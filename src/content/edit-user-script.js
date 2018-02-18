// TODO: Search, replace.
// TODO: Put name in title.

var editorOptions = {
  'tabSize': 2,
  'lineNumbers': true,
  'lineWrapping': false,
  'matchBrackets': false,
  'lint': true
};

for (let s in editorOptions) {
  let val = localStorage.getItem('op_' + s);
  if (val) editorOptions[s] = JSON.parse(val);
}

if (editorOptions.lint) {
  editorOptions.gutters = [];
  editorOptions.gutters.push('CodeMirror-lint-markers');
}

CodeMirror.commands.save = onSave;

var editor = CodeMirror(document.getElementById('editor'), editorOptions);

const titlePattern = '%s - Greasemonkey User Script Editor';
const userScriptUuid = location.hash.substr(1);
const editorDocs = [];
const editorTabs = [];
const editorUrls = [];
const tabs = document.getElementById('tabs');

///////////////////////////////////////////////////////////////////////////////

function addRequireTab(url, content) {
  if (!url) return console.error('addRequireTab missing URL!');
  if (!content) return console.error('addRequireTab missing content!');
  let requireTab = document.createElement('li');
  requireTab.className = 'tab';
  requireTab.textContent = nameForUrl(url);
  tabs.appendChild(requireTab);
  editorTabs.push(requireTab);
  editorDocs.push(CodeMirror.Doc(content, 'javascript'));
  editorUrls.push(url);
}

function nameForUrl(url) {
  return unescape(url.replace(/.*\//, '').replace(/[?#].*/, ''));
}

///////////////////////////////////////////////////////////////////////////////

chrome.runtime.sendMessage({
  'name': 'UserScriptGet',
  'uuid': userScriptUuid,
}, userScript => {
  let scriptTab = document.createElement('li');
  scriptTab.className = 'tab active';
  scriptTab.textContent = userScript.name;
  tabs.appendChild(scriptTab);
  editorTabs.push(scriptTab);
  editorDocs.push(CodeMirror.Doc(userScript.content, 'javascript'));
  editorUrls.push(null);

  Object.keys(userScript.requiresContent).forEach(u => {
    addRequireTab(u, userScript.requiresContent[u]);
  });

  editor.swapDoc(editorDocs[0]);
  editor.focus();

  document.title = titlePattern.replace('%s', userScript.name);
});


function onUserScriptChanged(message, sender, sendResponse) {
  if (message.name != 'UserScriptChanged') return;
  if (message.details.uuid != userScriptUuid) return;
  let details = message.details;
  let parsedDetails = message.parsedDetails;

  document.title = titlePattern.replace('%s', details.name);

  for (let i = editorDocs.length - 1; i > 0; i--) {
    let u = editorUrls[i];
    if (parsedDetails.requireUrls.indexOf(u) === -1) {
      editorTabs[i].parentNode.removeChild(editorTabs[i]);
      editorDocs.splice(i, 1);
      editorTabs.splice(i, 1);
      editorUrls.splice(i, 1);
    }
  }

  parsedDetails.requireUrls.forEach(u => {
    if (editorUrls.indexOf(u) === -1) {
      addRequireTab(u, details.requiresContent[u]);
    }
  });
}
chrome.runtime.onMessage.addListener(onUserScriptChanged);

///////////////////////////////////////////////////////////////////////////////

// TODO: Keyboard accessibility?
tabs.addEventListener('click', event => {
  if (event.target.classList.contains('tab')) {
    let selectedTab = document.querySelector('#tabs .tab.active');
    selectedTab.classList.remove('active');

    let newTab = event.target;
    newTab.classList.add('active');

    let idx = editorTabs.indexOf(newTab);
    editor.swapDoc(editorDocs[idx]);
    editor.focus();
  }
}, true);


editor.on('change', change => {
  let selectedTab = document.querySelector('#tabs .tab.active');
  let idx = editorTabs.indexOf(selectedTab);
  let selectedDoc = editorDocs[idx];
  if (selectedDoc.isClean()) {
    selectedTab.classList.remove('dirty');
  } else {
    selectedTab.classList.add('dirty');
  }
});


function onSave() {
  if (document.querySelectorAll('#tabs .tab.dirty').length == 0) {
    return;
  }

  let requires = {};
  for (let i = 1; i < editorDocs.length; i++) {
    requires[ editorUrls[i] ] = editorDocs[i].getValue();
  }

  chrome.runtime.sendMessage({
    'name': 'EditorSaved',
    'uuid': userScriptUuid,
    'content': editorDocs[0].getValue(),
    'requires': requires,
  });

  // TODO: Spinner, then only when completed:
  for (let i = 0; i < editorDocs.length; i++) {
    editorDocs[i].markClean();
    editorTabs[i].classList.remove('dirty');
  }
}

editor.on('swapDoc', doc => {
  doc.performLint();
});

///////////////////////////////////////////////////////////////////////////////

let gMenuBar = new MenuBar();
let gMenuActions = {
  'cm_save': { oper: 'save' },
  'cm_viewNextDoc': { oper: 'viewNextDoc' },
  'cm_viewPreviousDoc': { oper: 'viewPreviousDoc' },
  'cm_undo': { oper: 'undo' },
  'cm_redo': { oper: 'redo' },
  'cm_indentMore': { oper: 'indentMore' },
  'cm_indentLess': { oper: 'indentLess' },
  'cm_indentAuto': { oper: 'indentAuto' },
  'cm_jumpToLine': { oper: 'jumpToLine', foc: false },
  'cm_fold': { oper: 'fold' },
  'cm_unfold': { oper: 'unfold' },
  'cm_foldAll': { oper: 'foldAll' },
  'cm_unfoldAll': { oper: 'unfoldAll' },
  'cm_find': { oper: 'find', foc: false },
  'cm_findNext': { oper: 'findNext' },
  'cm_findPrev': { oper: 'findPrev' },
  'cm_replace': { oper: 'replace', foc: false },
  'cm_replaceAll': { oper: 'replaceAll', foc: false },
  'cm_autocomplete': { oper: 'autocomplete' },
  'cm_goToBracket': { oper: 'goToBracket' },
  'op_lineNumbers': { oper: 'lineNumbers' },
  'op_lineWrapping': { oper: 'lineWrapping' },
  'op_matchBrackets': { oper: 'matchBrackets' },
  'op_lint': { oper: 'lint' }
};

///////////////////////////////////////////////////////////////////////////////

{
  let isMac = CodeMirror.keyMap['default'] == CodeMirror.keyMap.macDefault;
  let ctrl = isMac ? 'Cmd-' : 'Ctrl-';

  let extraKeys = Object.assign({}, editor.getOption('extraKeys'), {
    [ctrl + '0']: 'fold',
    [ctrl + '9']: 'unfold',
    [ctrl + 'M']: 'goToBracket',
    [ctrl + 'Space']: 'autocomplete',
    ['Shift-' + ctrl + '0']: 'foldAll',
    ['Shift-' + ctrl + '9']: 'unfoldAll',
    ['Shift-' + ctrl + ']']: 'viewNextDoc',
    ['Shift-' + ctrl + '[']: 'viewPreviousDoc',
    ['Alt-F']: () => gMenuBar.showMenu('File'),
    ['Alt-E']: () => gMenuBar.showMenu('Edit'),
    ['Alt-S']: () => gMenuBar.showMenu('Search'),
    ['Alt-O']: () => gMenuBar.showMenu('Options'),
    ['Alt-A']: () => gMenuBar.showMenu('Addons')
  });

  editor.setOption('extraKeys', extraKeys);
}

///////////////////////////////////////////////////////////////////////////////

document.addEventListener('execCommand', event => {
  editor.execCommand(event.detail.oper);
  if (event.detail.foc !== false) {
    editor.focus();
  }
});

document.addEventListener('setOption', event => {
  let option = event.detail.oper;
  let value = !event.detail.val;

  if (option == 'lint') {
    editor.toggleLintGutter(value);
  }

  editor.setOption(option, value);

  let model = gMenuActions['op_' + option];
  if (model) model.val = value;

  localStorage.setItem('op_' + option, JSON.stringify(value));
});

///////////////////////////////////////////////////////////////////////////////

gMenuActions.cm_save.text = '&Save';
gMenuActions.cm_viewNextDoc.text = '&Next Document';
gMenuActions.cm_viewPreviousDoc.text = '&Previous Document';
gMenuActions.cm_undo.text = '&Undo';
gMenuActions.cm_redo.text = '&Redo';
gMenuActions.cm_indentMore.text = 'Indent &More';
gMenuActions.cm_indentLess.text = 'Indent &Less';
gMenuActions.cm_indentAuto.text = 'Indent &Auto';
gMenuActions.cm_jumpToLine.text = '&Jump To Line';
gMenuActions.cm_fold.text = 'Fold';
gMenuActions.cm_unfold.text = 'Unfold';
gMenuActions.cm_foldAll.text = 'Fold All';
gMenuActions.cm_unfoldAll.text = 'Unfold All';
gMenuActions.cm_find.text = '&Find';
gMenuActions.cm_findNext.text = 'Find &Next'
gMenuActions.cm_findPrev.text = 'Find &Previous';
gMenuActions.cm_replace.text = '&Replace';
gMenuActions.cm_replaceAll.text = 'Replace &All';
gMenuActions.cm_autocomplete.text = '&Autocomplete';
gMenuActions.cm_goToBracket.text = 'Go To &Bracket';
gMenuActions.op_lineNumbers.text = 'Line Numbers';
gMenuActions.op_lineWrapping.text = 'Wrap Lines';
gMenuActions.op_matchBrackets.text = 'Highlight Brackets';
gMenuActions.op_lint.text = 'Lint Metadata';

for (let key in gMenuActions) {
  if ('cm_' != key.slice(0, 3)) continue;
  gMenuActions[key].keymap = editor.lookupCommandKey(gMenuActions[key].oper);
  let val = localStorage.getItem(key);
  if (val) gMenuActions[key].text = JSON.parse(val);
}

gMenuActions.op_lineNumbers.val = editor.getOption('lineNumbers');
gMenuActions.op_lineWrapping.val = editor.getOption('lineWrapping');
gMenuActions.op_matchBrackets.val = editor.getOption('matchBrackets');
gMenuActions.op_lint.val = editor.getOption('lint');

gMenuBar.addMenu('File')
  .addItem('execCommand', gMenuActions.cm_save)
  .addDivider()
  .addItem('execCommand', gMenuActions.cm_viewNextDoc)
  .addItem('execCommand', gMenuActions.cm_viewPreviousDoc);

gMenuBar.addMenu('Edit')
  .addItem('execCommand', gMenuActions.cm_undo)
  .addItem('execCommand', gMenuActions.cm_redo)
  .addDivider()
  .addItem('execCommand', gMenuActions.cm_indentMore)
  .addItem('execCommand', gMenuActions.cm_indentLess)
  .addItem('execCommand', gMenuActions.cm_indentAuto)
  .addDivider()
  .addItem('execCommand', gMenuActions.cm_jumpToLine)
  .addDivider()
  .addItem('execCommand', gMenuActions.cm_fold)
  .addItem('execCommand', gMenuActions.cm_unfold)
  .addItem('execCommand', gMenuActions.cm_foldAll)
  .addItem('execCommand', gMenuActions.cm_unfoldAll);

gMenuBar.addMenu('Search')
  .addItem('execCommand', gMenuActions.cm_find)
  .addItem('execCommand', gMenuActions.cm_findNext)
  .addItem('execCommand', gMenuActions.cm_findPrev)
  .addDivider()
  .addItem('execCommand', gMenuActions.cm_replace)
  .addItem('execCommand', gMenuActions.cm_replaceAll);

gMenuBar.addMenu('Options')
  .addItem('setOption', gMenuActions.op_lineNumbers)
  .addItem('setOption', gMenuActions.op_lineWrapping)
  .addItem('setOption', gMenuActions.op_matchBrackets)
  .addItem('setOption', gMenuActions.op_lint);

gMenuBar.addMenu('Addons')
  .addItem('execCommand', gMenuActions.cm_autocomplete)
  .addItem('execCommand', gMenuActions.cm_goToBracket);

rivets.bind(document.querySelector('menubar'), { menubar: gMenuBar });
