(function() {
  const keyMap = {
    'Tab': cm => {
      if (selectNextTabStop(cm).done) {
        unbindSnippet(cm);
        return CodeMirror.Pass;
      }
    },
    'Enter': unbindSnippet,
    'Esc': unbindSnippet
  };

  // Produces tab stops from text.
  // Original version https://github.com/atom/snippets
  // MIT license https://github.com/atom/snippets/blob/master/LICENSE.md
  function extractTabStops(bodyTree) {
    let tabStopIndexes = {};
    let bodyText = [];
    let row = 0, column = 0;
    let extractTabStops = bodyTree => {
      for (let segment of bodyTree) {
        if (segment.index != null) {
          let { index, content } = segment;
          if (index == 0) {
            index = Infinity;
          }
          let start = { line: row, ch: column };
          extractTabStops(content);
          let end = { line: row, ch: column };
          if (tabStopIndexes[index] == null) {
            tabStopIndexes[index] = [];
          }
          tabStopIndexes[index].push({ start, end });
        } else if (typeof segment == 'string') {
          bodyText.push(segment);
          let segmentLines = segment.split('\n');
          column += segmentLines.shift().length;
          let nextLine = null;
          while ((nextLine = segmentLines.shift()) != null) {
            row += 1;
            column = nextLine.length;
          }
        }
      }
    };
    extractTabStops(bodyTree);
    let tabStops = [];
    for (let index of Object.keys(tabStopIndexes).sort((a, b) => a - b)) {
      tabStops.push(tabStopIndexes[index]);
    }
    return {
      lineCount: row + 1,
      tabStops: tabStops,
      text: bodyText.join('')
    };
  }

  class TabStop {
    constructor(cm, start, end) {
      const options = { insertLeft: true, clearWhenEmpty: true };
      this.start = cm.setBookmark(start, options);
      this.end = cm.setBookmark(end, options);
    }
    clear() {
      this.start.clear();
      this.end.clear();
    }
    find() {
      const anchor = this.start.find();
      if (anchor) return { anchor, head: this.end.find() };
    }
  }

  function* tabStopGenerator(cm, bookmarks) {
    for (const marks of bookmarks) {
      const list = marks.map(m => m.find()).filter(Boolean);
      if (list.length) {
        cm.setSelections(list, 0);
        yield marks[0];
      }
    }
  }

  function* bookmarkGenerator(pos, tabStops) {
    const { line, ch } = pos;
    for (const stops of tabStops) {
      yield stops.map(s => {
        const offset = (line + s.start.line) == line ? ch : 0;
        return {
          anchor: CodeMirror.Pos(line + s.start.line, offset + s.start.ch),
          head: CodeMirror.Pos(line + s.end.line, offset + s.end.ch)
        };
      });
    }
  }

  function* rangeIterator(begin, end) {
    for (let i = begin; i < end; i++) yield i;
  }

  function selectNextTabStop(cm) {
    const current = cm.state.currentSnippet;
    const iter = current.tabs.next();
    current.primaryMarker = iter.value;
    return iter;
  }

  function isCursorAtBookmark(cm) {
    const bookmark = cm.state.currentSnippet.primaryMarker.find();
    if (!bookmark) return false;
    const cursor = cm.getCursor();
    return CodeMirror.cmpPos(cursor, bookmark.anchor) != -1 &&
           CodeMirror.cmpPos(cursor, bookmark.head) != 1;
  }

  function cursorHandler(cm) {
    if (!isCursorAtBookmark(cm)) unbindSnippet(cm);
  }

  function unbindSnippet(cm) {
    cm.state.currentSnippet.bookmarks.forEach(l => l.forEach(m => m.clear()));
    cm.off('cursorActivity', cursorHandler);
    cm.setCursor(cm.getCursor());
    cm.removeKeyMap(keyMap);
  }

  function hintReplacer(cm, range, snippet) {
    let parsed;
    try {
      parsed = window.tabstopParser.parse(snippet.text);
    } catch(e) {
      console.log(e);
      return;
    }

    parsed = extractTabStops(parsed);

    cm.operation(() => {
      if (cm.state.currentSnippet) unbindSnippet(cm);
      cm.state.currentSnippet = {};

      const bookmarks = [];
      cm.replaceRange(parsed.text, range.from, range.to);
      for (const marks of bookmarkGenerator(range.from, parsed.tabStops)) {
        bookmarks.push(marks.map(m => new TabStop(cm, m.anchor, m.head)));
      }
      cm.state.currentSnippet.tabs = tabStopGenerator(cm, bookmarks);
      cm.state.currentSnippet.bookmarks = bookmarks;

      if (parsed.lineCount > 1) {
        const line = range.from.line + 1;
        for (const n of rangeIterator(line, line + parsed.lineCount)) {
          cm.indentLine(n, null, true);
        }
      }

      if (!selectNextTabStop(cm).done) {
        cm.on('cursorActivity', cursorHandler);
        cm.addKeyMap(keyMap);
      }
    });
  }

  CodeMirror.registerGlobalHelper('hint', 'snippets', (mode, cm) => {
    return mode.name == 'javascript'
  }, function(cm, hintOptions) {
    const cur = cm.getCursor();
    const token = cm.getTokenAt(cur);
    if (token.type == 'comment' || token.type == 'string') return;

    const chars = token.string.slice(0, cur.ch - token.start);
    const regex = new RegExp((chars.length == 1 ? '^' : '') + chars, 'i');

    return {
      from: CodeMirror.Pos(cur.line, token.start),
      to: CodeMirror.Pos(cur.line, token.end),
      list: cm.state.snippets.map(({ prefix, name, data }) => {
        if (prefix.match(regex)) return {
          className: 'CodeMirror-hint-snippet',
          hint: hintReplacer,
          displayText: name,
          text: data
        }
      }).filter(Boolean)
    };
  });

  CodeMirror.defineOption('snippets', [], function(cm, val, old) {
    cm.state.snippets = val;
  });
})();
