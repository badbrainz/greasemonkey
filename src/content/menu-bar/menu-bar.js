class Menu {
  constructor(name) {
    this.name = name;
    this.items = [];
    this.index = -1;
    this.opened = false;
  }

  addItem(str, exec) {
    let [text, cmd, key] = str.split(':');
    this.items.push({ text, cmd, key, exec });
    return this;
  }

  select(index) {
    this.index += index;
    if (this.index < 0) {
      this.index = this.items.length - 1;
    } else if (this.index >= this.items.length) {
      this.index = 0;
    }
  }

  selectByKey(key) {
    this.index = this.items.findIndex(i => i.key == key);
  }

  accept(index) {
    let item = this.items[index];
    if (item && item.exec) item.exec();
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
        this.select(1);
        break;
      case 'ArrowUp':
        this.select(-1);
        break;
      case 'Enter':
        this.accept(this.index);
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
    let i = this.index + index;
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
        this.select(-1);
        break;
      case 'ArrowRight':
        this.select(1);
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
