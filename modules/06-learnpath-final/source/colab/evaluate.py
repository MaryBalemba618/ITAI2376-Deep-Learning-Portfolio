"""Reproducible engineering evidence, NOT student outcomes.
Mary Balemba | Group: LearnPath | ITAI2376.
"""
import csv
import json
import random
import statistics
import time
import unittest
from pathlib import Path
from learnpath.core import TOPICS, STYLES, Tutor, ExpressionTool, Bandit, MemoryTool, make_exercise

ROOT = Path(__file__).resolve().parent

def oracle(task):
    v=task['variables']; level=task['level']; topic=task['topic']
    if topic=='arithmetic':
        a,b=v['a'],v['b']; return [a+b,a*b+2,(a+b)*3][level-1]
    if topic=='conditions':
        passed=v['score']>=v['pass_mark']; return [passed,1 if passed else 0,10 if passed else -10][level-1]
    if topic=='loops':
        n=v['n']; values=[list(range(n)),list(range(1,n+1)),[k for k in range(n+1) if k%2==0]][level-1]
        total=0
        for value in values: total+=value
        return total
    items=v['items']; total=0; count=0
    for item in items: total+=item; count+=1
    return [count,total,total//count][level-1]

def benchmark():
    checks=[]; timings=[]; checker=ExpressionTool()
    for seed in range(20):
        for topic in TOPICS:
            for level in (1,2,3):
                task=make_exercise(topic,level,random.Random(seed)); expected=oracle(task)
                begin=time.perf_counter(); actual=checker.run(task['reference'],task['variables'])['value']
                timings.append((time.perf_counter()-begin)*1000)
                checks.append(type(expected) is type(actual) and expected==actual)
    return {'cases':len(checks),'passed':sum(checks),'median_checker_ms':round(statistics.median(timings),4),
            'p95_checker_ms':round(sorted(timings)[int(.95*(len(timings)-1))],4)}

def simulation():
    # Equal topic/level sampling; outcome probabilities are ASSUMPTIONS.
    # Each context has one strong style (0.85), one medium (0.45), one weak (0.25).
    contexts=[f'{t}:L{l}' for t in TOPICS for l in (1,2,3)]
    rows=[]
    for seed in range(30):
        rng=random.Random(seed); mem=MemoryTool(); mem.save(mem.get('sim')); mem.db.commit()
        policy=Bandit(mem,rng,epsilon=.15)
        probs={c:{s:[.85,.45,.25][(i-j)%3] for i,s in enumerate(STYLES)} for j,c in enumerate(contexts)}
        for episode in range(600):
            context=contexts[episode%len(contexts)]
            style,_=policy.choose('sim',context)
            success=rng.random()<probs[context][style]
            with mem.db: mem.reward('sim',context,style,1.0 if success else -.5)
        test_rng=random.Random(10000+seed); adaptive=uniform=0
        for episode in range(360):
            context=contexts[episode%len(contexts)]
            stats=mem.policy('sim',context); style=max(STYLES,key=lambda s:stats[s]['q'])
            baseline=test_rng.choice(STYLES); draw=test_rng.random()
            adaptive+=draw<probs[context][style]; uniform+=draw<probs[context][baseline]
        rows.append({'seed':seed,'trained_greedy_success':adaptive/360,'uniform_success':uniform/360})
        mem.close()
    differences=[r['trained_greedy_success']-r['uniform_success'] for r in rows]
    margin=1.96*statistics.stdev(differences)/(len(rows)**.5)
    return rows,{'kind':'Synthetic fixed-probability bandit simulation; not human learners',
        'seeds':30,'training_interactions_per_seed':600,'held_out_interactions_per_seed':360,
        'adaptive_success':statistics.mean(r['trained_greedy_success'] for r in rows),
        'uniform_success':statistics.mean(r['uniform_success'] for r in rows),
        'paired_difference':statistics.mean(differences),
        'difference_95pct_normal_interval':[statistics.mean(differences)-margin,statistics.mean(differences)+margin],
        'assumed_success_probabilities':[.85,.45,.25],
        'caveat':'Evaluation freezes policy and exploits greedily; live epsilon exploration differs. Fixed contexts omit changing skills and fatigue.'}

def demo():
    t=Tutor(seed=42); who='student_demo'; trace=[]
    task=t.start(who,'Help me learn loops')
    trace.append({'step':'Personalized lesson','task':task})
    trace.append({'step':'Wrong answer','answer':'-1','result':t.submit(who,'-1')})
    trace.append({'step':'Constructive hint','result':t.hint(who)})
    ref=t.memory.get(who)['active']['reference']
    trace.append({'step':'Retry after hint','answer':ref,'result':t.submit(who,ref)})
    for _ in range(5):
        task=t.next_exercise(who,'loops'); ref=t.memory.get(who)['active']['reference']
        trace.append({'step':'Adaptive practice','topic':task['topic'],'level':task['level'],'style':task['style'],'answer':ref,'result':t.submit(who,ref)})
    task=t.next_exercise(who,'lists')
    trace.append({'step':'Blocked expression','answer':'open(1)','result':t.submit(who,'open(1)')})
    trace.append({'step':'Progress dashboard','result':t.progress(who)})
    t.memory.close(); return trace

def main():
    out=ROOT/'evidence'; out.mkdir(exist_ok=True)
    suite=unittest.defaultTestLoader.discover(str(ROOT/'tests'))
    with (out/'tests.txt').open('w') as log:
        result=unittest.TextTestRunner(stream=log,verbosity=2).run(suite)
    rows,sim=simulation()
    evidence={'credits':{'group':'LearnPath','participants':['Mary Balemba'],'course':'ITAI2376'},
              'executed_utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
              'environment':'Local Python 3.12; Colab-specific authentication and live Gemini not tested',
              'tests':{'run':result.testsRun,'failures':len(result.failures),'errors':len(result.errors)},
              'exercise_benchmark':benchmark(),'bandit_simulation':sim}
    (out/'evaluation.json').write_text(json.dumps(evidence,indent=2))
    (out/'demo_trace.json').write_text(json.dumps(demo(),indent=2))
    with (out/'simulation.csv').open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
    print(json.dumps(evidence,indent=2))
    if not result.wasSuccessful(): raise SystemExit(1)

if __name__=='__main__': main()
