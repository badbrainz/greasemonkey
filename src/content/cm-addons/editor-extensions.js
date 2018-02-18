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

