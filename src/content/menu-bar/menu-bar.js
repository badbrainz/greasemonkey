let $q = (selector, parent = document) => parent.querySelector(selector);
let $a = (selector, parent = document) => parent.querySelectorAll(selector);

// Define radio(name="menu") key map here.

const menuHotKeys = {
  'Alt-F': () => activateMenu('file'),
  'Alt-E': () => activateMenu('edit'),
  'Alt-V': () => activateMenu('view'),
  'Alt-S': () => activateMenu('search'),
  'Alt-O': () => activateMenu('options'),
  'Alt-A': () => activateMenu('addons'),
  'Alt-H': () => activateMenu('help')
};

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

function activateMenu(id) {
  let trigger = $q(`input[name="menu"][id="${id}"]`);
  trigger.checked = true;
  trigger.focus();
}

function onMenuEvent(event) {
  let menubar = event.currentTarget;

  let activator = $q('input[name="menu"]:checked', menubar);
  if (!activator) return;

  let dropdown = $q('input[name="menu"]:checked ~ .dropdown', menubar);
  let currentItem = $q(':focus', dropdown);

  if (event.type == 'click') {
    if (currentItem || event.target.classList.contains('backdrop')) {
      activator.checked = false;
    }
    return;
  }

  let keyName = CodeMirror.keyName(event);

  if (menuHotKeys.hasOwnProperty(keyName)) {
    menuHotKeys[keyName]();
    event.preventDefault();
    return;
  }

  switch (keyName) {
    case 'Esc':
      activator.checked = false;
      activator.focus();
      break;
    case 'Enter':
      if (currentItem) {
        event.preventDefault();
        currentItem.click();
        activator.checked = false;
      }
      break;
    case 'Space':
      if (currentItem) {
        event.preventDefault();
      }
      break;
    case 'Tab':
      if (document.activeElement === dropdown.lastElementChild ||
          dropdown.lastElementChild.contains(document.activeElement)) {
        activator.checked = false;
      }
      break;
    case 'Shift-Tab':
      if (document.activeElement === activator) {
        event.preventDefault();
        activator.checked = false;
      }
      break;
    default:
      break;
    }
  }

///////////////////////////////////////////////////////////////////////////////

// Define options here.

CodeMirror.defineOption('fontSize', 11, (cm, value) => {
  cm.getWrapperElement().parentNode.style.fontSize = value + 'px';
  cm.refresh();
});

CodeMirror.defineOption('autocomplete', false);

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

CodeMirror.commands.goToBracket = cm => {
  cm.extendSelectionsBy(range => {
    let next = cm.scanForBracket(range.head, 1);
    if (next && CodeMirror.cmpPos(next.pos, range.head) != 0) return next.pos;
    let prev = cm.scanForBracket(range.head, -1);
    return prev && CodeMirror.Pos(prev.pos.line, prev.pos.ch + 1) || range.head;
  });
};

CodeMirror.commands.autocomplete = cm => {
  cm.showHint({
    'hint': (cm, options) => {
      if (cm.getOption('autocomplete') && CodeMirror.hint.anyword) {
        return CodeMirror.hint.anyword(cm, options);
      }
    },
    'container': cm.getWrapperElement().parentNode,
    'completeSingle': false
  });
};
