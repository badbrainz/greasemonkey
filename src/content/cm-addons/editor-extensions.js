CodeMirror.defineExtension('lookupKeyMapShortcut', function(cmd, map) {
  let key = Object.keys(map).find(k => map[k] == cmd);
  if (key) return key;
  if (map.fallthrough) {
    return this.lookupKeyMapShortcut(cmd, CodeMirror.keyMap[map.fallthrough]);
  }
  return '';
});

CodeMirror.defineExtension('lookupCommandKey', function(cmd) {
  let map = this.getOption('extraKeys');
  let sc = map && this.lookupKeyMapShortcut(cmd, map);
  if (sc) return sc;
  return this.lookupKeyMapShortcut(cmd,
    CodeMirror.keyMap[this.getOption('keyMap')]);
});

CodeMirror.defineExtension('toggleLintGutter', function(lint) {
  let gutters = this.getOption('gutters');
  let found = gutters.indexOf('CodeMirror-lint-markers');
  if (found == -1 && lint) {
    gutters = ['CodeMirror-lint-markers'].concat(gutters);
  } else if (found > -1 && !lint) {
    gutters = gutters.slice(0);
    gutters.splice(found, 1);
  }
  this.setOption('gutters', gutters);
});
