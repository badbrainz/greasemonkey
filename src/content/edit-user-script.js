// TODO: Search, replace.
// TODO: Put name in title.

const editorOptions = (function() {
  let editorOptions = {
    'tabSize': 2,
    'lineNumbers': true,
    'fontSize': 11,
    'lint': true,
    'gutters': [],
    'matchBrackets': false,
    'autocomplete': false
  };

  if (localStorage.hasOwnProperty('editor')) {
    Object.assign(editorOptions, JSON.parse(localStorage.editor));
  }

  if (editorOptions.lint) {
    editorOptions.gutters.push('CodeMirror-lint-markers');
  }

  return editorOptions;
})();

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

///////////////////////////////////////////////////////////////////////////////

editor.on('swapDoc', doc => {
  doc.performLint();
});

editor.on('optionChange', (cm, option) => {
  let optionalKeys = [
    'fontSize', 'lineWrapping', 'indentWithTabs', 'indentUnit', 'lint',
    'matchBrackets', 'autocomplete'];

  if (optionalKeys.includes(option)) {
    let config = {};
    optionalKeys.forEach(k => {
      config[k] = editor.getOption(k);
    });
    localStorage.editor = JSON.stringify(config);
  }
});

let menuBar = new MenuBar();

menuBar.addMenu('File')
  .addItem('Save:save:s', () => editor.execCommand('save'));

menuBar.addMenu('Edit')
  .addItem('Undo:undo:u', () => editor.execCommand('undo'))
  .addItem('Redo:redo:r', () => editor.execCommand('redo'))
  .addItem('Indent More:indentMore:]', () => editor.execCommand('indentMore'))
  .addItem('Indent Less:indentLess:[', () => editor.execCommand('indentLess'))
  .addItem('Indent Auto:indentAuto', () => editor.execCommand('indentAuto'))
  .addItem('Jump to Line:jumpToLine:j', () => editor.execCommand('jumpToLine'))
  .addItem('Fold:fold', () => editor.execCommand('fold'))
  .addItem('Unfold:unfold', () => editor.execCommand('unfold'))
  .addItem('Fold All:foldAll', () => editor.execCommand('foldAll'))
  .addItem('Unfold All:unfoldAll', () => editor.execCommand('unfoldAll'));

menuBar.addMenu('View')
  .addItem('Font Size +:increaseFontSize:i', () => editor.execCommand('increaseFontSize'))
  .addItem('Font Size -:decreaseFontSize:d', () => editor.execCommand('decreaseFontSize'))
  .addItem('Next Document:viewNextDoc:n', () => editor.execCommand('viewNextDoc'))
  .addItem('Previous Document:viewPreviousDoc:p', () => editor.execCommand('viewPreviousDoc'));

menuBar.addMenu('Search')
  .addItem('Find:find:f', () => editor.execCommand('find'))
  .addItem('Find Next:findNext:n', () => editor.execCommand('findNext'))
  .addItem('Find Previous:findPrev:p', () => editor.execCommand('findPrev'))
  .addItem('Replace:replace:r', () => editor.execCommand('replace'))
  .addItem('Replace All:replaceAll:a', () => editor.execCommand('replaceAll'));

menuBar.addMenu('Addons')
  .addItem('Auto Complete:autocomplete:a', () => editor.execCommand('autocomplete'))
  .addItem('Find Bracket:goToBracket:b', () => editor.execCommand('goToBracket'));

rivets.bind(document.querySelector('menubar'), { menubar: menuBar });

{
  let isMac = CodeMirror.keyMap['default'] == CodeMirror.keyMap.macDefault;
  let ctrl = isMac ? 'Cmd-' : 'Ctrl-';
  let extraKeys = {};
  extraKeys[ctrl + "'"] = 'increaseFontSize';
  extraKeys[ctrl + ';'] = 'decreaseFontSize';
  extraKeys[ctrl + '0'] = 'fold';
  extraKeys[ctrl + '9'] = 'unfold';
  extraKeys[ctrl + 'M'] = 'goToBracket';
  extraKeys[ctrl + 'Space'] = 'autocomplete';
  extraKeys['Shift-' + ctrl + '0'] = 'foldAll';
  extraKeys['Shift-' + ctrl + '9'] = 'unfoldAll';
  extraKeys['Shift-' + ctrl + ']'] = 'viewNextDoc';
  extraKeys['Shift-' + ctrl + '['] = 'viewPreviousDoc';
  extraKeys['Alt-F'] = () => menuBar.showMenu('File');
  extraKeys['Alt-E'] = () => menuBar.showMenu('Edit');
  extraKeys['Alt-V'] = () => menuBar.showMenu('View');
  extraKeys['Alt-S'] = () => menuBar.showMenu('Search');
  extraKeys['Alt-A'] = () => menuBar.showMenu('Addons');
  editor.setOption('extraKeys', extraKeys);
}
