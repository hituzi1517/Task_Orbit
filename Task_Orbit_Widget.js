// Variables used by Scriptable.
// icon-color: deep-purple; icon-glyph: tasks;
// Scriptableで「Task Orbit」という名前にして保存してください。

const colors = {
  violet: ['#382268', '#6746ce'],
  blue: ['#183065', '#3159b1'],
  mint: ['#12473a', '#197660'],
  pink: ['#69224b', '#ad3b72'],
  gold: ['#573414', '#92551a'],
  plum: ['#512361', '#85439e'],
  'hue-0': ['#5b1a1a', '#882525'],
  'hue-12': ['#5b271a', '#883925'],
  'hue-24': ['#5b341a', '#884d25'],
  'hue-42': ['#5b481a', '#886a25'],
  'hue-54': ['#5b551a', '#887e25'],
  'hue-68': ['#535b1a', '#7b8825'],
  'hue-83': ['#425b1a', '#628825'],
  'hue-106': ['#295b1a', '#3c8825'],
  'hue-124': ['#1a5b1e', '#25882c'],
  'hue-148': ['#1a5b38', '#258853'],
  'hue-181': ['#1a5a5b', '#258688'],
  'hue-194': ['#1a4c5b', '#257188'],
  'hue-206': ['#1a3f5b', '#255d88'],
  'hue-230': ['#1a255b', '#253688'],
  'hue-244': ['#1e1a5b', '#2c2588'],
  'hue-274': ['#3f1a5b', '#5d2588'],
  'hue-307': ['#5b1a54', '#88257d'],
  'hue-348': ['#5b1a27', '#882539'],
};
const fileManager = FileManager.local();
const snapshotPath = fileManager.joinPath(fileManager.libraryDirectory(), 'task-orbit-widget-v1.json');
const family = config.widgetFamily || 'small';
const randomMode = String(args.widgetParameter || '').trim().toLowerCase() === 'random';

function dayKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function parseSnapshot(text) {
  const value = JSON.parse(text);
  if (!value || value.type !== 'task-orbit-widget' || value.version !== 1 ||
      typeof value.site !== 'string' || !/^https:\/\/[^\s/?#]+(?:[/?#]|$)/i.test(value.site) ||
      !Array.isArray(value.tasks) || !Number.isFinite(value.updated) || value.updated <= 0 ||
      Number.isNaN(new Date(value.updated).getTime()) ||
      typeof value.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.day) ||
      !Number.isInteger(value.done) || value.done < 0) {
    throw new Error('Task Orbitの設定画面で「タスクをコピー」を押してから、もう一度読み込んでください。');
  }
  const tasks = value.tasks.filter(item => Array.isArray(item) &&
    typeof item[0] === 'string' && item[0].trim() &&
    typeof item[1] === 'string' && (item[1] === '' || /^\d{4}-\d{2}-\d{2}$/.test(item[1])) &&
    Number.isInteger(item[2]) && item[2] >= 0 && item[2] <= 999);
  return {
    type:value.type, version:value.version, site:value.site, updated:value.updated, day:value.day,
    done:value.done, tasks, accent:Object.prototype.hasOwnProperty.call(colors, value.accent) ? value.accent : 'violet',
  };
}

function readSnapshot() {
  try {
    return parseSnapshot(fileManager.readString(snapshotPath));
  } catch {
    return null;
  }
}

function dailyPick(tasks, day) {
  if (!tasks.length) return null;
  // Keep the suggestion consistent across widget reloads of the same snapshot.
  let seed = 2166136261;
  for (const char of day) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return tasks[(seed >>> 0) % tasks.length];
}

function text(widget, value, size, {bold = false, muted = false, lines = 1} = {}) {
  const item = widget.addText(value);
  item.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  item.textColor = new Color(muted ? '#F4ECFF' : '#FFFFFF', muted ? 0.86 : 1);
  item.lineLimit = lines;
  item.minimumScaleFactor = 0.78;
  return item;
}

function buildWidget(snapshot, size, suggest, now = new Date()) {
  const today = dayKey(now);
  const tasks = snapshot ? snapshot.tasks : [];
  const due = tasks.filter(task => task[1] && task[1] <= today);
  const done = snapshot && snapshot.day === today ? snapshot.done : 0;
  const suggestion = dailyPick(due.length ? due : tasks, today);
  const widget = new ListWidget();
  const accessory = size.startsWith('accessory');
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  widget.refreshAfterDate = new Date(Math.min(midnight.getTime(), now.getTime() + 15 * 60000));
  widget.url = snapshot ? snapshot.site : 'scriptable:///run/Task%20Orbit';

  if (accessory) {
    if (size === 'accessoryInline') {
      widget.addText(snapshot ? 'Task Orbit · 未完了 ' + due.length + '件' : 'Task Orbit · 初期設定');
    } else if (size === 'accessoryCircular') {
      widget.addAccessoryWidgetBackground = true;
      widget.addSpacer();
      const number = widget.addText(snapshot ? String(due.length) : '–');
      number.font = Font.boldSystemFont(19);
      number.centerAlignText();
      const label = widget.addText('未完了');
      label.font = Font.systemFont(9);
      label.centerAlignText();
      widget.addSpacer();
    } else {
      widget.addText(suggest ? 'Task Orbit · 日替わり' : 'Task Orbit · 今日');
      const line = widget.addText(snapshot ? (suggest ? suggestion?.[0] || '未完了なし' : '未完了 ' + due.length + '件 · 完了 ' + done + '件') : 'サイトからタスクを取り込む');
      line.lineLimit = 2;
    }
    return widget;
  }

  const [start,end] = colors[snapshot?.accent || 'violet'];
  const gradient = new LinearGradient();
  gradient.colors = [new Color(start), new Color(end)];
  gradient.locations = [0,1];
  widget.backgroundGradient = gradient;
  widget.setPadding(13, 14, 12, 14);
  const heading = suggest ? 'Task Orbit · 日替わり' : 'Task Orbit';
  text(widget,heading,11,{bold:true,muted:true});
  widget.addSpacer(6);
  if (!snapshot) {
    text(widget,'初期設定',19,{bold:true});
    widget.addSpacer(4);
    text(widget,'サイトの設定からタスクを取り込む',11,{lines:2});
    return widget;
  }

  if (suggest) {
    text(widget,suggestion?.[0] || '未完了のタスクなし',size === 'small' ? 17 : 20,{bold:true,lines:3});
    if (suggestion?.[2]) {
      widget.addSpacer(3);
      text(widget,'目安 ' + suggestion[2] + '分',10,{muted:true});
    }
  } else {
    text(widget,'未完了 ' + due.length + '件',size === 'small' ? 20 : 23,{bold:true});
    text(widget,'今日の完了 ' + done + '件',11,{muted:true});
    widget.addSpacer(6);
    const limit = size === 'small' ? 1 : size === 'medium' ? 3 : 7;
    due.slice(0,limit).forEach(task => text(widget,'○  ' + task[0],11));
    if (!due.length) text(widget,'今日までの未完了なし',11);
    else if (due.length > limit && size !== 'small') text(widget,'ほか ' + (due.length - limit) + ' 件',10,{muted:true});
  }
  widget.addSpacer();
  const updated = new Date(snapshot.updated);
  const stamp = (updated.getMonth() + 1) + '/' + updated.getDate() + ' ' +
    String(updated.getHours()).padStart(2,'0') + ':' + String(updated.getMinutes()).padStart(2,'0');
  text(widget,'取込 ' + stamp,9,{muted:true});
  return widget;
}

async function message(title, detail) {
  const alert = new Alert();
  alert.title = title;
  alert.message = detail;
  alert.addAction('OK');
  await alert.presentAlert();
}

async function importClipboard() {
  let snapshot;
  try {
    snapshot = parseSnapshot(Pasteboard.pasteString());
  } catch {
    await message('タスクを読み込めませんでした','Task Orbitの設定で「タスクをコピー」を押し、貼り付けを許可してからお試しください。');
    return;
  }
  try {
    fileManager.writeString(snapshotPath, JSON.stringify(snapshot));
  } catch {
    await message('保存できませんでした','Scriptableでデータの保存に失敗しました。');
    return;
  }
  await message('タスクを取り込みました','ホーム画面はiOSのタイミングで更新されます。');
}

async function run() {
  if (config.runsInWidget) {
    Script.setWidget(buildWidget(readSnapshot(),family,randomMode));
    Script.complete();
    return;
  }
  if (args.queryParameters?.orbit === 'import') {
    await importClipboard();
    Script.complete();
    return;
  }
  const menu = new Alert();
  menu.title = 'Task Orbit';
  menu.message = 'サイトで「タスクをコピー」したあと、ここからも取り込めます。';
  menu.addAction('コピーしたタスクを取り込む');
  menu.addAction('小サイズをプレビュー');
  menu.addAction('中サイズをプレビュー');
  menu.addAction('日替わりをプレビュー');
  menu.addCancelAction('閉じる');
  const choice = await menu.presentSheet();
  if (choice === 0) await importClipboard();
  if (choice === 1) await buildWidget(readSnapshot(),'small',false).presentSmall();
  if (choice === 2) await buildWidget(readSnapshot(),'medium',false).presentMedium();
  if (choice === 3) await buildWidget(readSnapshot(),'small',true).presentSmall();
  Script.complete();
}

await run();
