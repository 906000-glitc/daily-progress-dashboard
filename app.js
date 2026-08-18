const STORAGE_KEY = 'rava-dashboard-data-v4';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const defaultState = {
  tasks: [
    { title: 'مرور اهداف سه‌ماهه', meta: 'برنامه‌ریزی · ۳۰ دقیقه', time: '۰۹:۰۰', done: true },
    { title: 'طراحی وایرفریم صفحه اصلی', meta: 'پروژه شخصی · ۱ ساعت و ۳۰ دقیقه', time: '۱۰:۳۰', done: false },
    { title: 'مطالعه فصل چهارم کتاب', meta: 'یادگیری · ۴۵ دقیقه', time: '۱۴:۰۰', done: false },
    { title: 'پیاده‌روی عصرانه', meta: 'سلامتی · ۳۰ دقیقه', time: '۱۸:۳۰', done: false },
    { title: 'نوشتن سه نکته روزانه', meta: 'ذهن‌آگاهی · ۱۰ دقیقه', time: '۲۱:۰۰', done: false }
  ],
  goals: [
    { title: 'طراحی نسخه اول محصول', value: 68, color: 'purple' },
    { title: 'یادگیری زبان انگلیسی', value: 42, color: 'orange' }
  ],
  note: '',
  theme: 'light'
};

const state = { ...defaultState, ...readState() };
let activeFilter = 'all';
let modalType = null;
let timerSeconds = 25 * 60;
let timerRunning = false;
let timerInterval = null;

function readState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function clean(value) { return String(value).trim().replace(/[<>]/g, ''); }
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}

function renderTasks() {
  const list = $('#taskList');
  const filtered = state.tasks.filter(task => activeFilter === 'all' || (activeFilter === 'done' ? task.done : !task.done));
  list.innerHTML = filtered.map((task, index) => `
    <label class="task ${task.done ? 'done' : ''}">
      <input type="checkbox" data-task-index="${state.tasks.indexOf(task)}" ${task.done ? 'checked' : ''}>
      <div><strong>${clean(task.title)}</strong><small>${clean(task.meta || 'وظیفه جدید')}</small></div>
      <time>${task.time || '--:--'}</time>
    </label>`).join('');
  $('#taskCount').textContent = state.tasks.filter(task => !task.done).length;
  const done = state.tasks.filter(task => task.done).length;
  $('#completionRate').innerHTML = `${Math.round((done / Math.max(state.tasks.length, 1)) * 100)} <em>درصد</em>`;
}
function renderGoals() {
  $('#goalList').innerHTML = state.goals.map((goal, index) => `
    <div class="goal"><div class="goal-title"><span>${clean(goal.title)}</span><b>${goal.value}%</b></div>
    <div class="goal-progress"><i style="width:${goal.value}%;background:${goal.color === 'orange' ? 'var(--orange)' : 'var(--purple)'}"></i></div>
    <div class="goal-meta"><span>${100 - goal.value}% تا تکمیل باقی مانده</span><button data-goal-index="${index}">+ پیشرفت</button></div></div>`).join('');
}
function openModal(type) {
  modalType = type;
  $('#modalTitle').textContent = type === 'task' ? 'وظیفه جدید' : type === 'goal' ? 'هدف جدید' : 'یادداشت جدید';
  $('#modalTitleInput').value = '';
  $('#modalDescriptionInput').value = '';
  $('#modal').classList.add('open');
  $('#modal').setAttribute('aria-hidden', 'false');
  $('#modalTitleInput').focus();
}
function closeModal() { $('#modal').classList.remove('open'); $('#modal').setAttribute('aria-hidden', 'true'); modalType = null; }
function submitModal() {
  const title = clean($('#modalTitleInput').value);
  const description = clean($('#modalDescriptionInput').value);
  if (!title) return showToast('لطفاً عنوان را وارد کن');
  if (modalType === 'task') state.tasks.push({ title, meta: description || 'وظیفه جدید', time: '--:--', done: false });
  if (modalType === 'goal') state.goals.push({ title, value: 0, color: state.goals.length % 2 ? 'orange' : 'purple' });
  if (modalType === 'note') state.note = `${state.note ? `${state.note}\n` : ''}${title}`;
  saveState(); renderTasks(); renderGoals(); $('#notesInput').value = state.note; closeModal(); showToast('با موفقیت ذخیره شد ✓');
}
function updateTimer() {
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const seconds = String(timerSeconds % 60).padStart(2, '0');
  $('#timerDisplay').textContent = `${minutes}:${seconds}`;
  $('#timerProgress').style.width = `${((25 * 60 - timerSeconds) / (25 * 60)) * 100}%`;
}
function toggleTimer() {
  timerRunning = !timerRunning;
  $('#timerButton').textContent = timerRunning ? 'توقف جلسه' : 'ادامه جلسه';
  if (timerRunning) timerInterval = window.setInterval(() => { timerSeconds -= 1; updateTimer(); if (timerSeconds <= 0) { resetTimer(); showToast('جلسه تمرکز تمام شد؛ استراحت کن!'); } }, 1000);
  else window.clearInterval(timerInterval);
}
function resetTimer() { window.clearInterval(timerInterval); timerRunning = false; timerSeconds = 25 * 60; $('#timerButton').textContent = 'شروع جلسه'; updateTimer(); }
function exportData() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'rava-backup.json'; link.click(); URL.revokeObjectURL(link.href); showToast('نسخه پشتیبان آماده شد ✓'); }
function applyTheme() { document.body.classList.toggle('dark', state.theme === 'dark'); $('#themeToggle').textContent = state.theme === 'dark' ? '☀' : '☾'; }
function handleAction(action) { if (action === 'task') openModal('task'); if (action === 'goal') openModal('goal'); if (action === 'focus') { document.querySelector('#focus').scrollIntoView({ behavior: 'smooth' }); if (!timerRunning) toggleTimer(); } if (action === 'export') exportData(); if (action === 'search') { const query = window.prompt('چه چیزی را جستجو می‌کنی؟'); if (query) showToast(`جستجو برای «${clean(query)}» آماده است`); } if (action === 'close') closeModal(); if (action === 'submit') submitModal(); }

function bindEvents() {
  document.addEventListener('click', event => { const action = event.target.closest('[data-action]')?.dataset.action; if (action) handleAction(action); });
  $('#taskList').addEventListener('change', event => { const index = event.target.dataset.taskIndex; if (index === undefined) return; state.tasks[index].done = event.target.checked; saveState(); renderTasks(); showToast(event.target.checked ? 'وظیفه تکمیل شد — عالی پیش رفتی!' : 'وظیفه به برنامه برگشت'); });
  $$('.tabs button').forEach(button => button.addEventListener('click', () => { $$('.tabs button').forEach(item => item.classList.remove('active')); button.classList.add('active'); activeFilter = button.dataset.filter; renderTasks(); }));
  $('#goalList').addEventListener('click', event => { const button = event.target.closest('[data-goal-index]'); if (!button) return; const goal = state.goals[Number(button.dataset.goalIndex)]; goal.value = Math.min(100, goal.value + 5); saveState(); renderGoals(); showToast('پیشرفت هدف ثبت شد ✦'); });
  $('#themeToggle').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; saveState(); applyTheme(); });
  $('#timerButton').addEventListener('click', toggleTimer); $('#timerReset').addEventListener('click', resetTimer);
  $('#notesInput').addEventListener('input', event => { state.note = event.target.value; saveState(); });
  $('#notesInput').addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') showToast('یادداشت ذخیره شد ✓'); });
  $('#modal').addEventListener('click', event => { if (event.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openModal('task'); } });
}

function init() { applyTheme(); renderTasks(); renderGoals(); $('#notesInput').value = state.note || ''; updateTimer(); bindEvents(); }
init();
