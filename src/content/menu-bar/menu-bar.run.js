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

editor.setOption('extraKeys',
	Object.assign({}, editor.getOption('extraKeys'), {
    ['Alt-F']: () => menuBar.showMenu('File'),
    ['Alt-E']: () => menuBar.showMenu('Edit'),
    ['Alt-S']: () => menuBar.showMenu('Search'),
    ['Alt-A']: () => menuBar.showMenu('Addons')
  }));
