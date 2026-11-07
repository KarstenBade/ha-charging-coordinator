/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const j = globalThis, K = j.ShadowRoot && (j.ShadyCSS === void 0 || j.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Q = Symbol(), pt = /* @__PURE__ */ new WeakMap();
let Et = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== Q) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (K && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = pt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && pt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Ht = (o) => new Et(typeof o == "string" ? o : o + "", void 0, Q), Nt = (o, ...t) => {
  const e = o.length === 1 ? o[0] : t.reduce((s, i, r) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + o[r + 1], o[0]);
  return new Et(e, o, Q);
}, Rt = (o, t) => {
  if (K) o.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), i = j.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = e.cssText, o.appendChild(s);
  }
}, ut = K ? (o) => o : (o) => o instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return Ht(e);
})(o) : o;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: kt, defineProperty: zt, getOwnPropertyDescriptor: Dt, getOwnPropertyNames: jt, getOwnPropertySymbols: Lt, getPrototypeOf: It } = Object, g = globalThis, $t = g.trustedTypes, Vt = $t ? $t.emptyScript : "", W = g.reactiveElementPolyfillSupport, U = (o, t) => o, G = { toAttribute(o, t) {
  switch (t) {
    case Boolean:
      o = o ? Vt : null;
      break;
    case Object:
    case Array:
      o = o == null ? o : JSON.stringify(o);
  }
  return o;
}, fromAttribute(o, t) {
  let e = o;
  switch (t) {
    case Boolean:
      e = o !== null;
      break;
    case Number:
      e = o === null ? null : Number(o);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(o);
      } catch {
        e = null;
      }
  }
  return e;
} }, St = (o, t) => !kt(o, t), ft = { attribute: !0, type: String, converter: G, reflect: !1, useDefault: !1, hasChanged: St };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), g.litPropertyMetadata ?? (g.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let E = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = ft) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(t, s, e);
      i !== void 0 && zt(this.prototype, t, i);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: i, set: r } = Dt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: i, set(n) {
      const c = i == null ? void 0 : i.call(this);
      r == null || r.call(this, n), this.requestUpdate(t, c, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ft;
  }
  static _$Ei() {
    if (this.hasOwnProperty(U("elementProperties"))) return;
    const t = It(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(U("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(U("properties"))) {
      const e = this.properties, s = [...jt(e), ...Lt(e)];
      for (const i of s) this.createProperty(i, e[i]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [s, i] of e) this.elementProperties.set(s, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, s] of this.elementProperties) {
      const i = this._$Eu(e, s);
      i !== void 0 && this._$Eh.set(i, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const i of s) e.unshift(ut(i));
    } else t !== void 0 && e.push(ut(t));
    return e;
  }
  static _$Eu(t, e) {
    const s = e.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const s of e.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Rt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var s;
      return (s = e.hostConnected) == null ? void 0 : s.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var s;
      return (s = e.hostDisconnected) == null ? void 0 : s.call(e);
    });
  }
  attributeChangedCallback(t, e, s) {
    this._$AK(t, s);
  }
  _$ET(t, e) {
    var r;
    const s = this.constructor.elementProperties.get(t), i = this.constructor._$Eu(t, s);
    if (i !== void 0 && s.reflect === !0) {
      const n = (((r = s.converter) == null ? void 0 : r.toAttribute) !== void 0 ? s.converter : G).toAttribute(e, s.type);
      this._$Em = t, n == null ? this.removeAttribute(i) : this.setAttribute(i, n), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var r, n;
    const s = this.constructor, i = s._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const c = s.getPropertyOptions(i), a = typeof c.converter == "function" ? { fromAttribute: c.converter } : ((r = c.converter) == null ? void 0 : r.fromAttribute) !== void 0 ? c.converter : G;
      this._$Em = i;
      const l = a.fromAttribute(e, c.type);
      this[i] = l ?? ((n = this._$Ej) == null ? void 0 : n.get(i)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, i = !1, r) {
    var n;
    if (t !== void 0) {
      const c = this.constructor;
      if (i === !1 && (r = this[t]), s ?? (s = c.getPropertyOptions(t)), !((s.hasChanged ?? St)(r, e) || s.useDefault && s.reflect && r === ((n = this._$Ej) == null ? void 0 : n.get(t)) && !this.hasAttribute(c._$Eu(t, s)))) return;
      this.C(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: s, reflect: i, wrapped: r }, n) {
    s && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), r !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (e = void 0), this._$AL.set(t, e)), i === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var s;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [r, n] of this._$Ep) this[r] = n;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [r, n] of i) {
        const { wrapped: c } = n, a = this[r];
        c !== !0 || this._$AL.has(r) || a === void 0 || this.C(r, void 0, n, a);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (s = this._$EO) == null || s.forEach((i) => {
        var r;
        return (r = i.hostUpdate) == null ? void 0 : r.call(i);
      }), this.update(e)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((s) => {
      var i;
      return (i = s.hostUpdated) == null ? void 0 : i.call(s);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
E.elementStyles = [], E.shadowRootOptions = { mode: "open" }, E[U("elementProperties")] = /* @__PURE__ */ new Map(), E[U("finalized")] = /* @__PURE__ */ new Map(), W == null || W({ ReactiveElement: E }), (g.reactiveElementVersions ?? (g.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const T = globalThis, _t = (o) => o, L = T.trustedTypes, mt = L ? L.createPolicy("lit-html", { createHTML: (o) => o }) : void 0, Ct = "$lit$", m = `lit$${Math.random().toFixed(9).slice(2)}$`, Pt = "?" + m, Bt = `<${Pt}>`, A = document, H = () => A.createComment(""), N = (o) => o === null || typeof o != "object" && typeof o != "function", X = Array.isArray, Wt = (o) => X(o) || typeof (o == null ? void 0 : o[Symbol.iterator]) == "function", F = `[ 	
\f\r]`, M = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, gt = /-->/g, vt = />/g, v = RegExp(`>|${F}(?:([^\\s"'>=/]+)(${F}*=${F}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), yt = /'/g, bt = /"/g, Mt = /^(?:script|style|textarea|title)$/i, Ft = (o) => (t, ...e) => ({ _$litType$: o, strings: t, values: e }), f = Ft(1), S = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), At = /* @__PURE__ */ new WeakMap(), y = A.createTreeWalker(A, 129);
function Ut(o, t) {
  if (!X(o) || !o.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return mt !== void 0 ? mt.createHTML(t) : t;
}
const qt = (o, t) => {
  const e = o.length - 1, s = [];
  let i, r = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = M;
  for (let c = 0; c < e; c++) {
    const a = o[c];
    let l, p, h = -1, $ = 0;
    for (; $ < a.length && (n.lastIndex = $, p = n.exec(a), p !== null); ) $ = n.lastIndex, n === M ? p[1] === "!--" ? n = gt : p[1] !== void 0 ? n = vt : p[2] !== void 0 ? (Mt.test(p[2]) && (i = RegExp("</" + p[2], "g")), n = v) : p[3] !== void 0 && (n = v) : n === v ? p[0] === ">" ? (n = i ?? M, h = -1) : p[1] === void 0 ? h = -2 : (h = n.lastIndex - p[2].length, l = p[1], n = p[3] === void 0 ? v : p[3] === '"' ? bt : yt) : n === bt || n === yt ? n = v : n === gt || n === vt ? n = M : (n = v, i = void 0);
    const _ = n === v && o[c + 1].startsWith("/>") ? " " : "";
    r += n === M ? a + Bt : h >= 0 ? (s.push(l), a.slice(0, h) + Ct + a.slice(h) + m + _) : a + m + (h === -2 ? c : _);
  }
  return [Ut(o, r + (o[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class R {
  constructor({ strings: t, _$litType$: e }, s) {
    let i;
    this.parts = [];
    let r = 0, n = 0;
    const c = t.length - 1, a = this.parts, [l, p] = qt(t, e);
    if (this.el = R.createElement(l, s), y.currentNode = this.el.content, e === 2 || e === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (i = y.nextNode()) !== null && a.length < c; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const h of i.getAttributeNames()) if (h.endsWith(Ct)) {
          const $ = p[n++], _ = i.getAttribute(h).split(m), w = /([.?@])?(.*)/.exec($);
          a.push({ type: 1, index: r, name: w[2], strings: _, ctor: w[1] === "." ? Gt : w[1] === "?" ? Jt : w[1] === "@" ? Kt : V }), i.removeAttribute(h);
        } else h.startsWith(m) && (a.push({ type: 6, index: r }), i.removeAttribute(h));
        if (Mt.test(i.tagName)) {
          const h = i.textContent.split(m), $ = h.length - 1;
          if ($ > 0) {
            i.textContent = L ? L.emptyScript : "";
            for (let _ = 0; _ < $; _++) i.append(h[_], H()), y.nextNode(), a.push({ type: 2, index: ++r });
            i.append(h[$], H());
          }
        }
      } else if (i.nodeType === 8) if (i.data === Pt) a.push({ type: 2, index: r });
      else {
        let h = -1;
        for (; (h = i.data.indexOf(m, h + 1)) !== -1; ) a.push({ type: 7, index: r }), h += m.length - 1;
      }
      r++;
    }
  }
  static createElement(t, e) {
    const s = A.createElement("template");
    return s.innerHTML = t, s;
  }
}
function C(o, t, e = o, s) {
  var n, c;
  if (t === S) return t;
  let i = s !== void 0 ? (n = e._$Co) == null ? void 0 : n[s] : e._$Cl;
  const r = N(t) ? void 0 : t._$litDirective$;
  return (i == null ? void 0 : i.constructor) !== r && ((c = i == null ? void 0 : i._$AO) == null || c.call(i, !1), r === void 0 ? i = void 0 : (i = new r(o), i._$AT(o, e, s)), s !== void 0 ? (e._$Co ?? (e._$Co = []))[s] = i : e._$Cl = i), i !== void 0 && (t = C(o, i._$AS(o, t.values), i, s)), t;
}
class Zt {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: s } = this._$AD, i = ((t == null ? void 0 : t.creationScope) ?? A).importNode(e, !0);
    y.currentNode = i;
    let r = y.nextNode(), n = 0, c = 0, a = s[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let l;
        a.type === 2 ? l = new k(r, r.nextSibling, this, t) : a.type === 1 ? l = new a.ctor(r, a.name, a.strings, this, t) : a.type === 6 && (l = new Qt(r, this, t)), this._$AV.push(l), a = s[++c];
      }
      n !== (a == null ? void 0 : a.index) && (r = y.nextNode(), n++);
    }
    return y.currentNode = A, i;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class k {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, s, i) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = i, this._$Cv = (i == null ? void 0 : i.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = C(this, t, e), N(t) ? t === d || t == null || t === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : t !== this._$AH && t !== S && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Wt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== d && N(this._$AH) ? this._$AA.nextSibling.data = t : this.T(A.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var r;
    const { values: e, _$litType$: s } = t, i = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = R.createElement(Ut(s.h, s.h[0]), this.options)), s);
    if (((r = this._$AH) == null ? void 0 : r._$AD) === i) this._$AH.p(e);
    else {
      const n = new Zt(i, this), c = n.u(this.options);
      n.p(e), this.T(c), this._$AH = n;
    }
  }
  _$AC(t) {
    let e = At.get(t.strings);
    return e === void 0 && At.set(t.strings, e = new R(t)), e;
  }
  k(t) {
    X(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, i = 0;
    for (const r of t) i === e.length ? e.push(s = new k(this.O(H()), this.O(H()), this, this.options)) : s = e[i], s._$AI(r), i++;
    i < e.length && (this._$AR(s && s._$AB.nextSibling, i), e.length = i);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, e); t !== this._$AB; ) {
      const i = _t(t).nextSibling;
      _t(t).remove(), t = i;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class V {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, i, r) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = t, this.name = e, this._$AM = i, this.options = r, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(t, e = this, s, i) {
    const r = this.strings;
    let n = !1;
    if (r === void 0) t = C(this, t, e, 0), n = !N(t) || t !== this._$AH && t !== S, n && (this._$AH = t);
    else {
      const c = t;
      let a, l;
      for (t = r[0], a = 0; a < r.length - 1; a++) l = C(this, c[s + a], e, a), l === S && (l = this._$AH[a]), n || (n = !N(l) || l !== this._$AH[a]), l === d ? t = d : t !== d && (t += (l ?? "") + r[a + 1]), this._$AH[a] = l;
    }
    n && !i && this.j(t);
  }
  j(t) {
    t === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Gt extends V {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === d ? void 0 : t;
  }
}
class Jt extends V {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== d);
  }
}
class Kt extends V {
  constructor(t, e, s, i, r) {
    super(t, e, s, i, r), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = C(this, t, e, 0) ?? d) === S) return;
    const s = this._$AH, i = t === d && s !== d || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, r = t !== d && (s === d || i);
    i && this.element.removeEventListener(this.name, this, s), r && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Qt {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    C(this, t);
  }
}
const q = T.litHtmlPolyfillSupport;
q == null || q(R, k), (T.litHtmlVersions ?? (T.litHtmlVersions = [])).push("3.3.3");
const Xt = (o, t, e) => {
  const s = (e == null ? void 0 : e.renderBefore) ?? t;
  let i = s._$litPart$;
  if (i === void 0) {
    const r = (e == null ? void 0 : e.renderBefore) ?? null;
    s._$litPart$ = i = new k(t.insertBefore(H(), r), r, void 0, e ?? {});
  }
  return i._$AI(o), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const b = globalThis;
class O extends E {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Xt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return S;
  }
}
var xt;
O._$litElement$ = !0, O.finalized = !0, (xt = b.litElementHydrateSupport) == null || xt.call(b, { LitElement: O });
const Z = b.litElementPolyfillSupport;
Z == null || Z({ LitElement: O });
(b.litElementVersions ?? (b.litElementVersions = [])).push("4.2.2");
const Yt = [
  ["off", "Off", "mdi:power"],
  ["pv", "PV", "mdi:solar-power"],
  ["pv_grid", "PV + grid", "mdi:transmission-tower-import"],
  ["now", "Now", "mdi:lightning-bolt"]
], te = [
  ["auto", "Auto"],
  ["1p", "1p"],
  ["3p", "3p"]
];
function u(o) {
  if (!o) return;
  const t = Number(o.state);
  return Number.isFinite(t) ? t : void 0;
}
function x(o) {
  return o === void 0 ? "–" : Math.abs(o) >= 1e3 ? `${(o / 1e3).toFixed(1)} kW` : `${Math.round(o)} W`;
}
function wt(o) {
  if (!o) return "";
  const t = Math.round(o);
  return t >= 60 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")} min` : `${t} s`;
}
const I = class I extends O {
  setConfig(t) {
    this._config = { prefix: "charging_coordinator", ...t };
  }
  getCardSize() {
    return 6;
  }
  static getStubConfig() {
    return {};
  }
  entity(t, e) {
    var s, i;
    return (i = this.hass) == null ? void 0 : i.states[`${t}.${(s = this._config) == null ? void 0 : s.prefix}_${e}`];
  }
  async select(t, e) {
    var s, i;
    await ((i = this.hass) == null ? void 0 : i.callService("select", "select_option", {
      entity_id: `select.${(s = this._config) == null ? void 0 : s.prefix}_${t}`,
      option: e
    }));
  }
  async toggle(t, e) {
    var s, i;
    await ((i = this.hass) == null ? void 0 : i.callService("switch", e ? "turn_on" : "turn_off", {
      entity_id: `switch.${(s = this._config) == null ? void 0 : s.prefix}_${t}`
    }));
  }
  flowTile(t, e, s, i = "", r = "") {
    return f`
      <div class="tile ${r}">
        <ha-icon .icon=${t}></ha-icon>
        <div class="tile-label">${e}</div>
        <div class="tile-value">${s}</div>
        <div class="tile-sub">${i}</div>
      </div>
    `;
  }
  render() {
    var rt, nt, at, ct, ht, lt, dt;
    if (!this.hass || !this._config) return d;
    const t = this.entity("sensor", "status");
    if (!t)
      return f`<ha-card><div class="warning">Charging Coordinator entities not found
        (prefix "${this._config.prefix}").</div></ha-card>`;
    const e = ((rt = this.entity("switch", "active_control")) == null ? void 0 : rt.state) === "on", s = (nt = this.entity("select", "charge_mode")) == null ? void 0 : nt.state, i = (at = this.entity("select", "phase_mode")) == null ? void 0 : at.state, r = u(this.entity("sensor", "grid_power")), n = (u(this.entity("sensor", "pv_dc_power")) ?? 0) + (u(this.entity("sensor", "pv_inverter_power")) ?? 0), c = u(this.entity("sensor", "battery_power")), a = u(this.entity("sensor", "battery_soc")), l = u(this.entity("sensor", "charger_power")), p = r === void 0 ? void 0 : r + n + (c ?? 0) - (l ?? 0), h = ((ct = this.entity("binary_sensor", "battery_hold")) == null ? void 0 : ct.state) === "on", $ = ((ht = this.entity("binary_sensor", "vehicle_connected")) == null ? void 0 : ht.state) === "on", _ = u(this.entity("sensor", "target_current")), w = u(this.entity("sensor", "target_phases")), Y = ((lt = this.entity("binary_sensor", "target_enabled")) == null ? void 0 : lt.state) === "on", tt = u(this.entity("sensor", "price")), et = u(this.entity("number", "price_threshold")), st = ((dt = this.entity("binary_sensor", "price_cheap")) == null ? void 0 : dt.state) === "on", z = this.entity("sensor", "pv_timer_remaining"), D = this.entity("sensor", "phase_timer_remaining"), it = t.attributes.limit_reason, ot = u(this.entity("sensor", "fuse_headroom")), Tt = u(this.entity("sensor", "unbalance"));
    return f`
      <ha-card>
        <div class="header">
          <div class="title">${this._config.title ?? "Charging Coordinator"}</div>
          <button
            class="badge ${e ? "active" : "shadow"}"
            title="Toggle active control"
            @click=${() => this.toggle("active_control", !e)}
          >
            ${e ? "Active" : "Shadow mode"}
          </button>
        </div>
        <div class="status">${t.state}</div>

        <div class="flow">
          ${this.flowTile("mdi:solar-power-variant", "PV", x(n))}
          ${this.flowTile(
      "mdi:transmission-tower",
      "Grid",
      x(r === void 0 ? void 0 : Math.abs(r)),
      r === void 0 ? "" : r >= 0 ? "import" : "export",
      r === void 0 ? "" : r > 50 ? "in" : r < -50 ? "out" : ""
    )}
          ${this.flowTile(
      h ? "mdi:battery-lock" : "mdi:home-battery",
      "Battery",
      a === void 0 ? "–" : `${Math.round(a)} %`,
      f`${x(c)}${h ? f` · <b>hold</b>` : d}`,
      h ? "warn" : ""
    )}
          ${this.flowTile("mdi:home", "Home", x(p))}
          ${this.flowTile(
      "mdi:car-electric",
      "Vehicle",
      x(l),
      $ ? Y ? `${_ ?? "–"} A · ${w ?? "–"}p` : "connected" : "not connected",
      Y ? "out" : ""
    )}
        </div>

        <div class="row">
          <div class="row-label">Mode</div>
          <div class="segmented">
            ${Yt.map(
      ([P, B, Ot]) => f`
                <button
                  class=${s === P ? "selected" : ""}
                  @click=${() => this.select("charge_mode", P)}
                >
                  <ha-icon .icon=${Ot}></ha-icon>${B}
                </button>
              `
    )}
          </div>
        </div>
        <div class="row">
          <div class="row-label">Phases</div>
          <div class="segmented small">
            ${te.map(
      ([P, B]) => f`
                <button
                  class=${i === P ? "selected" : ""}
                  @click=${() => this.select("phase_mode", P)}
                >
                  ${B}
                </button>
              `
    )}
          </div>
        </div>

        <div class="facts">
          <div>
            <span>Price</span>
            <b class=${st ? "good" : ""}>
              ${tt === void 0 ? "–" : tt.toFixed(3)}
              ${et === void 0 ? "" : f`${st ? "≤" : ">"} ${et.toFixed(3)}`}
            </b>
          </div>
          ${z && z.attributes.action !== "inactive" ? f`<div>
                <span>PV ${z.attributes.action}</span>
                <b>${wt(u(z))}</b>
              </div>` : d}
          ${D && D.attributes.action !== "inactive" ? f`<div>
                <span>${D.attributes.action}</span>
                <b>${wt(u(D))}</b>
              </div>` : d}
          <div>
            <span>Fuse headroom</span>
            <b>${ot === void 0 ? "–" : `${ot.toFixed(1)} A`}</b>
          </div>
          <div>
            <span>Unbalance</span>
            <b>${x(Tt)}</b>
          </div>
          ${it ? f`<div><span>Limit</span><b class="warn">${it}</b></div>` : d}
        </div>
      </ha-card>
    `;
  }
};
I.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 }
}, I.styles = Nt`
    ha-card {
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 500;
    }
    .status {
      color: var(--secondary-text-color);
      margin: 4px 0 12px;
      min-height: 1.2em;
    }
    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    .badge {
      border: none;
      border-radius: 12px;
      padding: 2px 10px;
      font-size: 0.8rem;
    }
    .badge.active {
      background: var(--success-color, #43a047);
      color: #fff;
    }
    .badge.shadow {
      background: var(--warning-color, #ffa600);
      color: #000;
    }
    .flow {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .tile {
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      padding: 8px;
      text-align: center;
    }
    .tile ha-icon {
      color: var(--state-icon-color, var(--secondary-text-color));
    }
    .tile.in ha-icon {
      color: var(--error-color, #db4437);
    }
    .tile.out ha-icon {
      color: var(--success-color, #43a047);
    }
    .tile.warn ha-icon {
      color: var(--warning-color, #ffa600);
    }
    .tile-label,
    .tile-sub {
      font-size: 0.75rem;
      color: var(--secondary-text-color);
    }
    .tile-value {
      font-size: 1.05rem;
      font-weight: 500;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .row-label {
      width: 56px;
      color: var(--secondary-text-color);
      font-size: 0.85rem;
    }
    .segmented {
      display: flex;
      flex: 1;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      overflow: hidden;
    }
    .segmented button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 4px;
      border: none;
      background: transparent;
      font-size: 0.85rem;
    }
    .segmented button + button {
      border-left: 1px solid var(--divider-color);
    }
    .segmented button.selected {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .segmented ha-icon {
      --mdc-icon-size: 18px;
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 4px 16px;
      margin-top: 8px;
      font-size: 0.85rem;
    }
    .facts div {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .facts span {
      color: var(--secondary-text-color);
    }
    .good {
      color: var(--success-color, #43a047);
    }
    .warn {
      color: var(--warning-color, #ffa600);
    }
    .warning {
      color: var(--error-color);
    }
  `;
let J = I;
customElements.define("charging-coordinator-card", J);
window.customCards ?? (window.customCards = []);
window.customCards.push({
  type: "charging-coordinator-card",
  name: "Charging Coordinator",
  description: "Status and controls of the Charging Coordinator integration"
});
