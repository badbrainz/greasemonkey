function lookupCommandKey(cmd, map) {
  let key = Object.keys(map).find(k => map[k] == cmd);
  if (key) return key;
  if (map.fallthrough)
    return lookupCommandKey(cmd, CodeMirror.keyMap[map.fallthrough]);
  return '';
}

rivets.formatters.keymap = function(cmd) {
  let map = editor.getOption('extraKeys');
  let key = map && lookupCommandKey(cmd, map);
  if (!key) {
    map = CodeMirror.keyMap[editor.getOption('keyMap')];
    key = lookupCommandKey(cmd, map);
  }
  return key;
};

rivets.formatters.args = function(fn, ...args) {
  return () => fn.apply(this, args);
};

rivets.formatters.ctx = function(fn) {
  return (...args) => fn.apply(this, args);
};

rivets.formatters.eq = function(a, b) {
  return a == b;
};

rivets.binders.focus = function(el, value) {
  if (el.classList.toggle('focused', value)) el.focus();
  else el.blur();
};

rivets.binders['bottom-left'] = function(el, target) {
  let { left, bottom } = target.getBoundingClientRect();
  el.style.left = left + 'px';
  el.style.top = bottom + 'px';
};

rivets.components.menubar = {
  initialize: function(el, attrs) {
    return {
      menubar: attrs.menus,
      toggled: function() {
        return el.children[this.menubar.index];
      }
    };
  },

  template: function() {
    return `
      <button
        rv-each-menu="menubar.menus"
        rv-on-click="menubar.toggle | args index"
        rv-on-keydown="menubar.traverse | ctx"
        rv-focus="menu.opened"
        rv-text="menu.name">
      </button>
      <div
        class="trigger"
        rv-if="menubar.current"
        rv-on-click="menubar.toggle | args -1">
        <ul rv-bottom-left="toggled < menubar.current | call">
          <li
            rv-each-item="menubar.current.items"
            rv-class-selected="menubar.current.index | eq index"
            rv-on-click="menubar.current.accept | args index">
            { item.text } <span>{ item.cmd | keymap }</span>
          </li>
        </ul>
      </div>`;
  }
};
