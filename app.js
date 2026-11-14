'use strict';

const $ = (selector, parent = document) => parent.querySelector(selector);
const modal = $('#modal');
const modalContent = $('#modal-content');
const storageKey = 'task-orbit-v1:' + location.pathname.replace(/index\.html$/, '');
const dayFormat = new Intl.DateTimeFormat('ja-JP', {month: 'long', day: 'numeric', weekday: 'short'});
const fullDateFormat = new Intl.DateTimeFormat('ja-JP', {year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'});
const icons = {
  orbit: '<ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-42 12 12)"/><circle cx="12" cy="12" r="2.8"/><path d="M18 4v4m-2-2h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h2m4 0h2"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  inbox: '<path d="m3 13 3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm0 0h5l2 3h4l2-3h5"/>',
  check: '<path d="m5 12 4 4L19 7"/>',
  checkcircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  chart: '<path d="M4 19h16M7 15v-4m5 4V6m5 9V9"/>',
  settings: '<path d="m10 3-1 3-3 1-3 3 2 2-1 3 2 3 3-1 2 4 3-1 1-3 3-1 3-3-2-2 1-3-2-3-3 1-2-4z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  stack: '<rect x="6" y="6" width="14" height="14" rx="2"/><path d="M3 16V5a2 2 0 0 1 2-2h11m-6 8h6m-6 4h4"/>',
  sliders: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="var(--panel)"/><circle cx="15" cy="17" r="2" fill="var(--panel)"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  hourglass: '<path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4m10-18v4l-5 5 5 5v4"/>',
  shuffle: '<path d="M3 6h3c5 0 6 12 11 12h4m-3-3 3 3-3 3M3 18h3c1.5 0 2.5-1 3.5-2.5m4.5-7C15 7 16 6 18 6h3m-3-3 3 3-3 3"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  repeat: '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15m-14 8-4 4 4 4m14-9v2a3 3 0 0 1-3 3H3"/>',
  reset: '<path d="M4 11a8 8 0 1 1 1 6m-1-6V5m0 6h6"/>',
  play: '<path d="m8 5 12 7-12 7z"/>',
  pause: '<path d="M9 5v14m6-14v14"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
};
const icon = name => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || '') + '</svg>';
document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });

const priorityLabels = {high: '高', medium: '中', low: '低', none: 'なし'};
const repeatLabels = {none: 'なし', daily: '毎日', weekly: '毎週', monthly: '毎月'};
const energyLabels = {low: '軽め', medium: 'ふつう', high: '集中'};
const palette = {
  violet: ['#8058d4', '紫'], mint: ['#359b82', '緑'], gold: ['#bf8540', '橙'],
  blue: ['#477fc1', '青'], pink: ['#c35f88', '桃'], gray: ['#77758a', '灰'],
};
const views = {
  today: ['今日', '今日のタスク', '期限が今日までのタスクと、今日完了したタスク。', 'sun'],
  all: ['すべて', 'すべてのタスク', '期限未設定のタスクもまとめて確認できます。', 'inbox'],
  upcoming: ['カレンダー', 'カレンダー', '日付を選んで、その日の予定を確認。', 'calendar'],
  done: ['完了済み', '完了したタスク', 'これまでに終えたタスクの履歴。', 'checkcircle'],
  progress: ['振り返り', 'タスクの振り返り', '直近7日間の完了数を確認。', 'chart'],
};
const modes = {
  random: 'おまかせ', urgent: '優先くじ', quick: 'すきま時間',
  energy: '気分で選ぶ', triple: '3つ選ぶ', order: '順番シャッフル',
};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char]);
}
const uid = () => crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
function dateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
const parseDay = key => new Date(key + 'T12:00:00');
const validDay = key => typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && dateKey(parseDay(key)) === key;
function shiftDays(key, days) {
  const date = parseDay(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}
function nextDue(task) {
  const today = dateKey();
  const base = task.due || today;
  if (task.repeat === 'daily' || task.repeat === 'weekly') {
    const interval = task.repeat === 'daily' ? 1 : 7;
    const daysBehind = Math.max(0, Math.round((parseDay(today) - parseDay(base)) / 86400000));
    return shiftDays(base, interval * (Math.floor(daysBehind / interval) + 1));
  }
  const date = parseDay(base);
  const current = parseDay(today);
  const anchor = task.anchor || date.getDate();
  const span = Math.max(1, (current.getFullYear() - date.getFullYear()) * 12 + current.getMonth() - date.getMonth());
  const resolve = offset => {
    const next = new Date(date.getFullYear(), date.getMonth() + offset, 1);
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(anchor, last));
    return dateKey(next);
  };
  return resolve(span) > today ? resolve(span) : resolve(span + 1);
}

function makeTask(title, fields = {}) {
  return {id: uid(), title, due: '', priority: 'none', minutes: 0, energy: 'medium', category: '', tags: [],
    notes: '', checklist: [], repeat: 'none', anchor: 0, doneAt: '', created: Date.now(), nextId: '', sample: false, ...fields};
}

function starterData() {
  const today = dateKey();
  const categories = [{id:'study', name:'勉強', color:'violet'}, {id:'life', name:'生活', color:'mint'}, {id:'personal', name:'自分の時間', color:'gold'}];
  const tasks = [
    makeTask('英単語を20個復習する', {category:'study', due:today, priority:'high', minutes:15, energy:'medium'}),
    makeTask('今週の予定を確認する', {category:'life', due:today, priority:'medium', minutes:10, energy:'low', repeat:'weekly'}),
    makeTask('机の上を片づける', {category:'life', due:today, priority:'low', minutes:5, energy:'low'}),
    makeTask('読みかけの本を10ページ読む', {category:'personal', due:today, minutes:15, energy:'low'}),
    makeTask('明日やることをメモする', {category:'study', due:shiftDays(today,1), minutes:10}),
  ];
  tasks.forEach(task => { task.sample = true; });
  return {version:1, tasks, categories, theme:'light'};
}

function decode(raw) {
  if (raw?.version !== 1 || !Array.isArray(raw.tasks) || !Array.isArray(raw.categories)) {
    throw new Error('Task Orbitのバックアップファイルを選んでください。');
  }
  const seen = new Set();
  const categories = raw.categories.map(category => {
    if (typeof category?.id !== 'string' || !category.id || seen.has(category.id) || typeof category.name !== 'string' || !category.name.trim()) throw new Error('カテゴリの形式が正しくありません。');
    seen.add(category.id);
    return {id: category.id, name: category.name.trim().slice(0,40), color: Object.hasOwn(palette, category.color) ? category.color : 'gray'};
  });
  const taskIds = new Set();
  const tasks = raw.tasks.map(task => {
    if (typeof task?.id !== 'string' || !task.id || taskIds.has(task.id) || typeof task.title !== 'string' || !task.title.trim()) throw new Error('タスクの形式が正しくありません。');
    taskIds.add(task.id);
    const checklist = Array.isArray(task.checklist) ? task.checklist.filter(item => typeof item?.text === 'string').map(item => ({text:item.text.slice(0,180), checked:item.checked === true})) : [];
    return makeTask(task.title.trim().slice(0,180), {
      id: task.id, due: validDay(task.due) ? task.due : '', doneAt: validDay(task.doneAt) ? task.doneAt : '',
      priority: Object.hasOwn(priorityLabels, task.priority) ? task.priority : 'none',
      energy: Object.hasOwn(energyLabels, task.energy) ? task.energy : 'medium',
      repeat: Object.hasOwn(repeatLabels, task.repeat) ? task.repeat : 'none',
      minutes: Number.isInteger(task.minutes) && task.minutes >= 0 && task.minutes <= 999 ? task.minutes : 0,
      anchor: Number.isInteger(task.anchor) && task.anchor >= 1 && task.anchor <= 31 ? task.anchor : 0,
      category: seen.has(task.category) ? task.category : '',
      tags: Array.isArray(task.tags) ? task.tags.filter(tag => typeof tag === 'string').map(tag => tag.slice(0,35)).slice(0,15) : [],
      notes: typeof task.notes === 'string' ? task.notes.slice(0,4000) : '',
      checklist, nextId: typeof task.nextId === 'string' ? task.nextId : '',
      sample: task.sample === true, created: Number.isFinite(task.created) ? task.created : Date.now(),
    });
  });
  return {version:1, categories, tasks, theme:raw.theme === 'dark' ? 'dark' : 'light'};
}

let data;
let storageFailed = false;
try {
  const saved = localStorage.getItem(storageKey);
  data = saved ? decode(JSON.parse(saved)) : starterData();
  if (!saved) localStorage.setItem(storageKey, JSON.stringify(data));
} catch {
  storageFailed = true;
  data = {version:1, tasks:[], categories:[], theme:'light'};
}

let selectedDay = dateKey();
let month = selectedDay.slice(0,7);
let view;
let undoData = null;
let toastTimeout;
let filtersOpen = false;
const filters = {query:'', priority:'', state:'', sort:'due'};
let drawMode = 'random';
let drawScope = 'view';
let quickLimit = 15;
let energyTarget = 'low';
let drawn = [];
const drawHistory = new Set();
let drawMessage = '';
let shuffledOrder = [];
let focus = {minutes:25, remaining:1500000, end:0, taskId:''};

function notify(message, undo = false) {
  clearTimeout(toastTimeout);
  const toast = $('#toast');
  toast.innerHTML = escapeHTML(message) + (undo ? ' <button data-action="undo">元に戻す</button>' : '');
  toast.hidden = false;
  toastTimeout = setTimeout(() => { toast.hidden = true; undoData = null; }, undo ? 8000 : 3400);
  if (!undo) undoData = null;
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    storageFailed = false;
  } catch { storageFailed = true; }
}

function change(update, message) {
  const previous = JSON.stringify(data);
  update();
  persist();
  render();
  undoData = previous;
  notify(storageFailed ? '端末に保存できません。バックアップを書き出せます。' : message, true);
}

function getView() {
  const hash = location.hash.slice(1);
  if (Object.hasOwn(views, hash)) return hash;
  const category = data.categories.find(item => encodeURIComponent(item.id) === hash.slice(4));
  return hash.startsWith('cat-') && category ? 'cat-' + category.id : 'today';
}

function changeView() {
  const next = getView();
  if (next !== view) {
    filters.query = '';
    filters.priority = '';
    filters.state = '';
    filtersOpen = false;
    clearDraw();
  }
  view = next;
  render();
}

const active = () => data.tasks.filter(task => !task.doneAt);
const categoryFor = id => data.categories.find(category => category.id === id);
const taskFor = id => data.tasks.find(task => task.id === id);
const currentCategory = () => view?.startsWith('cat-') ? categoryFor(view.slice(4)) : undefined;

function todayTasks() {
  const today = dateKey();
  return data.tasks.filter(task => task.doneAt === today || (!task.doneAt && task.due && task.due <= today));
}
function viewTasks() {
  const category = currentCategory();
  if (category) return data.tasks.filter(task => task.category === category.id);
  if (view === 'today') return todayTasks();
  if (view === 'upcoming') return data.tasks.filter(task => task.due === selectedDay);
  if (view === 'done') return data.tasks.filter(task => task.doneAt);
  return data.tasks;
}

function matches(task, query) {
  return [task.title, task.notes, ...task.tags, categoryFor(task.category)?.name, ...task.checklist.map(item => item.text)]
    .some(value => value?.toLocaleLowerCase().includes(query));
}
const rank = {high:0, medium:1, low:2, none:3};
const compareDue = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || rank[a.priority] - rank[b.priority] || a.created - b.created;
function visibleTasks() {
  const query = filters.query.trim().toLocaleLowerCase();
  const tasks = viewTasks().filter(task => (!query || matches(task, query)) &&
    (!filters.priority || task.priority === filters.priority) &&
    (!filters.state || Boolean(task.doneAt) === (filters.state === 'done')));
  const ordering = new Map(shuffledOrder.map((id, index) => [id,index]));
  const compare = {
    due: compareDue,
    priority: (a,b) => rank[a.priority] - rank[b.priority] || compareDue(a,b),
    shortest: (a,b) => (a.minutes || 1000) - (b.minutes || 1000) || compareDue(a,b),
    newest: (a,b) => b.created - a.created,
    shuffle: (a,b) => (ordering.get(a.id) ?? Infinity) - (ordering.get(b.id) ?? Infinity) || compareDue(a,b),
  };
  return tasks.sort(compare[filters.sort] || compareDue);
}
const options = (items, value) => Object.entries(items).map(([key, label]) => '<option value="' + escapeHTML(key) + '"' + (String(value) === key ? ' selected' : '') + '>' + escapeHTML(label) + '</option>').join('');
const actionButton = (label, action, id = '', className = 'secondary') =>
  '<button type="button" class="button ' + className + '" data-action="' + action + '" data-id="' + escapeHTML(id) + '">' + escapeHTML(label) + '</button>';

function renderNav() {
  const today = dateKey();
  const counts = {today: todayTasks().filter(task => !task.doneAt).length, all: active().length,
    upcoming: active().filter(task => task.due && task.due > today).length, done: data.tasks.filter(task => task.doneAt).length};
  const navItem = (key, label, graphic, count, href = key) => '<a href="#' + escapeHTML(href) + '" class="nav-button' + (view === key ? ' active" aria-current="page' : '') + '">' +
    graphic + '<span>' + escapeHTML(label) + '</span>' + (count !== undefined ? '<span class="nav-count">' + count + '</span>' : '') + '</a>';
  $('#navigation').innerHTML = '<div class="nav-group"><div class="nav-heading"><span>タスク</span></div>' +
    Object.entries(views).map(([key, [label, , , image]]) => navItem(key, label, icon(image), counts[key])).join('') +
    '</div><div class="nav-group"><div class="nav-heading"><span>カテゴリ</span><button class="icon-button" data-action="category" title="カテゴリを追加" aria-label="カテゴリを追加">' + icon('plus') + '</button></div>' +
    data.categories.map(category => navItem('cat-' + category.id, category.name, '<i class="category-dot" style="background:' + palette[category.color][0] + '"></i>',
      active().filter(task => task.category === category.id).length, 'cat-' + encodeURIComponent(category.id))).join('') + '</div>';
}

function renderStats() {
  const today = dateKey();
  const pending = active().filter(task => task.due && task.due <= today);
  const done = data.tasks.filter(task => task.doneAt === today).length;
  const minutes = pending.reduce((sum, task) => sum + task.minutes, 0);
  const fraction = pending.length + done ? done / (pending.length + done) : 0;
  const card = (image, color, title, value, unit, progress = '') => '<article class="stat"><div class="tile ' + color + '">' + icon(image) +
    '</div><div><span>' + title + '</span><strong>' + value + ' <small>' + unit + '</small></strong></div>' + progress + '</article>';
  $('#stats').innerHTML = card('calendar','violet','今日までの未完了',pending.length,'件') +
    card('checkcircle','mint','今日の完了',done,'件','<div class="stat-progress" aria-hidden="true"><i style="width:' + Math.round(fraction * 100) + '%"></i></div>') +
    card('hourglass','peach','残りの見積り',minutes,'分');
}

function taskMeta(task) {
  const today = dateKey();
  const category = categoryFor(task.category);
  const due = task.due === today ? '今日' : task.due ? dayFormat.format(parseDay(task.due)) : '';
  const checked = task.checklist.filter(item => item.checked).length;
  return '<div class="metadata">' +
    (category ? '<span class="chip" style="border:1px solid ' + palette[category.color][0] + '65"><i class="category-dot" style="background:' + palette[category.color][0] + '"></i>' + escapeHTML(category.name) + '</span>' : '') +
    (due ? '<span class="' + (task.due < today && !task.doneAt ? 'late' : '') + '">' + icon('calendar') + escapeHTML(due) + '</span>' : '') +
    (task.minutes ? '<span>' + icon('clock') + task.minutes + '分</span>' : '') +
    (task.repeat !== 'none' ? '<span>' + icon('repeat') + repeatLabels[task.repeat] + '</span>' : '') +
    (task.checklist.length ? '<span>' + icon('checkcircle') + checked + '/' + task.checklist.length + '</span>' : '') +
    task.tags.map(tag => '<span class="chip">#' + escapeHTML(tag) + '</span>').join('') + '</div>';
}

function taskRow(task) {
  const id = escapeHTML(task.id);
  const priority = task.priority === 'none' ? '' : '<span class="priority priority-' + task.priority + '">' + priorityLabels[task.priority] + '優先</span>';
  return '<article class="task-row' + (task.doneAt ? ' done' : '') + '"><button class="check" role="checkbox" aria-checked="' + Boolean(task.doneAt) +
    '" aria-label="' + escapeHTML(task.title) + '" data-action="toggle" data-id="' + id + '">' + (task.doneAt ? icon('check') : '') + '</button>' +
    '<div class="task-details"><button class="task-name" data-action="detail" data-id="' + id + '">' + escapeHTML(task.title) + '</button>' + taskMeta(task) +
    '</div>' + priority + '<button class="icon-button" data-action="menu" data-id="' + id + '" title="タスクの操作" aria-label="' + escapeHTML(task.title) + ' の操作">' + icon('more') + '</button></article>';
}

function renderCalendar() {
  const start = parseDay(month + '-01');
  const first = shiftDays(month + '-01', -start.getDay());
  const last = new Date(start.getFullYear(), start.getMonth()+1, 0).getDate();
  const counts = new Map();
  active().forEach(task => { if (task.due) counts.set(task.due, (counts.get(task.due) || 0) + 1); });
  return '<div class="calendar"><div class="calendar-top">' + actionButton('‹','month','-1') + '<strong>' + start.getFullYear() + '年' + (start.getMonth()+1) +
    '月</strong>' + actionButton('›','month','1') + '</div><div class="calendar-grid">' + [...'日月火水木金土'].map(day => '<span>' + day + '</span>').join('') +
    Array.from({length:Math.ceil((last+start.getDay())/7)*7}, (_,index) => {
      const key = shiftDays(first,index);
      const count = counts.get(key);
      return '<button class="' + (key === selectedDay ? 'picked ' : '') + (key.startsWith(month) ? '' : 'outside') + '" data-action="day" data-id="' + key +
        '" aria-pressed="' + (key === selectedDay) + '" aria-label="' + dayFormat.format(parseDay(key)) + (count ? '、未完了' + count + '件' : '') +
        '">' + Number(key.slice(-2)) + (count ? '<small>' + count + '</small>' : '') + '</button>';
    }).join('') + '</div><p class="date-selection">' + dayFormat.format(parseDay(selectedDay)) + '</p></div>';
}

function renderProgress() {
  const series = Array.from({length:7}, (_,index) => {
    const date = shiftDays(dateKey(),index-6);
    return {date, count:data.tasks.filter(task => task.doneAt === date).length};
  });
  const total = series.reduce((sum, day) => sum + day.count, 0);
  const max = Math.max(1, ...series.map(day => day.count));
  $('#list-title').textContent = '直近7日間';
  $('#list-summary').textContent = '完了 ' + total + ' 件';
  $('#task-list').innerHTML = '<div class="week-list">' + series.map(({date,count}) => '<div class="week-row"><span>' + dayFormat.format(parseDay(date)) +
    '</span><progress max="' + max + '" value="' + count + '" aria-label="完了 ' + count + '件"></progress><span>' + count + ' 件</span></div>').join('') + '</div>';
}
function renderTasks() {
  const report = view === 'progress';
  $('#quick-row').hidden = report || view === 'done';
  $('#sort-button').hidden = report;
  $('#sort-button').setAttribute('aria-expanded', String(filtersOpen && !report));
  $('#filters').hidden = report || !filtersOpen;
  $('#filters').querySelector('.category-edit')?.remove();
  if (report) { renderProgress(); return; }
  const category = currentCategory();
  $('#list-title').textContent = view === 'upcoming' ? '月間カレンダー' : view === 'done' ? '完了履歴' : 'タスクリスト';
  const tasks = visibleTasks();
  const pending = tasks.filter(task => !task.doneAt);
  const complete = tasks.filter(task => task.doneAt);
  if (view === 'done' && filters.sort === 'due') complete.sort((a,b) => b.doneAt.localeCompare(a.doneAt) || b.created - a.created);
  $('#list-summary').textContent = '未完了 ' + pending.length + ' 件 · 完了 ' + complete.length + ' 件';
  if (category && filtersOpen) $('#filters').insertAdjacentHTML('beforeend', '<div class="category-edit">' + actionButton('カテゴリを編集','category',category.id) + '</div>');
  $('#task-list').innerHTML = (view === 'upcoming' ? renderCalendar() : '') + (tasks.length
    ? pending.map(taskRow).join('') + (complete.length && view !== 'done' ? '<p class="done-label">完了済み</p>' : '') + complete.map(taskRow).join('')
    : '<div class="empty"><p>' + (filters.query || filters.state || filters.priority ? '条件に一致するタスクがありません。' :
      view === 'done' ? '完了したタスクはここに表示されます。' : 'この一覧にタスクはありません。') + '</p>' +
      (view === 'done' || filters.query || filters.state || filters.priority ? '' : actionButton('タスクを追加','new')) + '</div>');
}

function clearDraw() {
  drawn = [];
  drawHistory.clear();
  drawMessage = '';
}
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function pick(pool) {
  if (drawMode !== 'urgent') return pool[Math.floor(Math.random() * pool.length)];
  const today = dateKey();
  const weights = pool.map(task => 5 - rank[task.priority] + (task.due && task.due <= today ? 5 : 0));
  let ticket = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  return pool.find((_,index) => (ticket -= weights[index]) < 0) ?? pool.at(-1);
}
function draw() {
  const source = drawScope === 'all' || ['done','progress'].includes(view) ? active() : visibleTasks().filter(task => !task.doneAt);
  const eligible = source.filter(task =>
    (drawMode !== 'quick' || (task.minutes > 0 && task.minutes <= quickLimit)) &&
    (drawMode !== 'energy' || task.energy === energyTarget));
  drawn = [];
  drawMessage = '';
  if (!eligible.length) drawMessage = '条件に合う未完了タスクがありません。';
  else if (drawMode === 'order') {
    const order = shuffle(eligible);
    drawn = order.map(task => task.id);
    shuffledOrder = drawn;
    filters.sort = 'shuffle';
    $('#filter-sort').value = 'shuffle';
    drawMessage = order.length + ' 件の順番を決めました。';
    renderTasks();
  } else {
    const count = Math.min(eligible.length, drawMode === 'triple' ? 3 : 1);
    let pool = eligible.filter(task => !drawHistory.has(task.id));
    if (pool.length < count) {
      drawHistory.clear();
      pool = [...eligible];
    }
    for (let i = 0; i < count; i++) {
      const task = pick(pool);
      drawn.push(task.id);
      drawHistory.add(task.id);
      pool = pool.filter(candidate => candidate.id !== task.id);
    }
  }
  const die = $('.die');
  die.classList.remove('rolled');
  void die.offsetWidth;
  die.classList.add('rolled');
  renderResult();
}
function renderRandomOptions() {
  $('#random-options').innerHTML = Object.entries(modes).map(([key,label]) => '<button class="random-option' + (key === drawMode ? ' active' : '') +
    '" data-action="mode" data-id="' + key + '" aria-pressed="' + (key === drawMode) + '">' + label + '</button>').join('') +
    '<div class="random-config"><select id="draw-scope" aria-label="くじの対象">' + options({view:'表示中の一覧',all:'すべての未完了'}, drawScope) + '</select>' +
    (drawMode === 'quick' ? '<select id="quick-limit" aria-label="使える時間">' + options({5:'5分以内',10:'10分以内',15:'15分以内',30:'30分以内',60:'60分以内'},quickLimit) + '</select>' : '') +
    (drawMode === 'energy' ? '<select id="energy-target" aria-label="今の気分">' + options(energyLabels,energyTarget) + '</select>' : '') + '</div>';
}
function renderResult() {
  const results = drawn.map(taskFor).filter(task => task && !task.doneAt);
  $('#random-result').innerHTML = (drawMessage ? '<p>' + escapeHTML(drawMessage) + '</p>' : '') +
    results.map((task,index) => '<div class="draw-result-row"><div>' + (results.length > 1 ? (index + 1) + '. ' : '') + '<strong>' + escapeHTML(task.title) +
      '</strong></div><button data-action="detail" data-id="' + escapeHTML(task.id) + '">詳細</button><button data-action="focus-task" data-id="' +
      escapeHTML(task.id) + '">タイマーにセット</button></div>').join('');
  $('#draw-label').textContent = results.length ? (drawMode === 'order' ? 'もう一度シャッフル' : 'もう一度引く') : (drawMode === 'order' ? '順番をシャッフル' : 'くじを引く');
}

function formatTimer(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(seconds / 60)).padStart(2,'0') + ':' + String(seconds % 60).padStart(2,'0');
}
function renderTimer() {
  const remaining = focus.end ? Math.max(0, focus.end - Date.now()) : focus.remaining;
  $('#timer-display').textContent = formatTimer(remaining);
  $('#focus-task').textContent = taskFor(focus.taskId)?.title ?? '作業時間を計る';
  const button = $('[data-action="timer"]');
  const label = focus.end ? '一時停止' : remaining && remaining < focus.minutes * 60000 ? '再開' : '開始';
  if (button.dataset.label !== label) {
    button.dataset.label = label;
    button.innerHTML = icon(focus.end ? 'pause' : 'play') + label;
  }
  $('#timer-minutes').disabled = !!focus.end;
  if (focus.end && remaining === 0) {
    focus.end = 0;
    focus.remaining = 0;
    notify('集中タイマーの時間になりました。');
    renderTimer();
  }
}
function render() {
  const category = currentCategory();
  const [path, title, description] = views[view] || [category?.name ?? '今日', category?.name ?? '今日のタスク', 'カテゴリのタスクを確認。'];
  document.documentElement.classList.toggle('dark', data.theme === 'dark');
  $('#storage-status').textContent = storageFailed ? '保存できません' : '自動保存オン';
  $('#path').textContent = path;
  $('#today-date').textContent = fullDateFormat.format(new Date());
  $('#page-title').textContent = title;
  $('#page-description').textContent = description;
  renderNav();
  renderStats();
  renderTasks();
  renderResult();
  renderTimer();
}

function openModal(title, content, focusSelector) {
  $('#modal-title').textContent = title;
  modalContent.innerHTML = content;
  if (!modal.open) modal.showModal();
  if (focusSelector) $(focusSelector,modalContent)?.focus();
}
const field = (label, control, wide = false) => '<label class="field' + (wide ? ' wide' : '') + '">' + label + control + '</label>';
const categoryChoices = () => ({'':'未設定', ...Object.fromEntries(data.categories.map(category => [category.id,category.name]))});
function defaults() {
  return {category:currentCategory()?.id ?? '', due:view === 'today' ? dateKey() : view === 'upcoming' ? selectedDay : ''};
}
function editTask(task) {
  const value = task ?? makeTask('', defaults());
  const input = (name, text, attrs = '') => '<input name="' + name + '" value="' + escapeHTML(text) + '" ' + attrs + '>';
  const select = (name, items, chosen) => '<select name="' + name + '">' + options(items,chosen) + '</select>';
  const area = (name, text, attrs = '') => '<textarea name="' + name + '" rows="2" ' + attrs + '>' + escapeHTML(text) + '</textarea>';
  openModal(task ? 'タスクを編集' : 'タスクを追加', '<form id="task-form" data-id="' + escapeHTML(task?.id ?? '') + '"><div class="form-grid">' +
    field('タスク名',input('title',value.title,'maxlength="180" required'),true) +
    field('カテゴリ',select('category',categoryChoices(),value.category)) +
    field('期限',input('due',value.due,'type="date"')) +
    field('優先度',select('priority',priorityLabels,value.priority)) +
    field('繰り返し',select('repeat',repeatLabels,value.repeat)) +
    field('所要時間（分）',input('minutes',value.minutes || '','type="number" min="1" max="999" placeholder="未設定"')) +
    field('必要な集中力',select('energy',energyLabels,value.energy)) +
    field('タグ（カンマ区切り）',input('tags',value.tags.join(', '),'maxlength="540"'),true) +
    field('メモ',area('notes',value.notes,'maxlength="4000"'),true) +
    field('チェックリスト（1行に1項目）',area('checklist',value.checklist.map(item => item.text).join('\n'),'maxlength="4000"'),true) +
    '</div><div class="form-actions">' + actionButton('キャンセル','close') + '<button class="button primary" type="submit">保存</button></div></form>', '[name="title"]');
}
function detail(task) {
  openModal(task.title, taskMeta(task) + (task.notes ? '<p class="details-notes">' + escapeHTML(task.notes) + '</p>' : '') +
    (task.checklist.length ? '<div class="details-list">' + task.checklist.map((item,index) =>
      '<label><input type="checkbox" data-check="' + index + '" data-id="' + escapeHTML(task.id) + '"' + (item.checked ? ' checked' : '') + '>' + escapeHTML(item.text) + '</label>').join('') + '</div>' : '') +
    '<div class="form-actions">' + actionButton('操作','menu',task.id) + actionButton('編集','edit',task.id) +
    actionButton(task.doneAt ? '未完了に戻す' : '完了する','toggle',task.id,'primary') + '</div>');
}
function taskMenu(task) {
  openModal(task.title, '<div class="form-actions menu-actions">' + actionButton('編集','edit',task.id) +
    actionButton('複製','duplicate',task.id) + actionButton('期限を明日に','tomorrow',task.id) +
    actionButton('タイマーにセット','focus-task',task.id) + actionButton('削除','delete',task.id,'secondary danger') + '</div>');
}
function editCategory(category) {
  openModal(category ? 'カテゴリを編集' : 'カテゴリを追加', '<form id="category-form" data-id="' + escapeHTML(category?.id ?? '') + '"><div class="form-grid">' +
    field('カテゴリ名','<input name="name" maxlength="40" required value="' + escapeHTML(category?.name ?? '') + '">',true) +
    field('色','<select name="color">' + options(Object.fromEntries(Object.entries(palette).map(([key,[,label]]) => [key,label])),category?.color ?? 'violet') + '</select>') +
    '</div><div class="form-actions">' + (category ? actionButton('カテゴリを削除','delete-category',category.id,'secondary danger') : '') +
    actionButton('閉じる','close') + '<button class="button primary">保存</button></div></form>', '[name="name"]');
}
function settings() {
  openModal('設定・バックアップ',
    '<section class="settings-group"><h3>テーマ</h3>' + actionButton('ライト','theme','light',data.theme === 'light' ? 'primary' : 'secondary') +
    actionButton('ダーク','theme','dark',data.theme === 'dark' ? 'primary' : 'secondary') + '</section>' +
    '<section class="settings-group"><h3>データ</h3><p class="muted">タスクはこのブラウザに自動保存されます。別の端末へ移すときはJSONを書き出して読み込んでください。</p>' +
    actionButton('JSONを書き出す','export') + actionButton('JSONを読み込む','import') + '<input id="import-file" type="file" accept=".json,application/json" hidden></section>' +
    (data.tasks.some(task => task.sample) ? '<section class="settings-group"><h3>サンプル</h3>' + actionButton('サンプルを消す','remove-samples') + '</section>' : ''));
}
function toggleTask(task) {
  if (modal.open) modal.close();
  const wasDone = !!task.doneAt;
  change(() => {
    if (wasDone) {
      const next = taskFor(task.nextId);
      if (next && !next.doneAt) {
        data.tasks = data.tasks.filter(item => item !== next);
        task.nextId = '';
      }
      task.doneAt = '';
    } else {
      task.doneAt = dateKey();
      if (task.repeat !== 'none' && !taskFor(task.nextId)) {
        const due = nextDue(task);
        const next = makeTask(task.title, {...task,due,created:Date.now(),id:uid(),doneAt:'',nextId:'',
          checklist:task.checklist.map(item => ({...item,checked:false})),
          anchor:task.repeat === 'monthly' ? task.anchor || parseDay(task.due || task.doneAt).getDate() : 0});
        task.nextId = next.id;
        data.tasks.push(next);
      }
    }
  }, wasDone ? '未完了に戻しました。' : 'タスクを完了しました。');
}

$('#filters').innerHTML = '<div class="filter-grid"><input id="filter-query" type="search" placeholder="この一覧を検索" aria-label="この一覧を検索">' +
  '<select id="filter-priority" aria-label="優先度で絞り込む">' + options({'':'すべての優先度',...priorityLabels},'') + '</select>' +
  '<select id="filter-state" aria-label="状態で絞り込む">' + options({'':'すべての状態',open:'未完了',done:'完了済み'},'') + '</select>' +
  '<select id="filter-sort" aria-label="並び替え">' + options({due:'期限順',priority:'優先度順',shortest:'短時間順',newest:'追加が新しい順',shuffle:'シャッフル順'},'due') + '</select></div>';

function searchResults(query) {
  const needle = query.trim().toLocaleLowerCase();
  const tasks = needle ? data.tasks.filter(task => matches(task,needle)).sort(compareDue) : [];
  $('#search-results').innerHTML = tasks.length ? tasks.map(taskRow).join('') :
    '<p class="empty">' + (needle ? '一致するタスクがありません。' : 'キーワードを入力すると結果が表示されます。') + '</p>';
}
function downloadBackup() {
  const uri = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], {type:'application/json'}));
  const link = Object.assign(document.createElement('a'), {href:uri, download:'task-orbit-' + dateKey() + '.json'});
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(uri), 10000);
}
function confirmAction(title, description, action, id) {
  openModal(title, '<p class="muted">' + description + '</p><div class="form-actions">' +
    actionButton('キャンセル','close') + actionButton(title,action,id,'primary') + '</div>');
}
let importData;
const actions = {
  new: () => editTask(),
  edit: (_,task) => { if (task) editTask(task); },
  detail: (_,task) => { if (task) detail(task); },
  menu: (_,task) => { if (task) taskMenu(task); },
  toggle: (_,task) => { if (task) toggleTask(task); },
  close: () => modal.close(),
  batch: () => openModal('タスクをまとめて追加','<form id="batch-form">' + field('1行に1件','<textarea name="items" rows="8" maxlength="20000" required placeholder="英単語の復習\n書類を提出"></textarea>') +
    '<div class="form-actions">' + actionButton('キャンセル','close') + '<button class="button primary">まとめて追加</button></div></form>', 'textarea'),
  category: id => editCategory(categoryFor(id)),
  'delete-category': id => confirmAction('カテゴリを削除','所属タスクはカテゴリ未設定になります。','confirm-category',id),
  'confirm-category': id => {
    modal.close();
    change(() => {
      data.categories = data.categories.filter(category => category.id !== id);
      data.tasks.forEach(task => { if (task.category === id) task.category = ''; });
      if (view === 'cat-' + id) { view = 'all'; location.hash = 'all'; }
    },'カテゴリを削除しました。');
  },
  delete: id => confirmAction('タスクを削除','選んだタスクを一覧から削除します。','confirm-delete',id),
  'confirm-delete': id => {
    modal.close();
    change(() => { data.tasks = data.tasks.filter(task => task.id !== id); },'タスクを削除しました。');
  },
  duplicate: (_,task) => {
    if (!task) return;
    modal.close();
    change(() => data.tasks.push(makeTask(task.title,{...task,id:uid(),created:Date.now(),doneAt:'',nextId:'',sample:false,
      checklist:task.checklist.map(item => ({...item,checked:false}))})), 'タスクを複製しました。');
  },
  tomorrow: (_,task) => {
    if (!task) return;
    modal.close();
    change(() => { task.due = shiftDays(dateKey(),1); task.anchor = 0; }, '期限を明日に変更しました。');
  },
  filters: () => { filtersOpen = !filtersOpen; renderTasks(); },
  search: () => {
    openModal('タスクを検索',field('タスク名・タグ・メモなど','<input id="global-query" type="search" autocomplete="off">') + '<div id="search-results"></div>', '#global-query');
    searchResults('');
  },
  month: id => {
    const start = parseDay(month + '-01');
    start.setMonth(start.getMonth() + Number(id));
    month = dateKey(start).slice(0,7);
    selectedDay = month === dateKey().slice(0,7) ? dateKey() : month + '-01';
    clearDraw();
    renderTasks();
    renderResult();
  },
  day: id => { selectedDay = id; month = id.slice(0,7); clearDraw(); renderTasks(); renderResult(); },
  mode: id => {
    drawMode = id;
    clearDraw();
    renderRandomOptions();
    renderResult();
    $('[data-action="mode"][data-id="' + id + '"]').focus();
  },
  draw,
  'focus-task': (_,task) => {
    if (!task) return;
    const periods = [5,15,25,45,60];
    const match = periods.reduce((best,value) => Math.abs(value-task.minutes) < Math.abs(best-task.minutes) ? value : best);
    const minutes = task.minutes ? match : 25;
    focus = {minutes,remaining:minutes*60000,end:0,taskId:task.id};
    $('#timer-minutes').value = String(minutes);
    if (modal.open) modal.close();
    renderTimer();
    $('#focus-card').scrollIntoView({block:'nearest'});
    $('[data-action="timer"]').focus({preventScroll:true});
    notify('集中タイマーにセットしました。');
  },
  timer: () => {
    if (focus.end) {
      focus.remaining = Math.max(0,focus.end-Date.now());
      focus.end = 0;
    } else {
      focus.end = Date.now() + (focus.remaining || focus.minutes*60000);
    }
    renderTimer();
  },
  'reset-timer': () => { focus.end = 0; focus.remaining = focus.minutes*60000; renderTimer(); },
  settings,
  theme: id => { data.theme = id; persist(); render(); settings(); },
  export: downloadBackup,
  import: () => $('#import-file').click(),
  'confirm-import': () => {
    if (!importData) return;
    modal.close();
    change(() => { data = importData; view = getView(); clearDraw(); }, 'バックアップを読み込みました。');
    importData = undefined;
  },
  'remove-samples': () => {
    modal.close();
    change(() => { data.tasks = data.tasks.filter(task => !task.sample); },'サンプルを消しました。');
  },
  undo: () => {
    if (undoData === null) return;
    data = decode(JSON.parse(undoData));
    view = getView();
    persist();
    render();
    notify(storageFailed ? '元に戻しましたが、端末に保存できません。' : '直前の操作を元に戻しました。');
  },
};

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || !Object.hasOwn(actions,button.dataset.action)) return;
  const id = button.dataset.id;
  actions[button.dataset.action](id,taskFor(id));
});

function formValue(form, name) {
  return String(form.get(name) ?? '').trim();
}
function lines(value) {
  return value.split(/\r?\n/).map(line => line.trim().slice(0,180)).filter(Boolean);
}
document.addEventListener('submit', event => {
  const element = event.target;
  if (!['quick-form','batch-form','task-form','category-form'].includes(element.id)) return;
  event.preventDefault();
  const form = new FormData(element);
  const title = formValue(form,'title');
  if (element.id === 'quick-form' && title) {
    change(() => data.tasks.push(makeTask(title,defaults())), 'タスクを追加しました。');
    element.reset();
  }
  if (element.id === 'batch-form') {
    const titles = lines(formValue(form,'items'));
    if (!titles.length) return;
    const fields = defaults();
    modal.close();
    change(() => data.tasks.push(...titles.map(item => makeTask(item,fields))), titles.length + ' 件追加しました。');
  }
  if (element.id === 'task-form' && title) {
    const existing = taskFor(element.dataset.id);
    const due = formValue(form,'due');
    const tags = [...new Set(formValue(form,'tags').split(/[,、，]/).map(item => item.trim().slice(0,35)).filter(Boolean))].slice(0,15);
    const previousChecklist = [...(existing?.checklist ?? [])];
    const checklist = lines(formValue(form,'checklist')).map(text => {
      const index = previousChecklist.findIndex(item => item.text === text);
      return index < 0 ? {text,checked:false} : previousChecklist.splice(index,1)[0];
    });
    const fields = {title,due,category:formValue(form,'category'),minutes:Number(formValue(form,'minutes')),
      priority:formValue(form,'priority'), energy:formValue(form,'energy'), repeat:formValue(form,'repeat'),
      tags, checklist, notes:formValue(form,'notes'), anchor:existing?.due === due ? existing.anchor : 0};
    modal.close();
    change(() => {
      if (existing) Object.assign(existing,fields);
      else data.tasks.push(makeTask(title,fields));
    }, 'タスクを保存しました。');
  }
  if (element.id === 'category-form') {
    const name = formValue(form,'name');
    if (!name) return;
    const color = formValue(form,'color');
    const existing = categoryFor(element.dataset.id);
    modal.close();
    change(() => {
      if (existing) Object.assign(existing,{name,color});
      else data.categories.push({id:uid(),name,color});
    }, 'カテゴリを保存しました。');
  }
});

document.addEventListener('input', event => {
  const {id,value} = event.target;
  if (id === 'global-query') searchResults(value);
  if (id === 'filter-query') { filters.query = value; clearDraw(); renderTasks(); renderResult(); }
});
document.addEventListener('change', async event => {
  const {id,value,dataset} = event.target;
  if (id.startsWith('filter-') && id !== 'filter-query') {
    filters[id.slice(7)] = value;
    if (value === 'shuffle') shuffledOrder = shuffle(viewTasks().map(task => task.id));
    clearDraw();
    renderTasks();
    renderResult();
  }
  if (id === 'draw-scope' || id === 'quick-limit' || id === 'energy-target') {
    if (id === 'draw-scope') drawScope = value;
    if (id === 'quick-limit') quickLimit = Number(value);
    if (id === 'energy-target') energyTarget = value;
    clearDraw();
    renderResult();
  }
  if (id === 'timer-minutes') {
    focus.minutes = Number(value);
    actions['reset-timer']();
  }
  if (dataset.check !== undefined) {
    const item = taskFor(dataset.id)?.checklist[Number(dataset.check)];
    if (item) change(() => { item.checked = event.target.checked; },'チェックリストを更新しました。');
  }
  if (id === 'import-file' && event.target.files[0]) {
    try {
      importData = decode(JSON.parse(await event.target.files[0].text()));
      confirmAction('バックアップを読み込む','現在のタスクとカテゴリを、選んだファイルのデータで置き換えます。','confirm-import','');
    } catch (error) { notify(error instanceof SyntaxError ? 'JSONを読み込めませんでした。' : error.message); }
    event.target.value = '';
  }
});

document.addEventListener('keydown', event => {
  if (modal.open || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable]')) return;
  if (event.key === '/') { event.preventDefault(); actions.search(); }
  if (event.key === 'n' && !event.repeat) actions.new();
});
window.addEventListener('hashchange', () => {
  changeView();
  $('#filter-query').value = filters.query;
  $('#filter-priority').value = filters.priority;
  $('#filter-state').value = filters.state;
});
window.addEventListener('storage', event => {
  if (event.key !== storageKey || !event.newValue) return;
  try {
    data = decode(JSON.parse(event.newValue));
    view = getView();
    if (modal.open) modal.close();
    notify('別のタブの変更を反映しました。');
    render();
  } catch { /* The existing tab state stays usable. */ }
});
let displayedDay = dateKey();
setInterval(() => {
  if (displayedDay !== dateKey()) {
    displayedDay = dateKey();
    render();
  } else renderTimer();
}, 250);
renderRandomOptions();
changeView();
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
