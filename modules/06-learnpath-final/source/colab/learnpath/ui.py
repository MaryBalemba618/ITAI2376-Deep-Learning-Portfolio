"""Notebook UI | Mary Balemba | Group LearnPath | ITAI2376."""
import html
import json
from pathlib import Path
from .core import TOPICS, TutorError
from .language import rewrite_lesson


def launch(tutor):
    import ipywidgets as w
    from IPython.display import display
    esc = lambda s: html.escape(str(s))
    nickname = w.Text(value='student_demo', description='Nickname:')
    goal = w.Text(value='Help me learn loops', description='Goal:', layout=w.Layout(width='90%'))
    topic = w.Dropdown(options=list(TOPICS), value='loops', description='Next topic:')
    llm = w.Checkbox(value=False, description='Optional Gemini explanations (API usage may cost money)', indent=False)
    answer = w.Textarea(placeholder='Example: sum(range(n))', description='Expression:', layout=w.Layout(width='90%', height='80px'))
    start = w.Button(description='Start / resume', button_style='primary')
    check = w.Button(description='Check answer', button_style='success')
    hint = w.Button(description='Get hint')
    next_btn = w.Button(description='Next exercise')
    save = w.Button(description='Save checkpoint')
    confirm_delete = w.Checkbox(value=False, description='Confirm deleting this nickname and its progress', indent=False)
    delete = w.Button(description='Delete my data', button_style='danger')
    lesson = w.HTML()
    result = w.HTML()
    dashboard = w.HTML()
    checkpoint = w.HTML()
    current = {'owner': None}

    def refresh():
        p = tutor.progress(nickname.value)
        bars = ''.join(f'<tr><td>{esc(t)}</td><td><progress value="{v}" max="1"></progress> {v:.0%}</td></tr>' for t, v in p['mastery'].items())
        acc = 'No attempts yet' if p['first_attempt_accuracy'] is None else f"{p['first_attempt_accuracy']:.0%}"
        dashboard.value = f'<h3>Your progress</h3><table>{bars}</table><p>First-attempt accuracy: {acc} | Suggested topic: {esc(p["recommended_topic"])}</p><small>Practice estimates; this is not a formal grade or proof of learning gain.</small>'

    def show(task):
        current['owner'] = nickname.value
        prose = rewrite_lesson(task['topic'], task['style'], task['lesson'], enabled=llm.value)
        # Escape all generated or user-derived content; never display it as raw HTML.
        lesson.value = f'''<div style="background:#f0f6ff;border-left:5px solid #3475db;padding:20px;border-radius:8px">
        <h2>{esc(task['topic'].title())} · Level {task['level']}</h2>
        <p><b>Explanation:</b> {esc(task['style'].replace('_', ' '))}</p>
        <p>{esc(prose['text'])}</p><small>{esc(prose['notice'])}</small>
        <h3>Your exercise</h3><p>{esc(task['prompt'])}</p><pre>{esc(json.dumps(task['variables']))}</pre>
        <p><b>Why this lesson:</b> {esc(task['decision'])}</p>
        <p><b>Plan:</b> {esc(' → '.join(task['plan']))}</p><small>Source: {esc(task['source'])}</small>
        {'<p>Document tool failed; built-in fallback is active.</p>' if task['fallback'] else ''}</div>'''
        answer.value = ''
        result.value = ''
        refresh()

    def guarded(fn):
        def run(_):
            try:
                fn()
            except (TutorError, OSError) as exc:
                result.value = f'<p style="color:#a32626">{esc(exc)}</p>'
        return run

    def owner_check():
        if current['owner'] != nickname.value:
            raise TutorError('Nickname changed. Click Start / resume before answering.')

    def submit():
        owner_check()
        r = tutor.submit(nickname.value, answer.value)
        result.value = f'<p style="color:{"#176746" if r["correct"] else "#a32626"}"><b>{esc(r["feedback"])}</b></p>'
        if r.get('reward') is not None:
            result.value += f'<p>Policy feedback reward: {r["reward"]:.1f}; topic practice estimate: {r["mastery"]:.0%}</p>'
        refresh()

    def request_hint():
        owner_check()
        result.value = f'<p><b>Hint:</b> {esc(tutor.hint(nickname.value))}</p>'

    def backup():
        path = Path.cwd() / 'learnpath_checkpoint.sqlite3'
        tutor.memory.checkpoint(path)
        checkpoint.value = '<p>Saved learnpath_checkpoint.sqlite3. Download it using the notebook checkpoint cell or the Colab Files panel.</p>'

    def erase():
        if not confirm_delete.value:
            raise TutorError('Tick the deletion checkbox first. This removes the current nickname and all its local history.')
        tutor.memory.delete(nickname.value)
        lesson.value, result.value = '', '<p>Nickname and progress deleted from this database. Any downloaded backups remain yours to manage.</p>'
        current['owner'] = None
        confirm_delete.value = False
        refresh()

    start.on_click(guarded(lambda: show(tutor.start(nickname.value, goal.value))))
    check.on_click(guarded(submit))
    hint.on_click(guarded(request_hint))
    next_btn.on_click(guarded(lambda: show(tutor.next_exercise(nickname.value, topic.value))))
    save.on_click(guarded(backup))
    delete.on_click(guarded(erase))
    display(w.VBox([
        w.HTML('<div style="background:#112742;color:white;padding:24px;border-radius:12px"><h1>LearnPath</h1><p>Small steps. Useful feedback. Your own learning path.</p><small>Option 4 · Mary Balemba · Group: LearnPath · ITAI2376</small></div>'),
        w.HTML('<p>Beginner Python expression practice. No full scripts, imports, file access or unrestricted code execution. Use a nickname, not personal information. The offline mode uses curated lessons and a learning policy; optional Gemini only rewrites explanations.</p>'),
        nickname, goal, llm, start, lesson, answer, w.HBox([check, hint]), result,
        w.HBox([topic, next_btn]), dashboard, save, checkpoint,
        w.Accordion(children=[w.VBox([confirm_delete, delete])], titles=('Privacy and deletion',))
    ]))
    return {'nickname': nickname, 'goal': goal, 'answer': answer, 'start': start, 'check': check,
            'hint': hint, 'next': next_btn, 'topic': topic, 'lesson': lesson, 'result': result, 'dashboard': dashboard}
