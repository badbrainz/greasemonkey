'use strict';
(function() {
  const greasemonkeyKeywords = (
    'description include exclude grant icon match name ' +
    'namespace noframes require resource run-at version').split(' ');

  const keywordProps = {
     'run-at': 'start end idle'.split(' ').map(s => 'document-' + s),
     'grant': ('deleteValue getValue listValues setValue ' +
               'getResourceUrl notification openInTab setClipboard ' +
               'xmlHttpRequest').split(' ')
               .map(s => 'GM.' + s).concat('unsafeWindow', 'none')
   };

  // Metablock tokenizer - simple mode
  CodeMirror.defineMode('metablock', function(config, parserConfig) {
    return CodeMirror.simpleMode(config, {
      start: [
        {regex: '// ', sol: true, next: 'keyword'},
        {regex: /.*/}
      ],
      keyword: [
        {token: 'keyword', regex: /@[a-zA-Z-]*/, next: 'variable'},
        {token: null, next: 'start'}
      ],
      variable: [
        {token: [null, 'variable'], regex: /^(\s+)(\S+(?:\s+\S+)*)/},
        {token: null, next: 'start'}
      ]
    });
  });

  // UserScript syntax highlighter - multiplexed (outer: js, inner: metablock)
  CodeMirror.defineMode('userscript', function(conf, parserConfig) {
    return CodeMirror.multiplexingMode(CodeMirror.getMode(conf, 'javascript'), {
      open: '// ==UserScript==',
      close: '// ==/UserScript==',
      mode: CodeMirror.getMode(conf, 'metablock'),
      delimStyle: 'comment',
      innerStyle: 'comment'
    });
  });

  // Metablock hint helper
  CodeMirror.registerHelper('hint', 'metablock', function(cm, options) {
    let cur = cm.getCursor(), token = cm.getTokenAt(cur);
    if (token.type == 'comment') return;
    let inner = CodeMirror.innerMode(cm.getMode(), token.state);
    if (inner.mode.name != 'metablock') return;

    let words = [];
    let start = token.start;
    let chars = token.string.slice(0, cur.ch - token.start);

    if (token.type.includes('keyword')) {
      words = greasemonkeyKeywords;
      chars = chars.slice(1);
      start += 1;
    } else if (token.type.includes('variable')) {
      let kwd = cm.getTokenAt(CodeMirror.Pos(cur.line, 4));
      kwd = kwd.string.slice(1);
      words = keywordProps[kwd];
    }

    const regex = new RegExp((chars.length == 1 ? '^' : '') + chars, 'i');

    return {
      list: words.filter(s => s.match(regex)),
      from: CodeMirror.Pos(cur.line, start),
      to: CodeMirror.Pos(cur.line, token.end)
    };
  });

  CodeMirror.defineMIME('text/x-userscript', 'userscript');
})();
