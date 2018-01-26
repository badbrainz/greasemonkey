setMenuShortcut('#file-save', 'save');
setMenuShortcut('#edit-undo', 'undo');
setMenuShortcut('#edit-redo', 'redo');
setMenuShortcut('#edit-indent-more', 'indentMore');
setMenuShortcut('#edit-indent-less', 'indentLess');
setMenuShortcut('#edit-indent-auto', 'indentAuto');
setMenuShortcut('#edit-delete-line', 'deleteLine');
setMenuShortcut('#edit-jump-to-line', 'jumpToLine');
setMenuShortcut('#edit-fold', 'fold');
setMenuShortcut('#edit-unfold', 'unfold');
setMenuShortcut('#edit-fold-all', 'foldAll');
setMenuShortcut('#edit-unfold-all', 'unfoldAll');
setMenuShortcut('#view-increase-font', 'increaseFontSize');
setMenuShortcut('#view-decrease-font', 'decreaseFontSize');
setMenuShortcut('#view-next-doc', 'viewNextDoc');
setMenuShortcut('#view-previous-doc', 'viewPreviousDoc');
setMenuShortcut('#search-find', 'find');
setMenuShortcut('#search-find-next', 'findNext');
setMenuShortcut('#search-find-prev', 'findPrev');
setMenuShortcut('#search-replace', 'replace');
setMenuShortcut('#search-replace-all', 'replaceAll');
setMenuShortcut('#addons-find-bracket', 'goToBracket');
setMenuShortcut('#addons-show-hints', 'autocomplete');

///////////////////////////////////////////////////////////////////////////////

// File
$q('#file-save').onclick = menuCommand('save');

// Edit
$q('#edit-undo').onclick = menuCommand('undo');
$q('#edit-redo').onclick = menuCommand('redo');
$q('#edit-indent-more').onclick = menuCommand('indentMore');
$q('#edit-indent-less').onclick = menuCommand('indentLess');
$q('#edit-indent-auto').onclick = menuCommand('indentAuto');
$q('#edit-delete-line').onclick = menuCommand('deleteLine');
$q('#edit-jump-to-line').onclick = menuCommand('jumpToLine', false);
$q('#edit-fold').onclick = menuCommand('fold');
$q('#edit-unfold').onclick = menuCommand('unfold');
$q('#edit-fold-all').onclick = menuCommand('foldAll');
$q('#edit-unfold-all').onclick = menuCommand('unfoldAll');

// View
$q('#view-increase-font').onclick = menuCommand('increaseFontSize');
$q('#view-decrease-font').onclick = menuCommand('decreaseFontSize');
$q('#view-next-doc').onclick = menuCommand('viewNextDoc');
$q('#view-previous-doc').onclick = menuCommand('viewPreviousDoc');

// Search
$q('#search-find').onclick = menuCommand('find', false);
$q('#search-find-next').onclick = menuCommand('findNext');
$q('#search-find-prev').onclick = menuCommand('findPrev');
$q('#search-replace').onclick = menuCommand('replace', false);
$q('#search-replace-all').onclick = menuCommand('replaceAll', false);

// Options
$q('#options-indent-with-tabs').addEventListener('change', event => {
  editor.setOption('indentWithTabs', true);
  editor.setOption('indentUnit', editor.getOption('tabSize'));
}, false);

$q('#options-indent-two-spaces').addEventListener('change', event => {
  editor.setOption('indentUnit', 2);
  editor.setOption('indentWithTabs', false);
}, false);

$q('#options-indent-four-spaces').addEventListener('change', event => {
  editor.setOption('indentUnit', 4);
  editor.setOption('indentWithTabs', false);
}, false);

$q('#options-line-wrap').addEventListener('change', event => {
  editor.setOption('lineWrapping', event.target.checked);
}, false);


$q('#options-highlight-brackets').addEventListener('change', event => {
  editor.setOption('matchBrackets', event.target.checked);
}, false);

$q('#options-linter').addEventListener('change', event => {
  let lint = event.target.checked;
  let gutters = editor.getOption('gutters');

  let found = gutters.indexOf('CodeMirror-lint-markers');
  if (found == -1 && lint) {
    gutters = ['CodeMirror-lint-markers'].concat(gutters);
  } else if (found > -1 && !lint) {
    gutters = gutters.slice(0);
    gutters.splice(found, 1);
  }

  editor.setOption('gutters', gutters);
  editor.setOption('lint', lint);
}, false);

$q('#options-autocomplete').addEventListener('change', event => {
  editor.setOption('autocomplete', event.target.checked);
}, false);

//Addons
$q('#addons-find-bracket').onclick = menuCommand('goToBracket');
$q('#addons-show-hints').onclick = menuCommand('autocomplete');

// Help
$q('#help-home-page').onclick = event => {
  chrome.tabs.create({
    'url': 'https://www.greasespot.net/',
    'active': true
  });
};

$q('#help-wiki').onclick = event => {
  chrome.tabs.create({
    'url': 'https://wiki.greasespot.net/',
    'active': true
  });
};

(function() {
  let tabs = editor.getOption('indentWithTabs');
  let unit = editor.getOption('indentUnit');
  $q('#options-indent-with-tabs').checked = tabs;
  $q('#options-indent-two-spaces').checked = !tabs && unit == 2;
  $q('#options-indent-four-spaces').checked = !tabs && unit == 4;
  $q('#options-line-wrap').checked = editor.getOption('lineWrapping');
  $q('#options-highlight-brackets').checked = editor.getOption('matchBrackets');
  $q('#options-linter').checked = editor.getOption('lint');
  $q('#options-autocomplete').checked = editor.getOption('autocomplete');
})();

///////////////////////////////////////////////////////////////////////////////

$q('#menus').addEventListener('keydown', onMenuEvent, true);
$q('#menus').addEventListener('click', onMenuEvent, true);
