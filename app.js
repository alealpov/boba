(() => {
'use strict';
const BANK=window.ICFES_BANK;
const STATE_PREFIX='icfesTwoSimStateV1:';
const RESULT_PREFIX='icfesTwoSimResultV1:';
const TOTAL=254;
const screens={loading:$('#loadingScreen'),welcome:$('#welcomeScreen'),exam:$('#examScreen'),results:$('#resultsScreen')};
let state=null,lastResult=null,activeSimId=null;

function $(s){return document.querySelector(s)}
function $$(s){return [...document.querySelectorAll(s)]}
function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]))}
function showScreen(name){Object.values(screens).forEach(x=>x.classList.remove('active'));screens[name].classList.add('active');window.scrollTo({top:0,behavior:'instant'})}
function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
function readJSON(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}}
function stateKey(id){return STATE_PREFIX+id}
function resultKey(id){return RESULT_PREFIX+id}
function simMap(){return new Map(BANK.simulations.map(s=>[s.id,s]))}
function groupMap(){return new Map(BANK.groups.map(g=>[g.id,g]))}
function getSim(id){return simMap().get(id)}
function loadState(id){return readJSON(stateKey(id),null)}
function loadResult(id){return readJSON(resultKey(id),null)}
function saveState(){if(!state||!activeSimId)return;localStorage.setItem(stateKey(activeSimId),JSON.stringify(state));const el=$('#saveStatus');el.textContent='✓ Avance guardado';clearTimeout(saveState.t);saveState.t=setTimeout(()=>el.textContent='',1600)}

function orderedGroupsForSimulation(id){
  const sim=getSim(id),gm=groupMap();
  return BANK.subjectOrder.flatMap(subject=>shuffle(sim.groupIds.map(gid=>gm.get(gid)).filter(g=>g&&g.subject===subject)).map(g=>g.id));
}
function createSession(id){
  activeSimId=id;
  state={version:1,simulationId:id,groupOrder:orderedGroupsForSimulation(id),currentGroup:0,answers:{},startedAt:new Date().toISOString(),finishedAt:null};
  saveState();return state;
}
function sessionGroups(){const gm=groupMap();return (state?.groupOrder||[]).map(id=>gm.get(id)).filter(Boolean)}
function sessionQuestionEntries(){let n=0;return sessionGroups().flatMap((g,groupIndex)=>g.questions.map(q=>({q,g,groupIndex,sessionNumber:++n})))}
function answeredCount(){return Object.keys(state?.answers||{}).length}

function simulationStatus(sim){
  const st=loadState(sim.id),result=loadResult(sim.id);
  if(st&&!st.finishedAt){const count=Object.keys(st.answers||{}).length;return {kind:'progress',count,label:`${count} de ${TOTAL} respondidas`}}
  if(result)return {kind:'done',count:TOTAL,label:`Finalizado · ${result.global}/500`};
  return {kind:'new',count:0,label:'Sin comenzar'};
}
function initWelcome(){
  state=null;lastResult=null;activeSimId=null;
  $('#subjectSummary').innerHTML=BANK.subjectOrder.map(s=>`<div class="subject-pill"><b>${BANK.subjectTargets[s]}</b><span>${esc(s)}</span></div>`).join('');
  const st=BANK.stats||{};
  $('#bankSummary').innerHTML=`Contenido definitivo: <strong>${st.validatedUniqueQuestions||508} preguntas únicas</strong>, <strong>dos simulacros de 254</strong> y cero repeticiones entre ellos.`;
  $('#simulationCards').innerHTML=BANK.simulations.map((sim,index)=>{
    const status=simulationStatus(sim);const pct=Math.round(status.count/TOTAL*100);
    const primary=status.kind==='progress'?'Continuar':status.kind==='done'?'Repetir':'Comenzar';
    return `<article class="simulation-card" data-sim-card="${sim.id}">
      <div class="simulation-number">${index+1}</div>
      <div class="simulation-card-copy"><div class="eyebrow">254 PREGUNTAS</div><h2>${esc(sim.title)}</h2><p>${esc(sim.description)}</p>
      <div class="mini-progress"><div style="width:${pct}%"></div></div><small>${esc(status.label)}</small></div>
      <div class="simulation-actions"><button class="btn primary" data-action="open" data-sim="${sim.id}">${primary}</button>${status.kind==='progress'?`<button class="btn ghost" data-action="restart" data-sim="${sim.id}">Reiniciar</button>`:''}${loadResult(sim.id)?`<button class="btn secondary" data-action="result" data-sim="${sim.id}">Ver resultado</button>`:''}</div>
    </article>`}).join('');
  $$('[data-action="open"]').forEach(b=>b.onclick=()=>openSimulation(b.dataset.sim));
  $$('[data-action="restart"]').forEach(b=>b.onclick=()=>{if(confirm('Se borrará el avance de este simulacro. ¿Deseas reiniciarlo?')){localStorage.removeItem(stateKey(b.dataset.sim));createSession(b.dataset.sim);renderExam()}});
  $$('[data-action="result"]').forEach(b=>b.onclick=()=>{activeSimId=b.dataset.sim;lastResult=loadResult(activeSimId);if(lastResult)renderResults(lastResult)});
  showScreen('welcome');
}
function openSimulation(id){
  activeSimId=id;const st=loadState(id);
  if(st&&!st.finishedAt){state=st;renderExam();return}
  if(st?.finishedAt&&loadResult(id)){
    if(!confirm('Este simulacro ya fue finalizado. ¿Deseas repetirlo desde cero?')){lastResult=loadResult(id);renderResults(lastResult);return}
  }
  createSession(id);renderExam();
}

function renderExam(){
  const groups=sessionGroups(),g=groups[state.currentGroup];if(!g)return initWelcome();
  const sim=getSim(activeSimId);const entries=sessionQuestionEntries();const currentEntries=entries.filter(e=>e.groupIndex===state.currentGroup);
  $('#simulationLabel').textContent=sim?.title||'';
  $('#subjectLabel').textContent=g.subject+(g.sourceExam?` · ${g.sourceExam}`:'');
  $('#blockTitle').textContent=g.questionCount>1?`Bloque de ${g.questionCount} preguntas`:'Pregunta individual';
  $('#contextNote').innerHTML=g.sharedContext?`<strong>Contexto compartido:</strong> responde juntas las preguntas originales ${g.questionStart} a ${g.questionEnd}.`:`Observa el material y responde la pregunta original ${g.questionStart}.`;
  $('#pageImages').innerHTML=g.pages.map((src,i)=>`<div class="page-image-wrap"><img src="${esc(src)}" alt="Página ${i+1} del bloque" data-zoom="${esc(src)}" loading="eager"><span class="page-badge">Página ${i+1}/${g.pages.length}</span></div>`).join('');
  $('#answerCards').innerHTML=currentEntries.map(({q,sessionNumber})=>`<section class="answer-card"><div class="answer-card-header"><h3>Pregunta ${sessionNumber} de ${TOTAL}</h3><span class="source-label">N.º original ${esc(q.sourceQuestion)}</span></div><div class="option-row" role="group" aria-label="Opciones de la pregunta ${sessionNumber}">${q.options.map(o=>`<button class="option-btn ${state.answers[q.id]===o?'selected':''}" data-qid="${esc(q.id)}" data-option="${esc(o)}" aria-pressed="${state.answers[q.id]===o}">${esc(o)}</button>`).join('')}</div></section>`).join('');
  const ans=answeredCount();$('#progressText').textContent=`${ans} de ${TOTAL} respondidas`;$('#remainingText').textContent=ans===TOTAL?'Lista para finalizar':`${TOTAL-ans} pendientes`;$('#progressBar').style.width=`${ans/TOTAL*100}%`;
  $('#prevBtn').disabled=state.currentGroup===0;$('#nextBtn').classList.toggle('hidden',state.currentGroup===groups.length-1);$('#finishBtn').classList.toggle('hidden',state.currentGroup!==groups.length-1);$('#finishBtn').disabled=ans!==TOTAL;
  $$('.option-btn').forEach(b=>b.onclick=()=>{
    const qid=b.dataset.qid,option=b.dataset.option;
    state.answers[qid]=option;
    const row=b.closest('.option-row');
    row?.querySelectorAll('.option-btn').forEach(btn=>{
      const selected=btn.dataset.option===option;
      btn.classList.toggle('selected',selected);
      btn.setAttribute('aria-pressed',String(selected));
    });
    const updated=answeredCount();
    $('#progressText').textContent=`${updated} de ${TOTAL} respondidas`;
    $('#remainingText').textContent=updated===TOTAL?'Lista para finalizar':`${TOTAL-updated} pendientes`;
    $('#progressBar').style.width=`${updated/TOTAL*100}%`;
    $('#finishBtn').disabled=updated!==TOTAL;
    saveState();
  });
  $$('[data-zoom]').forEach(img=>img.onclick=()=>openImage(img.dataset.zoom));saveState();showScreen('exam');
}
function moveGroup(delta){state.currentGroup=Math.max(0,Math.min(sessionGroups().length-1,state.currentGroup+delta));saveState();renderExam()}
function renderNavigator(){
  const entries=sessionQuestionEntries();
  $('#navigatorContent').innerHTML=BANK.subjectOrder.map(subject=>{const rows=entries.filter(e=>e.g.subject===subject);return rows.length?`<h3 class="nav-subject">${esc(subject)}</h3><div class="nav-grid">${rows.map(e=>`<button class="nav-question ${state.answers[e.q.id]?'answered':''} ${e.groupIndex===state.currentGroup?'current':''}" data-group="${e.groupIndex}" title="Pregunta ${e.sessionNumber}">${e.sessionNumber}</button>`).join('')}</div>`:''}).join('');
  $$('.nav-question').forEach(b=>b.onclick=()=>{state.currentGroup=+b.dataset.group;saveState();$('#navigatorDialog').close();renderExam()});$('#navigatorDialog').showModal();
}
function openImage(src){$('#zoomedImage').src=src;$('#imageDialog').showModal()}

function logLikelihood(theta,items){let ll=0;for(const it of items){const b=it.q.difficulty==='Fácil'?-1:(it.q.difficulty==='Media'?0:1.05),a=1.2,c=1/it.q.options.length,p=c+(1-c)/(1+Math.exp(-a*(theta-b))),ok=state.answers[it.q.id]===it.q.answer;ll+=Math.log(Math.max(1e-10,ok?p:1-p))}return ll}
function estimateSubject(subject){const items=sessionQuestionEntries().filter(e=>e.g.subject===subject);let bestT=-4,best=-Infinity;for(let t=-4;t<=4;t+=.02){const ll=logLikelihood(t,items);if(ll>best){best=ll;bestT=t}}const score=Math.max(0,Math.min(100,Math.round(100/(1+Math.exp(-1.25*bestT))))),correct=items.filter(e=>state.answers[e.q.id]===e.q.answer).length;return {subject,score,theta:+bestT.toFixed(2),correct,total:items.length,accuracy:Math.round(correct/items.length*100)}}
function levelLabel(score){return score<40?'Nivel 1 orientativo':score<60?'Nivel 2 orientativo':score<80?'Nivel 3 orientativo':'Nivel 4 orientativo'}
function globalBand(score){return score<250?'Base por reforzar':score<350?'Desempeño medio':score<425?'Desempeño alto':'Desempeño sobresaliente'}
function calculateResult(){const subjects=BANK.subjectOrder.map(estimateSubject),m=Object.fromEntries(subjects.map(x=>[x.subject,x.score])),weighted=BANK.subjectOrder.reduce((a,s)=>a+m[s]*BANK.scoring.weights[s],0)/13,global=Math.round(weighted*5),correct=sessionQuestionEntries().filter(e=>state.answers[e.q.id]===e.q.answer).length;return {simulationId:activeSimId,createdAt:new Date().toISOString(),global,correct,total:TOTAL,subjects,answers:{...state.answers},groupOrder:[...state.groupOrder]}}
function finishPractice(){if(answeredCount()!==TOTAL)return;state.finishedAt=new Date().toISOString();saveState();lastResult=calculateResult();localStorage.setItem(resultKey(activeSimId),JSON.stringify(lastResult));renderResults(lastResult)}
function renderResults(result){
  activeSimId=result.simulationId||activeSimId;const sim=getSim(activeSimId);lastResult=result;
  state={simulationId:activeSimId,groupOrder:result.groupOrder,answers:result.answers||{},finishedAt:result.createdAt,currentGroup:0};
  $('#resultSimulationLabel').textContent=`RESULTADO · ${sim?.title||'SIMULACRO'}`;
  $('#scoreHero').innerHTML=`<div class="global-score" style="--score-angle:${result.global/500*360}deg"><div><b>${result.global}</b><span>de 500</span></div></div><div class="score-copy"><div class="eyebrow">${globalBand(result.global)}</div><h2>${result.correct} respuestas correctas</h2><p>La estimación combina el patrón de aciertos con la dificultad provisional de los ítems. Acertar preguntas difíciles aumenta más la habilidad estimada; fallar preguntas fáciles la reduce más.</p></div>`;
  $('#subjectScores').innerHTML=result.subjects.map(s=>`<article class="score-card"><h3>${esc(s.subject)}</h3><div class="value">${s.score}</div><small>${s.correct}/${s.total} correctas · ${s.accuracy}%<br>${levelLabel(s.score)} · θ ${s.theta}</small></article>`).join('');
  $('#reviewSubject').innerHTML=BANK.subjectOrder.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');$('#reviewSubject').value=BANK.subjectOrder[0];$('#reviewFilter').value='incorrect';renderReview();showScreen('results');
}
function solutionMarkup(q){
  const sol=q.solution||{},status=q.solutionStatus||'specific_guided';
  const official=status==='official_explained',verified=status==='manual_verified',enhanced=status==='enhanced_guided';
  const statusLabel=official?'Explicación oficial':verified?'Solución verificada':enhanced?'Solución guiada revisada':'Solución guiada';
  const statusClass=official?'official':verified?'verified':'guided';
  const steps=Array.isArray(sol.steps)?sol.steps:[],distractors=Array.isArray(sol.distractors)?sol.distractors:[],correctText=sol.correctOptionText?` · ${esc(sol.correctOptionText)}`:'';
  return `<div class="solution-box ${statusClass}"><div class="solution-meta"><span class="solution-status ${statusClass}">${statusLabel}</span>${sol.verification?`<span class="verification-source">${esc(sol.verification)}</span>`:''}</div><h4>${esc(sol.title||'Solución')}</h4>${sol.whatEvaluates?`<p><strong>Qué evalúa:</strong> ${esc(sol.whatEvaluates)}</p>`:''}${sol.task?`<p><strong>Tarea:</strong> ${esc(sol.task)}</p>`:''}<p><strong>Respuesta correcta:</strong> ${esc(q.answer)}${correctText}</p><p><strong>Justificación:</strong> ${esc(sol.whyCorrect||`La clave registrada es ${q.answer}.`)}</p>${steps.length?`<h5>Paso a paso</h5><ol>${steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:''}${distractors.length?`<h5>Por qué no las otras opciones</h5><ul class="distractor-list">${distractors.map(d=>`<li><b>${esc(d.option)}</b>${d.text?` · ${esc(d.text)}`:''}<br><span>${esc(d.reason)}</span></li>`).join('')}</ul>`:''}${sol.miniGuide?`<p class="mini-guide"><strong>Mini guía:</strong> ${esc(sol.miniGuide)}</p>`:''}${statusClass==='guided'?`<div class="provisional">Solución pedagógica construida a partir de la clave del cuadernillo, el enunciado y el tema identificado. Consulta también la imagen completa del ítem.</div>`:''}</div>`;
}
function renderReview(){
  const subject=$('#reviewSubject').value,filter=$('#reviewFilter').value,gm=groupMap(),answers=lastResult?.answers||{},groups=(lastResult?.groupOrder||[]).map(id=>gm.get(id)).filter(g=>g?.subject===subject);
  const html=groups.map(g=>{const relevant=g.questions.filter(q=>filter==='all'||(filter==='correct')===(answers[q.id]===q.answer));if(!relevant.length)return'';return `<article class="review-group"><div class="review-group-head"><h3>${g.sharedContext?'Bloque de contexto':'Pregunta'} ${esc(g.questionStart)}${g.questionEnd!==g.questionStart?`–${esc(g.questionEnd)}`:''}</h3><span class="source-label">${esc(g.sourceExam||'Cuadernillo')} · ${esc(g.sourceFile)}</span></div><div class="review-page-images">${g.pages.map(src=>`<img src="${esc(src)}" data-zoom="${esc(src)}" loading="lazy" alt="Página del bloque revisado">`).join('')}</div>${relevant.map(q=>{const selected=answers[q.id],ok=selected===q.answer;return `<section class="review-answer"><div class="review-answer-top"><strong>Pregunta original ${esc(q.sourceQuestion)}</strong><span class="result-badge ${ok?'correct':'incorrect'}">${ok?'Correcta':'Incorrecta'}</span></div><div class="answer-facts"><span class="fact">Tu respuesta: <b>${esc(selected||'Sin responder')}</b></span><span class="fact">Clave: <b>${esc(q.answer)}</b></span><span class="fact">Dificultad: <b>${esc(q.difficulty)}</b></span>${q.level?`<span class="fact">Nivel: <b>${esc(q.level)}</b></span>`:''}</div>${solutionMarkup(q)}</section>`}).join('')}</article>`}).join('');
  $('#reviewList').innerHTML=html||'<div class="empty-state">No hay preguntas que coincidan con este filtro.</div>';$$('#reviewList [data-zoom]').forEach(img=>img.onclick=()=>openImage(img.dataset.zoom));
}

$('#prevBtn').onclick=()=>moveGroup(-1);$('#nextBtn').onclick=()=>moveGroup(1);$('#finishBtn').onclick=finishPractice;$('#exitBtn').onclick=initWelcome;$('#openNavigatorBtn').onclick=renderNavigator;$('#closeNavigatorBtn').onclick=()=>$('#navigatorDialog').close();$('#closeImageBtn').onclick=()=>$('#imageDialog').close();$('#homeBtn').onclick=initWelcome;$('#otherSimulationBtn').onclick=initWelcome;$('#repeatSimulationBtn').onclick=()=>{if(confirm('Se borrará el avance y resultado guardado de este simulacro. ¿Deseas repetirlo?')){localStorage.removeItem(stateKey(activeSimId));localStorage.removeItem(resultKey(activeSimId));createSession(activeSimId);renderExam()}};$('#reviewSubject').onchange=renderReview;$('#reviewFilter').onchange=renderReview;
window.addEventListener('keydown',e=>{if(!screens.exam.classList.contains('active'))return;if(['a','b','c','d','e','f','g'].includes(e.key.toLowerCase())){const card=$$('.answer-card').find(c=>!c.querySelector('.selected')),btn=card?.querySelector(`[data-option="${e.key.toUpperCase()}"]`);if(btn)btn.click()}});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
initWelcome();
})();
