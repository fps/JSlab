// code-textarea.js

const GRAMMAR = {
  brackets: [
    { open: '(', close: ')', type: 'bracket' },
    { open: '[', close: ']', type: 'bracket' },
    { open: '{', close: '}', type: 'bracket' }
  ],
  regions: [
    { id: 'comment-line', style: 'comment', start: '//', end: '\n', multiLine: false },
    { id: 'comment-block', style: 'comment', start: '/*', end: '*/', multiLine: true },
    { id: 'string-double', style: 'string', start: '"', end: '"', escape: '\\' },
    { id: 'string-single', style: 'string', start: "'", end: "'", escape: '\\' },
    { id: 'template-literal', style: 'string', start: '`', end: '`', escape: '\\', interpolationStart: '${', interpolationEnd: '}' }
  ],
  tokens: {
    keyword: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|await|async|try|catch|finally|throw|yield|in|of|delete|instanceof|typeof|void|with)\b/g,
    reserved: /\b(true|false|null|undefined|NaN)\b/g,
    number: /\b(\d+(\.\d*)?([eE][+-]?\d+)?|0x[0-9a-fA-F]+)\b/g
  }
};

const hasHighlightAPI = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';
const baseStyles = ['string', 'comment', 'error', 'keyword', 'reserved', 'number'];
const REFLECTED_ATTRIBUTES = ['dir', 'lang', 'autocapitalize', 'spellcheck', 'autocorrect', 'inputmode'];

let instanceCounter = 0;

class CodeTextarea extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.instanceId = ++instanceCounter;

    this._state = {
      pairLookup: new Map(),
      isBalanced: true,
      highlights: { bracket: [], base: new Map(), activePair: null },
      codeSegments: []
    };

    const style = document.createElement('style');
    const fauxBold = 'text-shadow: 0 0 0.5px currentColor;';

    style.textContent = `
      :host {
        display: block; width: 100%; border-radius: 4px;
        background: #B6CDD8;
        padding: 0;
        box-sizing: border-box; font-family: monospace;
        font-size: 14px; line-height: 1.4;
        color: #111;
        position: relative; min-height: 2.4em;
        border: 1px solid #8FAAB8;
        overflow: hidden;
      }
      .code-inner {
        min-height: 100%;
        padding: 8px 32px 8px 8px;
        box-sizing: border-box;
        display: block;
        width: 100%;
        outline: none;
        white-space: pre;
        overflow-x: auto;
        overflow-y: hidden;
      }
      .submit-btn {
        position: absolute; right: 12px; bottom: 8px;
        width: 1.6em; height: 1.6em; border-radius: 3px;
        border: 1px solid #777; background: #DDEEF5; color: #333;
        font-size: 12px; cursor: pointer; display: none;
        transition: border-color 0.15s, background 0.15s;
        padding: 0; margin: 0;
        z-index: 10;
      }
      .submit-btn:hover { background: #EEF8FC; }
      .submit-btn.ready {
        border-color: #080; box-shadow: 0 0 4px rgba(0, 128, 0, 0.5); background: #D0F0D0;
      }

      ::highlight(bracket0-${this.instanceId}) { color: #00008B; ${fauxBold} }
      ::highlight(bracket1-${this.instanceId}) { color: #006400; ${fauxBold} }
      ::highlight(bracket2-${this.instanceId}) { color: #8B0000; ${fauxBold} }
      ::highlight(activePair-${this.instanceId}) { background-color: rgba(255, 230, 0, 0.5); color: inherit; }
      ::highlight(error-${this.instanceId}) { background-color: rgba(255, 0, 0, 0.5); color: white; }
      ::highlight(string-${this.instanceId}) { color: #A31515; }
      ::highlight(comment-${this.instanceId}) { color: #40404080; }
      ::highlight(keyword-${this.instanceId}) { color: #0000FF; ${fauxBold} }
      ::highlight(reserved-${this.instanceId}) { color: #600060; }
      ::highlight(number-${this.instanceId}) { color: #007070; }
    `;

    this._inner = document.createElement('div');
    this._inner.className = 'code-inner';
    this._inner.contentEditable = 'plaintext-only';
    this._inner.spellcheck = false;

    this._textNode = document.createTextNode('');
    this._inner.appendChild(this._textNode);

    this._submitButton = document.createElement('button');
    this._submitButton.className = 'submit-btn';
    this._submitButton.title = 'Submit Code (Ctrl+Enter)';
    this._submitButton.textContent = '▶';

    this.shadowRoot.append(style, this._inner, this._submitButton);

    if (hasHighlightAPI) {
      for (let i = 0; i < 3; i++) {
        const name = `bracket${i}-${this.instanceId}`;
        const h = new Highlight();
        CSS.highlights.set(name, h);
        this._state.highlights.bracket.push(h);
      }
      baseStyles.forEach(style => {
        const name = `${style}-${this.instanceId}`;
        const h = new Highlight();
        CSS.highlights.set(name, h);
        this._state.highlights.base.set(style, h);
      });
      const activeName = `activePair-${this.instanceId}`;
      this._state.highlights.activePair = new Highlight();
      CSS.highlights.set(activeName, this._state.highlights.activePair);
    }

    this._onInput = this._onInput.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onSelectionChange = this._onSelectionChange.bind(this);
    this._onSubmitClick = this._onSubmitClick.bind(this);
  }

  static get observedAttributes() { return REFLECTED_ATTRIBUTES; }

  attributeChangedCallback(name, oldValue, newValue) {
    if (REFLECTED_ATTRIBUTES.includes(name)) {
      if (newValue === null) this._inner.removeAttribute(name);
      else this._inner.setAttribute(name, newValue);
    }
  }

  get _selection() {
    if (this.shadowRoot.getSelection) return this.shadowRoot.getSelection();
    return document.getSelection();
  }

  focus() { this._inner.focus(); }

  connectedCallback() {
    this._inner.addEventListener('input', this._onInput);
    this._inner.addEventListener('keydown', this._onKeyDown);
    this._submitButton.addEventListener('click', this._onSubmitClick);
    document.addEventListener('selectionchange', this._onSelectionChange);

    if (this.hasAttribute('value')) this.value = this.getAttribute('value');
    else {
      this._updateHighlights();
      this._updateHeight();
    }
  }

  disconnectedCallback() {
    this._inner.removeEventListener('input', this._onInput);
    this._inner.removeEventListener('keydown', this._onKeyDown);
    this._submitButton.removeEventListener('click', this._onSubmitClick);
    document.removeEventListener('selectionchange', this._onSelectionChange);

    if (hasHighlightAPI) {
      this._state.highlights.bracket.forEach((_, i) => CSS.highlights.delete(`bracket${i}-${this.instanceId}`));
      baseStyles.forEach(style => CSS.highlights.delete(`${style}-${this.instanceId}`));
      CSS.highlights.delete(`activePair-${this.instanceId}`);
    }
  }

  get value() { return this._textNode.data; }

  set value(v) {
    this._textNode.data = String(v);
    this._inner.innerHTML = '';
    this._inner.appendChild(this._textNode);
    this._updateHighlights();
    this._updateHeight();
    this._scrollToCursor();
  }

  _getCaretOffsets() {
    const sel = this._selection;
    if (!sel || !sel.rangeCount) return { start: 0, end: 0 };

    const r = sel.getRangeAt(0);
    if (!this._inner.contains(r.startContainer) || !this._inner.contains(r.endContainer)) return { start: 0, end: 0 };

    const a = document.createRange();
    a.setStart(this._inner, 0);
    a.setEnd(r.startContainer, r.startOffset);
    const start = a.toString().length;

    const b = document.createRange();
    b.setStart(this._inner, 0);
    b.setEnd(r.endContainer, r.endOffset);
    const end = b.toString().length;

    return { start, end };
  }

  _setCaretOffsets(start, end = start) {
    const sel = this._selection;
    if (!sel) return;

    const len = this._textNode.length;
    start = Math.max(0, Math.min(len, start));
    end = Math.max(0, Math.min(len, end));

    const r = document.createRange();
    r.setStart(this._textNode, start);
    r.setEnd(this._textNode, end);
    sel.removeAllRanges();
    sel.addRange(r);
  }

  _scrollToCursor() {
    const sel = this._selection;
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    let rect = range.getBoundingClientRect();

    // Some browsers return a 0-rect at end-of-text; this forces a measurable caret box.
    if (rect.left === 0 && rect.top === 0) {
      const span = document.createElement('span');
      span.appendChild(document.createTextNode('\u200b'));
      range.insertNode(span);
      rect = span.getBoundingClientRect();
      span.remove();
    }

    const containerRect = this._inner.getBoundingClientRect();
    const style = getComputedStyle(this);
    const em = parseFloat(style.fontSize) || 14;
    const buffer = 8 * em;

    const cursorLeft = rect.left - containerRect.left;
    const viewWidth = this._inner.clientWidth;
    const currentScroll = this._inner.scrollLeft;
    const absoluteCursorX = currentScroll + cursorLeft;

    if (absoluteCursorX < (viewWidth / 2)) {
      this._inner.scrollLeft = 0;
      return;
    }

    if (cursorLeft > viewWidth) this._inner.scrollLeft = absoluteCursorX - viewWidth + buffer;
    else if (cursorLeft < 0) this._inner.scrollLeft = absoluteCursorX - buffer;
  }

  _onInput() {
    const sel = this._selection;
    const { start, end } = this._getCaretOffsets();

    const text = this._inner.textContent || '';
    this._inner.innerHTML = '';
    this._textNode.data = text;
    this._inner.appendChild(this._textNode);

    if (sel) this._setCaretOffsets(start, end);

    this._updateHighlights();
    this._updateActivePair();
    this._updateHeight();
    requestAnimationFrame(() => this._scrollToCursor());
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }

  _onSelectionChange() {
    const sel = this._selection;
    if (sel && sel.anchorNode && this._inner.contains(sel.anchorNode)) {
      this._updateActivePair();
      requestAnimationFrame(() => this._scrollToCursor());
    } else if (this._state.highlights.activePair) {
      this._state.highlights.activePair.clear();
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this._fireSubmit('ctrl-enter');
      return;
    }

    if (e.key === 'Enter') {
      const text = this.value;
      const isOneLine = text.indexOf('\n') === -1;

      if (isOneLine && this._state.isBalanced && !e.shiftKey) {
        e.preventDefault();
        this._fireSubmit('enter');
      } else {
        e.preventDefault();
        this._insertNewlineWithIndent();
      }
      return;
    }

    if (e.key === '}') {
      e.preventDefault();
      this._insertClosingBrace();
    }
  }

  _onSubmitClick() { this._fireSubmit('button'); }

  _fireSubmit(source) {
    this.dispatchEvent(new CustomEvent('codesubmit', {
      bubbles: true, detail: { code: this.value, source }
    }));
  }

  _updateHeight() {
    const lines = this.value.split('\n').length;

    const cs = getComputedStyle(this._inner);
    const pt = parseFloat(cs.paddingTop) || 0;
    const pb = parseFloat(cs.paddingBottom) || 0;
    const fs = parseFloat(cs.fontSize) || 14;

    let lh = parseFloat(cs.lineHeight);
    if (!Number.isFinite(lh)) lh = fs * 1.4;

    const border = 2; // 1px top + 1px bottom on :host
    const height = Math.ceil(pt + pb + border + lh * Math.max(lines, 1));

    this.style.height = `${Math.max(height, Math.ceil(fs * 2.4))}px`;

    const showButton = lines > 1;
    this._submitButton.style.display = showButton ? 'block' : 'none';
  }

  _insertNewlineWithIndent() {
    const text = this.value;
    const sel = this._selection;
    const { start } = this._getCaretOffsets();
    if (!sel) return;

    const before = text.slice(0, start);
    const lineStart = before.lastIndexOf('\n') + 1;
    const currentLine = before.slice(lineStart);
    const indent = (currentLine.match(/^[ \t]*/) || [''])[0];
    const extra = currentLine.trim().endsWith('{') ? '  ' : '';

    const insert = '\n' + indent + extra;
    const newText = text.slice(0, start) + insert + text.slice(start);
    const newPos = start + insert.length;

    this.value = newText;
    this._setCaretOffsets(newPos);
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }

  _insertClosingBrace() {
    const text = this.value;
    const sel = this._selection;
    const { start } = this._getCaretOffsets();
    if (!sel) return;

    const before = text.slice(0, start);
    const lineStart = before.lastIndexOf('\n') + 1;
    const linePrefix = before.slice(lineStart);
    const isOnlyWhitespace = /^[ \t]*$/.test(linePrefix);

    let insertString = '}';
    let replaceStart = start;

    if (isOnlyWhitespace) {
      const matchIndex = this._robustFindOpenBrace(start);
      if (matchIndex !== -1) {
        const beforeMatch = text.slice(0, matchIndex);
        const matchLineStart = beforeMatch.lastIndexOf('\n') + 1;
        const matchLine = text.slice(matchLineStart, matchIndex);
        const matchIndent = (matchLine.match(/^[ \t]*/) || [''])[0];

        insertString = matchIndent + '}';
        replaceStart = lineStart;
      }
    }

    const newText = text.slice(0, replaceStart) + insertString + text.slice(start);
    const newPos = replaceStart + insertString.length;

    this.value = newText;
    this._setCaretOffsets(newPos);
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }

  _applyTokenHighlights(text, codeSegments) {
    const node = this._textNode;
    const segs = codeSegments || [];
    if (!segs.length) return;

    const within = (idx) => {
      // segments are non-overlapping and in order
      let lo = 0, hi = segs.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const [a, b] = segs[mid];
        if (idx < a) hi = mid - 1;
        else if (idx >= b) lo = mid + 1;
        else return true;
      }
      return false;
    };

    for (const [style, regex] of Object.entries(GRAMMAR.tokens)) {
      const highlight = this._state.highlights.base.get(style);
      if (!highlight) continue;

      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (!within(match.index)) continue;

        const range = new Range();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        highlight.add(range);
      }
    }
  }

  _updateHighlights() {
    if (!hasHighlightAPI) {
      this._state.isBalanced = true;
      return;
    }

    const text = this.value;
    const len = text.length;
    const node = this._textNode;

    this._state.highlights.bracket.forEach(h => h.clear());
    this._state.highlights.base.forEach(h => h.clear());
    if (this._state.highlights.activePair) this._state.highlights.activePair.clear();
    this._state.pairLookup.clear();
    this._state.codeSegments = [];

    const modeStack = [{ type: 'code' }];
    const bracketStack = [];
    const errorIndices = new Set();
    const matchAt = (str, idx) => text.startsWith(str, idx);

    const register = (idxA, lenA, idxB, lenB) => {
      this._state.pairLookup.set(idxA, { length: lenA, mateIndex: idxB, mateLength: lenB });
      this._state.pairLookup.set(idxB, { length: lenB, mateIndex: idxA, mateLength: lenA });
    };

    let codeSegStart = 0;
    const closeCodeSeg = (end) => {
      if (end > codeSegStart) this._state.codeSegments.push([codeSegStart, end]);
    };

    for (let i = 0; i < len; i++) {
      const currentMode = modeStack[modeStack.length - 1];
      const ch = text[i];

      if (currentMode.type === 'region') {
        const region = currentMode.def;
        const regionH = this._state.highlights.base.get(region.style);

        if (region.escape && ch === region.escape) { i++; continue; }

        if (region.interpolationStart && matchAt(region.interpolationStart, i)) {
          const segStart = currentMode.segmentStart;
          if (i > segStart) {
            const r = new Range();
            r.setStart(node, segStart);
            r.setEnd(node, i);
            if (regionH) regionH.add(r);
          }

          modeStack.push({ type: 'code', returnTo: region });
          closeCodeSeg(i + region.interpolationStart.length);
          codeSegStart = i + region.interpolationStart.length;
          i += region.interpolationStart.length - 1;
          continue;
        }

        if (matchAt(region.end, i)) {
          const startIdx = currentMode.start;
          const endIdx = i;
          const endLen = region.end.length;

          const r = new Range();
          r.setStart(node, startIdx);
          r.setEnd(node, endIdx + endLen);
          if (regionH) regionH.add(r);

          register(startIdx, region.start.length, endIdx, endLen);
          modeStack.pop();

          if (modeStack[modeStack.length - 1].type === 'code') {
            codeSegStart = endIdx + endLen;
          }

          i += endLen - 1;
          continue;
        }

        if (!region.multiLine && ch === '\n') {
          const r = new Range();
          r.setStart(node, currentMode.start);
          r.setEnd(node, i);
          if (regionH) regionH.add(r);
          modeStack.pop();

          if (modeStack[modeStack.length - 1].type === 'code') {
            codeSegStart = i;
          }

          i--;
          continue;
        }
      } else {
        if (currentMode.returnTo && matchAt(currentMode.returnTo.interpolationEnd, i)) {
          modeStack.pop();
          codeSegStart = i + currentMode.returnTo.interpolationEnd.length;
          continue;
        }

        if (/\s/.test(ch)) continue;

        let matchedRegion = null;
        for (const rDef of GRAMMAR.regions) {
          if (matchAt(rDef.start, i)) { matchedRegion = rDef; break; }
        }

        if (matchedRegion) {
          closeCodeSeg(i);
          modeStack.push({ type: 'region', def: matchedRegion, start: i, segmentStart: i + matchedRegion.start.length });
          i += matchedRegion.start.length - 1;
          continue;
        }

        const openB = GRAMMAR.brackets.find(b => b.open === ch);
        if (openB) {
          bracketStack.push({ char: ch, index: i, depth: bracketStack.length });
          continue;
        }

        const closeB = GRAMMAR.brackets.find(b => b.close === ch);
        if (closeB) {
          const top = bracketStack[bracketStack.length - 1];
          if (top && top.char === closeB.open) {
            bracketStack.pop();
            const group = top.depth % 3;
            const h = this._state.highlights.bracket[group];

            const r1 = new Range(); r1.setStart(node, top.index); r1.setEnd(node, top.index + 1); h.add(r1);
            const r2 = new Range(); r2.setStart(node, i); r2.setEnd(node, i + 1); h.add(r2);
            register(top.index, 1, i, 1);
          } else {
            errorIndices.add(i);
          }
          continue;
        }
      }
    }

    closeCodeSeg(len);

    const final = modeStack[modeStack.length - 1];
    if (final.type === 'region') {
      const regionH = this._state.highlights.base.get(final.def.style);
      const r = new Range();
      r.setStart(node, final.segmentStart);
      r.setEnd(node, len);
      if (regionH) regionH.add(r);
    }

    for (const item of bracketStack) errorIndices.add(item.index);

    const errH = this._state.highlights.base.get('error');
    if (errH) {
      for (const idx of errorIndices) {
        const r = new Range();
        r.setStart(node, idx);
        r.setEnd(node, idx + 1);
        errH.add(r);
      }
    }

    this._applyTokenHighlights(text, this._state.codeSegments);

    this._state.isBalanced = (errorIndices.size === 0) && (bracketStack.length === 0) && (modeStack.length === 1);
    this._submitButton.classList.toggle('ready', this._state.isBalanced);
  }

  _updateActivePair() {
    const activePairH = this._state.highlights.activePair;
    if (!activePairH) return;
    activePairH.clear();

    const sel = this._selection;
    if (!sel || !sel.rangeCount || !this._inner.contains(sel.anchorNode)) return;

    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.setStart(this._textNode, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const caret = preRange.toString().length;

    const node = this._textNode;
    const pairLookup = this._state.pairLookup;

    let match = pairLookup.get(caret);
    let matchIdx = caret;

    if (!match && caret > 0) {
      match = pairLookup.get(caret - 1);
      matchIdx = caret - 1;
    }

    if (match) {
      const r1 = new Range();
      r1.setStart(node, matchIdx);
      r1.setEnd(node, matchIdx + match.length);
      activePairH.add(r1);

      const r2 = new Range();
      r2.setStart(node, match.mateIndex);
      r2.setEnd(node, match.mateIndex + match.mateLength);
      activePairH.add(r2);
    }
  }

  _robustFindOpenBrace(limit) {
    const text = this.value;
    const modeStack = [{ type: 'code' }];
    const bracketStack = [];
    const matchAt = (str, idx) => text.startsWith(str, idx);

    for (let i = 0; i < limit; i++) {
      const currentMode = modeStack[modeStack.length - 1];
      const ch = text[i];

      if (currentMode.type === 'region') {
        const region = currentMode.def;
        if (region.escape && ch === region.escape) { i++; continue; }

        if (region.interpolationStart && matchAt(region.interpolationStart, i)) {
          modeStack.push({ type: 'code', returnTo: region });
          i += region.interpolationStart.length - 1;
          continue;
        }

        if (matchAt(region.end, i)) {
          modeStack.pop();
          i += region.end.length - 1;
          continue;
        }

        if (!region.multiLine && ch === '\n') {
          modeStack.pop();
          i--;
          continue;
        }
      } else {
        if (currentMode.returnTo && matchAt(currentMode.returnTo.interpolationEnd, i)) {
          modeStack.pop();
          continue;
        }

        if (/\s/.test(ch)) continue;

        let matchedRegion = null;
        for (const rDef of GRAMMAR.regions) {
          if (matchAt(rDef.start, i)) { matchedRegion = rDef; break; }
        }
        if (matchedRegion) {
          modeStack.push({ type: 'region', def: matchedRegion });
          i += matchedRegion.start.length - 1;
          continue;
        }

        const openB = GRAMMAR.brackets.find(b => b.open === ch);
        if (openB) { bracketStack.push({ char: ch, index: i }); continue; }

        const closeB = GRAMMAR.brackets.find(b => b.close === ch);
        if (closeB) {
          const top = bracketStack[bracketStack.length - 1];
          if (top && top.char === closeB.open) bracketStack.pop();
          continue;
        }
      }
    }

    if (bracketStack.length > 0) {
      const top = bracketStack[bracketStack.length - 1];
      if (top.char === '{') return top.index;
    }
    return -1;
  }
}

customElements.define('code-textarea', CodeTextarea);
