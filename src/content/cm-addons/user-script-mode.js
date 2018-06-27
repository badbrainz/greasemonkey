'use strict';

// Metablock tokenizer - simple mode
CodeMirror.defineMode('metablock', function(config, parserConfig) {
  return CodeMirror.simpleMode(config, {
    start: [
      {regex: '// ', sol: true, next: 'keyword'},
      {regex: /.*/}
    ],
    keyword: [
      {token: 'keyword', regex: /@[a-z-]*/, next: 'variable'},
      {token: null, next: 'start'}
    ],
    variable: [
      {token: [null, 'variable'], regex: /^(\s+)(\S+(?:\s+\S+)*)/},
      {token: null, next: 'start'}
    ]
  });
});

// UserScript syntax highlighter - multiplexed (outer: js, inner: metablock)
CodeMirror.defineMode('userscript', function(config, parserConfig) {
  return CodeMirror.multiplexingMode(CodeMirror.getMode(config, 'javascript'), {
    open: '// ==UserScript==',
    close: '// ==/UserScript==',
    mode: CodeMirror.getMode(config, 'metablock'),
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

  let words, prefix, start = token.start;
  if (token.type.includes('keyword') && options.metaKeywords) {
    words = options.metaKeywords;
    prefix = token.string.slice(1, cur.ch - start);
    start += 1;
  } else if (token.type.includes('variable') && options.metaVariables) {
    let kwd = cm.getTokenAt(CodeMirror.Pos(cur.line, 4));
    kwd = kwd.string.slice(1);
    words = options.metaVariables[kwd];
    prefix = token.string.slice(0, cur.ch - start);
  }
  return {
    list: Array.isArray(words) ? words.filter(s => s.startsWith(prefix)) : [],
    from: CodeMirror.Pos(cur.line, start),
    to: CodeMirror.Pos(cur.line, token.end)
  };
});

CodeMirror.defineMIME('text/x-userscript', 'userscript');
