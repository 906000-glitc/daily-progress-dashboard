/* Rava Workspace — single source of truth for UI state and interactions. */
const STORAGE_KEY = 'rava-workspace-v5';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const safe = value => String(value ?? '').replace(/[<>]/g, '').trim();
const defaultState = {
  user: { name: 'سارا احمدی', email: 'sara@rava.local' },
  theme: 'light', note: '', activeProject: 'همه پروژه‌ها', reminders: true,
  tasks: [
    { title: 'مرور اهداف سه‌ماهه', meta: 'برنامه‌ریزی · ۳۰ دقیقه', time: '۰۹:۰۰', project: 'شخصی', done: true },
    { title: 'طراحی وایرفریم صفحه اصلی', meta: 'پروژه شخصی · ۱ ساعت و ۳۰ دقیقه', time: '۱۰:۳۰', project: 'محصول روال', done: false },
    { title: 'مطالعه فصل چهارم کتاب', meta: 'یادگیری · ۴۵ دقیقه', time: '۱۴:۰۰', project: 'یادگیری', done: false },
    { title: 'پیاده‌روی عصرانه', meta: 'سلامتی · ۳۰ دقیقه', time: '۱۸:۳۰', project: 'سلامتی', done: false },
    { title: 'نوشتن سه نکته روزانه', meta: 'ذهن‌آگاهی · ۱۰ دقیقه', time: '۲۱:۰۰', project: 'شخصی', done: false }
  ],
  goals: [
    { title: 'طراحی نسخه اول محصول', value: 68, color: 'purple' },
    { title: 'یادگیری زبان انگلیسی', value: 42, color: 'orange' }
  ],
  projects: [
    { name: 'محصول روال', color: '#756bea', tasks: 8, done: 5 },
    { name: 'شخصی', color: '#42b98b', tasks: 12, done: 9 },
    { name: 'یادگیری', color: '#eda24f', tasks: 6, done: 3 }
  ]
};
function loadState() { try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return { ...defaultState }; } }
const state = loadState();
let filter = 'all'; let modalType = null; let seconds = 1500; let timer = null;
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 2300); }
function renderTasks() {
  const items = state.tasks.filter(t => (filter === 'all' || (filter === 'done' ? t.done : !t.done)) && (state.activeProject === 'همه پروژه‌ها' || t.project === state.activeProject));
  $('#taskList').innerHTML = items.map(task => { const index = state.tasks.indexOf(task); return `<label class="task ${task.done ? 'done' : ''}"><input type="checkbox" data-task="${index}" ${task.done ? 'checked' : ''}><div><strong>${safe(task.title)}</strong><small>${safe(task.meta)} · ${safe(task.project)}</small></div><time>${safe(task.time)}</time></label>`; }).join('') || '<p class="empty-state">در این فیلتر وظیفه‌ای نیست. یک مورد جدید اضافه کن.</p>';
  $('#taskCount').textContent = state.tasks.filter(t => !t.done).length;
  const completed = state.tasks.filter(t => t.done).length; $('#completionRate').innerHTML = `${Math.round(completed / Math.max(state.tasks.length, 1) * 100)} <em>درصد</em>`;
}
function renderGoals() { $('#goalList').innerHTML = state.goals.map((g, i) => `<div class="goal"><div class="goal-title"><span>${safe(g.title)}</span><b>${g.value}%</b></div><div class="goal-progress"><i style="width:${g.value}%;background:${g.color === 'orange' ? 'var(--orange)' : 'var(--purple)'}"></i></div><div class="goal-meta"><span>${100 - g.value}% باقی مانده</span><button data-goal="${i}">+ پیشرفت</button></div></div>`).join(''); }
function openModal(type) { modalType = type; $('#modalTitle').textContent = type === 'task' ? 'وظیفه جدید' : type === 'goal' ? 'هدف جدید' : 'یادداشت جدید'; $('#modalTitleInput').value = ''; $('#modalDescriptionInput').value = ''; $('#modal').classList.add('open'); $('#modal').setAttribute('aria-hidden', 'false'); $('#modalTitleInput').focus(); }
function closeModal() { $('#modal').classList.remove('open'); $('#modal').setAttribute('aria-hidden', 'true'); modalType = null; }
function submitModal() { const title = safe($('#modalTitleInput').value); const description = safe($('#modalDescriptionInput').value); if (!title) return toast('لطفاً عنوان را وارد کن'); if (modalType === 'task') state.tasks.push({ title, meta: description || 'وظیفه جدید', time: '--:--', project: state.activeProject === 'همه پروژه‌ها' ? 'شخصی' : state.activeProject, done: false }); if (modalType === 'goal') state.goals.push({ title, value: 0, color: state.goals.length % 2 ? 'orange' : 'purple' }); if (modalType === 'note') state.note += `${state.note ? '\n' : ''}${title}`; save(); renderTasks(); renderGoals(); $('#notesInput').value = state.note; closeModal(); toast('با موفقیت ذخیره شد ✓'); }
function exportData() { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })); link.download = 'rava-backup.json'; link.click(); toast('نسخه پشتیبان آماده شد ✓'); }
function updateTimer() { const m = String(Math.floor(seconds / 60)).padStart(2, '0'); const s = String(seconds % 60).padStart(2, '0'); $('#timerDisplay').textContent = `${m}:${s}`; $('#timerProgress').style.width = `${(1500 - seconds) / 15}%`; }
function toggleTimer() { if (timer) { clearInterval(timer); timer = null; $('#timerButton').textContent = 'ادامه جلسه'; return; } $('#timerButton').textContent = 'توقف جلسه'; timer = setInterval(() => { seconds--; updateTimer(); if (seconds <= 0) { resetTimer(); toast('جلسه تمام شد؛ استراحت کن!'); } }, 1000); }
function resetTimer() { clearInterval(timer); timer = null; seconds = 1500; $('#timerButton').textContent = 'شروع جلسه'; updateTimer(); }
function addWorkspaceModules() {
  const page = $('.page');
  const modules = document.createElement('section'); modules.className = 'workspace-modules'; modules.innerHTML = `<article class="panel module-card" id="projects"><div class="panel-heading"><div><span class="eyebrow">مدیریت پروژه</span><h2>فضای کارهای تو</h2></div><button class="button soft" data-action="project">+ پروژه</button></div><div class="project-list">${state.projects.map((p, i) => `<button class="project-item" data-project="${safe(p.name)}"><i style="background:${p.color}"></i><span>${safe(p.name)}</span><b>${p.done}/${p.tasks}</b></button>`).join('')}<button class="project-item selected" data-project="همه پروژه‌ها"><i></i><span>همه پروژه‌ها</span><b>${state.tasks.length}</b></button></div></article><article class="panel module-card" id="calendar"><div class="panel-heading"><div><span class="eyebrow">تقویم هفتگی</span><h2>برنامه نزدیک</h2></div><button class="button soft" data-action="reminder">+ یادآور</button></div><div class="calendar-grid">${['ش','ی','د','س','چ','پ','ج'].map((d, i) => `<div class="calendar-day ${i === 1 ? 'today' : ''}"><small>${d}</small><b>${۲۶ + i}</b><i style="height:${22 + i * 8}%"></i></div>`).join('')}</div><p class="module-note">۳ رویداد مهم در این هفته · <button data-action="reminder">مدیریت یادآورها</button></p></article><article class="panel module-card" id="reports"><div class="panel-heading"><div><span class="eyebrow">گزارش پیشرفته</span><h2>الگوی عملکرد</h2></div><select id="reportRange"><option>این هفته</option><option>ماه گذشته</option></select></div><div class="report-score"><strong>۸۶٪</strong><span>ثبات عملکرد</span><i><b style="width:86%"></b></i></div><div class="report-row"><span>تمرکز عمیق</span><b>۷.۲ ساعت</b></div><div class="report-row"><span>تکمیل به‌موقع</span><b>۸۴٪</b></div><div class="report-row"><span>روزهای فعال</span><b>۱۲ روز</b></div></article></section>`;
  page.appendChild(modules);
}
function addAuthPanel() { const top = $('.top-actions'); const button = document.createElement('button'); button.className = 'profile-button'; button.textContent = state.user.name.split(' ')[0]; button.dataset.action = 'account'; top.insertBefore(button, top.querySelector('.avatar')); }
function accountDialog() { const name = prompt('نام نمایشی جدید را وارد کن:', state.user.name); if (!name) return; state.user.name = safe(name); $('.profile b').textContent = state.user.name; save(); toast('پروفایل ذخیره شد ✓'); }
function handleAction(action) { if (action === 'task' || action === 'goal') openModal(action); if (action === 'focus') { $('#focus').scrollIntoView({ behavior: 'smooth' }); if (!timer) toggleTimer(); } if (action === 'export') exportData(); if (action === 'close') closeModal(); if (action === 'submit') submitModal(); if (action === 'project') { const name = safe(prompt('نام پروژه جدید:')); if (name) { state.projects.push({ name, color: '#756bea', tasks: 0, done: 0 }); save(); location.reload(); } } if (action === 'reminder') toast(state.reminders ? 'یادآور بعدی: جلسه برنامه‌ریزی، فردا ساعت ۹' : 'یادآورها خاموش هستند'); if (action === 'account') accountDialog(); if (action === 'search') { const query = safe(prompt('چه چیزی را جستجو می‌کنی؟')); if (query) toast(`جستجو برای «${query}» آماده است`); } }
function bind() {
  document.addEventListener('click', e => { const action = e.target.closest('[data-action]')?.dataset.action; if (action) handleAction(action); });
  $('#taskList').addEventListener('change', e => { const i = e.target.dataset.task; if (i === undefined) return; state.tasks[i].done = e.target.checked; save(); renderTasks(); toast(e.target.checked ? 'وظیفه تکمیل شد — عالی پیش رفتی!' : 'وظیفه به برنامه برگشت'); });
  $$('.tabs button').forEach(btn => btn.addEventListener('click', () => { $$('.tabs button').forEach(b => b.classList.remove('active')); btn.classList.add('active'); filter = btn.dataset.filter; renderTasks(); }));
  $('#goalList').addEventListener('click', e => { const button = e.target.closest('[data-goal]'); if (!button) return; state.goals[Number(button.dataset.goal)].value = Math.min(100, state.goals[Number(button.dataset.goal)].value + 5); save(); renderGoals(); toast('پیشرفت هدف ثبت شد ✦'); });
  $('.workspace-modules').addEventListener('click', e => { const item = e.target.closest('[data-project]'); if (!item) return; state.activeProject = item.dataset.project; $$('.project-item').forEach(x => x.classList.toggle('selected', x === item)); renderTasks(); document.querySelector('#today').scrollIntoView({ behavior: 'smooth' }); });
  $('#themeToggle').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; document.body.classList.toggle('dark', state.theme === 'dark'); $('#themeToggle').textContent = state.theme === 'dark' ? '☀' : '☾'; save(); });
  $('#timerButton').addEventListener('click', toggleTimer); $('#timerReset').addEventListener('click', resetTimer); $('#notesInput').addEventListener('input', e => { state.note = e.target.value; save(); });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); }); document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openModal('task'); } });
}
function init() { document.body.classList.toggle('dark', state.theme === 'dark'); $('#themeToggle').textContent = state.theme === 'dark' ? '☀' : '☾'; $('#notesInput').value = state.note; renderTasks(); renderGoals(); addWorkspaceModules(); addAuthPanel(); updateTimer(); bind(); }
init();
