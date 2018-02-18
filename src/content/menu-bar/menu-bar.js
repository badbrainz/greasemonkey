class MenuItem {
	constructor(action, data, meta = {}) {
  	this.action = action;
    this.data = data;
    this.meta = meta;
  }

  accept() {
    document.dispatchEvent(new CustomEvent(this.action, {
      detail: this.data,
      cancelable: true,
      bubbles: true
    }));
  }
}

class Menu {
  constructor(name) {
    this.name = name;
    this.items = [];
    this.index = -1;
    this.opened = false;
  }

  addItem(action, data, meta) {
    this.items.push(new MenuItem(action, data, meta));
    return this;
  }

  addDivider() {
    let last = this.items[this.items.length - 1];
    if (last) last.meta.type = 'divider';
    return this;
  }

  select(index) {
    this.index = index;
    if (this.index < 0) {
      this.index = this.items.length - 1;
    } else if (this.index >= this.items.length) {
      this.index = 0;
    }
  }

  selectByKey(key) {
    this.index = this.items.findIndex(i => {
      let index = i.data.text.indexOf('&');
      if (index != -1) {
        return i.data.text[index + 1].toLowerCase() == key;
      }
    });
  }

  accept(index) {
  	let item = this.items[index];
    if (item) item.accept();
  }

  open() {
    this.opened = true;
  }

  close() {
    this.opened = false;
    this.index = -1;
  }

  traverse(event) {
    switch (event.key) {
      case 'ArrowDown':
        this.select(this.index + 1);
        break;
      case 'ArrowUp':
        this.select(this.index - 1);
        break;
      case 'Enter':
        this.accept(this.index);
        event.preventDefault();
        break;
      case 'Tab':
        event.preventDefault();
        break;
      default:
        this.selectByKey(event.key);
        if (this.index != -1) {
          this.accept(this.index);
          event.preventDefault();
        }
        return;
    }
  }
}

class MenuBar {
  constructor() {
    this.menus = [];
    this.index = -1;
    this.current = null;
  }

  addMenu(name) {
    this.menus.push(new Menu(name));
    return this.menus[this.menus.length - 1];
  }

  showMenu(name) {
    let index = this.menus.findIndex(m => m.name == name);
    if (index != this.index) this.toggle(index);
  }

  select(index) {
    let i = index;
    if (i < 0) i = this.menus.length - 1;
    if (i >= this.menus.length) i = 0;
    this.toggle(i);
  }

  toggle(index) {
    if (this.current) this.current.close();
    this.index = this.current === this.menus[index] ? -1 : index;
    this.current = this.menus[this.index];
    if (this.current) this.current.open();
  }

  traverse(event) {
    if (this.current) {
      this.current.traverse(event);
    }

    if (event.defaultPrevented) {
      this.toggle(-1);
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        this.select(this.index - 1);
        break;
      case 'ArrowRight':
        this.select(this.index + 1);
        break;
      case 'Escape':
        this.toggle(-1);
        break;
      default:
        return;
    }

    event.preventDefault();
  }
}
