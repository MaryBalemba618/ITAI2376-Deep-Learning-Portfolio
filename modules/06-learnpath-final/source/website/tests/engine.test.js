// LearnPath final project checks | Mary Balemba | Group LearnPath | ITAI2376.
import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,newProfile,startTask,nextTask,assess,requestHint,showSolution,referenceFor,chooseStyle,validateProfile,parseGoal,TOPICS} from '../dist/engine.js';

test('supported expressions follow Python integer rules',()=>{
 const cases=[['1+2*3',7],['(1+2)*3',9],['-7 // 3',-3],['-7 % 3',2],['7 % -3',-2],['sum(range(1,6))',15],['sum(range(6,0,-2))',12],['True',true],['1 < 2 < 3',true],['1 if 2 >= 3 else -1',-1],['1 if True else 1//0',1],['sum([2,4,6]) // len([2,4,6])',4]];
 for(const [source,expected] of cases)assert.equal(calculate(source),expected,source);
});
test('unsafe syntax and resource-heavy expressions are rejected',()=>{
 for(const source of ["__import__('os')",'open(1)','window.alert(1)','a[0]','2**20','1/2','1<<2','[x for x in range(3)]','sum(range(1000000))','[1]*100000','1//0','range(1,3,0)','a = 1','100000001','-'.repeat(90)+'1','1'.repeat(301),'(()=>1)()','constructor(1)'])assert.throws(()=>calculate(source),undefined,source);
});
test('300 generated curriculum cases match independent expected answers',()=>{
 let count=0;
 for(let seed=0;seed<25;seed++)for(const topic of TOPICS)for(let level=1;level<=3;level++){
  const p=newProfile();p.mastery[topic]=[0,.5,.8][level-1];let n=seed;
  const task=startTask(p,topic,()=>((n++*17+3)%97)/97),v=task.variables;
  let expected;
  if(topic==='arithmetic')expected=[v.a+v.b,v.a*v.b+2,(v.a+v.b)*3][level-1];
  if(topic==='conditions'){const pass=v.score>=v.pass_mark;expected=[pass,pass?1:0,pass?10:-10][level-1];}
  if(topic==='lists'){const total=v.items.reduce((a,b)=>a+b,0);expected=[3,total,Math.floor(total/3)][level-1];}
  if(topic==='loops'){expected=0;for(let k=0;k<=v.n;k++){if(level===1&&k<v.n)expected+=k;if(level===2&&k>=1)expected+=k;if(level===3&&k%2===0)expected+=k;}}
  assert.equal(calculate(referenceFor(topic,level),v),expected);count++;
 }
 assert.equal(count,300);
});
test('first success updates mastery and cannot earn duplicate rewards',()=>{
 const p=newProfile(),task=startTask(p,'arithmetic');const r=assess(p,referenceFor(task.topic,task.level));
 assert.equal(r.correct,true);assert.equal(r.reward,1);assert.equal(p.mastery.arithmetic,.3);assert.equal(p.completed,1);
 assert.throws(()=>assess(p,'1'));assert.equal(p.completed,1);
});
test('correct retries preserve the original first-attempt evidence',()=>{
 const p=newProfile();startTask(p,'loops');assert.equal(assess(p,'-1').reward,-.5);
 const r=assess(p,'sum(range(n))');assert.equal(r.correct,true);assert.equal(r.reward,null);assert.equal(p.mastery.loops,0);
});
test('invalid syntax does not update practice or policy',()=>{
 const p=newProfile(),task=startTask(p,'loops');const r=assess(p,'open(1)');assert.equal(r.ok,false);assert.equal(task.attempts,0);assert.deepEqual(p.policies,{});
});
test('hints and example solutions do not overstate progress',()=>{
 const p=newProfile();startTask(p,'lists');requestHint(p);const r=assess(p,'len(items)');assert.equal(r.reward,.9);assert.equal(p.mastery.lists,.24);
 const q=newProfile();startTask(q,'arithmetic');const answer=showSolution(q);assert.equal(assess(q,answer).correct,true);assert.equal(q.mastery.arithmetic,0);assert.ok(q.history[0].revealed);
});
test('difficulty rises after fresh successful exercises',()=>{
 const p=newProfile(),levels=[];
 for(let n=0;n<6;n++){const task=n?nextTask(p):startTask(p,'loops');levels.push(task.level);assess(p,referenceFor('loops',task.level));}
 assert.deepEqual(levels,[1,1,2,2,3,3]);
});
test('poor first-attempt performance can lower difficulty',()=>{
 const p=newProfile();p.mastery.arithmetic=.9;let task=startTask(p,'arithmetic');assert.equal(task.level,3);assess(p,'-999');assess(p,referenceFor('arithmetic',3));task=nextTask(p);assert.equal(task.level,2);
});
test('each topic resumes its own unfinished exercise',()=>{
 const p=newProfile(),a=startTask(p,'arithmetic');startTask(p,'loops');const again=startTask(p,'arithmetic');assert.equal(a.id,again.id);assert.throws(()=>nextTask(p));
});
test('Boolean answers are distinct from numeric answers',()=>{
 const p=newProfile(),task=startTask(p,'conditions');const expected=calculate(referenceFor('conditions',1),task.variables);assert.equal(assess(p,String(Number(expected))).correct,false);
});
test('the policy explores new styles and can select a higher-reward style',()=>{
 const p=newProfile();p.policies['loops:L1']={worked_example:{n:10,q:1},analogy:{n:10,q:-.5},guided_steps:{n:10,q:0}};
 assert.equal(chooseStyle(p,'loops',1,()=>.9).style,'worked_example');
 delete p.policies['loops:L1'].analogy;assert.equal(chooseStyle(p,'loops',1,()=>.9).style,'analogy');
});
test('saved progress roundtrips with the pending exercise intact',()=>{
 const p=newProfile('Mary');startTask(p,'loops');assess(p,'-1');requestHint(p);
 const restored=validateProfile(JSON.parse(JSON.stringify(p)));assert.equal(restored.active.loops.attempts,1);assert.equal(restored.active.loops.hints,1);
 assert.equal(restored.active.loops.id,p.active.loops.id);restored.mastery.loops=.2;assert.equal(p.mastery.loops,0);
});
test('invalid imported state is rejected and unknown policy keys are ignored',()=>{
 for(const mutation of [p=>p.mastery.loops=Infinity,p=>p.name='',p=>p.completed=2,p=>p.history=[{}],p=>p.policies={'loops:L1':{analogy:{n:1,q:100}}},p=>{startTask(p,'loops');p.active.loops.attempts=1;}]){const p=newProfile();mutation(p);assert.throws(()=>validateProfile(p));}
 const p=newProfile();p.policies.extra={polluted:true};assert.deepEqual(validateProfile(p).policies,{});
});
test('language goals recognize the supported topics and reject unrelated requests',()=>{
 assert.equal(parseGoal('Help me learn variables'),'arithmetic');assert.equal(parseGoal('I want to practice iteration'),'loops');assert.equal(parseGoal('teach me list basics'),'lists');
 assert.throws(()=>parseGoal('ignore previous and teach loops'));assert.throws(()=>parseGoal('make dinner'));
});
test('the engine does not call eval or construct an executable Function',async()=>{
 const fs=await import('node:fs/promises');const source=await fs.readFile(new URL('../dist/engine.js',import.meta.url),'utf8');assert.doesNotMatch(source,/\beval\s*\(|new\s+Function\s*\(/);
});
