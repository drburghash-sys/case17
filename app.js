const CASES = window.CASE17_CASES || [];

const STORAGE_KEY = 'case17Solved_story_v4';
const state = {
  filter: 'الكل',
  solved: new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
};

const homeView = document.getElementById('homeView');
const caseView = document.getElementById('caseView');
const caseGrid = document.getElementById('caseGrid');
const caseContent = document.getElementById('caseContent');

const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
}[ch]));

const diffClass = d => ({'سهل':'easy','متوسط':'medium','صعب':'hard','خبير':'expert'})[d] || '';
const estimate = d => ({'سهل':'6–10','متوسط':'10–15','صعب':'15–22','خبير':'20–30'})[d] || '10–15';

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.solved]));
  updateProgress();
}

function isUnlocked(c) {
  return c.id === 1 || state.solved.has(c.id - 1);
}

function levelUnlocked(level) {
  return CASES.some(c => c.difficulty === level && isUnlocked(c));
}

function time12(total) {
  total = ((total % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const min = total % 60;
  const ap = h24 < 12 ? 'ص' : 'م';
  const h = h24 % 12 || 12;
  return `${h}:${String(min).padStart(2,'0')} ${ap}`;
}

function caseTimes(id) {
  const base = 17 * 60 + ((id * 17) % 210);
  return {
    arrival: time12(base - 28),
    before: time12(base - 12),
    incident: time12(base),
    after: time12(base + 11),
    later: time12(base + 27)
  };
}

function actors(c) {
  const s = c.suspects;
  const guilty = s[c.culprit];
  const decoy = s[(c.culprit + 1) % s.length];
  const witness = s[(c.culprit + 2) % s.length];
  const cleared = s[(c.culprit + 3) % s.length];
  const extra = s.length > 4 ? s[(c.culprit + 4) % s.length] : null;
  return {guilty, decoy, witness, cleared, extra};
}

function storyData(c) {
  const t = caseTimes(c.id);
  const a = actors(c);
  const hard = c.difficulty === 'صعب' || c.difficulty === 'خبير';
  const expert = c.difficulty === 'خبير';

  const story = [
    `بدأ البلاغ في ${c.place} عند ${t.incident}: ${c.premise}`,
    `كان في دائرة التحقيق ${c.suspects.map(s=>s.name).join('، ')}. منذ البداية لم تكن المشكلة في نقص المشتبهين، بل في أن أكثر من شخص كان يخفي شيئًا مختلفًا.`,
    `${a.decoy.name} أعطى إفادة ناقصة وأخفى أمرًا جانبيًا، بينما قال ${a.guilty.name} إنه غادر المنطقة قبل ${t.before}. أما ${a.witness.name} فذكر حركة قرب موقع الحادث عند ${t.incident}، لكن شهادته وحدها لا تحدد شخصًا بعينه.`,
    `مهمتك ليست البحث عن أكثر شخص يبدو مريبًا؛ المطلوب ربط الزمن، طريقة التنفيذ، والدافع حتى يبقى تفسير واحد فقط متماسكًا.`
  ];

  const profiles = c.suspects.map((s, i) => {
    if (i === c.culprit) return {
      ...s,
      statement: `${s.name} يقول: «أنهيت عملي وغادرت قبل ${t.before}، ولم أعد إلى موقع الحادث.» لا يوجد شاهد مستقل يؤكد الفترة بين ${t.before} و${t.after}.`,
      flag: 'إفادة مرتبة لكن فيها فجوة زمنية.'
    };
    if (s.name === a.decoy.name) return {
      ...s,
      statement: `${s.name} أنكر في البداية وجوده قرب الموقع عند ${t.arrival}، ثم اعترف بأنه كان هناك لسبب شخصي لا يريد كشفه.`,
      flag: 'كذب فعلاً، لكن سبب الكذب قد يكون منفصلًا عن الجريمة.'
    };
    if (s.name === a.witness.name) return {
      ...s,
      statement: `${s.name} كان قريبًا من المكان، وأبلغ أنه شاهد حركة عند ${t.incident}. سجله يثبت وجوده، لكن لا يثبت مشاركته في التنفيذ.`,
      flag: 'شاهد ومشتبه في الوقت نفسه.'
    };
    if (s.name === a.cleared.name) return {
      ...s,
      statement: `${s.name} يقول إنه غادر عند ${t.before}. يوجد مصدر مستقل يضعه في موقع آخر عند ${t.incident}.`,
      flag: 'أليبي قابل للتحقق.'
    };
    return {
      ...s,
      statement: `${s.name} كان يملك سببًا مشروعًا للوجود في ${c.place}، لكنه لم يذكر كل تحركاته من البداية.`,
      flag: 'وجوده مشروع، لكن إفادته تحتاج مراجعة.'
    };
  });

  const easyEvidence = [
    {title:`سجل ${a.cleared.name}`, text:`عند ${t.incident} ظهر ${a.cleared.name} في تسجيل مستقل خارج نقطة التنفيذ. هذا يستبعده من النافذة الأساسية.`},
    {title:`إفادة ${a.decoy.name}`, text:`${a.decoy.name} كذب بشأن وجوده عند ${t.arrival}. بعد المراجعة ثبت أن سبب الكذب شخصي ولا يفسر ${c.method}.`},
    {title:`حركة ${a.guilty.name}`, text:`${a.guilty.name} قال إنه غادر قبل ${t.before}، لكن سجلًا ثانويًا يثبت استخدام شيء مرتبط به قرب الموقع عند ${t.after}.`},
    {title:'طريقة التنفيذ', text:`إعادة فحص الموقع أثبتت أن الفعل أمكن تنفيذه بهذه الطريقة: ${c.method}.`},
    {title:`ما يعرفه ${a.guilty.name}`, text:`من بين الموجودين، كان ${a.guilty.name} يعرف الإجراء أو المسار اللازم لتنفيذ الطريقة المكتشفة بحكم دوره: ${a.guilty.role}.`},
    {title:'النقطة التي قلبت التحقيق', text:`${c.key}. عند تطبيق هذه المعلومة على أقوال الأشخاص، تصبح رواية أحدهم غير قابلة للاستمرار.`},
    {title:'الدافع', text:`ظهرت رسالة سابقة تربط ${a.guilty.name} مباشرة بخلاف متعلق بـ${c.motive}. الدافع وحده لا يكفي، لكنه ينسجم مع بقية الأدلة.`},
    {title:'مقارنة الروايات', text:`${a.decoy.name} فُسرت كذبته، و${a.cleared.name} لديه أليبي مستقل، وشهادة ${a.witness.name} لا تثبت مشاركته. تبقى فجوة رواية ${a.guilty.name} مرتبطة بزمن التنفيذ وطريقته.`}
  ];

  const mediumExtra = [
    {title:`تفصيل ذكره ${a.witness.name}`, text:`${a.witness.name} سمع أو رأى حركة عند ${t.incident}. الوصف يتوافق مع شخصين، لكنه يستبعد تنفيذ الفعل قبل ${t.before} كما ادعى أحد المشتبهين.`},
    {title:'الأثر المادي', text:`أثر من موقع الحادث وُجد في مسار استخدمه ${a.guilty.name} و${a.decoy.name}. لذلك لا يمكن استخدامه وحده ضد أي منهما.`},
    {title:'سجل الصلاحيات', text:`الصلاحيات كانت متاحة لأكثر من شخص، لكن ${a.guilty.name} هو الوحيد بينهم الذي تجمع له الصلاحية مع النافذة الزمنية غير المفسرة.`}
  ];

  const hardExtra = [
    {title:`الكذبة الثانية`, text:`${a.witness.name} أخفى لقاءً قصيرًا مع ${a.decoy.name} قبل الحادث. اللقاء حقيقي لكنه يفسر سبب ارتباك شهادته، لا طريقة الجريمة.`},
    {title:'سجل صحيح بتفسير خاطئ', text:`يوجد سجل يضع جهازًا أو بطاقة تخص ${a.guilty.name} في مكان آخر عند ${t.before}. السجل يثبت وجود الجهاز أو البطاقة فقط، لا وجود الشخص نفسه.`},
    {title:'نسخة أقدم من السجل', text:`نسخة احتياطية تحفظ حدثًا عند ${t.after} لا يظهر في النسخة الحالية. الحدث يتوافق مع ${c.method} ولا يحمل اسم المستخدم صراحة.`},
    {title:'الدليل السلبي', text:`لو كانت رواية ${a.guilty.name} صحيحة لظهر حدث متوقع في النظام بين ${t.before} و${t.incident}، لكنه غير موجود. غياب هذا الحدث يصبح مهمًا عند جمعه مع بقية الأدلة.`}
  ];

  const expertExtra = [
    {title:`مسار ${a.extra ? a.extra.name : a.decoy.name}`, text:`${a.extra ? a.extra.name : a.decoy.name} يملك دافعًا ظاهريًا أقوى من بقية المشتبهين، لكن تحركاته الموثقة لا تسمح بتنفيذ الطريقة المكتشفة خلال النافذة الزمنية.`},
    {title:'تعارض المصدرين', text:`مصدران موثوقان يبدوان متعارضين: الأول يضع أثرًا مرتبطًا بـ${a.guilty.name} خارج الموقع، والثاني يثبت نشاطًا داخله. التعارض يختفي فقط إذا فصلت بين «وجود الغرض» و«وجود الشخص».`},
    {title:'إعادة بناء دقيقة', text:`التجربة الزمنية أثبتت أن تنفيذ ${c.method} يحتاج نافذة قصيرة جدًا. فقط رواية واحدة تترك هذه النافذة بلا شاهد مستقل من دون أن تتعارض مع الأدلة الفيزيائية.`},
    {title:'الخيط الأخير', text:`لا يوجد دليل منفرد يسمي الفاعل. الحل يحتاج ربط: ${c.key} + نافذة الزمن + المعرفة بطريقة التنفيذ + الدافع المرتبط بـ${c.motive}.`}
  ];

  let evidence = [...easyEvidence];
  if (c.difficulty !== 'سهل') evidence.push(...mediumExtra);
  if (hard) evidence.push(...hardExtra);
  if (expert) evidence.push(...expertExtra);

  // في المستويات الأعلى نعيد ترتيب الأدلة حتى لا تأتي النتيجة في تسلسل مريح.
  if (hard) {
    const order = c.id % 2
      ? [1,8,3,10,0,5,9,2,11,6,4,7,12,13,14]
      : [4,1,9,2,7,0,10,5,3,8,6,11,12,13,14];
    evidence = order.filter(i => evidence[i]).map(i => evidence[i]);
    const rest = evidence.length;
  }

  return {t, story, profiles, evidence};
}

function updateProgress() {
  const n = state.solved.size;
  document.getElementById('progressText').textContent = `${n} من ${CASES.length}`;
  document.getElementById('progressBar').style.width = `${n / CASES.length * 100}%`;
}

function renderFilters() {
  document.querySelectorAll('.filter[data-filter]').forEach(btn => {
    const level = btn.dataset.filter;
    if (level === 'الكل') return;
    const locked = !levelUnlocked(level);
    btn.disabled = locked;
    btn.classList.toggle('locked-filter', locked);
    btn.innerHTML = locked ? `🔒 ${level}` : level;
  });
}

function renderHome() {
  renderFilters();
  const list = state.filter === 'الكل' ? CASES : CASES.filter(c => c.difficulty === state.filter);

  caseGrid.innerHTML = list.map(c => {
    const unlocked = isUnlocked(c);
    const solved = state.solved.has(c.id);
    if (!unlocked) {
      return `
        <button class="case-card locked-card" data-id="${c.id}" disabled>
          <div class="card-top">
            <span>القضية ${String(c.id).padStart(2,'0')}</span>
            <span class="diff ${diffClass(c.difficulty)}">${esc(c.difficulty)}</span>
          </div>
          <div class="lock-mark">🔒</div>
          <h2>ملف مقفل</h2>
          <p>حل القضية السابقة لفتح هذا الملف.</p>
          <div class="card-bottom"><span>متسلسل</span><span>مغلق</span></div>
        </button>`;
    }

    return `
      <button class="case-card ${solved ? 'solved' : 'unlocked'}" data-id="${c.id}">
        <div class="card-top">
          <span>القضية ${String(c.id).padStart(2,'0')}</span>
          <span class="diff ${diffClass(c.difficulty)}">${esc(c.difficulty)}</span>
        </div>
        <h2>${esc(c.title)}</h2>
        <p><b>${esc(c.place)}</b><br>${esc(c.premise)}</p>
        <div class="card-bottom">
          <span>${solved ? 'إعادة فتح الملف' : 'ابدأ التحقيق'}</span>
          <span class="solved-tag">محلولة ✓</span>
        </div>
      </button>`;
  }).join('');

  caseGrid.querySelectorAll('.case-card:not(:disabled)').forEach(b => {
    b.onclick = () => openCase(Number(b.dataset.id));
  });
  updateProgress();
}

function wrongHint(c) {
  if (c.difficulty === 'سهل') return 'ليس هذا المتهم. راجع الدليل الذي يربط الزمن بطريقة التنفيذ، ثم قارن الأليبي المستقل لكل اسم.';
  if (c.difficulty === 'متوسط') return 'الاتهام لا يفسر كل الأدلة. هناك كذبة جانبية صحيحة لكنها ليست الجريمة؛ لا تخلط بينهما.';
  return 'النتيجة لا تصمد أمام جميع الأدلة. في هذا المستوى لا يكفي الدافع أو الكذب وحده؛ أعد بناء الخط الزمني كاملًا.';
}

function openCase(id) {
  const c = CASES.find(x => x.id === id);
  if (!c || !isUnlocked(c)) return;
  const d = storyData(c);

  homeView.classList.add('hidden');
  caseView.classList.remove('hidden');
  window.scrollTo({top:0});

  caseContent.innerHTML = `
    <section class="case-head panel">
      <div class="case-top">
        <span>ملف ${String(c.id).padStart(2,'0')}</span>
        <span class="diff ${diffClass(c.difficulty)}">${esc(c.difficulty)}</span>
      </div>
      <h1>${esc(c.title)}</h1>
      <p class="premise">${esc(c.premise)}</p>
      <div class="info-grid">
        <div class="info-box"><b>المكان</b>${esc(c.place)}</div>
        <div class="info-box"><b>المطلوب</b>${esc(c.mission)}</div>
        <div class="info-box"><b>زمن متوقع</b>${estimate(c.difficulty)} دقيقة</div>
      </div>
    </section>

    <div class="case-stats">
      <span>🧩 ${d.evidence.length} دليل</span>
      <span>👥 ${c.suspects.length} مشتبهين</span>
      <span>🕰️ الأوقات 12 ساعة</span>
    </div>

    <h3 class="section-title">القصة</h3>
    <section class="story-board">
      ${d.story.map((p,i)=>`<p><span class="story-no">0${i+1}</span>${esc(p)}</p>`).join('')}
    </section>

    <h3 class="section-title">ملفات المشتبهين</h3>
    <div class="suspects">
      ${d.profiles.map(s=>`
        <details class="suspect">
          <summary><span>👤 ${esc(s.name)}</span><small>${esc(s.role)}</small></summary>
          <div>
            <p>${esc(s.statement)}</p>
            <span class="flag">${esc(s.flag)}</span>
          </div>
        </details>`).join('')}
    </div>

    <h3 class="section-title">الأدلة والتحقيق</h3>
    <p class="hint">الأسماء مهمة. راقب ماذا قال كل شخص، أين كان، وما الذي يثبته الدليل فعلاً. الدليل قد يثبت وجود بطاقة أو جهاز دون أن يثبت وجود صاحبه.</p>
    <div class="evidence-list">
      ${d.evidence.map((ev,i)=>`
        <details class="evidence">
          <summary><span class="ecode">E-${String(i+1).padStart(2,'0')}</span><span>${esc(ev.title)}</span></summary>
          <div>${esc(ev.text)}</div>
        </details>`).join('')}
    </div>

    <h3 class="section-title">توجيه الاتهام</h3>
    <div class="accuse-list">
      ${c.suspects.map((s,i)=>`
        <div class="accuse" data-index="${i}">
          <button>اتهام ${esc(s.name)}</button>
          <div class="verdict"></div>
        </div>`).join('')}
    </div>

    <h3 class="section-title">دفتر المحقق</h3>
    <textarea class="notes" placeholder="اكتب: من كان أين؟ من كذب؟ لماذا كذب؟ ما الدليل الذي يثبت الشخص نفسه وليس بطاقته أو جهازه؟"></textarea>
  `;

  caseContent.querySelectorAll('.accuse').forEach(row => {
    row.querySelector('button').onclick = () => {
      const i = Number(row.dataset.index);
      caseContent.querySelectorAll('.accuse').forEach(x => x.classList.remove('open','correct','wrong'));
      row.classList.add('open');
      const verdict = row.querySelector('.verdict');

      if (i === c.culprit) {
        row.classList.add('correct');
        const newlySolved = !state.solved.has(c.id);
        state.solved.add(c.id);
        save();

        const next = CASES.find(x => x.id === c.id + 1);
        verdict.innerHTML = `
          <b>✓ تم حل القضية: ${esc(c.suspects[c.culprit].name)}</b>
          <p>${esc(c.solution)}</p>
          ${next ? `<button class="next-case" data-next="${next.id}">🔓 تم فتح القضية ${String(next.id).padStart(2,'0')} — انتقل إليها</button>` : '<b>أنهيت جميع ملفات CASE 17.</b>'}
        `;
        const nb = verdict.querySelector('.next-case');
        if (nb) nb.onclick = () => openCase(Number(nb.dataset.next));
      } else {
        row.classList.add('wrong');
        verdict.textContent = wrongHint(c);
      }
    };
  });
}

document.getElementById('backBtn').onclick = () => {
  caseView.classList.add('hidden');
  homeView.classList.remove('hidden');
  renderHome();
  window.scrollTo({top:0});
};

document.querySelectorAll('.filter').forEach(btn => {
  btn.onclick = () => {
    if (btn.disabled) return;
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    renderHome();
  };
});

renderHome();
