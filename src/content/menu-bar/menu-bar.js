let $q = (selector, parent = document) => parent.querySelector(selector);
let $a = (selector, parent = document) => parent.querySelectorAll(selector);

// Map combo keys to menu checkboxes here.

const hotKeys = {
  'Alt-F': 'file',
  'Alt-E': 'edit',
  'Alt-V': 'view',
  'Alt-S': 'search',
  'Alt-O': 'options',
  'Alt-A': 'addons',
  'Alt-H': 'help',
};

const menuState = {
  menu: null,
  items: [],
  index: -1,

  handleEvent(event) {
    let keyname = CodeMirror.keyNames[event.keyCode];
    switch (keyname) {
      case 'Up':
        if (this.items[this.index] && this.items[this.index - 1]) {
          this.items[--this.index].focus();
        } else {
          this.index = this.items.length - 1;
          this.items[this.index].focus();
        }
        break;
      case 'Down':
        if (this.items[this.index] && this.items[this.index + 1]) {
          this.items[++this.index].focus();
        } else {
          this.index = 0
          this.items[this.index].focus();
        }
        break;
      case 'Enter':
        if (this.items[this.index]) {
          event.preventDefault();
          this.items[this.index].click();
        } else {
          this.index = 0
          this.items[this.index].focus();
        }
        break;
      case 'Esc':
        this.menu.firstElementChild.click();
        editor.focus();
        break;
      case 'Tab':
        event.preventDefault();
        break;
      default:
        break;
    }
  }
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

function activateMenu(menu) {
  if (menuState.menu) {
    menuState.menu.removeEventListener('keydown', menuState, true);
  }
  menuState.menu = menu;
  menuState.menu.addEventListener('keydown', menuState, true);
  menuState.items = $a('.dropdown-item', menuState.menu);
  menuState.index = -1;
  $q('.dropdown', menuState.menu).focus();
}

function onMenuToggled(event) {
  if (!event.target.isSameNode(event.currentTarget.firstElementChild)) {
    event.currentTarget.firstElementChild.click();
  } else if (event.target.checked) {
    activateMenu(event.currentTarget);
  }
}

function onHotKey(event) {
  let combo = CodeMirror.keyName(event);
  if (!hotKeys.hasOwnProperty(combo)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  // BUG menubar won't receive focus if hotkey is pressed inside search dialog.
  if (event.target.className.includes('CodeMirror-search-field')) {
    return;
  }

  for (let menu of $a('#menus .menu')) {
    let input = menu.firstElementChild;
    if (input.checked && input.id != hotKeys[combo]) {
      input.checked = false;
    } else if (!input.checked && input.id == hotKeys[combo]) {
      input.checked = true;
      activateMenu(menu);
    }
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
