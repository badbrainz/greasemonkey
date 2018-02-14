let menuBar = new MenuBar();

menuBar.addMenu('File')
  .addItem('execCommand', { text: 'Save', cmd: 'save', key: 's' })
  .addItem('execCommand', { text: 'Next Document', cmd: 'viewNextDoc', key: 'n' })
  .addItem('execCommand', { text: 'Previous Document', cmd: 'viewPreviousDoc', key: 'p' });

menuBar.addMenu('Edit')
  .addItem('execCommand', { text: 'Undo', cmd: 'undo', key: 'u' })
  .addItem('execCommand', { text: 'Redo', cmd: 'redo', key: 'r' })
  .addItem('execCommand', { text: 'Indent More', cmd: 'indentMore', key: ']' })
  .addItem('execCommand', { text: 'Indent Less', cmd: 'indentLess', key: '[' })
  .addItem('execCommand', { text: 'Indent Auto', cmd: 'indentAuto', key: 'i' })
  .addItem('execCommand', { text: 'Jump to Line', cmd: 'jumpToLine', foc: false, key: 'j' })
  .addItem('execCommand', { text: 'Fold', cmd: 'fold' })
  .addItem('execCommand', { text: 'Unfold', cmd: 'unfold' })
  .addItem('execCommand', { text: 'Fold All', cmd: 'foldAll' })
  .addItem('execCommand', { text: 'Unfold All', cmd: 'unfoldAll' });

menuBar.addMenu('Search')
  .addItem('execCommand', { text: 'Find', cmd: 'find', foc: false, key: 'f' })
  .addItem('execCommand', { text: 'Find Next', cmd: 'findNext', key: 'n' })
  .addItem('execCommand', { text: 'Find Previous', cmd: 'findPrev', key: 'p' })
  .addItem('execCommand', { text: 'Replace', cmd: 'replace', foc: false, key: 'r' })
  .addItem('execCommand', { text: 'Replace All', cmd: 'replaceAll', foc: false, key: 'a' });

menuBar.addMenu('Options')
  .addItem('setOption', {
    text: 'Line Numbers',
    opt: 'lineNumbers',
    val: editor.getOption('lineNumbers')
  })
  .addItem('setOption', {
    text: 'Wrap Lines',
    opt: 'lineWrapping',
    val: editor.getOption('lineWrapping')
  })
  .addItem('setOption', {
    text: 'Highlight Brackets',
    opt: 'matchBrackets',
    val: editor.getOption('matchBrackets')
  })
  .addItem('setOption', {
    text: 'Lint Metadata',
    opt: 'lint',
    val: editor.getOption('lint')
  });

menuBar.addMenu('Addons')
  .addItem('execCommand', { text: 'Auto Complete', cmd: 'autocomplete' })
  .addItem('execCommand', { text: 'Find Bracket', cmd: 'goToBracket' });

rivets.bind(document.querySelector('menubar'), { menubar: menuBar });

editor.setOption('extraKeys',
	Object.assign({}, editor.getOption('extraKeys'), {
    ['Alt-F']: () => menuBar.showMenu('File'),
    ['Alt-E']: () => menuBar.showMenu('Edit'),
    ['Alt-S']: () => menuBar.showMenu('Search'),
    ['Alt-O']: () => menuBar.showMenu('Options'),
    ['Alt-A']: () => menuBar.showMenu('Addons')
  }));
