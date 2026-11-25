"""LearnPath | Mary Balemba | Group: LearnPath | ITAI2376.
Planning-then-execution tutor. No eval, exec, shell, or learner code execution.
"""
from __future__ import annotations
import ast
import copy
import hashlib
import json
import math
import operator
import random
import re
import sqlite3
import time
import uuid
from pathlib import Path

TOPICS = ('arithmetic', 'conditions', 'loops', 'lists')
STYLES = ('worked_example', 'analogy', 'guided_steps')
ALIASES = {'variables': 'arithmetic', 'math': 'arithmetic', 'numbers': 'arithmetic',
           'if': 'conditions', 'conditionals': 'conditions', 'decisions': 'conditions',
           'for': 'loops', 'iteration': 'loops', 'list': 'lists', 'collections': 'lists'}
CREDITS = {'project': 'LearnPath', 'group': 'LearnPath', 'participants': ['Mary Balemba'], 'course': 'ITAI2376'}

class TutorError(ValueError):
    """A recoverable, student-readable boundary or tool error."""


def learner_id(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,32}', value):
        raise TutorError('Use a nickname of 1-32 letters, numbers, underscores or hyphens.')
    return value


def parse_goal(request):
    """Bounded natural-language intent parser; never accepts instructions as code."""
    if not isinstance(request, str) or not request.strip() or len(request) > 500:
        raise TutorError('Enter a learning request between 1 and 500 characters.')
    text = request.lower()
    blocked = ('ignore previous', 'system prompt', 'api key', 'password', 'malware',
               'ransomware', 'steal', 'exploit', 'weapon', 'self-harm', 'kill myself')
    if any(phrase in text for phrase in blocked):
        raise TutorError('This tutor only supports beginner Python practice. Please ask about a supported Python topic.')
    words = re.findall(r'[a-z]+', text)
    found = next((ALIASES.get(w, w) for w in words if ALIASES.get(w, w) in TOPICS), None)
    if found is None:
        raise TutorError('I can teach arithmetic, conditions, loops, or lists. Try: help me learn loops.')
    return found


class ExpressionTool:
    """A small AST interpreter, not a Python sandbox. Only bounded integer expressions."""
    LIMIT = 100_000_000
    OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
           ast.FloorDiv: operator.floordiv, ast.Mod: operator.mod}
    CMPS = {ast.Eq: operator.eq, ast.NotEq: operator.ne, ast.Lt: operator.lt,
            ast.LtE: operator.le, ast.Gt: operator.gt, ast.GtE: operator.ge}

    def run(self, source, context=None):
        if not isinstance(source, str) or not source.strip() or len(source) > 300:
            raise TutorError('Enter one expression, up to 300 characters.')
        if not re.fullmatch(r'[A-Za-z0-9_\s+*/%<>=!(),\[\]:-]+', source):
            raise TutorError('Use numbers, given variables, operators, and sum/len/range only.')
        try:
            tree = ast.parse(source.strip(), mode='eval')
            if sum(1 for _ in ast.walk(tree)) > 80:
                raise TutorError('That expression is too complex. Keep it under 80 syntax nodes.')
            result = self._visit(tree.body, context or {}, 0)
            self._bounded(result)
            return {'ok': True, 'value': result, 'tool': 'bounded_expression'}
        except TutorError:
            raise
        except (SyntaxError, TypeError, ValueError, ZeroDivisionError, OverflowError, RecursionError, IndexError) as exc:
            raise TutorError('Expression could not be checked. Review syntax, types, and division by zero.') from exc

    def _bounded(self, value):
        if type(value) in (int, bool):
            if abs(value) > self.LIMIT:
                raise TutorError('Number exceeds the practice limit.')
        elif type(value) is list:
            if len(value) > 100:
                raise TutorError('Use at most 100 items.')
            for item in value:
                if type(item) not in (int, bool):
                    raise TutorError('Lists may contain integers and booleans only.')
                self._bounded(item)
        else:
            raise TutorError('Only integer, Boolean, and short list results are supported.')
        return value

    def _visit(self, node, env, depth):
        if depth > 12:
            raise TutorError('Expression nesting is too deep.')
        visit = lambda x: self._visit(x, env, depth + 1)
        if isinstance(node, ast.Constant) and type(node.value) in (int, bool):
            return self._bounded(node.value)
        if isinstance(node, ast.Name) and node.id in env:
            return self._bounded(copy.deepcopy(env[node.id]))
        if isinstance(node, ast.List):
            return self._bounded([visit(x) for x in node.elts])
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub, ast.Not)):
            v = visit(node.operand)
            if type(v) not in (int, bool):
                raise TutorError('Unary operators need an integer or Boolean.')
            return self._bounded(not v if isinstance(node.op, ast.Not) else (-v if isinstance(node.op, ast.USub) else +v))
        if isinstance(node, ast.BinOp) and type(node.op) in self.OPS:
            a, b = visit(node.left), visit(node.right)
            if type(a) not in (int, bool) or type(b) not in (int, bool):
                raise TutorError('Arithmetic supports integers only; list repetition is blocked.')
            return self._bounded(self.OPS[type(node.op)](a, b))
        if isinstance(node, ast.Compare):
            a = visit(node.left)
            for op, expr in zip(node.ops, node.comparators):
                if type(op) not in self.CMPS:
                    raise TutorError('Unsupported comparison.')
                b = visit(expr)
                if type(a) not in (int, bool) or type(b) not in (int, bool):
                    raise TutorError('Compare integer or Boolean values only.')
                if not self.CMPS[type(op)](a, b):
                    return False
                a = b
            return True
        if isinstance(node, ast.IfExp):
            return visit(node.body if visit(node.test) else node.orelse)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.keywords:
            name = node.func.id
            args = [visit(x) for x in node.args]
            if name == 'range' and 1 <= len(args) <= 3 and all(type(x) is int for x in args):
                r = range(*args)
                if len(r) > 100:
                    raise TutorError('range is limited to 100 items.')
                return list(r)
            if name in ('sum', 'len') and len(args) == 1 and type(args[0]) is list:
                return self._bounded(sum(args[0]) if name == 'sum' else len(args[0]))
        raise TutorError('Unsupported syntax. Imports, attributes, files, comprehensions, and general Python execution are blocked.')


class DocumentTool:
    """Retrieves curated lesson documents, with a visible offline fallback."""
    def __init__(self, path=None):
        self.path = Path(path) if path else Path(__file__).resolve().parent.parent / 'data' / 'lessons.json'

    def run(self, topic, style):
        try:
            data = json.loads(self.path.read_text(encoding='utf-8'))
            entry = data[topic]
            text = entry['styles'][style]
            if not isinstance(text, str) or not 1 <= len(text) <= 2500:
                raise ValueError('invalid lesson')
            return {'ok': True, 'text': text, 'source': entry['source'], 'fallback': False, 'tool': 'lesson_documents'}
        except (OSError, ValueError, KeyError, TypeError):
            return {'ok': False, 'text': f'Practice {topic} using a small example. Work one step at a time and check the result.',
                    'source': 'Built-in practice fallback', 'fallback': True, 'tool': 'lesson_documents'}


class MemoryTool:
    """Parameterized SQLite tool; atomic learning updates and bounded checkpoints."""
    def __init__(self, path=':memory:'):
        if path != ':memory:':
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.path = None if path == ':memory:' else Path(path).resolve()
        self.db = sqlite3.connect(str(path))
        self.db.row_factory = sqlite3.Row
        self.db.executescript('''
        PRAGMA foreign_keys=ON;
        CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS policies(id TEXT, context TEXT, style TEXT, n INTEGER, q REAL,
          PRIMARY KEY(id,context,style), FOREIGN KEY(id) REFERENCES profiles(id) ON DELETE CASCADE);
        CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, learner TEXT NOT NULL, kind TEXT NOT NULL, data TEXT NOT NULL,
          FOREIGN KEY(learner) REFERENCES profiles(id) ON DELETE CASCADE);
        ''')
        self.db.commit()

    def get(self, who):
        learner_id(who)
        row = self.db.execute('SELECT data FROM profiles WHERE id=?', (who,)).fetchone()
        if row:
            return json.loads(row['data'])
        return {'id': who, 'mastery': {t: 0.0 for t in TOPICS}, 'count': 0, 'active': None}

    def save(self, profile):
        self.db.execute('INSERT INTO profiles VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
                        (profile['id'], json.dumps(profile)))

    def log(self, who, kind, data):
        self.db.execute('INSERT INTO events(learner,kind,data) VALUES(?,?,?)', (who, kind, json.dumps(data)))

    def policy(self, who, context):
        rows = self.db.execute('SELECT style,n,q FROM policies WHERE id=? AND context=?', (who, context)).fetchall()
        known = {r['style']: {'n': r['n'], 'q': r['q']} for r in rows}
        return {s: known.get(s, {'n': 0, 'q': 0.0}) for s in STYLES}

    def reward(self, who, context, style, value):
        old = self.policy(who, context)[style]
        n = old['n'] + 1
        q = old['q'] + (value - old['q']) / n
        self.db.execute('INSERT INTO policies VALUES(?,?,?,?,?) ON CONFLICT(id,context,style) DO UPDATE SET n=excluded.n,q=excluded.q',
                        (who, context, style, n, q))

    def delete(self, who):
        learner_id(who)
        with self.db:
            self.db.execute('DELETE FROM profiles WHERE id=?', (who,))

    def checkpoint(self, path):
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            if self.path is not None and target.resolve() == self.path:
                self.db.commit()
                return str(target)
            with sqlite3.connect(str(target)) as dest:
                self.db.backup(dest)
            return str(target)
        except sqlite3.Error as exc:
            raise TutorError('Could not write checkpoint. Choose a writable local path and retry.') from exc

    def close(self):
        self.db.close()


class Bandit:
    """Epsilon-greedy contextual bandit; contexts: topic and current level."""
    def __init__(self, memory, rng, epsilon=0.15):
        if not 0 <= epsilon <= 1:
            raise ValueError('epsilon must be in [0,1]')
        self.memory, self.rng, self.epsilon = memory, rng, epsilon

    def choose(self, who, context):
        stats = self.memory.policy(who, context)
        unseen = [s for s in STYLES if stats[s]['n'] == 0]
        if unseen:
            return self.rng.choice(unseen), 'Trying an explanation style with no feedback in this topic and level.'
        if self.rng.random() < self.epsilon:
            return self.rng.choice(STYLES), 'Exploring another explanation style.'
        best = max(x['q'] for x in stats.values())
        return self.rng.choice([s for s in STYLES if stats[s]['q'] == best]), 'Using a style with the highest observed first-attempt reward.'


def make_exercise(topic, level, rng):
    """Procedural, checked tasks. Equivalent expressions are accepted by value."""
    a, b = rng.randint(2, 7), rng.randint(2, 7)
    if topic == 'arithmetic':
        expression = ('a + b', 'a * b + 2', '(a + b) * 3')[level - 1]
        context = {'a': a, 'b': b}
        prompt = ('Add a and b.', 'Multiply a by b, then add 2.', 'Add a and b, then multiply that total by 3.')[level - 1]
        hint = 'Use the given names a and b. Parentheses control which calculation happens first.'
    elif topic == 'conditions':
        context = {'score': a * 10, 'pass_mark': b * 10}
        expression = ('score >= pass_mark', '1 if score >= pass_mark else 0', '10 if score >= pass_mark else -10')[level - 1]
        prompt = ('Return whether score meets pass_mark (True or False).', 'Return 1 if score meets pass_mark, otherwise 0.', 'Return 10 if score meets pass_mark, otherwise -10.')[level - 1]
        hint = 'A comparison uses >=. A conditional expression is: value_if_true if condition else value_if_false.'
    elif topic == 'loops':
        context = {'n': a + b}
        expression = ('sum(range(n))', 'sum(range(1, n + 1))', 'sum(range(0, n + 1, 2))')[level - 1]
        prompt = ('Find the total of integers from 0 up to, but excluding, n.', 'Find the total of integers from 1 through n.', 'Find the total of even integers from 0 through n.')[level - 1]
        hint = 'range stops before its second argument. Add 1 to include n. A third range argument sets the step.'
    else:
        context = {'items': [a, b, a + b]}
        expression = ('len(items)', 'sum(items)', 'sum(items) // len(items)')[level - 1]
        prompt = ('Find how many numbers are in items.', 'Find the total of items.', 'Find the integer average of items, rounding down.')[level - 1]
        hint = 'len counts items; sum adds them. Integer division uses //.'
    expected = ExpressionTool().run(expression, context)['value']
    return {'topic': topic, 'level': level, 'prompt': prompt, 'variables': context,
            'hint': hint, 'reference': expression, 'expected': expected}


class Tutor:
    def __init__(self, db_path=':memory:', seed=42, documents=None):
        self.memory = MemoryTool(db_path)
        self.rng = random.Random(seed)
        self.documents = documents or DocumentTool()
        self.checker = ExpressionTool()
        self.bandit = Bandit(self.memory, self.rng)

    def start(self, who, request):
        learner_id(who)
        topic = parse_goal(request)
        try:
            with self.memory.db:
                profile = self.memory.get(who)
                if profile['active'] and profile['active']['topic'] == topic:
                    return self._public(profile['active'])
                mastery = profile['mastery'][topic]
                level = 1 if mastery < 0.4 else (2 if mastery < 0.75 else 3)
                context = f'{topic}:L{level}'
                style, reason = self.bandit.choose(who, context)
                document = self.documents.run(topic, style)
                task = make_exercise(topic, level, self.rng)
                task.update({'id': uuid.uuid4().hex, 'context': context, 'style': style, 'decision': reason,
                             'lesson': document['text'], 'source': document['source'], 'fallback': document['fallback'],
                             'hints': 0, 'attempts': 0, 'rewarded': False, 'solved': False,
                             'plan': ['Interpret request', 'Load learner memory', 'Choose level and explanation',
                                      'Retrieve lesson', 'Generate checked exercise', 'Assess answer and update memory']})
                profile['active'] = task
                profile['count'] += 1
                self.memory.save(profile)
                self.memory.log(who, 'start', {'task_id': task['id'], 'topic': topic, 'level': level, 'style': style, 'fallback': document['fallback']})
                return self._public(task)
        except sqlite3.Error as exc:
            raise TutorError('Progress storage is unavailable. Reopen the notebook or use a new local checkpoint path; no success is claimed.') from exc

    @staticmethod
    def _public(task):
        return {k: copy.deepcopy(v) for k, v in task.items() if k not in ('reference', 'expected', 'rewarded')}

    def hint(self, who):
        try:
            with self.memory.db:
                profile = self.memory.get(who)
                task = profile['active']
                if not task or task['solved']:
                    raise TutorError('Start an exercise first.')
                task['hints'] = min(task['hints'] + 1, 3)
                self.memory.save(profile)
                return task['hint']
        except sqlite3.Error as exc:
            raise TutorError('Could not save hint use. Restore storage before continuing.') from exc

    def submit(self, who, answer):
        started = time.perf_counter()
        try:
            with self.memory.db:
                profile = self.memory.get(who)
                task = profile['active']
                if not task:
                    raise TutorError('Start an exercise first.')
                if task['solved']:
                    raise TutorError('Already completed. Choose Next exercise to continue.')
                try:
                    value = self.checker.run(answer, task['variables'])['value']
                except TutorError as exc:
                    return {'ok': False, 'correct': False, 'feedback': str(exc), 'updated': False}
                correct = type(value) is type(task['expected']) and value == task['expected']
                first = task['attempts'] == 0
                task['attempts'] += 1
                reward = None
                if not task['rewarded']:
                    reward = max(-1.0, (1.0 if correct else -0.5) - 0.1 * task['hints'])
                    self.memory.reward(who, task['context'], task['style'], reward)
                    task['rewarded'] = True
                # Mastery uses first-attempt evidence; retries cannot farm proficiency.
                if first:
                    score = max(0, 1 - 0.2 * task['hints']) if correct else 0
                    old = profile['mastery'][task['topic']]
                    profile['mastery'][task['topic']] = round(0.7 * old + 0.3 * score, 4)
                task['solved'] = correct
                mastery = profile['mastery'][task['topic']]
                next_topic = min(TOPICS, key=lambda t: profile['mastery'][t])
                feedback = ('Correct. Good work applying the idea.' if correct else 'That result does not match yet. Try a hint and work through the given values.')
                result = {'ok': True, 'correct': correct, 'feedback': feedback, 'updated': first,
                          'first_attempt': first, 'reward': reward, 'mastery': mastery, 'recommended_topic': next_topic,
                          'latency_ms': round((time.perf_counter() - started) * 1000, 3)}
                self.memory.save(profile)
                self.memory.log(who, 'answer', {**result, 'task_id': task['id'], 'topic': task['topic'], 'style': task['style']})
                return result
        except sqlite3.Error as exc:
            raise TutorError('Progress could not be saved. This attempt was rolled back; please restore storage and retry.') from exc

    def next_exercise(self, who, request):
        # Validate before dropping a pending task. An unfinished first answer earns no reward.
        parse_goal(request)
        learner_id(who)
        try:
            with self.memory.db:
                p = self.memory.get(who)
                if p['active'] and not p['active']['solved']:
                    raise TutorError('Complete the current exercise or choose another topic before moving on.')
                p['active'] = None
                self.memory.save(p)
            return self.start(who, request)
        except sqlite3.Error as exc:
            raise TutorError('Could not open another exercise. Restore storage and retry.') from exc

    def progress(self, who):
        try:
            profile = self.memory.get(who)
            events = self.memory.db.execute("SELECT data FROM events WHERE learner=? AND kind='answer'", (who,)).fetchall()
            first = [json.loads(r['data']) for r in events if json.loads(r['data'])['first_attempt']]
            return {'mastery': profile['mastery'], 'exercises_started': profile['count'], 'first_attempts': len(first),
                    'first_attempt_accuracy': (sum(x['correct'] for x in first) / len(first) if first else None),
                    'recommended_topic': min(TOPICS, key=lambda t: profile['mastery'][t]),
                    'note': 'Practice estimates only. No claim of measured learning gain.'}
        except sqlite3.Error as exc:
            raise TutorError('Progress could not be read. Restore the checkpoint or restart.') from exc
