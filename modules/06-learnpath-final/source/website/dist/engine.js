/* LearnPath browser engine. Original capstone: Mary Balemba.
   No eval, Function constructor, learner-code execution or external service. */
export const TOPICS = ['arithmetic','conditions','loops','lists'];
export const STYLES = ['worked_example','analogy','guided_steps'];
export const LABELS = {arithmetic:'Numbers & variables',conditions:'Making decisions',loops:'Working with loops',lists:'Exploring lists'};
export class PracticeError extends Error {}
const fail = (message) => { throw new PracticeError(message); };
const scalar = x => typeof x === 'boolean' || (typeof x === 'number' && Number.isInteger(x));
const bound = x => {
  if (scalar(x)) { if (Math.abs(Number(x)) > 100000000) fail('That number is too large for a practice exercise.'); }
  else if (Array.isArray(x)) {
    if (x.length>100 || !x.every(scalar)) fail('Lists can contain up to 100 integers or booleans.');
    x.forEach(bound);
  } else fail('Use an integer, True or False, or a short list.');
  return x;
};

/** Parse a bounded Python expression into an AST and interpret allowed nodes. */
export function calculate(source, context={}) {
  if(typeof source!=='string'||!source.trim()||source.length>300) fail('Enter one expression, up to 300 characters.');
  const tokens=[]; let pos=0;
  while(pos<source.length){
    const rest=source.slice(pos);
    const match=/^(\s+|\d+|[A-Za-z_][A-Za-z_0-9]*|\/\/|>=|<=|==|!=|[+*%<>()\[\],\/-])/.exec(rest);
    if(!match) fail('That character is unsupported. Use the given variables, whole numbers, and the supported operators.');
    pos+=match[0].length;
    if(!/^\s+$/.test(match[0])) tokens.push(match[0]);
    if(tokens.length>100) fail('Keep the expression short: at most 100 tokens.');
  }
  let i=0,nodes=0,depth=0;
  const peek=()=>tokens[i];
  const take=()=>tokens[i++];
  const expect=x=>{if(take()!==x) fail(`Check the syntax. Expected ${x}.`);};
  const node=(kind,parts)=>{if(++nodes>80) fail('That expression is too complex. Break it into smaller steps.');return{kind,...parts};};
  function conditional(){
    if(++depth>12) fail('The expression is nested too deeply.');
    let value=compare();
    if(peek()==='if'){take();const test=compare();expect('else');const other=conditional();value=node('if',{test,yes:value,no:other});}
    depth--;return value;
  }
  function compare(){
    const left=add(),ops=[],rights=[];
    while(['>=','<=','>','<','==','!='].includes(peek())){ops.push(take());rights.push(add());}
    return ops.length?node('compare',{left,ops,rights}):left;
  }
  function add(){let left=mult();while(['+','-'].includes(peek())){const op=take();left=node('binary',{op,left,right:mult()});}return left;}
  function mult(){let left=unary();while(['*','//','%'].includes(peek())){const op=take();left=node('binary',{op,left,right:unary()});}return left;}
  function unary(){
    if(['+','-'].includes(peek())){if(++depth>12)fail('Too many nested operators.');const op=take(),v=unary();depth--;return node('unary',{op,v});}
    return atom();
  }
  function atom(){
    const token=take();
    if(token===undefined)fail('The expression is incomplete.');
    if(/^\d+$/.test(token))return node('literal',{value:bound(Number(token))});
    if(token==='True'||token==='False')return node('literal',{value:token==='True'});
    if(token==='('){const v=conditional();expect(')');return v;}
    if(token==='['){const values=[];if(peek()!==']'){do{values.push(conditional());if(peek()!==',')break;take();if(peek()===']')break;}while(true);}expect(']');return node('list',{values});}
    if(/^[A-Za-z_][A-Za-z_0-9]*$/.test(token)){
      if(peek()==='('){take();const args=[];if(peek()!==')'){do{args.push(conditional());if(peek()!==',')break;take();}while(true);}expect(')');return node('call',{name:token,args});}
      return node('name',{name:token});
    }
    fail('Use a supported expression, such as a + b or sum(range(n)).');
  }
  const tree=conditional();
  if(i!==tokens.length)fail('Full scripts, assignments, indexing and general Python execution are not supported here.');
  function visit(x,level=0){
    if(level>12)fail('The expression is nested too deeply.');
    const v=a=>visit(a,level+1);
    switch(x.kind){
      case 'literal':return x.value;
      case 'name':if(!Object.hasOwn(context,x.name))fail(`I don’t recognize ${x.name}. Use the variables shown above.`);return bound(context[x.name]);
      case 'list':return bound(x.values.map(v));
      case 'if':return v(v(x.test)?x.yes:x.no);
      case 'unary':{const a=v(x.v);if(!scalar(a))fail('Unary operators need whole numbers or booleans.');return bound(x.op==='not'?!a:x.op==='-'?-Number(a):Number(a));}
      case 'binary':{
        const a=v(x.left),b=v(x.right);
        if(!scalar(a)||!scalar(b))fail('Arithmetic uses whole numbers; list multiplication is not supported.');
        const n=Number(a),m=Number(b);
        if((x.op==='//'||x.op==='%')&&m===0)fail('You can’t divide by zero. Try a different expression.');
        return bound(x.op==='+'?n+m:x.op==='-'?n-m:x.op==='*'?n*m:x.op==='//'?Math.floor(n/m):n-Math.floor(n/m)*m);
      }
      case 'compare':{
        let a=v(x.left);
        for(let j=0;j<x.ops.length;j++){
          const b=v(x.rights[j]);if(!scalar(a)||!scalar(b))fail('Compare whole numbers or booleans only.');
          const n=Number(a),m=Number(b),op=x.ops[j];
          const good=op==='=='?n===m:op==='!='?n!==m:op==='>'?n>m:op==='<'?n<m:op==='>='?n>=m:n<=m;
          if(!good)return false;a=b;
        }return true;
      }
      case 'call':{
        if(!['sum','len','range'].includes(x.name))fail('Only sum(), len() and range() are allowed. Files, imports and other Python calls are blocked.');
        const args=x.args.map(v);
        if(x.name==='range'){
          if(args.length<1||args.length>3||!args.every(a=>typeof a==='number'&&Number.isInteger(a)))fail('range takes one to three whole-number arguments.');
          const start=args.length===1?0:args[0],stop=args.length===1?args[0]:args[1],step=args.length===3?args[2]:1;
          if(!step)fail('The range step cannot be zero.');
          const length=Math.max(0,Math.ceil((stop-start)/step));
          if(length>100)fail('Keep ranges to 100 items or fewer.');
          return bound(Array.from({length},(_,k)=>start+k*step));
        }
        if(args.length!==1||!Array.isArray(args[0]))fail(`${x.name} needs one list or range.`);
        return bound(x.name==='len'?args[0].length:args[0].reduce((a,b)=>a+Number(b),0));
      }
    }
    fail('Unsupported expression.');
  }
  return visit(tree);
}

export function parseGoal(request){
  if(typeof request!=='string'||!request.trim()||request.length>500)fail('Tell me what you want to practice in 1–500 characters.');
  const text=request.toLowerCase();
  if(['ignore previous','system prompt','api key','password','malware','ransomware','steal','exploit'].some(x=>text.includes(x)))fail('Let’s stay with beginner Python practice: numbers, conditions, loops or lists.');
  const aliases={variables:'arithmetic',variable:'arithmetic',math:'arithmetic',numbers:'arithmetic',number:'arithmetic',if:'conditions',conditionals:'conditions',decisions:'conditions',condition:'conditions',for:'loops',loop:'loops',iteration:'loops',list:'lists',collections:'lists'};
  for(const word of text.match(/[a-z]+/g)||[]){const topic=aliases[word]||word;if(TOPICS.includes(topic))return topic;}
  fail('I can help with numbers and variables, conditions, loops or lists. Try “Help me learn loops.”');
}
export function newProfile(name='Learner'){
  return {name,mastery:Object.fromEntries(TOPICS.map(t=>[t,0])),policies:{},active:{},history:[],started:0,completed:0,topic:'arithmetic',goal:''};
}
export const levelFor=m=>m<.4?1:m<.75?2:3;
export const recommend=p=>TOPICS.reduce((a,b)=>p.mastery[a]<=p.mastery[b]?a:b);
export function chooseStyle(p,topic,level,rng=Math.random){
  const context=`${topic}:L${level}`,stats=p.policies[context]||{};
  const unseen=STYLES.filter(s=>!stats[s]?.n);
  const random=xs=>xs[Math.min(xs.length-1,Math.floor(rng()*xs.length))];
  if(unseen.length)return{style:random(unseen),reason:'Trying a fresh way to explain this topic.'};
  if(rng()<.15)return{style:random(STYLES),reason:'Trying another approach to find what helps you.'};
  const best=Math.max(...STYLES.map(s=>stats[s].q));
  return{style:random(STYLES.filter(s=>stats[s].q===best)),reason:'Using an approach that has worked well in your recent practice.'};
}
export function referenceFor(topic,level){return {
  arithmetic:['a + b','a * b + 2','(a + b) * 3'],
  conditions:['score >= pass_mark','1 if score >= pass_mark else 0','10 if score >= pass_mark else -10'],
  loops:['sum(range(n))','sum(range(1, n + 1))','sum(range(0, n + 1, 2))'],
  lists:['len(items)','sum(items)','sum(items) // len(items)']
}[topic][level-1];}
export function promptFor(topic,level){return{
  arithmetic:['Add a and b.','Multiply a by b, then add 2.','Add a and b, then multiply that total by 3.'],
  conditions:['Return True if score meets pass_mark, otherwise False.','Return 1 if score meets pass_mark, otherwise 0.','Return 10 if score meets pass_mark, otherwise -10.'],
  loops:['Find the total of integers from 0 up to, but excluding, n.','Find the total of integers from 1 through n.','Find the total of even integers from 0 through n.'],
  lists:['Find how many numbers are in items.','Find the total of items.','Find the integer average of items, rounding down.']
}[topic][level-1];}
export const HINTS={arithmetic:'Use a and b. Addition uses + and multiplication uses *. Put the calculation that comes first inside parentheses.',conditions:'Use >= to check the pass mark. For two outcomes, write: first_value if condition else second_value.',loops:'range stops before its end value. Use n + 1 to include n. A third argument, such as 2, sets the step. Wrap it in sum to add the values.',lists:'len counts items; sum adds them. An integer average uses sum(items) // len(items).'};
export function generateTask(p,topic,rng=Math.random){
  if(!TOPICS.includes(topic))fail('Choose a supported Python topic.');
  const level=levelFor(p.mastery[topic]),a=2+Math.floor(rng()*6),b=2+Math.floor(rng()*6);
  const choice=chooseStyle(p,topic,level,rng);
  const variables=topic==='arithmetic'?{a,b}:topic==='conditions'?{score:a*10,pass_mark:b*10}:topic==='loops'?{n:a+b}:{items:[a,b,a+b]};
  return{id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`,topic,level,variables,...choice,attempts:0,hints:0,rewarded:false,solved:false,revealed:false};
}
export function startTask(p,topic=p.topic,rng=Math.random){
  p.topic=topic;
  if(!p.active[topic]){p.active[topic]=generateTask(p,topic,rng);p.started++;}
  return p.active[topic];
}
export function nextTask(p,rng=Math.random){
  const current=p.active[p.topic];
  if(current&&!current.solved)fail('Finish this exercise first, or choose another topic.');
  delete p.active[p.topic];return startTask(p,p.topic,rng);
}
export function assess(p,source,now=new Date()){
  const task=p.active[p.topic];if(!task)fail('Choose a topic to begin.');
  if(task.solved)fail('You’ve completed this one. Your next exercise is ready.');
  let value;
  try{value=calculate(source,task.variables);}catch(e){return{ok:false,correct:false,feedback:e.message,updated:false};}
  const expected=calculate(referenceFor(task.topic,task.level),task.variables);
  const correct=typeof value===typeof expected&&JSON.stringify(value)===JSON.stringify(expected);
  const first=task.attempts===0;task.attempts++;
  let reward=null;
  if(!task.rewarded){
    reward=Math.max(-1,(correct&&!task.revealed?1:-.5)-.1*task.hints);
    const context=`${task.topic}:L${task.level}`,stats=p.policies[context]||(p.policies[context]={});
    const old=stats[task.style]||{n:0,q:0},n=old.n+1;
    stats[task.style]={n,q:old.q+(reward-old.q)/n};task.rewarded=true;
  }
  if(first){
    const score=correct&&!task.revealed?Math.max(0,1-.2*task.hints):0;
    p.mastery[task.topic]=Math.round((.7*p.mastery[task.topic]+.3*score)*10000)/10000;
  }
  task.solved=correct;
  if(correct)p.completed++;
  const result={ok:true,correct,first,updated:first,reward,mastery:p.mastery[task.topic],
    feedback:correct?'That’s right. Nice work!':'Not quite yet. Take another look at the values, or try a hint.'};
  p.history.push({topic:task.topic,level:task.level,style:task.style,correct,first,time:now.toISOString(),revealed:task.revealed});
  p.history=p.history.slice(-200);
  return result;
}
export function requestHint(p){const t=p.active[p.topic];if(!t||t.solved)fail('Start a new exercise to get a hint.');t.hints=Math.min(3,t.hints+1);return HINTS[t.topic];}
export function showSolution(p){const t=p.active[p.topic];if(!t||t.solved)fail('Start a new exercise first.');t.revealed=true;t.hints=3;return referenceFor(t.topic,t.level);}

/** Normalize imported/local state into known fields; never render imported HTML. */
export function validateProfile(input){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('This progress file is not valid.');
  const p=newProfile();
  if(typeof input.name!=='string'||input.name.length<1||input.name.length>32)fail('The nickname must be between 1 and 32 characters.');
  p.name=input.name;
  for(const topic of TOPICS){
    const v=input.mastery?.[topic];if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)fail('The progress scores in this file are invalid.');p.mastery[topic]=v;
  }
  for(const key of ['started','completed']){
    const n=input[key];if(!Number.isInteger(n)||n<0||n>1000000)fail('Invalid practice totals.');p[key]=n;
  }
  if(p.completed>p.started)fail('Invalid completed-exercise total.');
  if(!TOPICS.includes(input.topic))fail('Invalid saved topic.');p.topic=input.topic;
  p.goal=typeof input.goal==='string'?input.goal.slice(0,500):'';
  if(!input.policies||typeof input.policies!=='object'||Array.isArray(input.policies))fail('Invalid explanation history.');
  for(const topic of TOPICS)for(const level of [1,2,3]){
    const key=`${topic}:L${level}`,entry=input.policies[key];if(!entry)continue;p.policies[key]={};
    for(const s of STYLES){if(!entry[s])continue;const {n,q}=entry[s];
      if(!Number.isInteger(n)||n<1||n>1000000||typeof q!=='number'||!Number.isFinite(q)||q< -1||q>1)fail('Invalid explanation feedback.');
      p.policies[key][s]={n,q};
    }
  }
  if(!Array.isArray(input.history)||input.history.length>200)fail('Invalid practice history.');
  p.history=input.history.map(e=>{
    if(!TOPICS.includes(e.topic)||![1,2,3].includes(e.level)||!STYLES.includes(e.style)||typeof e.correct!=='boolean'||typeof e.first!=='boolean'||typeof e.revealed!=='boolean'||typeof e.time!=='string'||e.time.length>32||!Number.isFinite(Date.parse(e.time)))fail('Invalid practice history entry.');
    return{topic:e.topic,level:e.level,style:e.style,correct:e.correct,first:e.first,revealed:e.revealed,time:e.time};
  });
  for(const topic of TOPICS){
    const t=input.active?.[topic];if(!t)continue;
    if(t.topic!==topic||![1,2,3].includes(t.level)||!STYLES.includes(t.style)||typeof t.id!=='string'||!/^[a-z0-9-]{1,64}$/i.test(t.id)||!Number.isInteger(t.attempts)||t.attempts<0||t.attempts>10000||!Number.isInteger(t.hints)||t.hints<0||t.hints>3||typeof t.solved!=='boolean'||typeof t.revealed!=='boolean'||typeof t.rewarded!=='boolean'||t.rewarded!==(t.attempts>0)||(t.solved&&t.attempts===0))fail('Invalid saved exercise.');
    const variables={};
    const numeric=v=>Number.isInteger(v)&&v>=0&&v<=100;
    for(const key of topic==='arithmetic'?['a','b']:topic==='conditions'?['score','pass_mark']:topic==='loops'?['n']:['items']){
      const v=t.variables?.[key];
      if(key==='items'){
        if(!Array.isArray(v)||v.length!==3||!v.every(numeric))fail('Invalid saved list.');variables.items=[...v];
      }else{if(!numeric(v))fail('Invalid saved variable.');variables[key]=v;}
    }
    calculate(referenceFor(topic,t.level),variables);
    p.active[topic]={id:t.id,topic,level:t.level,style:t.style,reason:'Resuming your saved exercise.',variables,attempts:t.attempts,hints:t.hints,rewarded:t.rewarded,solved:t.solved,revealed:t.revealed};
  }
  return p;
}
