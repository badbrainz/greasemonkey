// TODO Add a 'Save All' menu.

let $q = (selector, parent = document) => parent.querySelector(selector);
let $a = (selector, parent = document) => parent.querySelectorAll(selector);

function lookupCommandKey(command, keyMap) {
  let key = Object.keys(keyMap).find(k => keyMap[k] == command);
  if (key) return key;
  if (keyMap.fallthrough)
    return lookupCommandKey(command, CodeMirror.keyMap[keyMap.fallthrough]);
  return '';
}

function setMenuShortcut(selector, command) {
  let extra = editor.getOption('extraKeys');
  let key = extra && lookupCommandKey(command, extra);
  if (!key) {
    let map = CodeMirror.keyMap[editor.getOption('keyMap')];
    key = lookupCommandKey(command, map);
  }
  $q(selector + ' .shortcut').innerText = key;
}

function menuCommand(cmd, focus = true) {
  return () => {
    editor.execCommand(cmd);
    if (focus) {
      editor.focus();
    }
  };
}

function closeDropdown(event) {
  if (!event.target.isSameNode(event.currentTarget.firstElementChild)) {
    event.currentTarget.firstElementChild.checked = false;
  }
}

///////////////////////////////////////////////////////////////////////////////

// Define options here.

CodeMirror.defineOption('fontSize', 11, (cm, value) => {
  cm.getWrapperElement().style.fontSize = value + 'px';
  cm.refresh();
});

///////////////////////////////////////////////////////////////////////////////

// Define commands here.

CodeMirror.commands.save = cm => {
    onSave();
};

CodeMirror.commands.increaseFontSize = cm => {
  cm.setOption('fontSize', cm.getOption('fontSize') + 1);
};

CodeMirror.commands.decreaseFontSize = cm => {
  cm.setOption('fontSize', cm.getOption('fontSize') - 1);
};
