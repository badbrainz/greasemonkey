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

CodeMirror.commands.viewNextDoc = cm => {
  let selectedTab = document.querySelector('#tabs .tab.active');
  if (selectedTab.nextElementSibling) {
    selectedTab.nextElementSibling.click();
  }
};

CodeMirror.commands.viewPreviousDoc = cm => {
  let selectedTab = document.querySelector('#tabs .tab.active');
  if (selectedTab.previousElementSibling) {
    selectedTab.previousElementSibling.click();
  }
};
