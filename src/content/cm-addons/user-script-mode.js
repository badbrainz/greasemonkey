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

CodeMirror.defineMIME('text/x-userscript', 'userscript');
