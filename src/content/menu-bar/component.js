rivets.formatters.args = function(fn, ...args) {
  return () => fn.apply(this, args);
};

rivets.formatters.ctx = function(fn) {
  return (...args) => fn.apply(this, args);
};

rivets.formatters.eq = function(a, b) {
  return a == b;
};

rivets.formatters.cond = function(cond, a, b) {
  return cond ? a : b;
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

rivets.binders['fa-*'] = function(el, val) {
  el.classList.toggle('fa-' + this.args[0], val);
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
        type="button"
        rv-each-menu="menubar.menus"
        rv-on-click="menubar.toggle | args index"
        rv-on-keydown="menubar.traverse | ctx"
        rv-tabindex="menu.opened | cond 0 -1"
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
            rv-on-click="menubar.current.accept | args index"
            rv-on-mouseover="menubar.current.select | args index"
            rv-class-divider="item.meta.type | eq 'divider'">
            <i class="fa fa-fw" rv-fa-check="item.data.val | eq true"></i>
            { item.data.text }
            <span class="keymap" rv-after="item.data.keymap"></span>
          </li>
        </ul>
      </div>`;
  }
};
