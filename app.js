const CASES=window.CASE17_CASES||[];
const STORAGE_KEY='case17Solved_sourced_v1';
const state={filter:'الكل',solved:new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'))};

const homeView=document.getElementById('homeView');
const caseView=document.getElementById('caseView');
const caseGrid=document.getElementById('caseGrid');
const caseContent=document.getElementById('caseContent');

const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const dc=d=>({'سهل':'easy','متوسط':'medium','صعب':'hard','خبير':'expert'})[d]||'';
const est=d=>({'سهل':'7–12','متوسط':'12–18','صعب':'18–28','خبير':'25–40'})[d]||'12–18';

function save(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify([...state.solved]));
  updateProgress();
}
function isUnlocked(c){return c.id===1||state.solved.has(c.id-1)}
function levelUnlocked(level){return CASES.some(c=>c.difficulty===level&&isUnlocked(c))}
function updateProgress(){
  const n=state.solved.size;
  document.getElementById('progressText').textContent=`${n} من ${CASES.length}`;
  document.getElementById('progressBar').style.width=`${CASES.length?n/CASES.length*100:0}%`;
}
function renderFilters(){
  document.querySelectorAll('.filter[data-filter]').forEach(btn=>{
    const level=btn.dataset.filter;
    if(level==='الكل')return;
    const locked=!levelUnlocked(level);
    btn.disabled=locked;
    btn.classList.toggle('locked-filter',locked);
    btn.innerHTML=locked?`🔒 ${level}`:level;
  });
}
function renderHome(){
  renderFilters();
  const list=state.filter==='الكل'?CASES:CASES.filter(c=>c.difficulty===state.filter);
  caseGrid.innerHTML=list.map(c=>{
    const unlocked=isUnlocked(c),solved=state.solved.has(c.id);
    if(!unlocked)return `
      <button class="case-card locked-card" disabled>
        <div class="card-top"><span>القضية ${String(c.id).padStart(2,'0')}</span><span class="diff ${dc(c.difficulty)}">${esc(c.difficulty)}</span></div>
        <div class="lock-mark">🔒</div><h2>ملف مقفل</h2>
        <p>حل القضية السابقة لفتح هذا الملف.</p>
        <div class="card-bottom"><span>متسلسل</span><span>مغلق</span></div>
      </button>`;
    return `
      <button class="case-card ${solved?'solved':'unlocked'}" data-id="${c.id}">
        <div class="card-top"><span>القضية ${String(c.id).padStart(2,'0')}</span><span class="diff ${dc(c.difficulty)}">${esc(c.difficulty)}</span></div>
        <h2>${esc(c.title)}</h2>
        <p><b>${esc(c.place)}</b><br>${esc(c.premise)}</p>
        <div class="card-bottom"><span>${solved?'إعادة فتح الملف':'ابدأ التحقيق'}</span><span class="solved-tag">محلولة ✓</span></div>
      </button>`;
  }).join('');
  caseGrid.querySelectorAll('.case-card:not(:disabled)').forEach(b=>b.onclick=()=>openCase(Number(b.dataset.id)));
  updateProgress();
}
function wrongHint(c){
  if(c.difficulty==='سهل')return 'الاتهام لا يجمع الدافع مع الفرصة والدليل المادي. أعد مقارنة أسماء المشتبهين بالأدلة.';
  if(c.difficulty==='متوسط')return 'هناك تفسير بريء لأحد الأدلة القوية. لا تعتمد على الكذب وحده؛ اربط التوقيت بالطريقة.';
  if(c.difficulty==='صعب')return 'هذا الاتهام يفسر جزءًا من القضية فقط. أعد بناء التسلسل الزمني وحدد أي دليل يثبت الشخص نفسه لا مجرد غرض يخصه.';
  return 'في هذا الملف لا يوجد دليل منفرد حاسم. ابحث عن التفسير الوحيد الذي يجعل كل القرائن صحيحة في الوقت نفسه.';
}
function sourceBlock(c){
  return `<div class="source-box"><b>المصدر بعد الحل</b><br>الحبكة مقتبسة ومُعاد صياغتها من: <em>${esc(c.sourceTitle)}</em> — ${esc(c.sourceAuthor)}.<br><a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener">فتح المصدر الأصلي</a></div>`;
}
function openCase(id){
  const c=CASES.find(x=>x.id===id);
  if(!c||!isUnlocked(c))return;
  homeView.classList.add('hidden');caseView.classList.remove('hidden');window.scrollTo({top:0});
  caseContent.innerHTML=`
    <section class="case-head panel">
      <div class="case-top"><span>ملف ${String(c.id).padStart(2,'0')}</span><span class="diff ${dc(c.difficulty)}">${esc(c.difficulty)}</span></div>
      <h1>${esc(c.title)}</h1><p class="premise">${esc(c.premise)}</p>
      <div class="info-grid">
        <div class="info-box"><b>المكان</b>${esc(c.place)}</div>
        <div class="info-box"><b>المطلوب</b>${esc(c.mission)}</div>
        <div class="info-box"><b>الوقت المتوقع</b>${est(c.difficulty)} دقيقة</div>
      </div>
    </section>
    <div class="case-stats"><span>🧩 ${c.evidence.length} دليل</span><span>👥 ${c.suspects.length} مشتبهين</span><span>📚 حبكة من قضية كلاسيكية منشورة</span></div>

    <h3 class="section-title">القصة</h3>
    <section class="story-board">${c.story.map((p,i)=>`<p><span class="story-no">${String(i+1).padStart(2,'0')}</span>${esc(p)}</p>`).join('')}</section>

    <h3 class="section-title">المشتبهون وإفاداتهم</h3>
    <div class="suspects">${c.suspects.map(s=>`
      <details class="suspect">
        <summary><span>👤 ${esc(s.name)}</span><small>${esc(s.role)}</small></summary>
        <div><p>${esc(s.statement)}</p>${s.note?`<span class="flag">${esc(s.note)}</span>`:''}</div>
      </details>`).join('')}</div>

    <h3 class="section-title">الأدلة</h3>
    <p class="hint">كل دليل مكتوب ليخبرك بما حدث، لا بمن تتهم. بعض الأدلة لها تفسير ثانٍ، وبعض المشتبهين يكذبون دون أن يكونوا الجناة.</p>
    <div class="evidence-list">${c.evidence.map((e,i)=>`
      <details class="evidence">
        <summary><span class="ecode">E-${String(i+1).padStart(2,'0')}</span><span>${esc(e.title)}</span></summary>
        <div>${esc(e.text)}</div>
      </details>`).join('')}</div>

    <h3 class="section-title">توجيه الاتهام</h3>
    <div class="accuse-list">${c.suspects.map((s,i)=>`
      <div class="accuse" data-index="${i}">
        <button>اتهام ${esc(s.name)}</button><div class="verdict"></div>
      </div>`).join('')}</div>

    <h3 class="section-title">دفتر المحقق</h3>
    <textarea class="notes" placeholder="دوّن: من كان يملك الفرصة؟ من كذب؟ ما تفسير كل أثر؟ وهل يوجد دليل يناقض نظريتك؟"></textarea>
  `;

  caseContent.querySelectorAll('.accuse').forEach(row=>{
    row.querySelector('button').onclick=()=>{
      const i=Number(row.dataset.index);
      caseContent.querySelectorAll('.accuse').forEach(x=>x.classList.remove('open','correct','wrong'));
      row.classList.add('open');
      const v=row.querySelector('.verdict');
      if(i===c.culprit){
        row.classList.add('correct');
        state.solved.add(c.id);save();
        const next=CASES.find(x=>x.id===c.id+1);
        v.innerHTML=`<b>✓ تم حل القضية: ${esc(c.suspects[c.culprit].name)}</b><p>${esc(c.solution)}</p>${sourceBlock(c)}${next?`<button class="next-case" data-next="${next.id}">🔓 فتح القضية ${String(next.id).padStart(2,'0')} — انتقل إليها</button>`:'<b>أنهيت جميع الملفات الحالية.</b>'}`;
        const nb=v.querySelector('.next-case');if(nb)nb.onclick=()=>openCase(Number(nb.dataset.next));
      }else{
        row.classList.add('wrong');v.textContent=wrongHint(c);
      }
    };
  });
}
document.getElementById('backBtn').onclick=()=>{caseView.classList.add('hidden');homeView.classList.remove('hidden');renderHome();window.scrollTo({top:0})};
document.querySelectorAll('.filter').forEach(btn=>btn.onclick=()=>{if(btn.disabled)return;document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');state.filter=btn.dataset.filter;renderHome()});
renderHome();
