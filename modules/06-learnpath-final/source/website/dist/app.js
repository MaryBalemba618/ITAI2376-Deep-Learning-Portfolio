import {TOPICS,STYLES,LABELS,PracticeError,newProfile,validateProfile,parseGoal,startTask,nextTask,assess,requestHint,showSolution,promptFor,referenceFor,levelFor,recommend} from './engine.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const META={arithmetic:{short:'Numbers & variables',tiny:'Numbers',color:'#9a83ce',tint:'#eee8f9',icon:'code',caption:'Start with the basics'},conditions:{short:'Making decisions',tiny:'Conditions',color:'#ce9e80',tint:'#faeee6',icon:'branch',caption:'Make a choice'},loops:{short:'Working with loops',tiny:'Loops',color:'#7fa793',tint:'#eaf4ee',icon:'loop',caption:'One step, then another'},lists:{short:'Exploring lists',tiny:'Lists',color:'#87a4c4',tint:'#edf3fa',icon:'list',caption:'Bring things together'}};
const STYLE_LABELS={worked_example:'A worked example',analogy:'A fresh perspective',guided_steps:'Step by step'};
const KEY='learnpath.practice.v1';
let p,storageOK=true,loadMessage='';
try{const raw=localStorage.getItem(KEY);p=raw?validateProfile(JSON.parse(raw)):newProfile();}catch(e){p=newProfile();try{localStorage.setItem('__lp_probe','1');localStorage.removeItem('__lp_probe');loadMessage='Your saved progress could not be read. A fresh practice space is ready.';}catch{storageOK=false;}}
let lessons={};
try{const response=await fetch('./lessons.json');if(!response.ok)throw Error();lessons=await response.json();}catch{loadMessage='The lesson library is unavailable. A short fallback lesson is ready, and exercises still work.';}
function save(){try{localStorage.setItem(KEY,JSON.stringify(p));storageOK=true;}catch{storageOK=false;}$('#storage-warning').hidden=storageOK;}
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#toast').hidden=true;},4000);}
function firsts(){return p.history.filter(e=>e.first);}
function accuracy(){const events=firsts();return events.length?Math.round(events.filter(x=>x.correct&&!x.revealed).length/events.length*100)+'%':'—';}
function formatValue(v){return Array.isArray(v)?'['+v.join(', ')+']':typeof v==='boolean'?v?'True':'False':String(v);}
function css(t){return `--topic:${META[t].color};--tint:${META[t].tint}`;}
function setProfile(){ $('#profile-name').textContent=p.name;$('#avatar').textContent=Array.from(p.name)[0].toUpperCase();$('#nickname').value=p.name; }
function renderNav(){
 $('#topic-nav').innerHTML=TOPICS.map(t=>`<button data-topic="${t}" class="${p.topic===t?'selected':''}" aria-pressed="${p.topic===t}" style="${css(t)}"><span class="topic-dot"></span>${META[t].short}<span class="tiny-level">L${levelFor(p.mastery[t])}</span></button>`).join('');
 $('#topic-cards').innerHTML=TOPICS.map(t=>`<button data-topic="${t}" class="topic-card ${p.topic===t?'selected':''}" style="${css(t)}" aria-pressed="${p.topic===t}"><span class="topic-icon">${icon(META[t].icon)}</span><strong>${META[t].short}</strong><small>${META[t].caption}</small><span class="card-check">${icon('check')}</span></button>`).join('');
}
function renderRail(){
 const task=p.active[p.topic],level=task?.level||levelFor(p.mastery[p.topic]);
 const descriptions=['Build your foundation','Put the pieces together','Stretch your thinking'];
 $('#path-steps').innerHTML=[1,2,3].map((n,i)=>`<div class="path-step ${n<level?'done':n===level?'current':''}"><span class="step-circle">${n<level?icon('check'):n}</span><div><strong>${['Getting started','Finding your rhythm','Growing stronger'][i]}</strong><small>${descriptions[i]}</small></div></div>`).join('');
 $('#completed-count').textContent=p.completed;$('#accuracy-count').textContent=accuracy();
 $('#mastery-bars').innerHTML=TOPICS.map(t=>`<div class="mastery-row" style="${css(t)}"><div class="mastery-label"><span>${META[t].tiny}</span><span>${Math.round(p.mastery[t]*100)}%</span></div><div class="mastery-track" role="progressbar" aria-label="${META[t].tiny} practice estimate" aria-valuenow="${Math.round(p.mastery[t]*100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p.mastery[t]*100}%"></span></div></div>`).join('');
 $('#recommended-title').textContent=LABELS[recommend(p)];
}
function clearMessages(){ $('#hint-panel').hidden=true;$('#hint-panel').replaceChildren();$('#feedback').hidden=true;$('#answer').value=''; }
function renderLesson(reset=true){
 const task=startTask(p,p.topic);if(reset)clearMessages();
 const topic=task.topic;$('#lesson-number').textContent=String(TOPICS.indexOf(topic)+1).padStart(2,'0');
 $('#lesson-heading').textContent=LABELS[topic];
 $('#lesson-level').textContent=`Level ${task.level} · ${['Getting started','Building confidence','A little challenge'][task.level-1]}`;
 $('#style-badge span').textContent=STYLE_LABELS[task.style];
 const lesson=lessons?.[topic]?.styles?.[task.style];
 $('#lesson-text').textContent=typeof lesson==='string'?lesson:`Let’s practice ${META[topic].tiny.toLowerCase()}. Read the values, take one step at a time, and use a hint if you get stuck.`;
 $('#lesson-reason').textContent=`${task.reason} Your exercise level follows your recent first-attempt practice. Hints are always here when you need them.`;
 const links={arithmetic:'https://docs.python.org/3/tutorial/introduction.html#numbers',conditions:'https://docs.python.org/3/tutorial/controlflow.html#if-statements',loops:'https://docs.python.org/3/tutorial/controlflow.html#the-range-function',lists:'https://docs.python.org/3/tutorial/introduction.html#lists'};
 $('#lesson-source').href=links[topic];$('#exercise-prompt').textContent=promptFor(topic,task.level);
 $('#variables').textContent=Object.entries(task.variables).map(([k,v])=>`${k} = ${formatValue(v)}`).join('    ');
 $('#answer').placeholder={arithmetic:'Try a + b…',conditions:'Try score >= pass_mark…',loops:'Try sum(range(n))…',lists:'Try len(items)…'}[topic];
 $('#answer').disabled=task.solved;$('#check-answer').disabled=task.solved;$('#hint-button').disabled=task.solved;$('#solution-button').disabled=task.solved;$('#next-button').hidden=!task.solved;
 if(task.solved){showFeedback({correct:true,feedback:'You’ve already finished this step.',first:false},true);}
 if(task.revealed&&!task.solved){displaySolution(false);}
 renderNav();renderRail();save();
}
function showFeedback(r,resuming=false){
 const box=$('#feedback');box.hidden=false;box.className='feedback'+(r.correct?' correct':'');
 const title=document.createElement('strong');title.textContent=r.correct?r.feedback:r.ok===false?'Let’s adjust that expression.':r.feedback;
 const body=document.createElement('span');body.textContent=r.correct?(resuming?'Pick up with your next exercise whenever you’re ready.':r.first&&!p.active[p.topic].revealed?'Your practice is moving forward. Ready for another small step?':'Good job working through it. The original first try stays in your practice record.'):(r.ok===false?r.feedback:'You can change your answer and try again. A hint may help you see the next step.');
 box.replaceChildren(title,body);
 if(!r.correct&&r.ok===false){const note=document.createElement('small');note.textContent='This input hasn’t changed your practice score.';box.append(note);}
}
function chooseTopic(topic){
 if(!TOPICS.includes(topic))return; p.topic=topic;showView('practice',false);renderLesson();$('#goal-error').hidden=true;
}
function showView(view,scroll=true){
 if(!['practice','progress','about'].includes(view))view='practice';
 $$('.view').forEach(e=>e.hidden=e.id!==`view-${view}`);
 $$('[data-view]').forEach(e=>{e.classList.toggle('active',e.dataset.view===view);if(e.classList.contains('nav-item')||e.closest('.mobile-nav')){if(e.dataset.view===view)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current');}});
 $('#page-label').textContent={practice:'Practice',progress:'My progress',about:'How it works'}[view];
 if(view==='progress')renderProgress();
 if(location.hash!==`#${view}`)history.replaceState(null,'',`#${view}`);
 if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function renderProgress(){
 const first=firsts(),days=new Set(p.history.map(e=>new Date(e.time).toLocaleDateString())).size;
 $('#progress-summary').innerHTML=`<div class="summary-stat"><strong>${p.completed}</strong><span>exercises finished</span></div><div class="summary-stat"><strong>${accuracy()}</strong><span>recent first-try accuracy</span></div><div class="summary-stat"><strong>${days}</strong><span>days with practice</span></div>`;
 $('#progress-topics').innerHTML=TOPICS.map(t=>`<div class="progress-topic" style="${css(t)}"><span class="topic-icon">${icon(META[t].icon)}</span><div><h3>${LABELS[t]}</h3><p>Level ${levelFor(p.mastery[t])} · ${first.filter(e=>e.topic===t).length} recent first tries</p></div><div class="mastery-track" role="progressbar" aria-label="${META[t].tiny} practice estimate" aria-valuenow="${Math.round(p.mastery[t]*100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p.mastery[t]*100}%"></span></div><span class="percentage">${Math.round(p.mastery[t]*100)}%</span><button class="button button-secondary" data-topic="${t}">Practice${icon('arrow')}</button></div>`).join('');
 const recent=p.history.slice(-12).reverse();
 $('#activity-list').innerHTML=recent.length?recent.map(e=>`<div class="activity-row"><span class="activity-icon ${e.correct?'success':''}">${icon(e.correct?'check':'loop')}</span><div><strong>${LABELS[e.topic]} · Level ${e.level}</strong><small>${e.correct?(e.revealed?'Completed with an example solution':e.first?'Correct on the first try':'Completed after a retry'):'An opportunity to try again'}</small></div><span class="activity-date">${escape(new Date(e.time).toLocaleDateString(undefined,{month:'short',day:'numeric'}))}</span></div>`).join(''):`<div class="empty-state">${icon('spark')}<p>Your story starts with one small step.<br>Try an exercise, and your practice will appear here.</p><button class="button button-primary" data-view="practice">Start practicing${icon('arrow')}</button></div>`;
}
function displaySolution(mark=true){
 let solution;if(mark)solution=showSolution(p);else solution=referenceFor(p.active[p.topic].topic,p.active[p.topic].level);
 const panel=$('#hint-panel');panel.hidden=false;
 const title=document.createElement('strong');title.textContent='One way to solve this:';
 const code=document.createElement('code');code.textContent=solution;
 const note=document.createElement('p');note.textContent='Try it, then follow the values step by step. This exercise can be completed, but a revealed solution won’t count as a first-try success.';
 panel.replaceChildren(title,code,note);save();
}
function exportProgress(){
 const data={app:'LearnPath',version:1,exportedAt:new Date().toISOString(),data:p};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='LearnPath-progress.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 toast('Your progress file is ready to take with you.');
}
function openSettings(){setProfile();$('#settings-message').textContent='';$('#reset-confirm').checked=false;$('#settings-dialog').showModal();}
document.addEventListener('click',event=>{
 const target=event.target.closest('button,a');if(!target)return;
 if(target.dataset.view){showView(target.dataset.view);return;}
 if(target.dataset.topic){chooseTopic(target.dataset.topic);return;}
});
$('#goal-form').addEventListener('submit',event=>{event.preventDefault();try{const goal=$('#goal').value,topic=parseGoal(goal);p.goal=goal;chooseTopic(topic);toast(`Let’s practice ${META[topic].tiny.toLowerCase()}.`);}catch(e){$('#goal-error').textContent=e.message;$('#goal-error').hidden=false;}});
$('#answer-form').addEventListener('submit',event=>{
 event.preventDefault();try{
  const result=assess(p,$('#answer').value);showFeedback(result);save();renderRail();
  if(result.correct){$('#answer').disabled=true;$('#check-answer').disabled=true;$('#hint-button').disabled=true;$('#solution-button').disabled=true;$('#next-button').hidden=false;$('#next-button').focus();}
  else $('#feedback').focus();
 }catch(e){toast(e.message);}
});
$('#answer').addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();$('#answer-form').requestSubmit();}});
$('#hint-button').addEventListener('click',()=>{try{const hint=requestHint(p);$('#hint-panel').hidden=false;$('#hint-panel').textContent=hint;save();}catch(e){toast(e.message);}});
$('#solution-button').addEventListener('click',()=>{try{displaySolution();}catch(e){toast(e.message);}});
$('#next-button').addEventListener('click',()=>{try{nextTask(p);renderLesson();$('#answer').focus();}catch(e){toast(e.message);}});
$('#recommend-button').addEventListener('click',()=>chooseTopic(recommend(p)));
$('#copy-values').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#variables').textContent);toast('Exercise values copied.');}catch{toast('Copy isn’t available here. The values are shown just above your expression.');}});
for(const id of ['settings-open','profile-open','mobile-settings','privacy-open'])$('#'+id).addEventListener('click',openSettings);
$('#syntax-open').addEventListener('click',()=>$('#syntax-dialog').showModal());
$$('.dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('dialog').forEach(d=>d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}}));
$('#name-form').addEventListener('submit',event=>{event.preventDefault();const name=$('#nickname').value.trim();if(!name||name.length>32){$('#settings-message').textContent='Use a nickname of 1–32 characters.';return;}p.name=name;save();setProfile();$('#settings-message').textContent=`You’re all set, ${name}.`;});
$('#export-progress').addEventListener('click',exportProgress);$('#export-settings').addEventListener('click',exportProgress);
$('#import-button').addEventListener('click',()=>$('#import-file').click());
$('#import-file').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 try{
  if(file.size>1000000)throw new PracticeError('Choose a LearnPath progress file under 1 MB.');
  const data=JSON.parse(await file.text());if(data.app!=='LearnPath'||data.version!==1)throw new PracticeError('Choose a version 1 LearnPath progress export.');
  const imported=validateProfile(data.data);
  if((p.started||p.name!=='Learner')&&!window.confirm('Importing replaces the LearnPath progress in this browser. Export your current progress first if you want to keep it. Continue?'))return;
  p=imported;save();setProfile();renderLesson();renderProgress();$('#settings-message').textContent='Progress imported. You’re ready to pick up where you left off.';
 }catch(e){$('#settings-message').textContent=e instanceof SyntaxError?'This file could not be read as a LearnPath progress export.':e.message;}
 finally{event.target.value='';}
});
$('#reset-button').addEventListener('click',()=>{
 if(!$('#reset-confirm').checked){$('#settings-message').textContent='Tick the erase checkbox first. Export your progress if you want a backup.';return;}
 p=newProfile();save();setProfile();renderLesson();renderProgress();$('#settings-message').textContent='Your browser’s LearnPath progress has been cleared.';$('#reset-confirm').checked=false;
});
window.addEventListener('hashchange',()=>showView(location.hash.slice(1)));
setProfile();renderLesson();showView(location.hash.slice(1)||'practice',false);
if(loadMessage)toast(loadMessage);
