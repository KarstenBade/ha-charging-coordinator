/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const J = globalThis, de = J.ShadowRoot && (J.ShadyCSS === void 0 || J.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, pe = Symbol(), ge = /* @__PURE__ */ new WeakMap();
let Ne = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== pe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (de && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = ge.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && ge.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const De = (r) => new Ne(typeof r == "string" ? r : r + "", void 0, pe), Fe = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce((i, s, n) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + r[n + 1], r[0]);
  return new Ne(t, r, pe);
}, Be = (r, e) => {
  if (de) r.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = J.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, r.appendChild(i);
  }
}, ve = de ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return De(t);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Ve, defineProperty: je, getOwnPropertyDescriptor: We, getOwnPropertyNames: qe, getOwnPropertySymbols: Ge, getPrototypeOf: Ke } = Object, x = globalThis, _e = x.trustedTypes, Ze = _e ? _e.emptyScript : "", se = x.reactiveElementPolyfillSupport, V = (r, e) => r, ce = { toAttribute(r, e) {
  switch (e) {
    case Boolean:
      r = r ? Ze : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, e) {
  let t = r;
  switch (e) {
    case Boolean:
      t = r !== null;
      break;
    case Number:
      t = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(r);
      } catch {
        t = null;
      }
  }
  return t;
} }, He = (r, e) => !Ve(r, e), ye = { attribute: !0, type: String, converter: ce, reflect: !1, useDefault: !1, hasChanged: He };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), x.litPropertyMetadata ?? (x.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let R = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = ye) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && je(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: n } = We(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: s, set(o) {
      const c = s == null ? void 0 : s.call(this);
      n == null || n.call(this, o), this.requestUpdate(e, c, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ye;
  }
  static _$Ei() {
    if (this.hasOwnProperty(V("elementProperties"))) return;
    const e = Ke(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(V("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(V("properties"))) {
      const t = this.properties, i = [...qe(t), ...Ge(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, s] of t) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const s = this._$Eu(t, i);
      s !== void 0 && this._$Eh.set(s, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const s of i) t.unshift(ve(s));
    } else e !== void 0 && t.push(ve(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Be(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostConnected) == null ? void 0 : i.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostDisconnected) == null ? void 0 : i.call(t);
    });
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    var n;
    const i = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, i);
    if (s !== void 0 && i.reflect === !0) {
      const o = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : ce).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var n, o;
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const c = i.getPropertyOptions(s), a = typeof c.converter == "function" ? { fromAttribute: c.converter } : ((n = c.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? c.converter : ce;
      this._$Em = s;
      const h = a.fromAttribute(t, c.type);
      this[s] = h ?? ((o = this._$Ej) == null ? void 0 : o.get(s)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, n) {
    var o;
    if (e !== void 0) {
      const c = this.constructor;
      if (s === !1 && (n = this[e]), i ?? (i = c.getPropertyOptions(e)), !((i.hasChanged ?? He)(n, t) || i.useDefault && i.reflect && n === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(c._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: n }, o) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), n !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, o] of this._$Ep) this[n] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [n, o] of s) {
        const { wrapped: c } = o, a = this[n];
        c !== !0 || this._$AL.has(n) || a === void 0 || this.C(n, void 0, o, a);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach((s) => {
        var n;
        return (n = s.hostUpdate) == null ? void 0 : n.call(s);
      }), this.update(t)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((i) => {
      var s;
      return (s = i.hostUpdated) == null ? void 0 : s.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
R.elementStyles = [], R.shadowRootOptions = { mode: "open" }, R[V("elementProperties")] = /* @__PURE__ */ new Map(), R[V("finalized")] = /* @__PURE__ */ new Map(), se == null || se({ ReactiveElement: R }), (x.reactiveElementVersions ?? (x.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const j = globalThis, be = (r) => r, Y = j.trustedTypes, xe = Y ? Y.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, Ue = "$lit$", b = `lit$${Math.random().toFixed(9).slice(2)}$`, Re = "?" + b, Je = `<${Re}>`, M = document, W = () => M.createComment(""), q = (r) => r === null || typeof r != "object" && typeof r != "function", ue = Array.isArray, Xe = (r) => ue(r) || typeof (r == null ? void 0 : r[Symbol.iterator]) == "function", ne = `[ 	
\f\r]`, L = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, we = /-->/g, Ae = />/g, S = RegExp(`>|${ne}(?:([^\\s"'>=/]+)(${ne}*=${ne}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ee = /'/g, Se = /"/g, Te = /^(?:script|style|textarea|title)$/i, ze = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), v = ze(1), O = ze(2), z = Symbol.for("lit-noChange"), p = Symbol.for("lit-nothing"), Ce = /* @__PURE__ */ new WeakMap(), P = M.createTreeWalker(M, 129);
function Ie(r, e) {
  if (!ue(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return xe !== void 0 ? xe.createHTML(e) : e;
}
const Ye = (r, e) => {
  const t = r.length - 1, i = [];
  let s, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = L;
  for (let c = 0; c < t; c++) {
    const a = r[c];
    let h, d, l = -1, f = 0;
    for (; f < a.length && (o.lastIndex = f, d = o.exec(a), d !== null); ) f = o.lastIndex, o === L ? d[1] === "!--" ? o = we : d[1] !== void 0 ? o = Ae : d[2] !== void 0 ? (Te.test(d[2]) && (s = RegExp("</" + d[2], "g")), o = S) : d[3] !== void 0 && (o = S) : o === S ? d[0] === ">" ? (o = s ?? L, l = -1) : d[1] === void 0 ? l = -2 : (l = o.lastIndex - d[2].length, h = d[1], o = d[3] === void 0 ? S : d[3] === '"' ? Se : Ee) : o === Se || o === Ee ? o = S : o === we || o === Ae ? o = L : (o = S, s = void 0);
    const g = o === S && r[c + 1].startsWith("/>") ? " " : "";
    n += o === L ? a + Je : l >= 0 ? (i.push(h), a.slice(0, l) + Ue + a.slice(l) + b + g) : a + b + (l === -2 ? c : g);
  }
  return [Ie(r, n + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class G {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let n = 0, o = 0;
    const c = e.length - 1, a = this.parts, [h, d] = Ye(e, t);
    if (this.el = G.createElement(h, i), P.currentNode = this.el.content, t === 2 || t === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (s = P.nextNode()) !== null && a.length < c; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const l of s.getAttributeNames()) if (l.endsWith(Ue)) {
          const f = d[o++], g = s.getAttribute(l).split(b), m = /([.?@])?(.*)/.exec(f);
          a.push({ type: 1, index: n, name: m[2], strings: g, ctor: m[1] === "." ? et : m[1] === "?" ? tt : m[1] === "@" ? it : ee }), s.removeAttribute(l);
        } else l.startsWith(b) && (a.push({ type: 6, index: n }), s.removeAttribute(l));
        if (Te.test(s.tagName)) {
          const l = s.textContent.split(b), f = l.length - 1;
          if (f > 0) {
            s.textContent = Y ? Y.emptyScript : "";
            for (let g = 0; g < f; g++) s.append(l[g], W()), P.nextNode(), a.push({ type: 2, index: ++n });
            s.append(l[f], W());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Re) a.push({ type: 2, index: n });
      else {
        let l = -1;
        for (; (l = s.data.indexOf(b, l + 1)) !== -1; ) a.push({ type: 7, index: n }), l += b.length - 1;
      }
      n++;
    }
  }
  static createElement(e, t) {
    const i = M.createElement("template");
    return i.innerHTML = e, i;
  }
}
function I(r, e, t = r, i) {
  var o, c;
  if (e === z) return e;
  let s = i !== void 0 ? (o = t._$Co) == null ? void 0 : o[i] : t._$Cl;
  const n = q(e) ? void 0 : e._$litDirective$;
  return (s == null ? void 0 : s.constructor) !== n && ((c = s == null ? void 0 : s._$AO) == null || c.call(s, !1), n === void 0 ? s = void 0 : (s = new n(r), s._$AT(r, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = s : t._$Cl = s), s !== void 0 && (e = I(r, s._$AS(r, e.values), s, i)), e;
}
class Qe {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, s = ((e == null ? void 0 : e.creationScope) ?? M).importNode(t, !0);
    P.currentNode = s;
    let n = P.nextNode(), o = 0, c = 0, a = i[0];
    for (; a !== void 0; ) {
      if (o === a.index) {
        let h;
        a.type === 2 ? h = new K(n, n.nextSibling, this, e) : a.type === 1 ? h = new a.ctor(n, a.name, a.strings, this, e) : a.type === 6 && (h = new st(n, this, e)), this._$AV.push(h), a = i[++c];
      }
      o !== (a == null ? void 0 : a.index) && (n = P.nextNode(), o++);
    }
    return P.currentNode = M, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class K {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = p, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = (s == null ? void 0 : s.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = I(this, e, t), q(e) ? e === p || e == null || e === "" ? (this._$AH !== p && this._$AR(), this._$AH = p) : e !== this._$AH && e !== z && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Xe(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== p && q(this._$AH) ? this._$AA.nextSibling.data = e : this.T(M.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var n;
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = G.createElement(Ie(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === s) this._$AH.p(t);
    else {
      const o = new Qe(s, this), c = o.u(this.options);
      o.p(t), this.T(c), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Ce.get(e.strings);
    return t === void 0 && Ce.set(e.strings, t = new G(e)), t;
  }
  k(e) {
    ue(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const n of e) s === t.length ? t.push(i = new K(this.O(W()), this.O(W()), this, this.options)) : i = t[s], i._$AI(n), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e !== this._$AB; ) {
      const s = be(e).nextSibling;
      be(e).remove(), e = s;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class ee {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, n) {
    this.type = 1, this._$AH = p, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = p;
  }
  _$AI(e, t = this, i, s) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) e = I(this, e, t, 0), o = !q(e) || e !== this._$AH && e !== z, o && (this._$AH = e);
    else {
      const c = e;
      let a, h;
      for (e = n[0], a = 0; a < n.length - 1; a++) h = I(this, c[i + a], t, a), h === z && (h = this._$AH[a]), o || (o = !q(h) || h !== this._$AH[a]), h === p ? e = p : e !== p && (e += (h ?? "") + n[a + 1]), this._$AH[a] = h;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === p ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class et extends ee {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === p ? void 0 : e;
  }
}
class tt extends ee {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== p);
  }
}
class it extends ee {
  constructor(e, t, i, s, n) {
    super(e, t, i, s, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = I(this, e, t, 0) ?? p) === z) return;
    const i = this._$AH, s = e === p && i !== p || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, n = e !== p && (i === p || s);
    s && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class st {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    I(this, e);
  }
}
const oe = j.litHtmlPolyfillSupport;
oe == null || oe(G, K), (j.litHtmlVersions ?? (j.litHtmlVersions = [])).push("3.3.3");
const nt = (r, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const n = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = s = new K(e.insertBefore(W(), n), n, void 0, t ?? {});
  }
  return s._$AI(r), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const k = globalThis;
class T extends R {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = nt(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return z;
  }
}
var Oe;
T._$litElement$ = !0, T.finalized = !0, (Oe = k.litElementHydrateSupport) == null || Oe.call(k, { LitElement: T });
const re = k.litElementPolyfillSupport;
re == null || re({ LitElement: T });
(k.litElementVersions ?? (k.litElementVersions = [])).push("4.2.2");
const Pe = [
  { value: "off", label: "Off", icon: "mdi:power" },
  { value: "pv", label: "PV", icon: "mdi:solar-power" },
  { value: "pv_grid", label: "PV + grid", icon: "mdi:transmission-tower-import" },
  { value: "now", label: "Now", icon: "mdi:lightning-bolt" }
], ke = [
  { value: "auto", label: "Auto", icon: "mdi:sine-wave" },
  { value: "1p", label: "1 phase", icon: "mdi:numeric-1-circle-outline" },
  { value: "3p", label: "3 phases", icon: "mdi:numeric-3-circle-outline" }
];
function u(r) {
  if (!r) return;
  const e = Number(r.state);
  return Number.isFinite(e) ? e : void 0;
}
function N(r) {
  return r === void 0 ? "–" : Math.abs(r) >= 1e3 ? `${(r / 1e3).toFixed(1)} kW` : `${Math.round(r)} W`;
}
function Z(r) {
  if (r === void 0) return "";
  const e = Math.max(0, Math.round(r));
  return e >= 60 ? `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")} min` : `${e} s`;
}
function ot(r) {
  return r && r[0].toUpperCase() + r.slice(1);
}
const D = 320, F = 300, C = 24, H = { x: 160, y: 122 }, ae = {
  pv: { x: 160, y: 36 },
  grid: { x: 44, y: 122 },
  home: { x: 276, y: 122 },
  battery: { x: 84, y: 206 },
  charger: { x: 236, y: 206 }
}, $ = {
  pv: "var(--energy-solar-color, #ff9800)",
  gridIn: "var(--energy-grid-consumption-color, #488fc2)",
  gridOut: "var(--energy-grid-return-color, #8353d1)",
  batteryOut: "var(--energy-battery-out-color, #4db6ac)",
  batteryIn: "var(--energy-battery-in-color, #f06292)",
  home: "var(--secondary-text-color, #727272)",
  charger: "var(--success-color, #43a047)",
  idle: "var(--divider-color, #e0e0e0)",
  hold: "var(--warning-color, #ffa600)"
}, B = 30;
function rt(r) {
  return Math.min(6, Math.max(0.9, 4e3 / (r + 400)));
}
function U(r, e) {
  return `${r / e * 100}%`;
}
const Q = class Q extends T {
  constructor() {
    var e;
    super(...arguments), this._menu = null, this._menuPos = { left: 16, top: 56 }, this._reducedMotion = ((e = window.matchMedia) == null ? void 0 : e.call(window, "(prefers-reduced-motion: reduce)").matches) ?? !1;
  }
  setConfig(e) {
    if (e.vehicles !== void 0 && !Array.isArray(e.vehicles))
      throw new Error("vehicles must be a list of {name, soc}");
    this._config = { prefix: "charging_coordinator", ...e };
  }
  getCardSize() {
    return 8;
  }
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }
  static getStubConfig() {
    return { vehicles: [] };
  }
  static getConfigElement() {
    return document.createElement("charging-coordinator-card-editor");
  }
  entity(e, t) {
    var i, s;
    return (s = this.hass) == null ? void 0 : s.states[`${e}.${(i = this._config) == null ? void 0 : i.prefix}_${t}`];
  }
  async select(e, t) {
    var i, s;
    this._menu = null, await ((s = this.hass) == null ? void 0 : s.callService("select", "select_option", {
      entity_id: `select.${(i = this._config) == null ? void 0 : i.prefix}_${e}`,
      option: t
    }));
  }
  // --- render ---------------------------------------------------------------
  render() {
    var o;
    if (!this.hass || !this._config) return p;
    const e = this.entity("sensor", "status");
    if (!e)
      return v`<ha-card>
        <div class="warning">
          Charging Coordinator entities not found (prefix "${this._config.prefix}").
        </div>
      </ha-card>`;
    const t = ((o = this.entity("switch", "active_control")) == null ? void 0 : o.state) === "on", i = Pe.find((c) => {
      var a;
      return c.value === ((a = this.entity("select", "charge_mode")) == null ? void 0 : a.state);
    }), s = ke.find(
      (c) => {
        var a;
        return c.value === ((a = this.entity("select", "phase_mode")) == null ? void 0 : a.state);
      }
    ), n = u(this.entity("sensor", "target_phases"));
    return v`
      <ha-card>
        ${this._config.title ? v`<div class="title">${this._config.title}</div>` : p}
        <div class="top">
          <div class="chips">
            ${this.renderChip("mode", (i == null ? void 0 : i.icon) ?? "mdi:help", (i == null ? void 0 : i.label) ?? "–", "Charge mode")}
            ${this.renderChip(
      "phase",
      (s == null ? void 0 : s.icon) ?? "mdi:sine-wave",
      (s == null ? void 0 : s.value) === "auto" && n ? `Auto · ${n}p` : (s == null ? void 0 : s.label) ?? "–",
      "Phases"
    )}
          </div>
          <span
            class="badge ${t ? "active" : "shadow"}"
            title=${t ? "The coordinator controls the charger and battery" : "Shadow mode: decisions are computed, nothing is written"}
          >
            <ha-icon .icon=${t ? "mdi:check-circle" : "mdi:eye-outline"}></ha-icon>
            ${t ? "Active" : "Shadow"}
          </span>
        </div>
        ${this.renderMenu()} ${this.renderHeadline(e, i == null ? void 0 : i.value)} ${this.renderFlow()}
        ${this.renderFacts(e)}
      </ha-card>
    `;
  }
  renderChip(e, t, i, s) {
    const n = this._menu === e;
    return v`
      <button
        class="chip ${n ? "open" : ""}"
        title=${s}
        aria-haspopup="menu"
        aria-expanded=${n ? "true" : "false"}
        @click=${(o) => {
      const c = o.currentTarget;
      this._menuPos = { left: c.offsetLeft, top: c.offsetTop + c.offsetHeight + 4 }, this._menu = n ? null : e;
    }}
      >
        <ha-icon .icon=${t}></ha-icon>
        <span>${i}</span>
        <ha-icon class="chevron" .icon=${"mdi:chevron-down"}></ha-icon>
      </button>
    `;
  }
  renderMenu() {
    var n;
    if (!this._menu) return p;
    const e = this._menu, t = e === "mode" ? Pe : ke, i = e === "mode" ? "charge_mode" : "phase_mode", s = (n = this.entity("select", i)) == null ? void 0 : n.state;
    return v`
      <div class="scrim" @click=${() => this._menu = null}></div>
      <div
        class="menu"
        role="menu"
        style="left: ${this._menuPos.left}px; top: ${this._menuPos.top}px"
        @keydown=${(o) => {
      o.key === "Escape" && (this._menu = null);
    }}
      >
        ${t.map(
      (o) => v`
            <button
              role="menuitemradio"
              aria-checked=${o.value === s ? "true" : "false"}
              class=${o.value === s ? "selected" : ""}
              @click=${() => this.select(i, o.value)}
            >
              <ha-icon .icon=${o.icon}></ha-icon>
              <span>${o.label}</span>
              ${o.value === s ? v`<ha-icon class="check" .icon=${"mdi:check"}></ha-icon>` : p}
            </button>
          `
    )}
      </div>
    `;
  }
  updated() {
    var e;
    if (this._menu) {
      const t = this.renderRoot.querySelector(
        ".menu button.selected, .menu button"
      );
      t && !((e = this.renderRoot.querySelector(".menu")) != null && e.contains(document.activeElement)) && t.focus();
    }
  }
  renderHeadline(e, t) {
    var w, A;
    const i = (w = this.entity("binary_sensor", "vehicle_connected")) == null ? void 0 : w.state, s = ((A = this.entity("binary_sensor", "target_enabled")) == null ? void 0 : A.state) === "on", n = u(this.entity("sensor", "charger_power")), o = u(this.entity("sensor", "target_current")), c = u(this.entity("sensor", "target_phases")), a = u(this.entity("sensor", "grid_power")) ?? 0, h = u(this.entity("sensor", "battery_power")) ?? 0, d = (u(this.entity("sensor", "pv_dc_power")) ?? 0) + (u(this.entity("sensor", "pv_inverter_power")) ?? 0), l = e.state, f = l.indexOf(": "), g = ot(f >= 0 ? l.slice(f + 2) : l);
    let m, _ = "", y = "";
    if (i === void 0 || i === "unknown" || i === "unavailable")
      m = "Waiting for charger data", y = "muted";
    else if (i === "off")
      m = "No vehicle connected", _ = t === "off" ? "Charging is off" : "", y = "muted";
    else if (t === "off")
      m = "Charging off", y = "muted";
    else if (s && (n ?? 0) > 100) {
      const E = n ?? 0, te = a + d + h - E, ie = Math.min(E, Math.max(0, d - te)), $e = Math.min(E - ie, Math.max(0, a)), Le = E - ie - $e, me = [
        ie > 200 ? "PV" : "",
        $e > 200 ? "grid" : "",
        Le > 200 && h > 200 ? "battery" : ""
      ].filter(Boolean);
      m = `Charging · ${N(n)}`, _ = [
        c && o ? `${c}p · ${o} A` : "",
        me.length ? `from ${me.join(" + ")}` : ""
      ].filter(Boolean).join(" · "), y = "charging";
    } else s ? (m = "Ready", _ = "Charging released, the vehicle is not drawing power") : (m = "Paused", _ = /^(enabling|disabling) in /i.test(g) ? "" : g);
    return v`
      <div class="headline ${y}">
        <div class="state">${m}</div>
        ${_ ? v`<div class="sub">${_}</div>` : p}
      </div>
    `;
  }
  renderFlow() {
    var w, A, E;
    const e = u(this.entity("sensor", "grid_power")), t = u(this.entity("sensor", "pv_dc_power")), i = u(this.entity("sensor", "pv_inverter_power")), s = t === void 0 && i === void 0 ? void 0 : (t ?? 0) + (i ?? 0), n = u(this.entity("sensor", "battery_power")), o = u(this.entity("sensor", "battery_soc")), c = u(this.entity("sensor", "charger_power")), a = ((w = this.entity("binary_sensor", "battery_hold")) == null ? void 0 : w.state) === "on", h = ((A = this.entity("binary_sensor", "target_enabled")) == null ? void 0 : A.state) === "on", d = u(this.entity("sensor", "target_current")), l = u(this.entity("sensor", "target_phases")), f = ((E = this.entity("binary_sensor", "vehicle_connected")) == null ? void 0 : E.state) === "on", g = e === void 0 ? void 0 : e + (s ?? 0) + (n ?? 0) - (c ?? 0), m = [
      { node: "pv", power: Math.max(0, s ?? 0), inbound: !0, color: $.pv },
      {
        node: "grid",
        power: Math.abs(e ?? 0),
        inbound: (e ?? 0) >= 0,
        color: (e ?? 0) >= 0 ? $.gridIn : $.gridOut
      },
      {
        node: "battery",
        power: Math.abs(n ?? 0),
        inbound: (n ?? 0) >= 0,
        color: (n ?? 0) >= 0 ? $.batteryOut : $.batteryIn
      },
      { node: "home", power: Math.max(0, g ?? 0), inbound: !1, color: $.home },
      { node: "charger", power: Math.max(0, c ?? 0), inbound: !1, color: $.charger }
    ], _ = a ? $.hold : (n ?? 0) < -B ? $.batteryIn : $.batteryOut, y = (c ?? 0) > B ? $.charger : $.idle;
    return v`
      <div class="flow" style="aspect-ratio: ${D} / ${F}">
        <svg viewBox="0 0 ${D} ${F}" aria-hidden="true">
          ${m.map((te) => this.renderLine(te))}
          <circle class="hub" cx=${H.x} cy=${H.y} r="4"></circle>
          ${this.renderNodeCircle("pv", $.pv)}
          ${this.renderNodeCircle(
      "grid",
      (e ?? 0) >= 0 ? $.gridIn : $.gridOut
    )}
          ${this.renderNodeCircle("home", $.home)}
          ${this.renderNodeCircle("battery", _, o)}
          ${this.renderNodeCircle("charger", y)}
        </svg>

        ${this.renderNode("pv", "mdi:solar-power-variant", $.pv, N(s), "PV", "side")}
        ${this.renderNode(
      "grid",
      "mdi:transmission-tower",
      (e ?? 0) >= 0 ? $.gridIn : $.gridOut,
      N(e === void 0 ? void 0 : Math.abs(e)),
      e === void 0 ? "Grid" : e >= 0 ? "Grid import" : "Grid export"
    )}
        ${this.renderNode("home", "mdi:home", $.home, N(g), "Home")}
        ${this.renderNode(
      "battery",
      a ? "mdi:battery-lock" : "mdi:home-battery",
      _,
      o === void 0 ? "–" : `${Math.round(o)} %`,
      v`${N(n === void 0 ? void 0 : Math.abs(n))}
          ${(n ?? 0) > B ? "out" : (n ?? 0) < -B ? "in" : ""}${a ? v` · <b class="hold">hold</b>` : p}`
    )}
        ${this.renderNode(
      "charger",
      "mdi:ev-station",
      y,
      N(c),
      f ? h && l && d ? `${l}p · ${d} A` : "Paused" : "No vehicle",
      "below",
      this.renderVehicles()
    )}
      </div>
    `;
  }
  renderLine(e) {
    const t = ae[e.node], i = H.x - t.x, s = H.y - t.y, n = Math.hypot(i, s), o = i / n, c = s / n, a = t.x + o * (C + 2), h = t.y + c * (C + 2), d = H.x - o * 5, l = H.y - c * 5, f = `M${a.toFixed(1)},${h.toFixed(1)} L${d.toFixed(1)},${l.toFixed(1)}`;
    if (!(e.power > B))
      return O`<path class="line idle" d=${f}></path>`;
    if (this._reducedMotion) {
      const y = (a + d) / 2, w = (h + l) / 2, A = Math.atan2(c, o) * 180 / Math.PI + (e.inbound ? 0 : 180);
      return O`
        <path class="line" d=${f} style="stroke: ${e.color}"></path>
        <polygon points="-4,-4 4,0 -4,4" style="fill: ${e.color}"
          transform="translate(${y.toFixed(1)} ${w.toFixed(1)}) rotate(${A.toFixed(0)})"></polygon>
      `;
    }
    const m = rt(e.power), _ = e.inbound ? "0;1" : "1;0";
    return O`
      <path class="line" d=${f} style="stroke: ${e.color}"></path>
      ${[0, 1, 2].map(
      (y) => O`
          <circle class="dot" r="3" style="fill: ${e.color}">
            <animateMotion dur="${m.toFixed(2)}s" repeatCount="indefinite"
              begin="${(-(y * m) / 3).toFixed(2)}s" path=${f}
              keyPoints=${_} keyTimes="0;1" calcMode="linear"></animateMotion>
          </circle>`
    )}
    `;
  }
  renderNodeCircle(e, t, i) {
    const { x: s, y: n } = ae[e], o = 2 * Math.PI * C;
    return O`
      <circle class="node" cx=${s} cy=${n} r=${C}
        style="stroke: ${i === void 0 ? t : $.idle}"></circle>
      ${i === void 0 ? p : O`<circle class="ring" cx=${s} cy=${n} r=${C}
            style="stroke: ${t}"
            stroke-dasharray="${(o * Math.min(100, Math.max(0, i)) / 100).toFixed(1)} ${o.toFixed(1)}"
            transform="rotate(-90 ${s} ${n})"></circle>`}
    `;
  }
  renderNode(e, t, i, s, n, o = "below", c = p) {
    const { x: a, y: h } = ae[e], d = o === "side" ? `left: ${U(a + C + 8, D)}; top: ${U(h, F)}; transform: translateY(-50%); text-align: left;` : `left: ${U(a, D)}; top: ${U(h + C + 4, F)}; transform: translateX(-50%);`;
    return v`
      <ha-icon
        class="node-icon"
        .icon=${t}
        style="left: ${U(a, D)}; top: ${U(h, F)}; color: ${i}"
      ></ha-icon>
      <div class="node-label ${e}" style=${d}>
        <div class="value">${s}</div>
        <div class="node-sub">${n}</div>
        ${c}
      </div>
    `;
  }
  renderVehicles() {
    var t;
    const e = ((t = this._config) == null ? void 0 : t.vehicles) ?? [];
    return e.length ? v`
      <div class="vehicles">
        ${e.map((i, s) => {
      var c;
      const n = i.soc ? u((c = this.hass) == null ? void 0 : c.states[i.soc]) : void 0, o = i.name || `Vehicle ${s + 1}`;
      return v`
            <div class="vehicle" title=${i.soc ?? ""}>
              <span class="vname">${o}</span>
              <span class="bar"
                ><span style="width: ${Math.min(100, Math.max(0, n ?? 0))}%"></span
              ></span>
              <span class="vsoc">${n === void 0 ? "–" : `${Math.round(n)} %`}</span>
            </div>
          `;
    })}
      </div>
    ` : p;
  }
  renderFacts(e) {
    var f, g, m;
    const t = [], i = ((f = this.entity("binary_sensor", "vehicle_connected")) == null ? void 0 : f.state) === "on", s = this.entity("sensor", "pv_timer_remaining"), n = this.entity("sensor", "phase_timer_remaining");
    i && (s == null ? void 0 : s.attributes.action) === "enable" ? t.push(this.fact("mdi:timer-play-outline", `Starts in ${Z(u(s))}`, "info")) : i && (s == null ? void 0 : s.attributes.action) === "disable" && t.push(this.fact("mdi:timer-stop-outline", `Stops in ${Z(u(s))}`, "warn")), i && (n == null ? void 0 : n.attributes.action) === "scale3p" ? t.push(this.fact("mdi:timer-sync-outline", `3 phases in ${Z(u(n))}`, "info")) : i && (n == null ? void 0 : n.attributes.action) === "scale1p" && t.push(this.fact("mdi:timer-sync-outline", `1 phase in ${Z(u(n))}`, "info")), e.state.includes("phase switch settling") && t.push(this.fact("mdi:timer-sand", "Phase switch settling", "info"));
    const o = u(this.entity("sensor", "price")), c = u(this.entity("number", "price_threshold")), a = ((g = this.entity("binary_sensor", "price_cheap")) == null ? void 0 : g.state) === "on";
    o !== void 0 && t.push(
      this.fact(
        a ? "mdi:cash-check" : "mdi:cash",
        `${o.toFixed(3)} ${c === void 0 ? "" : `${a ? "≤" : ">"} ${c.toFixed(3)}`}${a ? " · cheap" : ""}`,
        a ? "good" : "",
        "Price against threshold"
      )
    );
    const h = ((m = this.entity("binary_sensor", "battery_hold")) == null ? void 0 : m.state) === "on", d = e.attributes.battery_reason;
    h && t.push(
      this.fact(
        "mdi:battery-lock",
        `Battery hold${d ? ` · ${d.replace("ev ", "EV ")}` : ""}`,
        "warn",
        "The home battery is not discharging"
      )
    );
    const l = e.attributes.limit_reason;
    if (e.attributes.limited && l) {
      const _ = e.state.includes("blocked by");
      t.push(
        this.fact(
          _ ? "mdi:cancel" : "mdi:speedometer-slow",
          `${_ ? "Blocked" : "Limited"} · ${l}`,
          "warn",
          "Protection limit"
        )
      );
    }
    return t.length ? v`<div class="facts">${t}</div>` : p;
  }
  fact(e, t, i, s = "") {
    return v`<span class="fact ${i}" title=${s}
      ><ha-icon .icon=${e}></ha-icon>${t}</span
    >`;
  }
};
Q.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 },
  _menu: { state: !0 }
}, Q.styles = Fe`
    ha-card {
      padding: 16px;
      position: relative;
    }
    .title {
      font-size: 1.2rem;
      font-weight: 500;
      margin-bottom: 8px;
    }
    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    ha-icon {
      --mdc-icon-size: 18px;
    }

    /* top row: mode and phase chips, active badge */
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      padding: 5px 4px 5px 10px;
      border-radius: 18px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color, transparent);
      font-weight: 500;
    }
    .chip.open,
    .chip:focus-visible {
      border-color: var(--primary-color);
      outline: none;
    }
    .chip .chevron {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      white-space: nowrap;
    }
    .badge ha-icon {
      --mdc-icon-size: 16px;
    }
    .badge.active {
      color: var(--success-color, #43a047);
      background: color-mix(in srgb, var(--success-color, #43a047) 15%, transparent);
    }
    .badge.shadow {
      color: var(--warning-color, #ffa600);
      background: color-mix(in srgb, var(--warning-color, #ffa600) 15%, transparent);
    }

    /* menu */
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 4;
    }
    .menu {
      position: absolute;
      z-index: 5;
      min-width: 180px;
      padding: 4px 0;
      border-radius: 12px;
      background: var(--card-background-color, #fff);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }
    .menu button {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 16px;
      border: none;
      background: none;
      text-align: left;
    }
    .menu button:hover,
    .menu button:focus-visible {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
      outline: none;
    }
    .menu button.selected {
      color: var(--primary-color);
      font-weight: 500;
    }
    .menu .check {
      margin-left: auto;
    }

    /* headline */
    .headline {
      margin: 14px 0 4px;
    }
    .headline .state {
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.2;
    }
    .headline.charging .state {
      color: var(--success-color, #43a047);
    }
    .headline.muted .state {
      color: var(--secondary-text-color);
    }
    .headline .sub {
      color: var(--secondary-text-color);
      margin-top: 2px;
    }

    /* flow diagram */
    .flow {
      position: relative;
      width: 100%;
      max-width: 440px;
      margin: 0 auto;
    }
    .flow svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .line {
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
    }
    .line.idle {
      stroke: var(--divider-color, #e0e0e0);
    }
    .hub {
      fill: var(--secondary-text-color, #727272);
    }
    .node {
      fill: var(--card-background-color, #fff);
      stroke-width: 2.5;
    }
    .ring {
      fill: none;
      stroke-width: 3.5;
      stroke-linecap: round;
    }
    .node-icon {
      position: absolute;
      transform: translate(-50%, -50%);
      --mdc-icon-size: 24px;
      pointer-events: none;
    }
    .node-label {
      position: absolute;
      text-align: center;
      white-space: nowrap;
      line-height: 1.25;
    }
    .node-label .value {
      font-weight: 500;
    }
    .node-sub {
      font-size: 0.78rem;
      color: var(--secondary-text-color);
    }
    .node-sub .hold {
      color: var(--warning-color, #ffa600);
    }

    /* vehicles under the charger node */
    .vehicles {
      margin-top: 4px;
      display: grid;
      gap: 3px;
      font-size: 0.78rem;
    }
    .vehicle {
      display: grid;
      grid-template-columns: auto 52px auto;
      align-items: center;
      gap: 6px;
    }
    .vname {
      text-align: right;
      color: var(--secondary-text-color);
    }
    .bar {
      height: 6px;
      border-radius: 3px;
      background: var(--divider-color, #e0e0e0);
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--success-color, #43a047);
    }
    .vsoc {
      text-align: left;
      font-weight: 500;
      min-width: 32px;
    }

    /* facts: next action, price, reasons */
    .facts {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .fact {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px 3px 8px;
      border-radius: 12px;
      font-size: 0.82rem;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
    }
    .fact ha-icon {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
    }
    .fact.good {
      color: var(--success-color, #43a047);
      background: color-mix(in srgb, var(--success-color, #43a047) 12%, transparent);
    }
    .fact.warn {
      color: var(--warning-color, #ffa600);
      background: color-mix(in srgb, var(--warning-color, #ffa600) 12%, transparent);
    }
    .fact.info {
      color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    }
    .fact.good ha-icon,
    .fact.warn ha-icon,
    .fact.info ha-icon {
      color: inherit;
    }
    .warning {
      color: var(--error-color);
    }
  `;
let le = Q;
const X = 3, at = [
  { name: "title", selector: { text: {} } },
  ...Array.from({ length: X }, (r, e) => ({
    type: "grid",
    name: "",
    schema: [
      { name: `vehicle_${e + 1}_name`, selector: { text: {} } },
      { name: `vehicle_${e + 1}_soc`, selector: { entity: { domain: "sensor" } } }
    ]
  })),
  { name: "prefix", selector: { text: {} } }
], Me = {
  title: "Title (optional)",
  prefix: "Entity prefix (only if you renamed the integration's entities)"
}, fe = class fe extends T {
  setConfig(e) {
    this._config = e;
  }
  connectedCallback() {
    super.connectedCallback(), this.loadHaForm();
  }
  /** ha-form is loaded lazily by HA; creating a built-in card editor loads it. */
  async loadHaForm() {
    var i, s, n;
    if (customElements.get("ha-form")) return;
    const e = await ((i = window.loadCardHelpers) == null ? void 0 : i.call(window)), t = await (e == null ? void 0 : e.createCardElement({ type: "entities", entities: [] }));
    await ((n = (s = t == null ? void 0 : t.constructor) == null ? void 0 : s.getConfigElement) == null ? void 0 : n.call(s)), this.requestUpdate();
  }
  get data() {
    var t, i, s;
    const e = { title: (t = this._config) == null ? void 0 : t.title, prefix: (i = this._config) == null ? void 0 : i.prefix };
    return (((s = this._config) == null ? void 0 : s.vehicles) ?? []).slice(0, X).forEach((n, o) => {
      e[`vehicle_${o + 1}_name`] = n.name, e[`vehicle_${o + 1}_soc`] = n.soc;
    }), e;
  }
  changed(e) {
    if (!this._config) return;
    const t = e.detail.value, i = [];
    for (let n = 1; n <= X; n++) {
      const o = t[`vehicle_${n}_name`], c = t[`vehicle_${n}_soc`];
      (o || c) && i.push({ ...o ? { name: o } : {}, ...c ? { soc: c } : {} });
    }
    i.push(...(this._config.vehicles ?? []).slice(X));
    const s = { ...this._config, vehicles: i };
    for (const n of ["title", "prefix"])
      t[n] ? s[n] = t[n] : delete s[n];
    this._config = s, this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: s }, bubbles: !0, composed: !0 })
    );
  }
  render() {
    return !this.hass || !this._config ? p : v`
      <ha-form
        .hass=${this.hass}
        .data=${this.data}
        .schema=${at}
        .computeLabel=${(e) => {
      if (Me[e.name]) return Me[e.name];
      const t = /^vehicle_(\d)_(name|soc)$/.exec(e.name);
      return t ? `Vehicle ${t[1]} ${t[2] === "name" ? "name" : "SoC sensor"}` : e.name;
    }}
        @value-changed=${this.changed}
      ></ha-form>
    `;
  }
};
fe.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 }
};
let he = fe;
customElements.define("charging-coordinator-card", le);
customElements.define("charging-coordinator-card-editor", he);
window.customCards ?? (window.customCards = []);
window.customCards.push({
  type: "charging-coordinator-card",
  name: "Charging Coordinator",
  description: "Energy flow, charging state, vehicles and controls of the Charging Coordinator",
  preview: !0,
  documentationURL: "https://github.com/KarstenBade/ha-charging-coordinator"
});
