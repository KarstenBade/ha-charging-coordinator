/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ue = globalThis, ht = Ue.ShadowRoot && (Ue.ShadyCSS === void 0 || Ue.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, pt = Symbol(), _t = /* @__PURE__ */ new WeakMap();
let jt = class {
  constructor(e, t, r) {
    if (this._$cssResult$ = !0, r !== pt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (ht && e === void 0) {
      const r = t !== void 0 && t.length === 1;
      r && (e = _t.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), r && _t.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const pr = (n) => new jt(typeof n == "string" ? n : n + "", void 0, pt), me = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((r, i, s) => r + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + n[s + 1], n[0]);
  return new jt(t, n, pt);
}, ur = (n, e) => {
  if (ht) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const r = document.createElement("style"), i = Ue.litNonce;
    i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
  }
}, wt = ht ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const r of e.cssRules) t += r.cssText;
  return pr(t);
})(n) : n;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: gr, defineProperty: mr, getOwnPropertyDescriptor: fr, getOwnPropertyNames: br, getOwnPropertySymbols: vr, getPrototypeOf: yr } = Object, q = globalThis, kt = q.trustedTypes, $r = kt ? kt.emptyScript : "", Je = q.reactiveElementPolyfillSupport, we = (n, e) => n, st = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? $r : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, e) {
  let t = n;
  switch (e) {
    case Boolean:
      t = n !== null;
      break;
    case Number:
      t = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(n);
      } catch {
        t = null;
      }
  }
  return t;
} }, Wt = (n, e) => !gr(n, e), St = { attribute: !0, type: String, converter: st, reflect: !1, useDefault: !1, hasChanged: Wt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), q.litPropertyMetadata ?? (q.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let he = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = St) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const r = Symbol(), i = this.getPropertyDescriptor(e, r, t);
      i !== void 0 && mr(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, r) {
    const { get: i, set: s } = fr(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: i, set(o) {
      const a = i == null ? void 0 : i.call(this);
      s == null || s.call(this, o), this.requestUpdate(e, a, r);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? St;
  }
  static _$Ei() {
    if (this.hasOwnProperty(we("elementProperties"))) return;
    const e = yr(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(we("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(we("properties"))) {
      const t = this.properties, r = [...br(t), ...vr(t)];
      for (const i of r) this.createProperty(i, t[i]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [r, i] of t) this.elementProperties.set(r, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, r] of this.elementProperties) {
      const i = this._$Eu(t, r);
      i !== void 0 && this._$Eh.set(i, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const r = new Set(e.flat(1 / 0).reverse());
      for (const i of r) t.unshift(wt(i));
    } else e !== void 0 && t.push(wt(e));
    return t;
  }
  static _$Eu(e, t) {
    const r = t.attribute;
    return r === !1 ? void 0 : typeof r == "string" ? r : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const r of t.keys()) this.hasOwnProperty(r) && (e.set(r, this[r]), delete this[r]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ur(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var r;
      return (r = t.hostConnected) == null ? void 0 : r.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var r;
      return (r = t.hostDisconnected) == null ? void 0 : r.call(t);
    });
  }
  attributeChangedCallback(e, t, r) {
    this._$AK(e, r);
  }
  _$ET(e, t) {
    var s;
    const r = this.constructor.elementProperties.get(e), i = this.constructor._$Eu(e, r);
    if (i !== void 0 && r.reflect === !0) {
      const o = (((s = r.converter) == null ? void 0 : s.toAttribute) !== void 0 ? r.converter : st).toAttribute(t, r.type);
      this._$Em = e, o == null ? this.removeAttribute(i) : this.setAttribute(i, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var s, o;
    const r = this.constructor, i = r._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const a = r.getPropertyOptions(i), c = typeof a.converter == "function" ? { fromAttribute: a.converter } : ((s = a.converter) == null ? void 0 : s.fromAttribute) !== void 0 ? a.converter : st;
      this._$Em = i;
      const d = c.fromAttribute(t, a.type);
      this[i] = d ?? ((o = this._$Ej) == null ? void 0 : o.get(i)) ?? d, this._$Em = null;
    }
  }
  requestUpdate(e, t, r, i = !1, s) {
    var o;
    if (e !== void 0) {
      const a = this.constructor;
      if (i === !1 && (s = this[e]), r ?? (r = a.getPropertyOptions(e)), !((r.hasChanged ?? Wt)(s, t) || r.useDefault && r.reflect && s === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(a._$Eu(e, r)))) return;
      this.C(e, t, r);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: r, reflect: i, wrapped: s }, o) {
    r && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), s !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || r || (t = void 0), this._$AL.set(e, t)), i === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
    var r;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [s, o] of this._$Ep) this[s] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [s, o] of i) {
        const { wrapped: a } = o, c = this[s];
        a !== !0 || this._$AL.has(s) || c === void 0 || this.C(s, void 0, o, c);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (r = this._$EO) == null || r.forEach((i) => {
        var s;
        return (s = i.hostUpdate) == null ? void 0 : s.call(i);
      }), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((r) => {
      var i;
      return (i = r.hostUpdated) == null ? void 0 : i.call(r);
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
he.elementStyles = [], he.shadowRootOptions = { mode: "open" }, he[we("elementProperties")] = /* @__PURE__ */ new Map(), he[we("finalized")] = /* @__PURE__ */ new Map(), Je == null || Je({ ReactiveElement: he }), (q.reactiveElementVersions ?? (q.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ke = globalThis, At = (n) => n, De = ke.trustedTypes, Et = De ? De.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Gt = "$lit$", Y = `lit$${Math.random().toFixed(9).slice(2)}$`, Xt = "?" + Y, xr = `<${Xt}>`, oe = document, Se = () => oe.createComment(""), Ae = (n) => n === null || typeof n != "object" && typeof n != "function", ut = Array.isArray, _r = (n) => ut(n) || typeof (n == null ? void 0 : n[Symbol.iterator]) == "function", Qe = `[ 	
\f\r]`, ye = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Mt = /-->/g, Ct = />/g, te = RegExp(`>|${Qe}(?:([^\\s"'>=/]+)(${Qe}*=${Qe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Pt = /'/g, Ot = /"/g, Yt = /^(?:script|style|textarea|title)$/i, qt = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), l = qt(1), O = qt(2), ue = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), Lt = /* @__PURE__ */ new WeakMap(), ie = oe.createTreeWalker(oe, 129);
function Kt(n, e) {
  if (!ut(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Et !== void 0 ? Et.createHTML(e) : e;
}
const wr = (n, e) => {
  const t = n.length - 1, r = [];
  let i, s = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = ye;
  for (let a = 0; a < t; a++) {
    const c = n[a];
    let d, g, u = -1, y = 0;
    for (; y < c.length && (o.lastIndex = y, g = o.exec(c), g !== null); ) y = o.lastIndex, o === ye ? g[1] === "!--" ? o = Mt : g[1] !== void 0 ? o = Ct : g[2] !== void 0 ? (Yt.test(g[2]) && (i = RegExp("</" + g[2], "g")), o = te) : g[3] !== void 0 && (o = te) : o === te ? g[0] === ">" ? (o = i ?? ye, u = -1) : g[1] === void 0 ? u = -2 : (u = o.lastIndex - g[2].length, d = g[1], o = g[3] === void 0 ? te : g[3] === '"' ? Ot : Pt) : o === Ot || o === Pt ? o = te : o === Mt || o === Ct ? o = ye : (o = te, i = void 0);
    const x = o === te && n[a + 1].startsWith("/>") ? " " : "";
    s += o === ye ? c + xr : u >= 0 ? (r.push(d), c.slice(0, u) + Gt + c.slice(u) + Y + x) : c + Y + (u === -2 ? a : x);
  }
  return [Kt(n, s + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), r];
};
class Ee {
  constructor({ strings: e, _$litType$: t }, r) {
    let i;
    this.parts = [];
    let s = 0, o = 0;
    const a = e.length - 1, c = this.parts, [d, g] = wr(e, t);
    if (this.el = Ee.createElement(d, r), ie.currentNode = this.el.content, t === 2 || t === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (i = ie.nextNode()) !== null && c.length < a; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const u of i.getAttributeNames()) if (u.endsWith(Gt)) {
          const y = g[o++], x = i.getAttribute(u).split(Y), w = /([.?@])?(.*)/.exec(y);
          c.push({ type: 1, index: s, name: w[2], strings: x, ctor: w[1] === "." ? Sr : w[1] === "?" ? Ar : w[1] === "@" ? Er : Ge }), i.removeAttribute(u);
        } else u.startsWith(Y) && (c.push({ type: 6, index: s }), i.removeAttribute(u));
        if (Yt.test(i.tagName)) {
          const u = i.textContent.split(Y), y = u.length - 1;
          if (y > 0) {
            i.textContent = De ? De.emptyScript : "";
            for (let x = 0; x < y; x++) i.append(u[x], Se()), ie.nextNode(), c.push({ type: 2, index: ++s });
            i.append(u[y], Se());
          }
        }
      } else if (i.nodeType === 8) if (i.data === Xt) c.push({ type: 2, index: s });
      else {
        let u = -1;
        for (; (u = i.data.indexOf(Y, u + 1)) !== -1; ) c.push({ type: 7, index: s }), u += Y.length - 1;
      }
      s++;
    }
  }
  static createElement(e, t) {
    const r = oe.createElement("template");
    return r.innerHTML = e, r;
  }
}
function ge(n, e, t = n, r) {
  var o, a;
  if (e === ue) return e;
  let i = r !== void 0 ? (o = t._$Co) == null ? void 0 : o[r] : t._$Cl;
  const s = Ae(e) ? void 0 : e._$litDirective$;
  return (i == null ? void 0 : i.constructor) !== s && ((a = i == null ? void 0 : i._$AO) == null || a.call(i, !1), s === void 0 ? i = void 0 : (i = new s(n), i._$AT(n, t, r)), r !== void 0 ? (t._$Co ?? (t._$Co = []))[r] = i : t._$Cl = i), i !== void 0 && (e = ge(n, i._$AS(n, e.values), i, r)), e;
}
class kr {
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
    const { el: { content: t }, parts: r } = this._$AD, i = ((e == null ? void 0 : e.creationScope) ?? oe).importNode(t, !0);
    ie.currentNode = i;
    let s = ie.nextNode(), o = 0, a = 0, c = r[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let d;
        c.type === 2 ? d = new Me(s, s.nextSibling, this, e) : c.type === 1 ? d = new c.ctor(s, c.name, c.strings, this, e) : c.type === 6 && (d = new Mr(s, this, e)), this._$AV.push(d), c = r[++a];
      }
      o !== (c == null ? void 0 : c.index) && (s = ie.nextNode(), o++);
    }
    return ie.currentNode = oe, i;
  }
  p(e) {
    let t = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(e, r, t), t += r.strings.length - 2) : r._$AI(e[t])), t++;
  }
}
class Me {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, r, i) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = r, this.options = i, this._$Cv = (i == null ? void 0 : i.isConnected) ?? !0;
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
    e = ge(this, e, t), Ae(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== ue && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : _r(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && Ae(this._$AH) ? this._$AA.nextSibling.data = e : this.T(oe.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var s;
    const { values: t, _$litType$: r } = e, i = typeof r == "number" ? this._$AC(e) : (r.el === void 0 && (r.el = Ee.createElement(Kt(r.h, r.h[0]), this.options)), r);
    if (((s = this._$AH) == null ? void 0 : s._$AD) === i) this._$AH.p(t);
    else {
      const o = new kr(i, this), a = o.u(this.options);
      o.p(t), this.T(a), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Lt.get(e.strings);
    return t === void 0 && Lt.set(e.strings, t = new Ee(e)), t;
  }
  k(e) {
    ut(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let r, i = 0;
    for (const s of e) i === t.length ? t.push(r = new Me(this.O(Se()), this.O(Se()), this, this.options)) : r = t[i], r._$AI(s), i++;
    i < t.length && (this._$AR(r && r._$AB.nextSibling, i), t.length = i);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var r;
    for ((r = this._$AP) == null ? void 0 : r.call(this, !1, !0, t); e !== this._$AB; ) {
      const i = At(e).nextSibling;
      At(e).remove(), e = i;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class Ge {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, r, i, s) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = s, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(new String()), this.strings = r) : this._$AH = h;
  }
  _$AI(e, t = this, r, i) {
    const s = this.strings;
    let o = !1;
    if (s === void 0) e = ge(this, e, t, 0), o = !Ae(e) || e !== this._$AH && e !== ue, o && (this._$AH = e);
    else {
      const a = e;
      let c, d;
      for (e = s[0], c = 0; c < s.length - 1; c++) d = ge(this, a[r + c], t, c), d === ue && (d = this._$AH[c]), o || (o = !Ae(d) || d !== this._$AH[c]), d === h ? e = h : e !== h && (e += (d ?? "") + s[c + 1]), this._$AH[c] = d;
    }
    o && !i && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Sr extends Ge {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class Ar extends Ge {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class Er extends Ge {
  constructor(e, t, r, i, s) {
    super(e, t, r, i, s), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = ge(this, e, t, 0) ?? h) === ue) return;
    const r = this._$AH, i = e === h && r !== h || e.capture !== r.capture || e.once !== r.once || e.passive !== r.passive, s = e !== h && (r === h || i);
    i && this.element.removeEventListener(this.name, this, r), s && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Mr {
  constructor(e, t, r) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    ge(this, e);
  }
}
const et = ke.litHtmlPolyfillSupport;
et == null || et(Ee, Me), (ke.litHtmlVersions ?? (ke.litHtmlVersions = [])).push("3.3.3");
const Cr = (n, e, t) => {
  const r = (t == null ? void 0 : t.renderBefore) ?? e;
  let i = r._$litPart$;
  if (i === void 0) {
    const s = (t == null ? void 0 : t.renderBefore) ?? null;
    r._$litPart$ = i = new Me(e.insertBefore(Se(), s), s, void 0, t ?? {});
  }
  return i._$AI(n), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const se = globalThis;
class pe extends he {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Cr(t, this.renderRoot, this.renderOptions);
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
    return ue;
  }
}
var Vt;
pe._$litElement$ = !0, pe.finalized = !0, (Vt = se.litElementHydrateSupport) == null || Vt.call(se, { LitElement: pe });
const tt = se.litElementPolyfillSupport;
tt == null || tt({ LitElement: pe });
(se.litElementVersions ?? (se.litElementVersions = [])).push("4.2.2");
const Pr = {
  sensor: ["sensor", "input_number"],
  binary_sensor: ["binary_sensor", "input_boolean"],
  select: ["select", "input_select"],
  number: ["number", "input_number"],
  switch: ["switch", "input_boolean"],
  forecast: ["sensor"]
  // any sensor whose attributes hold the prices
};
function rt(n) {
  return n.split(".")[0];
}
const Be = [
  {
    value: "off",
    label: "Off",
    icon: "mdi:power",
    icons: ["mdi:power"],
    color: "var(--secondary-text-color, #727272)",
    description: "The car doesn't charge."
  },
  {
    value: "smart",
    label: "Smart",
    icon: "mdi:auto-fix",
    icons: ["mdi:auto-fix"],
    color: "var(--primary-color, #03a9f4)",
    description: "Charges only when it's worth it. Pick which reasons count."
  },
  {
    value: "now",
    label: "Now",
    icon: "mdi:lightning-bolt",
    icons: ["mdi:lightning-bolt"],
    color: "var(--error-color, #db4437)",
    description: "Charges at full power right away, from PV, battery and grid alike."
  }
], Or = [
  {
    key: "smart_pv",
    label: "PV surplus",
    icon: "mdi:solar-power",
    color: "var(--energy-solar-color, #ff9800)",
    description: "Charge with power that would otherwise be exported."
  },
  {
    key: "smart_price",
    label: "Cheap price",
    icon: "mdi:tag",
    color: "var(--success-color, #43a047)",
    description: "Also charge from the grid while the price is at or below the limit."
  }
], f = {
  pv: "var(--energy-solar-color, #ff9800)",
  gridIn: "var(--energy-grid-consumption-color, #488fc2)",
  gridOut: "var(--energy-grid-return-color, #8353d1)",
  batteryOut: "var(--energy-battery-out-color, #4db6ac)",
  batteryIn: "var(--energy-battery-in-color, #f06292)",
  home: "var(--secondary-text-color, #727272)",
  charger: "var(--success-color, #43a047)",
  idle: "var(--divider-color, #e0e0e0)",
  hold: "var(--warning-color, #ffa600)"
};
function z(n, e = 55) {
  return `color-mix(in srgb, ${n} ${e}%, var(--card-background-color, #fff))`;
}
const zt = { kW: 1e3, MW: 1e6 };
function v(n) {
  if (!n) return;
  const e = Number(n.state);
  if (!Number.isFinite(e)) return;
  const t = n.attributes.unit_of_measurement;
  return typeof t == "string" && t in zt ? e * zt[t] : e;
}
function j(n) {
  return n === void 0 ? "–" : Math.abs(n) >= 1e3 ? `${(n / 1e3).toFixed(1)} kW` : `${Math.round(n)} W`;
}
function L(n) {
  return n === void 0 ? "–" : n.toFixed(3);
}
function Lr(n, e) {
  var r;
  const t = e.image_entity ? (r = n.states[e.image_entity]) == null ? void 0 : r.attributes.entity_picture : void 0;
  return typeof t == "string" && t ? t : e.image || void 0;
}
function Zt(n, e) {
  const t = e == null ? void 0 : e.attributes.vehicles;
  if (!Array.isArray(t)) return [];
  const r = (i) => i ? v(n.states[i]) : void 0;
  return t.map((i, s) => {
    const o = i.range_entity ? n.states[i.range_entity] : void 0;
    return {
      name: i.name || `Vehicle ${s + 1}`,
      connected: i.connected === !0,
      soc: r(i.soc_entity),
      target: r(i.target_soc_entity),
      range: v(o),
      rangeUnit: (o == null ? void 0 : o.attributes.unit_of_measurement) ?? "km",
      image: Lr(n, i),
      socEntity: i.soc_entity || void 0
    };
  });
}
const zr = 4e3, gt = class gt extends pe {
  constructor() {
    super(...arguments), this._pending = /* @__PURE__ */ new Map();
  }
  setConfig(e) {
    this._config = { prefix: "charging_coordinator", ...e };
  }
  entityId(e, t) {
    var r, i, s;
    return ((i = (r = this._config) == null ? void 0 : r.entities) == null ? void 0 : i[t]) || `${e}.${(s = this._config) == null ? void 0 : s.prefix}_${t}`;
  }
  entity(e, t) {
    var r;
    return (r = this.hass) == null ? void 0 : r.states[this.entityId(e, t)];
  }
  /** A number setting, including a value just set in the card. */
  numberValue(e) {
    const t = v(this.entity("number", e)), r = this._pending.get(e);
    return r && Date.now() < r.until && r.value !== t ? r.value : (this._pending.delete(e), t);
  }
  async setNumber(e, t) {
    var c;
    const r = this.entity("number", e), i = Number((r == null ? void 0 : r.attributes.min) ?? -1 / 0), s = Number((r == null ? void 0 : r.attributes.max) ?? 1 / 0), o = Math.min(s, Math.max(i, t));
    this._pending.set(e, { value: o, until: Date.now() + zr }), this.requestUpdate();
    const a = this.entityId("number", e);
    await ((c = this.hass) == null ? void 0 : c.callService(rt(a), "set_value", {
      entity_id: a,
      value: o
    }));
  }
  async selectOption(e, t) {
    var i;
    const r = this.entityId("select", e);
    await ((i = this.hass) == null ? void 0 : i.callService(rt(r), "select_option", {
      entity_id: r,
      option: t
    }));
  }
  async toggle(e, t) {
    var i;
    const r = this.entityId("switch", e);
    await ((i = this.hass) == null ? void 0 : i.callService(rt(r), t ? "turn_on" : "turn_off", {
      entity_id: r
    }));
  }
  /** Shown instead of the card when the integration's entities are missing. */
  renderMissing(e) {
    return l`<ha-card>
      <div class="missing">
        Charging Coordinator entities not found (looked for ${this.entityId("…", e)}).
        Check the entity prefix in the card settings.
      </div>
    </ha-card>`;
  }
  renderStepper(e, t) {
    return l`<span class="stepper" role="group" aria-label=${e}>
      <button aria-label="Lower ${e.toLowerCase()}" @click=${() => t(-1)}>
        <ha-icon .icon=${"mdi:minus"}></ha-icon>
      </button>
      <button aria-label="Raise ${e.toLowerCase()}" @click=${() => t(1)}>
        <ha-icon .icon=${"mdi:plus"}></ha-icon>
      </button>
    </span>`;
  }
};
gt.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 }
};
let N = gt;
const Xe = me`
  ha-card {
    padding: 14px 16px;
  }
  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  ha-icon {
    --mdc-icon-size: 20px;
  }
  .title {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 10px;
  }
  .missing {
    color: var(--error-color);
  }
  .muted {
    color: var(--secondary-text-color);
  }
  .label {
    font-weight: 500;
  }
  .hint {
    font-size: 0.82rem;
    color: var(--secondary-text-color);
  }
  .value {
    font-size: 1.15rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .spread {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--divider-color);
  }
  .stepper {
    display: inline-flex;
    flex: none;
    border: 1px solid var(--divider-color);
    border-radius: 18px;
    overflow: hidden;
  }
  .stepper button {
    display: grid;
    place-items: center;
    width: 38px;
    height: 32px;
    border: none;
    background: var(--secondary-background-color, transparent);
  }
  .stepper button + button {
    border-left: 1px solid var(--divider-color);
  }
  .stepper ha-icon {
    --mdc-icon-size: 18px;
  }
  .switch {
    position: relative;
    flex: none;
    width: 36px;
    height: 20px;
    border: none;
    border-radius: 10px;
    background: var(--disabled-color, #9e9e9e);
    opacity: 0.8;
  }
  .switch::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--card-background-color, #fff);
    transition: left 0.15s;
  }
  .switch[aria-checked="true"] {
    background: var(--primary-color);
    opacity: 1;
  }
  .switch[aria-checked="true"]::after {
    left: 18px;
  }
  @media (prefers-reduced-motion: reduce) {
    .switch::after {
      transition: none;
    }
  }
`;
async function Nr() {
  var t, r, i;
  if (customElements.get("ha-form")) return;
  const n = await ((t = window.loadCardHelpers) == null ? void 0 : t.call(window)), e = await (n == null ? void 0 : n.createCardElement({ type: "entities", entities: [] }));
  await ((i = (r = e == null ? void 0 : e.constructor) == null ? void 0 : r.getConfigElement) == null ? void 0 : i.call(r));
}
function Hr(n) {
  return {
    type: "expandable",
    name: "entities",
    title: "Entities",
    schema: n.map((e) => ({
      name: e.key,
      selector: { entity: { domain: Pr[e.domain] ?? [e.domain] } }
    }))
  };
}
function Tr(n, e) {
  const t = new Map(n.map((r) => [r.key, r]));
  return {
    label: (r) => {
      var i;
      return (i = t.get(r)) == null ? void 0 : i.label;
    },
    helper: (r) => {
      const i = t.get(r);
      if (i)
        return i.domain === "forecast" ? "Default: the price sensor's source" : `Default: ${i.domain}.${e || "charging_coordinator"}_${i.key}`;
    }
  };
}
function Ir(n) {
  if (typeof n != "object" || n === null) return;
  const e = Object.entries(n).filter(
    (t) => typeof t[1] == "string" && t[1] !== ""
  );
  return e.length ? Object.fromEntries(e) : void 0;
}
function Ce(n, e = []) {
  var i;
  const t = n.map(({ name: s, selector: o }) => ({ name: s, selector: o }));
  e.length && t.push(Hr(e));
  const r = Object.fromEntries(n.map((s) => [s.name, s.label]));
  return i = class extends pe {
    setConfig(o) {
      this._config = o;
    }
    connectedCallback() {
      super.connectedCallback(), Nr().then(() => this.requestUpdate());
    }
    changed(o) {
      const a = { ...this._config };
      for (const d of n) {
        const g = o.detail.value[d.name];
        g === void 0 || g === "" || g === !1 ? delete a[d.name] : a[d.name] = g;
      }
      const c = Ir(o.detail.value.entities);
      c ? a.entities = c : delete a.entities, this._config = a, this.dispatchEvent(
        new CustomEvent("config-changed", { detail: { config: a }, bubbles: !0, composed: !0 })
      );
    }
    render() {
      if (!this.hass || !this._config) return h;
      const o = Tr(e, this._config.prefix);
      return l`<ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${t}
        .computeLabel=${(a) => r[a.name] ?? o.label(a.name) ?? a.name}
        .computeHelper=${(a) => o.helper(a.name)}
        @value-changed=${this.changed}
      ></ha-form>`;
    }
  }, i.properties = { hass: { attribute: !1 }, _config: { state: !0 } }, i;
}
const Pe = {
  name: "title",
  label: "Title (optional)",
  selector: { text: {} }
}, Oe = {
  name: "prefix",
  label: "Entity prefix (only if you renamed the integration's entities)",
  selector: { text: {} }
};
function H(n, e) {
  if (customElements.get(n)) {
    console.info(`${n} is already defined, keeping the first loaded version`);
    return;
  }
  customElements.define(n, e);
}
function Le(n, e, t) {
  const r = window.customCards ?? (window.customCards = []);
  r.some((i) => i.type === n) || r.push({
    type: n,
    name: e,
    description: t,
    preview: !0,
    documentationURL: "https://github.com/KarstenBade/ha-charging-coordinator"
  });
}
const Rr = [
  { key: "charge_mode", domain: "select", label: "Charge mode" },
  { key: "smart_pv", domain: "switch", label: "Smart: PV surplus" },
  { key: "smart_price", domain: "switch", label: "Smart: cheap price" },
  { key: "price_threshold", domain: "number", label: "Price limit" },
  { key: "price", domain: "sensor", label: "Current price" },
  { key: "grid_charge_max_power", domain: "number", label: "Max grid power" },
  { key: "block_battery_on_cheap_price", domain: "switch", label: "Battery hold at a cheap price" }
], Nt = 0.01, Ur = 500, mt = class mt extends N {
  getCardSize() {
    var e;
    return (e = this._config) != null && e.compact ? 2 : 5;
  }
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }
  static getStubConfig() {
    return {};
  }
  static getConfigElement() {
    return document.createElement("charging-coordinator-control-card-editor");
  }
  render() {
    if (!this.hass || !this._config) return h;
    const e = this.entity("select", "charge_mode");
    if (!e) return this.renderMissing("charge_mode");
    const t = e.state;
    return l`<ha-card>
      ${this._config.title ? l`<div class="title">${this._config.title}</div>` : h}
      ${this._config.compact ? this.renderCompact(t) : this.renderFull(t)}
    </ha-card>`;
  }
  sourceOn(e) {
    var t;
    return ((t = this.entity("switch", e)) == null ? void 0 : t.state) === "on";
  }
  renderModeButtons(e, t) {
    return l`<div class=${t ? "segments" : "modes"} role="group" aria-label="Charge mode">
      ${Be.map((r) => {
      const i = r.value === e;
      return l`<button
          class=${t ? "" : "mode"}
          style="--accent: ${r.color}"
          aria-pressed=${i ? "true" : "false"}
          @click=${() => this.selectOption("charge_mode", r.value)}
        >
          <ha-icon .icon=${r.icon} style=${i ? `color: ${r.color}` : ""}></ha-icon>
          <span>${r.label}</span>
        </button>`;
    })}
    </div>`;
  }
  /** The sources of smart mode as switches; the whole row (or pill) is the control. */
  renderSources(e) {
    return l`<div class=${e ? "tray" : "sources"}>
      ${Or.map((t) => {
      const r = this.sourceOn(t.key);
      return l`<button
          class="source"
          role="switch"
          aria-checked=${r ? "true" : "false"}
          style="--c: ${t.color}"
          @click=${() => this.toggle(t.key, !r)}
        >
          <ha-icon .icon=${t.icon}></ha-icon>
          ${e ? l`<span class="name">${t.label}</span>` : l`<span class="text"><b>${t.label}</b><span>${t.description}</span></span>`}
          <span class="knob" aria-hidden="true"></span>
        </button>`;
    })}
    </div>`;
  }
  // --- full -------------------------------------------------------------------
  renderFull(e) {
    var a;
    const t = Be.find((c) => c.value === e), r = e === "smart", i = r && this.sourceOn("smart_price"), s = ((a = this.entity("switch", "block_battery_on_cheap_price")) == null ? void 0 : a.state) === "on", o = r && !i && !this.sourceOn("smart_pv");
    return l`
      ${this.renderModeButtons(e, !1)}
      <p class="description">${(t == null ? void 0 : t.description) ?? "Unknown mode."}</p>
      ${r ? this.renderSources(!1) : h}
      ${o ? l`<p class="hint warn">Switch on PV surplus or Cheap price, or the car won't charge.</p>` : h}
      ${i || s ? this.renderLimit(i) : h}
      ${i ? this.renderGridMax() : h}
    `;
  }
  /** The price limit; it also applies to the battery hold at a cheap price. */
  renderLimit(e) {
    const t = this.numberValue("price_threshold"), r = v(this.entity("sensor", "price")), i = r !== void 0 && t !== void 0 && r <= t;
    let s;
    return r === void 0 ? s = "No current price." : e ? s = i ? `Now ${L(r)}, at or below your limit: charging from the grid.` : `Now ${L(r)}, above your limit: grid charging waits.` : s = `Now ${L(r)}. The battery hold at a cheap price uses this limit.`, l`<div class="section">
      <div class="spread">
        <div>
          <div class="label">Price limit</div>
          <div class="hint">${e ? "Grid charging only at or below" : "Battery hold at or below"}</div>
        </div>
        <div class="row">
          <span class="value">${L(t)}</span>
          ${this.renderStepper(
      "Price limit",
      (o) => t === void 0 ? void 0 : this.setNumber("price_threshold", Ht(t + o * Nt))
    )}
        </div>
      </div>
      ${t === void 0 ? h : this.renderRuler(t, r)}
      <div class="note ${i && e ? "good" : ""}">${s}</div>
    </div>`;
  }
  /** The limit on a price scale, with the current price as a dot. */
  renderRuler(e, t) {
    const r = t === void 0 ? [e] : [e, t], i = Math.max(...r) - Math.min(...r) > 0.25 ? 0.1 : 0.05, s = Math.floor((Math.min(...r) - i) / i) * i, o = Math.ceil((Math.max(...r) + i) / i) * i, a = (g) => `${Math.min(100, Math.max(0, (g - s) / (o - s) * 100))}%`, c = [];
    for (let g = s; g <= o + 1e-9; g += i) c.push(g);
    const d = t !== void 0 && t <= e;
    return l`<div class="ruler" aria-hidden="true">
      <div class="ticks">
        ${c.map((g) => l`<span style="left: ${a(g)}">${g.toFixed(2)}</span>`)}
      </div>
      <div class="track"><div class="cheap" style="width: ${a(e)}"></div></div>
      <div class="limit" style="left: ${a(e)}"></div>
      ${t === void 0 ? h : l`<div class="now ${d ? "good" : ""}" style="left: ${a(t)}"></div>`}
    </div>`;
  }
  renderGridMax() {
    const e = this.numberValue("grid_charge_max_power");
    return l`<div class="section">
      <div class="spread">
        <div>
          <div class="label">Max grid power</div>
          <div class="hint">Cap on total grid import while charging</div>
        </div>
        <div class="row">
          <span class="value">${e === void 0 ? "–" : `${(e / 1e3).toFixed(1)} kW`}</span>
          ${this.renderStepper(
      "Max grid power",
      (t) => e === void 0 ? void 0 : this.setNumber("grid_charge_max_power", e + t * Ur)
    )}
        </div>
      </div>
    </div>`;
  }
  // --- compact ----------------------------------------------------------------
  renderCompact(e) {
    let t;
    if (e === "smart") {
      const r = this.sourceOn("smart_price"), i = !r && !this.sourceOn("smart_pv");
      t = l`${this.renderSources(!0)}
        ${r ? this.renderCompactLimit() : h}
        ${i ? l`<p class="hint warn">Switch one on, or the car won't charge.</p>` : h}`;
    } else
      t = l`<p class="hint">
        ${e === "now" ? "Charging at full power from any source." : "Not charging."}
      </p>`;
    return l`${this.renderModeButtons(e, !0)}${t}`;
  }
  renderCompactLimit() {
    const e = this.numberValue("price_threshold"), t = v(this.entity("sensor", "price")), r = t !== void 0 && e !== void 0 && t <= e;
    return l`<div class="compact-limit">
      <span class="label">Price limit</span>
      <span class="value">${L(e)}</span>
      ${this.renderStepper(
      "Price limit",
      (i) => e === void 0 ? void 0 : this.setNumber("price_threshold", Ht(e + i * Nt))
    )}
      ${t === void 0 ? h : l`<span class="pill ${r ? "good" : ""}" title="Current price">
            <ha-icon .icon=${r ? "mdi:cash-check" : "mdi:cash"}></ha-icon>now
            ${L(t)}
          </span>`}
    </div>`;
  }
};
mt.styles = [
  Xe,
  me`
      .modes {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .mode {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        min-width: 0;
        padding: 10px 4px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        background: var(--secondary-background-color, transparent);
        color: var(--secondary-text-color);
      }
      .mode span:last-child {
        font-weight: 500;
        font-size: 0.86rem;
        white-space: nowrap;
      }
      .mode ha-icon {
        --mdc-icon-size: 22px;
      }
      .mode[aria-pressed="true"] {
        color: var(--primary-text-color);
        border-color: var(--accent);
        background: color-mix(in srgb, var(--accent) 16%, var(--card-background-color, #fff));
      }
      .description {
        margin: 10px 2px 0;
        font-size: 0.9rem;
      }
      .hint.warn {
        margin: 10px 2px 0;
        color: var(--warning-color, #ffa600);
      }
      p.hint {
        margin: 10px 2px 0;
      }

      /* smart sources: rows in the full card, pills in the compact one */
      .source {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        border: 1px solid transparent;
        background: none;
        color: var(--secondary-text-color);
        text-align: left;
      }
      .source[aria-checked="true"] {
        color: var(--primary-text-color);
      }
      .source[aria-checked="true"] > ha-icon {
        color: var(--c);
      }
      .knob {
        position: relative;
        flex: none;
        width: 34px;
        height: 20px;
        margin-left: auto;
        border-radius: 10px;
        background: color-mix(in srgb, var(--secondary-text-color) 45%, var(--card-background-color, #fff));
      }
      .knob::after {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--card-background-color, #fff);
        transition: left 0.15s;
      }
      .source[aria-checked="true"] .knob {
        background: var(--c);
      }
      .source[aria-checked="true"] .knob::after {
        left: 17px;
      }
      @media (prefers-reduced-motion: reduce) {
        .knob::after {
          transition: none;
        }
      }
      .sources {
        margin-top: 12px;
        border-top: 1px solid var(--divider-color);
      }
      .sources .source {
        width: 100%;
        padding: 10px 2px;
        border-radius: 0;
      }
      .sources .source + .source {
        border-top: 1px solid var(--divider-color);
      }
      .sources .text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .sources .text b {
        font-weight: 500;
      }
      .sources .text span {
        font-size: 0.84rem;
        color: var(--secondary-text-color);
      }
      .tray {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 8px;
      }
      .tray .source {
        gap: 8px;
        padding: 6px 8px 6px 10px;
        border-color: var(--divider-color);
        border-radius: 12px;
        background: var(--secondary-background-color, transparent);
      }
      .tray .source[aria-checked="true"] {
        border-color: color-mix(in srgb, var(--c) 55%, transparent);
        background: color-mix(in srgb, var(--c) 12%, var(--card-background-color, #fff));
      }
      .tray .name {
        overflow: hidden;
        font-weight: 500;
        font-size: 0.86rem;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .tray ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }
      .ruler {
        position: relative;
        height: 36px;
        margin: 10px 0 4px;
      }
      .ruler .ticks span {
        position: absolute;
        top: 0;
        transform: translateX(-50%);
        font-size: 0.7rem;
        color: var(--secondary-text-color);
      }
      .ruler .ticks span:first-child {
        transform: none;
      }
      .ruler .ticks span:last-child {
        transform: translateX(-100%);
      }
      .ruler .track {
        position: absolute;
        left: 0;
        right: 0;
        top: 20px;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        background: color-mix(in srgb, var(--secondary-text-color) 30%, var(--card-background-color, #fff));
      }
      .ruler .cheap {
        height: 100%;
        background: color-mix(in srgb, var(--success-color, #43a047) 60%, var(--card-background-color, #fff));
      }
      .ruler .limit {
        position: absolute;
        top: 12px;
        width: 4px;
        height: 24px;
        margin-left: -2px;
        border-radius: 2px;
        background: var(--primary-text-color);
      }
      .ruler .now {
        position: absolute;
        top: 16px;
        width: 16px;
        height: 16px;
        margin-left: -8px;
        border-radius: 50%;
        border: 3px solid var(--card-background-color, #fff);
        background: var(--primary-text-color);
        box-sizing: border-box;
      }
      .ruler .now.good {
        background: var(--success-color, #43a047);
      }
      .note {
        font-size: 0.86rem;
      }
      .note.good {
        color: var(--success-color, #43a047);
      }

      .segments {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border: 1px solid var(--divider-color);
        border-radius: 18px;
        overflow: hidden;
      }
      .segments button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 0;
        padding: 7px 4px;
        border: none;
        background: var(--secondary-background-color, transparent);
        color: var(--secondary-text-color);
        font-weight: 500;
        font-size: 0.85rem;
        white-space: nowrap;
      }
      .segments button + button {
        border-left: 1px solid var(--divider-color);
      }
      .segments button[aria-pressed="true"] {
        color: var(--primary-text-color);
        background: color-mix(in srgb, var(--accent) 22%, var(--card-background-color, #fff));
      }
      .segments ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }
      .compact-limit {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 10px;
        margin-top: 10px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-left: auto;
        padding: 3px 10px 3px 8px;
        border-radius: 12px;
        font-size: 0.82rem;
        background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
      }
      .pill ha-icon {
        --mdc-icon-size: 16px;
        color: var(--secondary-text-color);
      }
      .pill.good {
        color: var(--success-color, #43a047);
        background: color-mix(in srgb, var(--success-color, #43a047) 12%, transparent);
      }
      .pill.good ha-icon {
        color: inherit;
      }
    `
];
let ot = mt;
function Ht(n) {
  return Math.round(n * 1e3) / 1e3;
}
H(
  "charging-coordinator-control-card-editor",
  Ce([
    Pe,
    { name: "compact", label: "Compact (no explanations)", selector: { boolean: {} } },
    Oe
  ], Rr)
);
H("charging-coordinator-control-card", ot);
Le(
  "charging-coordinator-control-card",
  "Charging Coordinator control",
  "Charge mode, smart mode sources and price limit, optionally compact"
);
const Tt = [
  { key: "priority_soc", name: "Battery first below" },
  { key: "buffer_soc", name: "May keep a charge going above" },
  { key: "buffer_start_soc", name: "May start a charge from" }
], Dr = [
  { key: "battery_soc", domain: "sensor", label: "Battery state of charge" },
  { key: "battery_power", domain: "sensor", label: "Battery power (+ discharge, - charge)" },
  { key: "battery_hold", domain: "binary_sensor", label: "Battery hold" },
  { key: "priority_soc", domain: "number", label: "Battery first below (%)" },
  { key: "buffer_soc", domain: "number", label: "May keep a charge going above (%)" },
  { key: "buffer_start_soc", domain: "number", label: "May start a charge from (%)" },
  { key: "block_battery_on_ev_grid_charge", domain: "switch", label: "Hold while the car charges from the grid" },
  { key: "block_battery_on_cheap_price", domain: "switch", label: "Hold at a cheap price" }
], It = {
  battery: z(f.batteryIn, 45),
  car: z(f.home, 25),
  keep: z(f.batteryOut, 30),
  start: z(f.batteryOut, 60)
}, Rt = 30;
function Ut(n, e) {
  return n < e.priority_soc ? "battery" : e.buffer_start_soc > 0 && n >= e.buffer_start_soc ? "start" : e.buffer_soc > 0 && n > e.buffer_soc ? "keep" : "car";
}
const Ve = class Ve extends N {
  constructor() {
    super(...arguments), this._drag = null;
  }
  getCardSize() {
    return 5;
  }
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }
  static getStubConfig() {
    return {};
  }
  static getConfigElement() {
    return document.createElement("charging-coordinator-battery-card-editor");
  }
  level(e) {
    var t;
    return ((t = this._drag) == null ? void 0 : t.key) === e ? this._drag.value : this.numberValue(e) ?? 0;
  }
  render() {
    var o;
    if (!this.hass || !this._config) return h;
    if (!this.entity("number", "priority_soc")) return this.renderMissing("priority_soc");
    const e = v(this.entity("sensor", "battery_soc")), t = v(this.entity("sensor", "battery_power")), r = ((o = this.entity("binary_sensor", "battery_hold")) == null ? void 0 : o.state) === "on", i = Object.fromEntries(Tt.map((a) => [a.key, this.level(a.key)]));
    let s;
    return r ? s = "On hold, not discharging" : (t ?? 0) < -Rt ? s = `Charging · ${j(-(t ?? 0))}` : (t ?? 0) > Rt ? s = `Discharging · ${j(t)}` : s = t === void 0 ? "–" : "Idle", l`<ha-card>
      ${this._config.title ? l`<div class="title">${this._config.title}</div>` : h}
      <div class="spread">
        <div>
          <div class="label">Home battery</div>
          <div class="hint ${r ? "hold" : ""}">${s}</div>
        </div>
        <span class="value big">${e === void 0 ? "–" : `${Math.round(e)} %`}</span>
      </div>
      ${this.renderScale(i, e)} ${this.renderLegend(i)}
      <div class="section">
        ${this.renderSwitch(
      "block_battery_on_ev_grid_charge",
      "Hold the battery while the car charges from the grid"
    )}
        ${this.renderSwitch(
      "block_battery_on_cheap_price",
      "Hold the battery when the price is at or below the limit"
    )}
      </div>
    </ha-card>`;
  }
  /** Colored zones from 0 to 100 %, the three draggable levels and the current SoC. */
  renderScale(e, t) {
    const r = [0, 100, ...Object.values(e)].map((s) => Math.min(100, Math.max(0, s))).sort((s, o) => s - o).filter((s, o, a) => o === 0 || s !== a[o - 1]), i = r.slice(0, -1).map((s, o) => ({
      from: s,
      to: r[o + 1],
      zone: Ut((s + r[o + 1]) / 2, e)
    }));
    return l`<div class="scale">
      <div class="zones" @pointerdown=${(s) => s.preventDefault()}>
        ${i.map(
      (s) => l`<div style="left: ${s.from}%; width: ${s.to - s.from}%; background: ${It[s.zone]}"></div>`
    )}
      </div>
      ${t === void 0 ? h : l`<div class="soc" style="left: ${Math.min(100, Math.max(0, t))}%" title="Now ${Math.round(t)} %"></div>`}
      ${Tt.map((s) => this.renderMarker(s.key, s.name, e[s.key]))}
    </div>`;
  }
  renderMarker(e, t, r) {
    var o;
    const i = r <= 0, s = (a) => this.setNumber(e, Math.min(100, Math.max(0, Math.round(a))));
    return l`<div
      class="marker ${((o = this._drag) == null ? void 0 : o.key) === e ? "dragging" : ""}"
      style="left: ${r}%"
      role="slider"
      tabindex="0"
      aria-label=${t}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${r}
      aria-valuetext=${i ? "off" : `${r} %`}
      @keydown=${(a) => {
      const c = {
        ArrowLeft: -1,
        ArrowDown: -1,
        ArrowRight: 1,
        ArrowUp: 1,
        PageDown: -10,
        PageUp: 10
      };
      if (a.key in c) s(r + c[a.key]);
      else if (a.key === "Home") s(0);
      else if (a.key === "End") s(100);
      else return;
      a.preventDefault();
    }}
      @pointerdown=${(a) => this.startDrag(a, e)}
    >
      <span class="marker-label">${i ? "off" : `${r} %`}</span>
    </div>`;
  }
  startDrag(e, t) {
    const r = e.currentTarget, i = r.parentElement;
    r.setPointerCapture(e.pointerId), e.preventDefault();
    const s = (c) => {
      const d = i.getBoundingClientRect();
      return Math.round(Math.min(100, Math.max(0, (c.clientX - d.left) / d.width * 100)));
    };
    this._drag = { key: t, value: s(e) };
    const o = (c) => this._drag = { key: t, value: s(c) }, a = () => {
      r.removeEventListener("pointermove", o), r.removeEventListener("pointerup", a), r.removeEventListener("pointercancel", a);
      const c = this._drag;
      this._drag = null, c && this.setNumber(c.key, c.value);
    };
    r.addEventListener("pointermove", o), r.addEventListener("pointerup", a), r.addEventListener("pointercancel", a);
  }
  renderLegend(e) {
    const { priority_soc: t, buffer_soc: r, buffer_start_soc: i } = e, s = [];
    s.push(
      t > 0 ? ["battery", `Below ${t} %, PV charges the battery before the car.`] : ["car", "PV always goes to the car before the battery."]
    );
    const o = [...Array(100).keys()].some((a) => Ut(a + 0.5, e) === "car");
    return t > 0 && o && s.push(["car", "In the grey range, PV goes to the car first and the battery doesn't help."]), r > 0 && s.push(["keep", `Above ${r} %, the battery may keep a running charge going.`]), i > 0 && s.push(["start", `From ${i} %, the battery may start a charge.`]), r <= 0 && i <= 0 && s.push(["car", "The battery never helps charge the car."]), l`<ul class="legend">
      ${s.map(
      ([a, c]) => l`<li><i style="background: ${It[a]}"></i><span>${c}</span></li>`
    )}
    </ul>
    <div class="hint drag-hint">Drag a marker to change it; at 0 % it is off.</div>`;
  }
  renderSwitch(e, t) {
    const r = this.entity("switch", e);
    if (!r) return l``;
    const i = r.state === "on";
    return l`<div class="toggle">
      <span>${t}</span>
      <button
        class="switch"
        role="switch"
        aria-checked=${i ? "true" : "false"}
        aria-label=${t}
        @click=${() => this.toggle(e, !i)}
      ></button>
    </div>`;
  }
};
Ve.properties = {
  ...N.properties,
  _drag: { state: !0 }
}, Ve.styles = [
  Xe,
  me`
      .big {
        font-size: 1.4rem;
      }
      .hint.hold {
        color: var(--warning-color, #ffa600);
      }
      .scale {
        position: relative;
        height: 30px;
        margin: 30px 10px 14px;
        touch-action: none;
      }
      .zones {
        position: absolute;
        inset: 9px 0;
        border-radius: 6px;
        overflow: hidden;
      }
      .zones div {
        position: absolute;
        top: 0;
        bottom: 0;
      }
      .soc {
        position: absolute;
        top: 4px;
        bottom: 4px;
        width: 4px;
        margin-left: -2px;
        border-radius: 2px;
        background: var(--energy-battery-out-color, #4db6ac);
        pointer-events: none;
      }
      .marker {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 24px;
        margin-left: -12px;
        cursor: ew-resize;
        outline: none;
      }
      .marker::before {
        content: "";
        position: absolute;
        left: 10px;
        top: 0;
        bottom: 0;
        width: 4px;
        border-radius: 2px;
        background: var(--primary-text-color);
      }
      .marker::after {
        content: "";
        position: absolute;
        left: 5px;
        top: 8px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--primary-text-color);
        border: 2px solid var(--card-background-color, #fff);
        box-sizing: border-box;
      }
      .marker:focus-visible::after,
      .marker.dragging::after {
        background: var(--primary-color);
      }
      .marker-label {
        position: absolute;
        bottom: calc(100% + 2px);
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
      }
      .legend {
        display: grid;
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 0.86rem;
      }
      .legend li {
        display: flex;
        gap: 8px;
        align-items: baseline;
      }
      .legend i {
        flex: none;
        width: 10px;
        height: 10px;
        border-radius: 3px;
        transform: translateY(1px);
      }
      .drag-hint {
        margin-top: 6px;
      }
      .toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 0;
        font-size: 0.9rem;
      }
    `
];
let nt = Ve;
H("charging-coordinator-battery-card-editor", Ce([Pe, Oe], Dr));
H("charging-coordinator-battery-card", nt);
Le(
  "charging-coordinator-battery-card",
  "Charging Coordinator battery",
  "When the home battery comes before the car, and the battery hold switches"
);
const Br = [
  { key: "price", domain: "sensor", label: "Current price" },
  { key: "price_threshold", domain: "number", label: "Price limit" },
  // defaults to the sensor named in the price sensor's `source` attribute
  { key: "price_forecast", domain: "forecast", label: "Sensor with the price forecast" }
], Fe = 36e5, P = 24 * Fe, Fr = 0.01, Vr = 5 * 6e4, jr = ["start", "start_time", "startsAt", "starts_at", "time", "from", "datetime", "hour"], Wr = ["end", "end_time", "endsAt", "ends_at", "till", "to"], Gr = ["value", "price", "total", "price_per_kwh", "price_eur_per_kwh", "marketprice"];
function at(n) {
  if (typeof n == "number") return n < 1e12 ? n * 1e3 : n;
  if (typeof n != "string") return;
  const e = Date.parse(n);
  return Number.isFinite(e) ? e : void 0;
}
function it(n, e) {
  for (const t of e) if (n[t] !== void 0 && n[t] !== null) return n[t];
}
function Xr(n) {
  const e = /* @__PURE__ */ new Map(), t = (r, i, s) => {
    e.has(r) || e.set(r, { start: r, end: i ?? NaN, price: s });
  };
  for (const [r, i] of Object.entries(n))
    if (!(!Array.isArray(i) || i.length === 0)) {
      if (i.every((s) => typeof s == "number")) {
        const s = r === "today" ? 0 : r === "tomorrow" ? P : void 0;
        if (s === void 0) continue;
        const o = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0) + s, a = P / i.length;
        i.forEach((c, d) => t(o + d * a, o + (d + 1) * a, c));
        continue;
      }
      for (const s of i) {
        if (typeof s != "object" || s === null) continue;
        const o = s, a = at(it(o, jr)), c = Number(it(o, Gr));
        a === void 0 || !Number.isFinite(c) || t(a, at(it(o, Wr)), c);
      }
    }
  return Jt([...e.values()]);
}
function Jt(n) {
  const e = n.sort((i, s) => i.start - s.start), t = e.slice(1).map((i, s) => i.start - e[s].start).filter((i) => i > 0), r = t.length ? Math.min(...t) : Fe;
  return e.map((i, s) => {
    var o;
    return {
      ...i,
      end: Number.isFinite(i.end) ? i.end : ((o = e[s + 1]) == null ? void 0 : o.start) ?? i.start + r
    };
  });
}
async function Yr(n, e) {
  if (!n.callWS) return [];
  const t = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0), r = await n.callWS({
    type: "history/history_during_period",
    start_time: new Date(t).toISOString(),
    entity_ids: [e],
    minimal_response: !0,
    no_attributes: !0
  }), i = [];
  for (const o of r[e] ?? []) {
    const a = Number(o.s ?? o.state), c = at(o.lu ?? o.lc ?? o.last_updated ?? o.last_changed);
    c === void 0 || !Number.isFinite(a) || i.push({ start: Math.max(c, t), end: NaN, price: a });
  }
  const s = Jt(i);
  return s.length && (s[s.length - 1].end = Date.now()), s;
}
function Dt(n) {
  return new Date(n).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function qr(n) {
  const e = Math.round(n / 6e4);
  if (e < 60) return `${e} min`;
  const t = Math.floor(e / 60), r = e % 60;
  return r ? `${t} h ${r} min` : `${t} h`;
}
const je = class je extends N {
  constructor() {
    super(...arguments), this._history = [], this._historyAt = 0, this._historyLoading = !1;
  }
  getCardSize() {
    return 4;
  }
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }
  static getStubConfig() {
    return {};
  }
  static getConfigElement() {
    return document.createElement("charging-coordinator-price-card-editor");
  }
  forecast() {
    var r, i, s, o;
    const e = ((i = (r = this._config) == null ? void 0 : r.entities) == null ? void 0 : i.price_forecast) || ((s = this.entity("sensor", "price")) == null ? void 0 : s.attributes.source), t = typeof e == "string" ? (o = this.hass) == null ? void 0 : o.states[e] : void 0;
    return t ? Xr(t.attributes) : [];
  }
  maybeLoadHistory() {
    !this.hass || this._historyLoading || Date.now() - this._historyAt < Vr || (this._historyLoading = !0, Yr(this.hass, this.entityId("sensor", "price")).then((e) => this._history = e).catch((e) => console.warn("Loading price history failed", e)).finally(() => {
      this._historyAt = Date.now(), this._historyLoading = !1;
    }));
  }
  render() {
    if (!this.hass || !this._config) return h;
    if (!this.entity("number", "price_threshold")) return this.renderMissing("price_threshold");
    const e = this.numberValue("price_threshold"), t = v(this.entity("sensor", "price")), r = Date.now(), i = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
    let s = this.forecast().filter((d) => d.end > i && d.start < i + 2 * P);
    const o = s.some((d) => d.end > r);
    o || (this.maybeLoadHistory(), s = this._history);
    const a = Math.max(i + P, ...s.map((d) => d.end)), c = a > i + P;
    return l`<ha-card>
      ${this._config.title ? l`<div class="title">${this._config.title}</div>` : h}
      <div class="spread">
        <div>
          <div class="label">${c ? "Prices today and tomorrow" : "Prices today"}</div>
          <div class="hint">${this.summary(s, e, t, o)}</div>
        </div>
        <div class="row">
          <span class="value" title="Price limit">${L(e)}</span>
          ${this.renderStepper(
      "Price limit",
      (d) => e === void 0 ? void 0 : this.setNumber("price_threshold", Math.round((e + d * Fr) * 1e3) / 1e3)
    )}
        </div>
      </div>
      ${s.length ? this.renderChart(s, e, i, a, r) : l`<div class="empty">No prices yet today.</div>`}
      ${o ? h : l`<div class="hint note">
            Your price sensor doesn't provide a forecast, so only today's prices so far are shown.
          </div>`}
    </ha-card>`;
  }
  summary(e, t, r, i) {
    if (t === void 0) return "";
    if (r !== void 0 && r <= t) return `Now ${L(r)}, at or below your limit`;
    if (!i) return r === void 0 ? "" : `Now ${L(r)}, above your limit`;
    const s = Date.now(), o = e.find((c) => c.start >= s && c.price <= t);
    if (!o) return "No upcoming price at or below your limit";
    let a = o.end;
    for (const c of e) c.start === a && c.price <= t && (a = c.end);
    return `At or below your limit from ${Dt(o.start)}, for ${qr(a - o.start)}`;
  }
  renderChart(e, t, r, i, s) {
    const c = e.map((m) => m.price).concat(t === void 0 ? [] : [t]), d = Math.max(...c), g = Math.min(...c), u = g < 0 ? g : Math.max(0, g - (d - g) * 0.5 - 0.01), y = d + (d - u) * 0.08, x = g < 0 ? 0 : u, w = (m) => (m - r) / (i - r) * 388, _ = (m) => 110 - (m - u) / (y - u) * 110, ze = z(f.charger, 70), K = z(f.home, 35), ne = e.map((m) => {
      const k = w(Math.max(m.start, r)), W = w(Math.min(m.end, i)), Z = Math.max(0.5, W - k - (W - k > 3 ? 1 : 0)), R = Math.min(_(m.price), _(x)), J = Math.max(1, Math.abs(_(m.price) - _(x))), ae = t !== void 0 && m.price <= t, U = m.start <= s && s < m.end;
      return O`<rect class="bar ${m.end <= s ? "past" : ""} ${U ? "current" : ""}"
        x=${k} y=${R} width=${Z} height=${J} rx="1.5"
        style="fill: ${ae ? ze : K}"
        @click=${() => this.setNumber("price_threshold", Math.round(m.price * 1e3) / 1e3)}>
        <title>${Dt(m.start)} · ${L(m.price)} · tap to use as limit</title>
      </rect>`;
    }), T = i - r, Ye = T > P ? 12 * Fe : 6 * Fe, I = [];
    for (let m = r; m <= i; m += Ye) {
      const k = m >= i ? "24" : m === r + P ? "tomorrow" : String(new Date(m).getHours());
      I.push({ at: m, text: k });
    }
    return l`<div class="chart">
      <svg viewBox="0 0 ${388} ${110}" preserveAspectRatio="none" aria-hidden="true">
        ${ne}
        ${T > P ? O`<line class="midnight" x1=${w(r + P)} x2=${w(r + P)} y1="0" y2=${110}></line>` : h}
        ${t === void 0 ? h : O`<line class="limit" x1="0" x2=${388} y1=${_(t)} y2=${_(t)}></line>`}
      </svg>
      ${t === void 0 ? h : l`<span class="limit-label" style="top: ${_(t) / 110 * 100}%">limit</span>`}
    </div>
    <div class="axis">
      ${I.map(
      (m) => l`<span style="left: ${(m.at - r) / T * 100}%">${m.text}</span>`
    )}
    </div>`;
  }
};
je.properties = {
  ...N.properties,
  _history: { state: !0 }
}, je.styles = [
  Xe,
  me`
      .chart {
        position: relative;
        height: 110px;
        margin-top: 12px;
      }
      .chart svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .bar {
        cursor: pointer;
      }
      .bar.past {
        opacity: 0.45;
      }
      .bar.current {
        stroke: var(--primary-text-color);
        stroke-width: 1.5;
        vector-effect: non-scaling-stroke;
      }
      .limit {
        stroke: var(--primary-text-color);
        stroke-width: 1.5;
        stroke-dasharray: 4 3;
        vector-effect: non-scaling-stroke;
      }
      .midnight {
        stroke: var(--divider-color);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .limit-label {
        position: absolute;
        right: 0;
        transform: translateY(-120%);
        padding: 0 4px;
        border-radius: 4px;
        font-size: 0.7rem;
        background: var(--card-background-color, #fff);
      }
      .axis {
        position: relative;
        height: 16px;
        margin-top: 4px;
        font-size: 0.7rem;
        color: var(--secondary-text-color);
      }
      .axis span {
        position: absolute;
        transform: translateX(-50%);
        white-space: nowrap;
      }
      .axis span:first-child {
        transform: none;
      }
      .axis span:last-child {
        transform: translateX(-100%);
      }
      .empty {
        margin-top: 12px;
        color: var(--secondary-text-color);
      }
      .note {
        margin-top: 6px;
      }
    `
];
let ct = je;
H("charging-coordinator-price-card-editor", Ce([Pe, Oe], Br));
H("charging-coordinator-price-card", ct);
Le(
  "charging-coordinator-price-card",
  "Charging Coordinator prices",
  "Today's prices against the price limit"
);
const Qt = [
  { value: "tiles", label: "Tiles: one tile per car" },
  { value: "rows", label: "Rows: one compact row per car" },
  { value: "spotlight", label: "Spotlight: the connected car large" }
], Kr = [
  { key: "connected_vehicle", domain: "sensor", label: "Connected vehicle (lists the cars)" },
  { key: "vehicle_connected", domain: "binary_sensor", label: "Cable at the charger" },
  { key: "charger_power", domain: "sensor", label: "Charger power" }
], Zr = 100, ft = class ft extends N {
  getCardSize() {
    var e;
    return ((e = this._config) == null ? void 0 : e.layout) === "rows" ? 2 : 3;
  }
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }
  static getStubConfig() {
    return { layout: "tiles" };
  }
  static getConfigElement() {
    return document.createElement("charging-coordinator-vehicle-card-editor");
  }
  setConfig(e) {
    if (e.layout !== void 0 && !Qt.some((t) => t.value === e.layout))
      throw new Error("layout must be tiles, rows or spotlight");
    super.setConfig(e);
  }
  cars() {
    var r;
    if (!this.hass) return [];
    const e = ((r = this.entity("binary_sensor", "vehicle_connected")) == null ? void 0 : r.state) !== "off", t = (v(this.entity("sensor", "charger_power")) ?? 0) >= Zr;
    return Zt(this.hass, this.entity("sensor", "connected_vehicle")).map((i) => ({
      ...i,
      status: i.connected && e ? t ? "charging" : "plugged" : "off"
    }));
  }
  render() {
    if (!this.hass || !this._config) return h;
    const e = this.entity("sensor", "connected_vehicle");
    if (!e) return this.renderMissing("connected_vehicle");
    const t = this.cars(), r = this._config.layout ?? "tiles";
    let i;
    return t.length ? r === "rows" ? i = l`<div class="rows">${t.map((s) => this.renderRow(s))}</div>` : r === "spotlight" ? i = this.renderSpotlight(t, e.state) : i = l`<div class="tiles">${t.map((s) => this.renderTile(s))}</div>` : i = l`<p class="empty">
        No cars set up yet. Add one in Settings → Devices &amp; services → Charging Coordinator →
        Add vehicle.
      </p>`, l`<ha-card class="layout-${r}">
      ${this._config.title ? l`<div class="title">${this._config.title}</div>` : h}
      ${i}
    </ha-card>`;
  }
  // --- parts --------------------------------------------------------------------
  renderImage(e) {
    return e.image ? l`<img class="pic" src=${e.image} alt="" loading="lazy" />` : l`<div class="pic placeholder"><ha-icon .icon=${"mdi:car-side"}></ha-icon></div>`;
  }
  renderStatus(e) {
    const t = v(this.entity("sensor", "charger_power")), [r, i] = e.status === "charging" ? ["mdi:lightning-bolt", `Charging · ${j(t)}`] : e.status === "plugged" ? ["mdi:power-plug", "Plugged in"] : ["mdi:power-plug-off-outline", "Not connected"];
    return l`<span class="status ${e.status}"><ha-icon .icon=${r}></ha-icon>${i}</span>`;
  }
  renderBar(e) {
    const t = (r) => Math.min(100, Math.max(0, r));
    return l`<div
      class="bar"
      role="meter"
      aria-label="${e.name} state of charge"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${e.soc ?? 0}
    >
      <div class="fill" style="width: ${t(e.soc ?? 0)}%"></div>
      ${e.target === void 0 ? h : l`<div class="goal" style="left: ${t(e.target)}%" title="Target ${e.target} %"></div>`}
    </div>`;
  }
  soc(e) {
    return e.soc === void 0 ? "–" : `${Math.round(e.soc)} %`;
  }
  range(e) {
    return e.range === void 0 ? "" : `${Math.round(e.range)} ${e.rangeUnit}`;
  }
  target(e, t) {
    return e.target === void 0 ? h : l`<span class="target">${t}<b>${Math.round(e.target)} %</b></span>`;
  }
  // --- layouts ------------------------------------------------------------------
  renderTile(e) {
    return l`<div class="tile ${e.status}">
      ${this.renderImage(e)}
      <div class="head"><span class="name">${e.name}</span>${this.renderStatus(e)}</div>
      <div class="nums">
        <span><span class="soc">${this.soc(e)}</span> ${this.target(e, "→ ")}</span>
        <span class="muted">${this.range(e)}</span>
      </div>
      ${this.renderBar(e)}
    </div>`;
  }
  renderRow(e) {
    const t = this.range(e);
    return l`<div class="line ${e.status}">
      ${this.renderImage(e)}
      <div class="who">
        <span class="name">${e.name}${e.status === "off" ? h : l`<i class="dot"></i>`}</span>
        ${this.renderStatus(e)}
      </div>
      <div class="gauge">
        <div class="top">
          <span class="soc">${this.soc(e)}</span>
          <span class="muted small nowrap"
            >${t}<span class="wide"
              >${t && e.target !== void 0 ? " · " : ""}${this.target(e, "")}</span
            ></span
          >
        </div>
        ${this.renderBar(e)}
      </div>
    </div>`;
  }
  /** The car on the cable large; the others, if any, as quiet lines below. */
  renderSpotlight(e, t) {
    const r = e.filter((o) => o.status !== "off"), i = r.find((o) => o.name === t) ?? r[0], s = e.filter((o) => o !== i);
    return l`
      ${i ? l`<div class="stage">
            ${this.renderImage(i)}
            <div class="info">
              <div class="head"><span class="name">${i.name}</span>${this.renderStatus(i)}</div>
              <div class="big">
                <span class="soc">${this.soc(i)}</span>
                <span class="muted small">${this.target(i, "to ")}${i.range !== void 0 && i.target !== void 0 ? " · " : ""}${this.range(i)}</span>
              </div>
              ${this.renderBar(i)}
            </div>
          </div>` : h}
      ${s.map(
      (o) => l`<div class="aside ${o.status}">
          ${this.renderImage(o)}
          <div class="aside-body">
            <div class="spread">
              <span><span class="name">${o.name}</span> ${this.renderStatus(o)}</span>
              <span class="muted small">${this.soc(o)}${o.range === void 0 ? "" : ` · ${this.range(o)}`}</span>
            </div>
            ${this.renderBar(o)}
          </div>
        </div>`
    )}
    `;
  }
};
ft.styles = [
  Xe,
  me`
      :host {
        --target: var(--warning-color, #ff9800);
        --ev: var(--success-color, #43a047);
      }
      ha-card {
        display: block;
        container-type: inline-size;
        padding: 12px 14px;
      }
      ha-card.layout-tiles {
        padding: 10px;
      }
      .empty {
        margin: 0;
        color: var(--secondary-text-color);
      }
      .name {
        font-weight: 500;
      }
      .small {
        font-size: 0.8rem;
      }
      .soc {
        font-size: 1.25rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .target {
        color: var(--secondary-text-color);
        font-size: 0.8rem;
        white-space: nowrap;
      }
      .target b {
        color: var(--target);
        font-weight: 500;
      }
      .status {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        font-size: 0.82rem;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .status ha-icon {
        --mdc-icon-size: 16px;
        flex: none;
      }
      .status.charging {
        color: var(--ev);
      }
      .status.plugged {
        color: var(--primary-text-color);
      }

      /* picture: the car's own image, or an icon in its place */
      .pic {
        display: block;
        width: 100%;
        object-fit: contain;
      }
      .pic.placeholder {
        display: grid;
        place-items: center;
        color: var(--secondary-text-color);
      }
      .off .pic {
        opacity: 0.55;
      }

      /* SoC bar with the target as a tick */
      .bar {
        position: relative;
        height: 8px;
        border-radius: 4px;
        background: color-mix(in srgb, var(--secondary-text-color) 30%, var(--card-background-color, #fff));
      }
      .bar .fill {
        height: 100%;
        border-radius: 4px;
        background: var(--ev);
      }
      .bar .goal {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 3px;
        margin-left: -1.5px;
        border-radius: 2px;
        background: var(--target);
      }

      /* tiles */
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }
      .tile {
        min-width: 0;
        padding: 8px 10px 10px;
        border: 1px solid transparent;
        border-radius: 10px;
        background: var(--secondary-background-color, transparent);
      }
      .tile:not(.off) {
        border-color: color-mix(in srgb, var(--ev) 70%, transparent);
        background: color-mix(in srgb, var(--ev) 8%, var(--secondary-background-color, transparent));
      }
      .tile .pic {
        height: 84px;
        margin-bottom: 4px;
      }
      .tile .pic.placeholder ha-icon {
        --mdc-icon-size: 56px;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 2px 8px;
        margin-bottom: 6px;
      }
      .nums {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }
      .nums > span:first-child {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0 6px;
      }
      .nums .muted {
        white-space: nowrap;
      }

      /* rows */
      .line {
        display: grid;
        grid-template-columns: 88px minmax(0, 1fr) minmax(120px, 150px);
        align-items: center;
        gap: 12px;
        padding: 6px 0;
      }
      .line + .line {
        border-top: 1px solid var(--divider-color);
      }
      .line .pic {
        height: 44px;
      }
      .line .pic.placeholder ha-icon {
        --mdc-icon-size: 36px;
      }
      .who {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .dot {
        display: inline-block;
        width: 7px;
        height: 7px;
        margin-left: 7px;
        border-radius: 50%;
        background: var(--ev);
        vertical-align: 2px;
      }
      .gauge {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .gauge .top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
      }
      .gauge .soc {
        font-size: 1.1rem;
      }

      /* spotlight */
      .stage {
        display: grid;
        grid-template-columns: 44% minmax(0, 1fr);
        align-items: center;
        gap: 14px;
      }
      .stage .pic {
        height: 96px;
      }
      .stage .pic.placeholder ha-icon {
        --mdc-icon-size: 64px;
      }
      .info {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }
      .info .head {
        margin: 0;
        justify-content: flex-start;
      }
      .big {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px 10px;
      }
      .big .soc {
        font-size: 1.9rem;
        line-height: 1;
      }
      .aside {
        display: grid;
        grid-template-columns: 64px minmax(0, 1fr);
        align-items: center;
        gap: 10px;
        padding-top: 8px;
      }
      .stage + .aside,
      .aside + .aside {
        margin-top: 10px;
        border-top: 1px solid var(--divider-color);
      }
      .aside .pic {
        height: 30px;
      }
      .aside .pic.placeholder ha-icon {
        --mdc-icon-size: 26px;
      }
      .aside-body {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 0;
      }
      .aside .bar {
        height: 5px;
      }
      .aside .bar .goal {
        top: -3px;
        bottom: -3px;
      }
      .aside .status {
        margin-left: 6px;
      }

      .nowrap {
        white-space: nowrap;
      }

      @container (max-width: 380px) {
        /* the target stays visible as the tick on the bar */
        .line .wide {
          display: none;
        }
        .line {
          grid-template-columns: 60px minmax(0, 1fr) 104px;
          gap: 10px;
        }
        .line .pic {
          height: 32px;
        }
        .stage {
          grid-template-columns: 38% minmax(0, 1fr);
          gap: 10px;
        }
        .stage .pic {
          height: 72px;
        }
        .big .soc {
          font-size: 1.5rem;
        }
      }
    `
];
let lt = ft;
H(
  "charging-coordinator-vehicle-card-editor",
  Ce(
    [
      Pe,
      {
        name: "layout",
        label: "Layout",
        selector: { select: { mode: "dropdown", options: Qt } }
      },
      Oe
    ],
    Kr
  )
);
H("charging-coordinator-vehicle-card", lt);
Le(
  "charging-coordinator-vehicle-card",
  "Charging Coordinator vehicles",
  "Your cars with picture, state of charge, target and whether they are plugged in"
);
const Jr = [
  { key: "status", domain: "sensor", label: "Status" },
  { key: "active_control", domain: "switch", label: "Active control" },
  { key: "charge_mode", domain: "select", label: "Charge mode" },
  { key: "phase_mode", domain: "select", label: "Phase mode" },
  { key: "grid_power", domain: "sensor", label: "Grid power (+ import, - export)" },
  { key: "pv_dc_power", domain: "sensor", label: "PV power of the hybrid inverter (can charge the battery directly)" },
  { key: "pv_inverter_power", domain: "sensor", label: "PV power of another inverter" },
  { key: "battery_power", domain: "sensor", label: "Battery power (+ discharge, - charge)" },
  { key: "battery_soc", domain: "sensor", label: "Battery state of charge" },
  { key: "battery_hold", domain: "binary_sensor", label: "Battery hold" },
  { key: "charger_power", domain: "sensor", label: "Charger power" },
  { key: "vehicle_connected", domain: "binary_sensor", label: "Vehicle connected" },
  { key: "connected_vehicle", domain: "sensor", label: "Connected vehicle (lists the cars)" },
  { key: "smart_pv", domain: "switch", label: "Smart: PV surplus" },
  { key: "smart_price", domain: "switch", label: "Smart: cheap price" },
  { key: "target_enabled", domain: "binary_sensor", label: "Charging released" },
  { key: "target_current", domain: "sensor", label: "Target current" },
  { key: "target_phases", domain: "sensor", label: "Target phases" },
  { key: "price", domain: "sensor", label: "Current price" },
  { key: "price_threshold", domain: "number", label: "Price limit" },
  { key: "price_cheap", domain: "binary_sensor", label: "Price at or below the limit" },
  { key: "pv_timer_remaining", domain: "sensor", label: "Start / stop timer" },
  { key: "phase_timer_remaining", domain: "sensor", label: "Phase switch timer" }
], Bt = [
  { value: "auto", label: "Auto", icon: "mdi:sine-wave" },
  { value: "1p", label: "1 phase", icon: "mdi:numeric-1-circle-outline" },
  { value: "3p", label: "3 phases", icon: "mdi:numeric-3-circle-outline" }
];
function Re(n) {
  if (n === void 0) return "";
  const e = Math.max(0, Math.round(n));
  return e >= 60 ? `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")} min` : `${e} s`;
}
function Qr(n) {
  return n && n[0].toUpperCase() + n.slice(1);
}
const $e = 388, xe = 140, Ft = 122, re = 262, X = 168, le = 216, S = { x: 192, top: 6, w: 40, h: 44 }, D = 26, B = 112, ei = 36, ti = 6e3, F = 30;
function ri(n) {
  return Math.min(6, Math.max(0.9, 4e3 / (n + 400)));
}
function de(n, e) {
  return `${n / e * 100}%`;
}
function _e(n) {
  return Math.max(6, n / 2 + 4);
}
function V(...n) {
  return n.map((e) => typeof e == "number" && !Number.isInteger(e) ? e.toFixed(1) : String(e)).join(" ");
}
let ii = 0;
const We = class We extends N {
  constructor() {
    var e;
    super(...arguments), this._menu = null, this._menuPos = { left: 16, top: 56 }, this._uid = `ccc${++ii}`, this._reducedMotion = ((e = window.matchMedia) == null ? void 0 : e.call(window, "(prefers-reduced-motion: reduce)").matches) ?? !1;
  }
  getCardSize() {
    return 5;
  }
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }
  static getStubConfig() {
    return {};
  }
  static getConfigElement() {
    return document.createElement("charging-coordinator-card-editor");
  }
  async select(e, t) {
    this._menu = null, await this.selectOption(e, t);
  }
  /** The cars set up in the integration, and which one it takes as plugged in. */
  vehicleState() {
    var o;
    const e = this.entity("sensor", "connected_vehicle"), t = this.hass ? Zt(this.hass, e) : [], r = (o = this.entity("binary_sensor", "vehicle_connected")) == null ? void 0 : o.state, i = r === "on" ? !0 : r === "off" ? !1 : void 0, s = i ? t.find((a) => a.name === (e == null ? void 0 : e.state)) : void 0;
    return { connected: i, car: s, others: t.filter((a) => a !== s) };
  }
  /** "Smart · PV + price": the mode with the sources smart mode uses. */
  modeLabel(e) {
    var s, o;
    if (!e) return "–";
    if (e.value !== "smart") return e.label;
    const t = ((s = this.entity("switch", "smart_pv")) == null ? void 0 : s.state) === "on", r = ((o = this.entity("switch", "smart_price")) == null ? void 0 : o.state) === "on", i = [t ? "PV" : "", r ? "price" : ""].filter(Boolean).join(" + ");
    return i ? `Smart · ${i}` : "Smart · nothing";
  }
  // --- render ---------------------------------------------------------------
  render() {
    var a;
    if (!this.hass || !this._config) return h;
    const e = this.entity("sensor", "status");
    if (!e)
      return l`<ha-card>
        <div class="warning">
          Charging Coordinator entities not found (looked for ${this.entityId("sensor", "status")}).
        </div>
      </ha-card>`;
    const t = ((a = this.entity("switch", "active_control")) == null ? void 0 : a.state) === "on", r = Be.find((c) => {
      var d;
      return c.value === ((d = this.entity("select", "charge_mode")) == null ? void 0 : d.state);
    }), i = Bt.find(
      (c) => {
        var d;
        return c.value === ((d = this.entity("select", "phase_mode")) == null ? void 0 : d.state);
      }
    ), s = v(this.entity("sensor", "target_phases")), o = this.vehicleState();
    return l`
      <ha-card>
        ${this._config.title ? l`<div class="title">${this._config.title}</div>` : h}
        <div class="top">
          <div class="chips">
            ${this.renderChip("mode", (r == null ? void 0 : r.icon) ?? "mdi:help", this.modeLabel(r), "Charge mode")}
            ${this.renderChip(
      "phase",
      (i == null ? void 0 : i.icon) ?? "mdi:sine-wave",
      (i == null ? void 0 : i.value) === "auto" && s ? `Auto · ${s}p` : (i == null ? void 0 : i.label) ?? "–",
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
        ${this.renderMenu()} ${this.renderHeadline(e, r == null ? void 0 : r.value)}
        ${this.renderFlow(o)} ${this.renderFacts(e, o)}
      </ha-card>
    `;
  }
  renderChip(e, t, r, i) {
    const s = this._menu === e;
    return l`
      <button
        class="chip ${s ? "open" : ""}"
        title=${i}
        aria-haspopup="menu"
        aria-expanded=${s ? "true" : "false"}
        @click=${(o) => {
      const a = o.currentTarget;
      this._menuPos = { left: a.offsetLeft, top: a.offsetTop + a.offsetHeight + 4 }, this._menu = s ? null : e;
    }}
      >
        <ha-icon .icon=${t}></ha-icon>
        <span>${r}</span>
        <ha-icon class="chevron" .icon=${"mdi:chevron-down"}></ha-icon>
      </button>
    `;
  }
  renderMenu() {
    var s;
    if (!this._menu) return h;
    const e = this._menu, t = e === "mode" ? Be : Bt, r = e === "mode" ? "charge_mode" : "phase_mode", i = (s = this.entity("select", r)) == null ? void 0 : s.state;
    return l`
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
      (o) => l`
            <button
              role="menuitemradio"
              aria-checked=${o.value === i ? "true" : "false"}
              class=${o.value === i ? "selected" : ""}
              @click=${() => this.select(r, o.value)}
            >
              <ha-icon .icon=${o.icon}></ha-icon>
              <span>${o.label}</span>
              ${o.value === i ? l`<ha-icon class="check" .icon=${"mdi:check"}></ha-icon>` : h}
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
    var w, _;
    const r = (w = this.entity("binary_sensor", "vehicle_connected")) == null ? void 0 : w.state, i = ((_ = this.entity("binary_sensor", "target_enabled")) == null ? void 0 : _.state) === "on", s = v(this.entity("sensor", "charger_power")), o = v(this.entity("sensor", "target_current")), a = v(this.entity("sensor", "target_phases")), c = e.state, d = c.indexOf(": "), g = Qr(d >= 0 ? c.slice(d + 2) : c);
    let u, y = "", x = "";
    return r === void 0 || r === "unknown" || r === "unavailable" ? (u = "Waiting for charger data", x = "muted") : r === "off" ? (u = "No vehicle connected", y = t === "off" ? "Charging is off" : "", x = "muted") : t === "off" ? (u = "Charging off", x = "muted") : i && (s ?? 0) > 100 ? (u = `Charging · ${j(s)}`, y = a && o ? `${a}p · ${o} A` : "", x = "charging") : i ? (u = "Ready", y = "Charging released, the vehicle is not drawing power") : (u = "Paused", y = /^(enabling|disabling) in /i.test(g) ? "" : g), l`
      <div class="headline ${x}">
        <div class="state">${u}</div>
        ${y ? l`<div class="sub">${y}</div>` : h}
      </div>
    `;
  }
  renderFlow(e) {
    var xt;
    const t = v(this.entity("sensor", "grid_power")), r = v(this.entity("sensor", "pv_dc_power")), i = v(this.entity("sensor", "pv_inverter_power")), s = r === void 0 && i === void 0 ? void 0 : (r ?? 0) + (i ?? 0), o = v(this.entity("sensor", "battery_power")), a = v(this.entity("sensor", "battery_soc")), c = v(this.entity("sensor", "charger_power")), d = ((xt = this.entity("binary_sensor", "battery_hold")) == null ? void 0 : xt.state) === "on", g = t === void 0 ? void 0 : t + (s ?? 0) + (o ?? 0) - (c ?? 0), u = Math.max(0, s ?? 0), y = Math.max(0, t ?? 0), x = Math.max(0, o ?? 0), w = Math.max(0, -(o ?? 0)), _ = Math.min(w, Math.max(0, r ?? 0)), ze = w - _, K = Math.min(u - _, Math.max(0, -(t ?? 0))), ne = Math.max(0, g ?? 0), T = Math.max(0, c ?? 0), Ye = ei / Math.max(u + y + x, ti), I = (b) => b > F ? Math.max(2, b * Ye) : 0, m = I(_), k = I(K), W = I(u - _ - K), Z = I(y), R = W + Z, J = I(ze), ae = I(x), U = Math.max(0, R - J + ae), bt = ne > F ? ne : 0, vt = T > F ? T : 0, Ne = bt + vt, qe = Ne > 0 ? U * bt / Ne : 0, He = Ne > 0 ? U * vt / Ne : 0, Ke = K > F || (t ?? 0) < -F ? f.gridOut : f.gridIn, Ze = d ? f.hold : (o ?? 0) < -F ? f.batteryIn : (o ?? 0) > F ? f.batteryOut : f.home, yt = T > F ? f.charger : f.idle, A = B + Math.max(R, U) / 2, M = S.x, fe = S.top + S.h, C = Ft, Te = D - (m + W + k) / 2, er = (b) => {
      const p = _e(b), $ = Te + m + b / 2, E = A - R + b / 2, ce = X - 1 - 2 * p;
      return V(
        "M",
        C,
        $,
        "L",
        ce,
        $,
        "A",
        p,
        p,
        0,
        0,
        1,
        ce + p,
        $ + p,
        "L",
        ce + p,
        E - p,
        "A",
        p,
        p,
        0,
        0,
        0,
        ce + 2 * p,
        E,
        "L",
        X + 0.5,
        E
      );
    }, tr = (b) => {
      const p = _e(b), $ = Te + m + W + b / 2;
      return V(
        "M",
        C,
        $,
        "A",
        p,
        p,
        0,
        0,
        1,
        C + p,
        $ + p,
        "L",
        C + p,
        B - p,
        "A",
        p,
        p,
        0,
        0,
        1,
        C,
        B
      );
    }, rr = (b) => {
      const p = Te + b / 2;
      return V("M", C, p, "L", M - S.w / 2 + 1, p);
    }, ir = (b) => {
      const p = A - b / 2;
      return V("M", C, p, "L", X + 0.5, p);
    }, sr = (b) => {
      const p = _e(b), $ = A - R + b / 2;
      return V(
        "M",
        X - 0.5,
        $,
        "L",
        M - p,
        $,
        "A",
        p,
        p,
        0,
        0,
        0,
        M,
        $ - p,
        "L",
        M,
        fe
      );
    }, or = (b) => {
      const p = _e(b), $ = A - U + b / 2;
      return V(
        "M",
        M,
        fe,
        "L",
        M,
        $ - p,
        "A",
        p,
        p,
        0,
        0,
        0,
        M + p,
        $,
        "L",
        le + 0.5,
        $
      );
    }, nr = (b) => {
      const p = _e(b), $ = A - U + b / 2, E = re - 1 - 2 * p;
      return V(
        "M",
        le - 0.5,
        $,
        "L",
        E,
        $,
        "A",
        p,
        p,
        0,
        0,
        0,
        E + p,
        $ - p,
        "L",
        E + p,
        D + p,
        "A",
        p,
        p,
        0,
        0,
        1,
        E + 2 * p,
        D,
        "L",
        re,
        D
      );
    }, ar = (b) => {
      const p = A - b / 2;
      return V("M", le - 0.5, p, "L", re, p);
    }, G = (b) => `${this._uid}-${b}`, $t = z(f.home), Q = (b, p, $, E, ce, dr, hr) => O`<linearGradient id=${G(b)} gradientUnits="userSpaceOnUse" x1=${p} y1=${$} x2=${E} y2=${ce}>
        <stop offset="0.25" style="stop-color: ${z(dr)}"></stop>
        <stop offset="1" style="stop-color: ${z(hr)}"></stop>
      </linearGradient>`, cr = O`<defs>
      ${Q("pv", 0, D, 0, A - R, f.pv, f.home)}
      ${Q("direct", C, 0, M - S.w / 2, 0, f.pv, f.batteryIn)}
      ${Q("grid", C, 0, X, 0, f.gridIn, f.home)}
      ${Q("export", 0, D, 0, B, f.pv, f.gridOut)}
      ${Q("charge", 0, A - R, 0, fe, f.home, f.batteryIn)}
      ${Q("discharge", 0, fe, 0, A - U, f.batteryOut, f.home)}
      ${Q("ev", le, 0, re, 0, f.home, f.charger)}
    </defs>`, be = (b, p, $, E) => p > 0 ? this.pipe(b(p), p, $, E) : h, ee = J ? U : R, ve = (b, p, $, E) => $ > 0 ? O`<rect x=${b - 1.5} y=${p} width="3" height=${$} rx="1.5" style="fill: ${E}"></rect>` : h, lr = Math.min(100, Math.max(0, a ?? 0)) / 100, Ie = (S.h - 4) * lr;
    return l`
      <div class="flow" style="aspect-ratio: ${$e} / ${xe}">
        <svg viewBox="0 0 ${$e} ${xe}" aria-hidden="true">
          ${cr}
          ${ee > 0 ? O`<rect x=${X} y=${A - ee} width=${le - X} height=${ee} style="fill: ${$t}"></rect>` : h}
          ${be(rr, m, `url(#${G("direct")})`, _)}
          ${be(er, W, `url(#${G("pv")})`, u - _ - K)}
          ${k > 0 ? this.pipe(tr(k), k, `url(#${G("export")})`, K) : h}
          ${k > 0 ? h : be(ir, Z, `url(#${G("grid")})`, y)}
          ${ae > 0 ? this.pipe(or(ae), ae, `url(#${G("discharge")})`, x) : J > 0 ? this.pipe(sr(J), J, `url(#${G("charge")})`, ze) : h}
          ${be(nr, qe, $t, ne)}
          ${be(ar, He, `url(#${G("ev")})`, T)}
          ${ee > 0 ? this.pulse(V("M", X, A - ee / 2, "L", le, A - ee / 2), ee, ne + T) : h}
          ${ve(C - 1.5, Te, m + W + k, f.pv)}
          ${k > 0 ? ve(C - 1.5, B - k / 2, k, Ke) : ve(C - 1.5, Z ? A - Z : B, Z, Ke)}
          ${ve(re + 1.5, D - qe / 2, qe, f.home)}
          ${ve(re + 1.5, He ? A - He : B, He, yt)}
          <rect x=${M - 7} y=${S.top - 4} width="14" height="5" rx="1.5"
            style="fill: ${Ze}"></rect>
          <rect class="battery" x=${M - S.w / 2} y=${S.top} width=${S.w}
            height=${S.h} rx="7" style="stroke: ${Ze}"></rect>
          ${Ie > 0 ? O`<rect x=${M - S.w / 2 + 3} y=${fe - 3 - Ie}
                width=${S.w - 6} height=${Ie} rx=${Math.min(4, Ie / 2)}
                style="fill: ${z(Ze)}"></rect>` : h}
        </svg>

        ${this.renderSide("left", D, "mdi:solar-power-variant", f.pv, j(s), "PV")}
        ${this.renderSide(
      "left",
      B,
      "mdi:transmission-tower",
      Ke,
      j(t === void 0 ? void 0 : Math.abs(t)),
      t === void 0 ? "Grid" : t >= 0 ? "Grid import" : "Grid export"
    )}
        ${this.renderSide("right", D, "mdi:home", f.home, j(g), "Home")}
        ${this.renderSide(
      "right",
      B,
      "mdi:ev-station",
      yt,
      j(c),
      this.renderChargerSub(e)
    )}
        <div
          class="battery-label"
          style="left: ${de(M, $e)}; top: ${de(S.top + S.h / 2, xe)}"
          title=${d ? "Battery hold: the home battery is not discharging" : "Home battery"}
        >
          <div class="value">${a === void 0 ? "–" : `${Math.round(a)}%`}</div>
          <div class="node-sub">
            ${d ? l`<b class="hold">hold</b>` : j(o === void 0 ? void 0 : Math.abs(o))}
          </div>
        </div>
      </div>
    `;
  }
  /** A pipe of the given width along `d` (drawn in flow direction), with moving dots. */
  pipe(e, t, r, i) {
    return O`<path class="pipe" d=${e} style="stroke: ${r}; stroke-width: ${t.toFixed(1)}"></path>
      ${this.pulse(e, t, i)}`;
  }
  pulse(e, t, r) {
    return this._reducedMotion || r <= F ? h : O`<path class="pulse" d=${e}
      style="stroke-width: ${Math.min(4, Math.max(2, t * 0.4)).toFixed(1)}">
      <animate attributeName="stroke-dashoffset" from="0" to="-36"
        dur="${ri(r).toFixed(2)}s" repeatCount="indefinite"></animate>
    </path>`;
  }
  renderSide(e, t, r, i, s, o) {
    const a = e === "left" ? `right: calc(100% - ${de(Ft - 8, $e)}); top: ${de(t, xe)}; text-align: right;` : `left: ${de(re + 8, $e)}; top: ${de(t, xe)};`, c = l`<ha-icon .icon=${r} style="color: ${i}"></ha-icon>`;
    return l`
      <div class="side ${e}" style=${a}>
        ${e === "right" ? c : h}
        <div>
          <div class="value">${s}</div>
          ${typeof o == "string" ? l`<div class="node-sub">${o}</div>` : o}
        </div>
        ${e === "left" ? c : h}
      </div>
    `;
  }
  renderChargerSub(e) {
    const { connected: t, car: r } = e;
    return r ? l`<div class="car" title=${r.socEntity ?? ""}>
        <span>${r.name}</span>${this.renderSocBar(r.soc)}
        <b>${r.soc === void 0 ? "–" : `${Math.round(r.soc)} %`}</b>
      </div>` : l`<div class="node-sub">${t === void 0 ? "–" : t ? "Vehicle connected" : "No vehicle"}</div>`;
  }
  renderSocBar(e) {
    return l`<span class="bar"
      ><span style="width: ${Math.min(100, Math.max(0, e ?? 0))}%"></span
    ></span>`;
  }
  /** Cars that aren't at the charger. */
  renderVehicleChips(e) {
    return e.others.map(
      (t) => l`<span class="fact vehicle" title=${t.socEntity ?? ""}>
        <span class="vname">${t.name}</span>${this.renderSocBar(t.soc)}
        <b>${t.soc === void 0 ? "–" : `${Math.round(t.soc)} %`}</b>
      </span>`
    );
  }
  renderFacts(e, t) {
    var x, w;
    const r = this.renderVehicleChips(t), i = t.connected === !0, s = this.entity("sensor", "pv_timer_remaining"), o = this.entity("sensor", "phase_timer_remaining");
    i && (s == null ? void 0 : s.attributes.action) === "enable" ? r.push(this.fact("mdi:timer-play-outline", `Starts in ${Re(v(s))}`, "info")) : i && (s == null ? void 0 : s.attributes.action) === "disable" && r.push(this.fact("mdi:timer-stop-outline", `Stops in ${Re(v(s))}`, "warn")), i && (o == null ? void 0 : o.attributes.action) === "scale3p" ? r.push(this.fact("mdi:timer-sync-outline", `3 phases in ${Re(v(o))}`, "info")) : i && (o == null ? void 0 : o.attributes.action) === "scale1p" && r.push(this.fact("mdi:timer-sync-outline", `1 phase in ${Re(v(o))}`, "info")), e.state.includes("phase switch settling") && r.push(this.fact("mdi:timer-sand", "Phase switch settling", "info"));
    const a = v(this.entity("sensor", "price")), c = v(this.entity("number", "price_threshold")), d = ((x = this.entity("binary_sensor", "price_cheap")) == null ? void 0 : x.state) === "on";
    a !== void 0 && r.push(
      this.fact(
        d ? "mdi:cash-check" : "mdi:cash",
        `${a.toFixed(3)} ${c === void 0 ? "" : `${d ? "≤" : ">"} ${c.toFixed(3)}`}${d ? " · cheap" : ""}`,
        d ? "good" : "",
        "Price against threshold"
      )
    );
    const g = ((w = this.entity("binary_sensor", "battery_hold")) == null ? void 0 : w.state) === "on", u = e.attributes.battery_reason;
    g && r.push(
      this.fact(
        "mdi:battery-lock",
        `Battery hold${u ? ` · ${u.replace("ev ", "EV ")}` : ""}`,
        "warn",
        "The home battery is not discharging"
      )
    );
    const y = e.attributes.limit_reason;
    if (e.attributes.limited && y) {
      const _ = e.state.includes("blocked by");
      r.push(
        this.fact(
          _ ? "mdi:cancel" : "mdi:speedometer-slow",
          `${_ ? "Blocked" : "Limited"} · ${y}`,
          "warn",
          "Protection limit"
        )
      );
    }
    return r.length ? l`<div class="facts">${r}</div>` : h;
  }
  fact(e, t, r, i = "") {
    return l`<span class="fact ${r}" title=${i}
      ><ha-icon .icon=${e}></ha-icon>${t}</span
    >`;
  }
};
We.properties = {
  ...N.properties,
  _menu: { state: !0 }
}, We.styles = me`
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

    /* headline: state and details on one line */
    .headline {
      margin: 10px 0 2px;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: 10px;
    }
    .headline .state {
      font-size: 1.15rem;
      font-weight: 500;
      line-height: 1.3;
    }
    .headline.charging .state {
      color: var(--success-color, #43a047);
    }
    .headline.muted .state {
      color: var(--secondary-text-color);
    }
    .headline .sub {
      color: var(--secondary-text-color);
      font-size: 0.9rem;
    }

    /* flow diagram */
    .flow {
      container-type: inline-size;
      position: relative;
      width: 100%;
      max-width: 480px;
      margin: 10px auto 0;
    }
    .flow > svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .pipe {
      fill: none;
      stroke-linecap: butt;
    }
    .pulse {
      fill: none;
      stroke: var(--primary-text-color, #212121);
      stroke-opacity: 0.45;
      stroke-linecap: round;
      stroke-dasharray: 0.1 18;
    }
    .battery {
      fill: var(--card-background-color, #fff);
      stroke-width: 2;
    }
    .side {
      position: absolute;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      line-height: 1.25;
    }
    .side .value {
      font-weight: 500;
    }
    .side ha-icon {
      /* a shrink-to-fit label can otherwise collapse the icon to zero width */
      --mdc-icon-size: 28px;
      flex: none;
      width: 28px;
      height: 28px;
    }
    .battery-label {
      position: absolute;
      transform: translate(-50%, -50%);
      text-align: center;
      white-space: nowrap;
      line-height: 1.15;
      pointer-events: auto;
    }
    .battery-label .value {
      font-size: 0.85rem;
      font-weight: 500;
    }
    .battery-label .node-sub {
      font-size: 0.68rem;
    }
    .node-sub {
      font-size: 0.78rem;
      color: var(--secondary-text-color);
    }
    .hold {
      color: var(--warning-color, #ffa600);
    }

    @container (max-width: 360px) {
      .side {
        gap: 6px;
      }
      .side ha-icon {
        --mdc-icon-size: 24px;
        width: 24px;
        height: 24px;
      }
      .side .car .bar {
        width: 20px;
      }
      .battery-label .value {
        font-size: 0.78rem;
      }
      .battery-label .node-sub {
        font-size: 0.62rem;
      }
    }

    /* cars: the plugged-in one at the charger, the others in the bottom row */
    .car {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.78rem;
    }
    .car b,
    .vehicle b {
      font-weight: 500;
    }
    .bar {
      flex: none;
      width: 30px;
      height: 5px;
      border-radius: 3px;
      background: var(--divider-color, #e0e0e0);
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--success-color, #43a047);
    }
    .vehicle .bar span {
      background: var(--secondary-text-color);
    }
    .vehicle .vname {
      color: var(--secondary-text-color);
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
let dt = We;
H("charging-coordinator-card-editor", Ce([Pe, Oe], Jr));
H("charging-coordinator-card", dt);
Le(
  "charging-coordinator-card",
  "Charging Coordinator",
  "Energy flow, charging state, vehicles and controls of the Charging Coordinator"
);
