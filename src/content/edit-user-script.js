// TODO: Search, replace.
// TODO: Put name in title.

const editorOptions = (function() {
  let isMac = CodeMirror.keyMap['default'] == CodeMirror.keyMap.macDefault;
  let ctrl = isMac ? 'Cmd-' : 'Ctrl-';

  let editorOptions = {
    'tabSize': 2,
    'lineNumbers': true,
    'lint': true,
    'gutters': [],
    'extraKeys': {
      [ctrl + '0']: 'fold',
      [ctrl + '9']: 'unfold',
      [ctrl + 'M']: 'goToBracket',
      [ctrl + 'Space']: 'autocomplete',
      ['Shift-' + ctrl + '0']: 'foldAll',
      ['Shift-' + ctrl + '9']: 'unfoldAll',
      ['Shift-' + ctrl + ']']: 'viewNextDoc',
      ['Shift-' + ctrl + '[']: 'viewPreviousDoc'
    }
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
    'lineWrapping', 'indentWithTabs', 'indentUnit', 'lint', 'matchBrackets'];

  if (optionalKeys.includes(option)) {
    let config = {};
    optionalKeys.forEach(k => {
      config[k] = editor.getOption(k);
    });
    localStorage.editor = JSON.stringify(config);
  }
});

document.addEventListener('execCommand', event => {
  editor.execCommand(event.detail.cmd);
  if (event.detail.foc !== false) {
    editor.focus();
  }
});

document.addEventListener('setOption', event => {
  let option = event.detail.opt;
  let value = !event.detail.val;

  if (option == 'lint') {
    let gutters = editor.getOption('gutters');

    let found = gutters.indexOf('CodeMirror-lint-markers');
    if (found == -1 && value) {
      gutters = ['CodeMirror-lint-markers'].concat(gutters);
    } else if (found > -1 && !value) {
      gutters = gutters.slice(0);
      gutters.splice(found, 1);
    }

    editor.setOption('gutters', gutters);
  }

  editor.setOption(option, value);

  // toggle model state
  event.detail.val = value;
});
