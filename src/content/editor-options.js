CodeMirror.defineOption('fontSize', 11, (cm, value) => {
  cm.getWrapperElement().parentNode.style.fontSize = value + 'px';
  cm.refresh();
});

CodeMirror.defineOption('autocomplete', false);
