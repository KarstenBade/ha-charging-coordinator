/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ie = globalThis, dt = Ie.ShadowRoot && (Ie.ShadyCSS === void 0 || Ie.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ht = Symbol(), At = /* @__PURE__ */ new WeakMap();
let qt = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== ht) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (dt && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = At.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && At.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const bi = (n) => new qt(typeof n == "string" ? n : n + "", void 0, ht), Me = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, r, o) => i + ((s) => {
    if (s._$cssResult$ === !0) return s.cssText;
    if (typeof s == "number") return s;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + s + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + n[o + 1], n[0]);
  return new qt(t, n, ht);
}, vi = (n, e) => {
  if (dt) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), r = Ie.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = t.cssText, n.appendChild(i);
  }
}, St = dt ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return bi(t);
})(n) : n;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: yi, defineProperty: $i, getOwnPropertyDescriptor: _i, getOwnPropertyNames: xi, getOwnPropertySymbols: wi, getPrototypeOf: ki } = Object, q = globalThis, Et = q.trustedTypes, Ai = Et ? Et.emptyScript : "", Ke = q.reactiveElementPolyfillSupport, xe = (n, e) => n, tt = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? Ai : null;
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
} }, Yt = (n, e) => !yi(n, e), Mt = { attribute: !0, type: String, converter: tt, reflect: !1, useDefault: !1, hasChanged: Yt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), q.litPropertyMetadata ?? (q.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let pe = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Mt) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(e, i, t);
      r !== void 0 && $i(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: r, set: o } = _i(this.prototype, e) ?? { get() {
      return this[t];
    }, set(s) {
      this[t] = s;
    } };
    return { get: r, set(s) {
      const a = r == null ? void 0 : r.call(this);
      o == null || o.call(this, s), this.requestUpdate(e, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Mt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(xe("elementProperties"))) return;
    const e = ki(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(xe("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(xe("properties"))) {
      const t = this.properties, i = [...xi(t), ...wi(t)];
      for (const r of i) this.createProperty(r, t[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, r] of t) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const r = this._$Eu(t, i);
      r !== void 0 && this._$Eh.set(r, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const r of i) t.unshift(St(r));
    } else e !== void 0 && t.push(St(e));
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
    return vi(e, this.constructor.elementStyles), e;
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
    var o;
    const i = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, i);
    if (r !== void 0 && i.reflect === !0) {
      const s = (((o = i.converter) == null ? void 0 : o.toAttribute) !== void 0 ? i.converter : tt).toAttribute(t, i.type);
      this._$Em = e, s == null ? this.removeAttribute(r) : this.setAttribute(r, s), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var o, s;
    const i = this.constructor, r = i._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const a = i.getPropertyOptions(r), c = typeof a.converter == "function" ? { fromAttribute: a.converter } : ((o = a.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? a.converter : tt;
      this._$Em = r;
      const l = c.fromAttribute(t, a.type);
      this[r] = l ?? ((s = this._$Ej) == null ? void 0 : s.get(r)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, r = !1, o) {
    var s;
    if (e !== void 0) {
      const a = this.constructor;
      if (r === !1 && (o = this[e]), i ?? (i = a.getPropertyOptions(e)), !((i.hasChanged ?? Yt)(o, t) || i.useDefault && i.reflect && o === ((s = this._$Ej) == null ? void 0 : s.get(e)) && !this.hasAttribute(a._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: r, wrapped: o }, s) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, s ?? t ?? this[e]), o !== !0 || s !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
        for (const [o, s] of this._$Ep) this[o] = s;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, s] of r) {
        const { wrapped: a } = s, c = this[o];
        a !== !0 || this._$AL.has(o) || c === void 0 || this.C(o, void 0, s, c);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach((r) => {
        var o;
        return (o = r.hostUpdate) == null ? void 0 : o.call(r);
      }), this.update(t)) : this._$EM();
    } catch (r) {
      throw e = !1, this._$EM(), r;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((i) => {
      var r;
      return (r = i.hostUpdated) == null ? void 0 : r.call(i);
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
pe.elementStyles = [], pe.shadowRootOptions = { mode: "open" }, pe[xe("elementProperties")] = /* @__PURE__ */ new Map(), pe[xe("finalized")] = /* @__PURE__ */ new Map(), Ke == null || Ke({ ReactiveElement: pe }), (q.reactiveElementVersions ?? (q.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const we = globalThis, Pt = (n) => n, De = we.trustedTypes, Ct = De ? De.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Kt = "$lit$", X = `lit$${Math.random().toFixed(9).slice(2)}$`, Zt = "?" + X, Si = `<${Zt}>`, ne = document, Ae = () => ne.createComment(""), Se = (n) => n === null || typeof n != "object" && typeof n != "function", pt = Array.isArray, Ei = (n) => pt(n) || typeof (n == null ? void 0 : n[Symbol.iterator]) == "function", Ze = `[ 	
\f\r]`, ve = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ot = /-->/g, Lt = />/g, te = RegExp(`>|${Ze}(?:([^\\s"'>=/]+)(${Ze}*=${Ze}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Nt = /'/g, Ht = /"/g, Jt = /^(?:script|style|textarea|title)$/i, Qt = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), h = Qt(1), L = Qt(2), ue = Symbol.for("lit-noChange"), p = Symbol.for("lit-nothing"), Tt = /* @__PURE__ */ new WeakMap(), re = ne.createTreeWalker(ne, 129);
function ei(n, e) {
  if (!pt(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ct !== void 0 ? Ct.createHTML(e) : e;
}
const Mi = (n, e) => {
  const t = n.length - 1, i = [];
  let r, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", s = ve;
  for (let a = 0; a < t; a++) {
    const c = n[a];
    let l, u, m = -1, v = 0;
    for (; v < c.length && (s.lastIndex = v, u = s.exec(c), u !== null); ) v = s.lastIndex, s === ve ? u[1] === "!--" ? s = Ot : u[1] !== void 0 ? s = Lt : u[2] !== void 0 ? (Jt.test(u[2]) && (r = RegExp("</" + u[2], "g")), s = te) : u[3] !== void 0 && (s = te) : s === te ? u[0] === ">" ? (s = r ?? ve, m = -1) : u[1] === void 0 ? m = -2 : (m = s.lastIndex - u[2].length, l = u[1], s = u[3] === void 0 ? te : u[3] === '"' ? Ht : Nt) : s === Ht || s === Nt ? s = te : s === Ot || s === Lt ? s = ve : (s = te, r = void 0);
    const $ = s === te && n[a + 1].startsWith("/>") ? " " : "";
    o += s === ve ? c + Si : m >= 0 ? (i.push(l), c.slice(0, m) + Kt + c.slice(m) + X + $) : c + X + (m === -2 ? a : $);
  }
  return [ei(n, o + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class Ee {
  constructor({ strings: e, _$litType$: t }, i) {
    let r;
    this.parts = [];
    let o = 0, s = 0;
    const a = e.length - 1, c = this.parts, [l, u] = Mi(e, t);
    if (this.el = Ee.createElement(l, i), re.currentNode = this.el.content, t === 2 || t === 3) {
      const m = this.el.content.firstChild;
      m.replaceWith(...m.childNodes);
    }
    for (; (r = re.nextNode()) !== null && c.length < a; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const m of r.getAttributeNames()) if (m.endsWith(Kt)) {
          const v = u[s++], $ = r.getAttribute(m).split(X), w = /([.?@])?(.*)/.exec(v);
          c.push({ type: 1, index: o, name: w[2], strings: $, ctor: w[1] === "." ? Ci : w[1] === "?" ? Oi : w[1] === "@" ? Li : We }), r.removeAttribute(m);
        } else m.startsWith(X) && (c.push({ type: 6, index: o }), r.removeAttribute(m));
        if (Jt.test(r.tagName)) {
          const m = r.textContent.split(X), v = m.length - 1;
          if (v > 0) {
            r.textContent = De ? De.emptyScript : "";
            for (let $ = 0; $ < v; $++) r.append(m[$], Ae()), re.nextNode(), c.push({ type: 2, index: ++o });
            r.append(m[v], Ae());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Zt) c.push({ type: 2, index: o });
      else {
        let m = -1;
        for (; (m = r.data.indexOf(X, m + 1)) !== -1; ) c.push({ type: 7, index: o }), m += X.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const i = ne.createElement("template");
    return i.innerHTML = e, i;
  }
}
function me(n, e, t = n, i) {
  var s, a;
  if (e === ue) return e;
  let r = i !== void 0 ? (s = t._$Co) == null ? void 0 : s[i] : t._$Cl;
  const o = Se(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== o && ((a = r == null ? void 0 : r._$AO) == null || a.call(r, !1), o === void 0 ? r = void 0 : (r = new o(n), r._$AT(n, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = r : t._$Cl = r), r !== void 0 && (e = me(n, r._$AS(n, e.values), r, i)), e;
}
class Pi {
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
    const { el: { content: t }, parts: i } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? ne).importNode(t, !0);
    re.currentNode = r;
    let o = re.nextNode(), s = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (s === c.index) {
        let l;
        c.type === 2 ? l = new Pe(o, o.nextSibling, this, e) : c.type === 1 ? l = new c.ctor(o, c.name, c.strings, this, e) : c.type === 6 && (l = new Ni(o, this, e)), this._$AV.push(l), c = i[++a];
      }
      s !== (c == null ? void 0 : c.index) && (o = re.nextNode(), s++);
    }
    return re.currentNode = ne, r;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class Pe {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, r) {
    this.type = 2, this._$AH = p, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
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
    e = me(this, e, t), Se(e) ? e === p || e == null || e === "" ? (this._$AH !== p && this._$AR(), this._$AH = p) : e !== this._$AH && e !== ue && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ei(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== p && Se(this._$AH) ? this._$AA.nextSibling.data = e : this.T(ne.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var o;
    const { values: t, _$litType$: i } = e, r = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = Ee.createElement(ei(i.h, i.h[0]), this.options)), i);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === r) this._$AH.p(t);
    else {
      const s = new Pi(r, this), a = s.u(this.options);
      s.p(t), this.T(a), this._$AH = s;
    }
  }
  _$AC(e) {
    let t = Tt.get(e.strings);
    return t === void 0 && Tt.set(e.strings, t = new Ee(e)), t;
  }
  k(e) {
    pt(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, r = 0;
    for (const o of e) r === t.length ? t.push(i = new Pe(this.O(Ae()), this.O(Ae()), this, this.options)) : i = t[r], i._$AI(o), r++;
    r < t.length && (this._$AR(i && i._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e !== this._$AB; ) {
      const r = Pt(e).nextSibling;
      Pt(e).remove(), e = r;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class We {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, r, o) {
    this.type = 1, this._$AH = p, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = p;
  }
  _$AI(e, t = this, i, r) {
    const o = this.strings;
    let s = !1;
    if (o === void 0) e = me(this, e, t, 0), s = !Se(e) || e !== this._$AH && e !== ue, s && (this._$AH = e);
    else {
      const a = e;
      let c, l;
      for (e = o[0], c = 0; c < o.length - 1; c++) l = me(this, a[i + c], t, c), l === ue && (l = this._$AH[c]), s || (s = !Se(l) || l !== this._$AH[c]), l === p ? e = p : e !== p && (e += (l ?? "") + o[c + 1]), this._$AH[c] = l;
    }
    s && !r && this.j(e);
  }
  j(e) {
    e === p ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Ci extends We {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === p ? void 0 : e;
  }
}
class Oi extends We {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== p);
  }
}
class Li extends We {
  constructor(e, t, i, r, o) {
    super(e, t, i, r, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = me(this, e, t, 0) ?? p) === ue) return;
    const i = this._$AH, r = e === p && i !== p || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== p && (i === p || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Ni {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    me(this, e);
  }
}
const Je = we.litHtmlPolyfillSupport;
Je == null || Je(Ee, Pe), (we.litHtmlVersions ?? (we.litHtmlVersions = [])).push("3.3.3");
const Hi = (n, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = r = new Pe(e.insertBefore(Ae(), o), o, void 0, t ?? {});
  }
  return r._$AI(n), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const oe = globalThis;
class se extends pe {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Hi(t, this.renderRoot, this.renderOptions);
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
var Xt;
se._$litElement$ = !0, se.finalized = !0, (Xt = oe.litElementHydrateSupport) == null || Xt.call(oe, { LitElement: se });
const Qe = oe.litElementPolyfillSupport;
Qe == null || Qe({ LitElement: se });
(oe.litElementVersions ?? (oe.litElementVersions = [])).push("4.2.2");
const Ti = {
  sensor: ["sensor", "input_number"],
  binary_sensor: ["binary_sensor", "input_boolean"],
  select: ["select", "input_select"],
  number: ["number", "input_number"],
  switch: ["switch", "input_boolean"],
  text: ["text", "input_text"],
  forecast: ["sensor"]
  // any sensor whose attributes hold the prices
};
function Te(n) {
  return n.split(".")[0];
}
const ke = [
  {
    value: "off",
    label: "Off",
    icon: "mdi:power",
    icons: ["mdi:power"],
    color: "var(--secondary-text-color, #727272)",
    description: "The car doesn't charge."
  },
  {
    value: "pv",
    label: "PV",
    icon: "mdi:solar-power",
    icons: ["mdi:solar-power"],
    color: "var(--energy-solar-color, #ff9800)",
    description: "Charges only from PV surplus, after a short delay once there is enough."
  },
  {
    value: "pv_grid",
    label: "PV + grid",
    icon: "mdi:transmission-tower-import",
    icons: ["mdi:solar-power", "mdi:transmission-tower"],
    color: "var(--energy-grid-consumption-color, #488fc2)",
    description: "Charges from PV surplus, and also from the grid while the price is at or below your limit."
  },
  {
    value: "now",
    label: "Now",
    icon: "mdi:lightning-bolt",
    icons: ["mdi:lightning-bolt"],
    color: "var(--success-color, #43a047)",
    description: "Charges at full power right away, from any source."
  }
], g = {
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
function N(n, e = 55) {
  return `color-mix(in srgb, ${n} ${e}%, var(--card-background-color, #fff))`;
}
const zt = { kW: 1e3, MW: 1e6 };
function _(n) {
  if (!n) return;
  const e = Number(n.state);
  if (!Number.isFinite(e)) return;
  const t = n.attributes.unit_of_measurement;
  return typeof t == "string" && t in zt ? e * zt[t] : e;
}
function G(n) {
  return n === void 0 ? "–" : Math.abs(n) >= 1e3 ? `${(n / 1e3).toFixed(1)} kW` : `${Math.round(n)} W`;
}
function C(n) {
  return n === void 0 ? "–" : n.toFixed(3);
}
const zi = 4e3, bt = class bt extends se {
  constructor() {
    super(...arguments), this._pending = /* @__PURE__ */ new Map();
  }
  setConfig(e) {
    this._config = { prefix: "charging_coordinator", ...e };
  }
  entityId(e, t) {
    var i, r, o;
    return ((r = (i = this._config) == null ? void 0 : i.entities) == null ? void 0 : r[t]) || `${e}.${(o = this._config) == null ? void 0 : o.prefix}_${t}`;
  }
  entity(e, t) {
    var i;
    return (i = this.hass) == null ? void 0 : i.states[this.entityId(e, t)];
  }
  /** A number setting, including a value just set in the card. */
  numberValue(e) {
    const t = _(this.entity("number", e)), i = this._pending.get(e);
    return i && Date.now() < i.until && i.value !== t ? i.value : (this._pending.delete(e), t);
  }
  async setNumber(e, t) {
    var c;
    const i = this.entity("number", e), r = Number((i == null ? void 0 : i.attributes.min) ?? -1 / 0), o = Number((i == null ? void 0 : i.attributes.max) ?? 1 / 0), s = Math.min(o, Math.max(r, t));
    this._pending.set(e, { value: s, until: Date.now() + zi }), this.requestUpdate();
    const a = this.entityId("number", e);
    await ((c = this.hass) == null ? void 0 : c.callService(Te(a), "set_value", {
      entity_id: a,
      value: s
    }));
  }
  async selectOption(e, t) {
    var r;
    const i = this.entityId("select", e);
    await ((r = this.hass) == null ? void 0 : r.callService(Te(i), "select_option", {
      entity_id: i,
      option: t
    }));
  }
  async toggle(e, t) {
    var r;
    const i = this.entityId("switch", e);
    await ((r = this.hass) == null ? void 0 : r.callService(Te(i), t ? "turn_on" : "turn_off", {
      entity_id: i
    }));
  }
  async setText(e, t) {
    var r;
    const i = this.entityId("text", e);
    await ((r = this.hass) == null ? void 0 : r.callService(Te(i), "set_value", {
      entity_id: i,
      value: t
    }));
  }
  /** Shown instead of the card when the integration's entities are missing. */
  renderMissing(e) {
    return h`<ha-card>
      <div class="missing">
        Charging Coordinator entities not found (looked for ${this.entityId("…", e)}).
        Check the entity prefix in the card settings.
      </div>
    </ha-card>`;
  }
  renderStepper(e, t) {
    return h`<span class="stepper" role="group" aria-label=${e}>
      <button aria-label="Lower ${e.toLowerCase()}" @click=${() => t(-1)}>
        <ha-icon .icon=${"mdi:minus"}></ha-icon>
      </button>
      <button aria-label="Raise ${e.toLowerCase()}" @click=${() => t(1)}>
        <ha-icon .icon=${"mdi:plus"}></ha-icon>
      </button>
    </span>`;
  }
};
bt.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 }
};
let F = bt;
const ut = Me`
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
async function ti() {
  var t, i, r;
  if (customElements.get("ha-form")) return;
  const n = await ((t = window.loadCardHelpers) == null ? void 0 : t.call(window)), e = await (n == null ? void 0 : n.createCardElement({ type: "entities", entities: [] }));
  await ((r = (i = e == null ? void 0 : e.constructor) == null ? void 0 : i.getConfigElement) == null ? void 0 : r.call(i));
}
function ii(n) {
  return {
    type: "expandable",
    name: "entities",
    title: "Entities",
    schema: n.map((e) => ({
      name: e.key,
      selector: { entity: { domain: Ti[e.domain] ?? [e.domain] } }
    }))
  };
}
function it(n, e) {
  const t = new Map(n.map((i) => [i.key, i]));
  return {
    label: (i) => {
      var r;
      return (r = t.get(i)) == null ? void 0 : r.label;
    },
    helper: (i) => {
      const r = t.get(i);
      if (r)
        return r.domain === "forecast" ? "Default: the price sensor's source" : `Default: ${r.domain}.${e || "charging_coordinator"}_${r.key}`;
    }
  };
}
function ri(n) {
  if (typeof n != "object" || n === null) return;
  const e = Object.entries(n).filter(
    (t) => typeof t[1] == "string" && t[1] !== ""
  );
  return e.length ? Object.fromEntries(e) : void 0;
}
function mt(n, e = []) {
  var r;
  const t = n.map(({ name: o, selector: s }) => ({ name: o, selector: s }));
  e.length && t.push(ii(e));
  const i = Object.fromEntries(n.map((o) => [o.name, o.label]));
  return r = class extends se {
    setConfig(s) {
      this._config = s;
    }
    connectedCallback() {
      super.connectedCallback(), ti().then(() => this.requestUpdate());
    }
    changed(s) {
      const a = { ...this._config };
      for (const l of n) {
        const u = s.detail.value[l.name];
        u === void 0 || u === "" || u === !1 ? delete a[l.name] : a[l.name] = u;
      }
      const c = ri(s.detail.value.entities);
      c ? a.entities = c : delete a.entities, this._config = a, this.dispatchEvent(
        new CustomEvent("config-changed", { detail: { config: a }, bubbles: !0, composed: !0 })
      );
    }
    render() {
      if (!this.hass || !this._config) return p;
      const s = it(e, this._config.prefix);
      return h`<ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${t}
        .computeLabel=${(a) => i[a.name] ?? s.label(a.name) ?? a.name}
        .computeHelper=${(a) => s.helper(a.name)}
        @value-changed=${this.changed}
      ></ha-form>`;
    }
  }, r.properties = { hass: { attribute: !1 }, _config: { state: !0 } }, r;
}
const ft = {
  name: "title",
  label: "Title (optional)",
  selector: { text: {} }
}, gt = {
  name: "prefix",
  label: "Entity prefix (only if you renamed the integration's entities)",
  selector: { text: {} }
};
function Y(n, e) {
  if (customElements.get(n)) {
    console.info(`${n} is already defined, keeping the first loaded version`);
    return;
  }
  customElements.define(n, e);
}
function je(n, e, t) {
  const i = window.customCards ?? (window.customCards = []);
  i.some((r) => r.type === n) || i.push({
    type: n,
    name: e,
    description: t,
    preview: !0,
    documentationURL: "https://github.com/KarstenBade/ha-charging-coordinator"
  });
}
const Ii = [
  { key: "charge_mode", domain: "select", label: "Charge mode" },
  { key: "price_threshold", domain: "number", label: "Price limit" },
  { key: "price", domain: "sensor", label: "Current price" },
  { key: "grid_charge_max_power", domain: "number", label: "Max grid power" },
  { key: "block_battery_on_cheap_price", domain: "switch", label: "Battery hold at a cheap price" }
], It = 0.01, Ri = 500, vt = class vt extends F {
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
    if (!this.hass || !this._config) return p;
    const e = this.entity("select", "charge_mode");
    if (!e) return this.renderMissing("charge_mode");
    const t = e.state;
    return h`<ha-card>
      ${this._config.title ? h`<div class="title">${this._config.title}</div>` : p}
      ${this._config.compact ? this.renderCompact(t) : this.renderFull(t)}
    </ha-card>`;
  }
  // --- full -------------------------------------------------------------------
  renderFull(e) {
    const t = ke.find((i) => i.value === e);
    return h`
      <div class="modes" role="group" aria-label="Charge mode">
        ${ke.map((i) => {
      const r = i.value === e;
      return h`<button
            class="mode"
            style="--accent: ${i.color}"
            aria-pressed=${r ? "true" : "false"}
            @click=${() => this.selectOption("charge_mode", i.value)}
          >
            <span class="glyph" style=${r ? `color: ${i.color}` : ""}>
              ${i.icons.map((o) => h`<ha-icon .icon=${o}></ha-icon>`)}
            </span>
            <span>${i.label}</span>
          </button>`;
    })}
      </div>
      <p class="description">${(t == null ? void 0 : t.description) ?? "Unknown mode."}</p>
      ${this.renderLimit(e)} ${e === "pv_grid" ? this.renderGridMax() : p}
    `;
  }
  renderLimit(e) {
    var c;
    const t = this.numberValue("price_threshold"), i = _(this.entity("sensor", "price")), r = i !== void 0 && t !== void 0 && i <= t, o = ((c = this.entity("switch", "block_battery_on_cheap_price")) == null ? void 0 : c.state) === "on";
    let s;
    return i === void 0 ? s = "No current price." : e === "pv_grid" ? s = r ? `Now ${C(i)}, at or below your limit: also charging from the grid.` : `Now ${C(i)}, above your limit: grid charging waits.` : s = o ? `Now ${C(i)}. The limit applies in PV + grid mode and to the battery hold.` : `Now ${C(i)}. The limit only applies in PV + grid mode.`, h`<div class="section ${e === "pv_grid" || o ? "" : "inactive"}">
      <div class="spread">
        <div>
          <div class="label">Price limit</div>
          <div class="hint">Grid charging only at or below</div>
        </div>
        <div class="row">
          <span class="value">${C(t)}</span>
          ${this.renderStepper(
      "Price limit",
      (l) => t === void 0 ? void 0 : this.setNumber("price_threshold", Rt(t + l * It))
    )}
        </div>
      </div>
      ${t === void 0 ? p : this.renderRuler(t, i)}
      <div class="note ${r && e === "pv_grid" ? "good" : ""}">${s}</div>
    </div>`;
  }
  /** The limit on a price scale, with the current price as a dot. */
  renderRuler(e, t) {
    const i = t === void 0 ? [e] : [e, t], r = Math.max(...i) - Math.min(...i) > 0.25 ? 0.1 : 0.05, o = Math.floor((Math.min(...i) - r) / r) * r, s = Math.ceil((Math.max(...i) + r) / r) * r, a = (u) => `${Math.min(100, Math.max(0, (u - o) / (s - o) * 100))}%`, c = [];
    for (let u = o; u <= s + 1e-9; u += r) c.push(u);
    const l = t !== void 0 && t <= e;
    return h`<div class="ruler" aria-hidden="true">
      <div class="ticks">
        ${c.map((u) => h`<span style="left: ${a(u)}">${u.toFixed(2)}</span>`)}
      </div>
      <div class="track"><div class="cheap" style="width: ${a(e)}"></div></div>
      <div class="limit" style="left: ${a(e)}"></div>
      ${t === void 0 ? p : h`<div class="now ${l ? "good" : ""}" style="left: ${a(t)}"></div>`}
    </div>`;
  }
  renderGridMax() {
    const e = this.numberValue("grid_charge_max_power");
    return h`<div class="section">
      <div class="spread">
        <div>
          <div class="label">Max grid power</div>
          <div class="hint">Cap on total grid import while charging</div>
        </div>
        <div class="row">
          <span class="value">${e === void 0 ? "–" : `${(e / 1e3).toFixed(1)} kW`}</span>
          ${this.renderStepper(
      "Max grid power",
      (t) => e === void 0 ? void 0 : this.setNumber("grid_charge_max_power", e + t * Ri)
    )}
        </div>
      </div>
    </div>`;
  }
  // --- compact ----------------------------------------------------------------
  renderCompact(e) {
    const t = this.numberValue("price_threshold"), i = _(this.entity("sensor", "price")), r = i !== void 0 && t !== void 0 && i <= t;
    return h`
      <div class="segments" role="group" aria-label="Charge mode">
        ${ke.map((o) => {
      const s = o.value === e;
      return h`<button
            style="--accent: ${o.color}"
            aria-pressed=${s ? "true" : "false"}
            @click=${() => this.selectOption("charge_mode", o.value)}
          >
            <ha-icon .icon=${o.icon} style=${s ? `color: ${o.color}` : ""}></ha-icon>
            <span>${o.label}</span>
          </button>`;
    })}
      </div>
      <div class="compact-limit">
        <span class="label">Price limit</span>
        <span class="value">${C(t)}</span>
        ${this.renderStepper(
      "Price limit",
      (o) => t === void 0 ? void 0 : this.setNumber("price_threshold", Rt(t + o * It))
    )}
        ${i === void 0 ? p : h`<span class="pill ${r ? "good" : ""}" title="Current price">
              <ha-icon .icon=${r ? "mdi:cash-check" : "mdi:cash"}></ha-icon>now
              ${C(i)}
            </span>`}
      </div>
    `;
  }
};
vt.styles = [
  ut,
  Me`
      .modes {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
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
      .mode .glyph {
        display: flex;
        gap: 2px;
      }
      .mode[aria-pressed="true"] {
        color: var(--primary-text-color);
        border-color: var(--accent);
        background: color-mix(in srgb, var(--accent) 16%, var(--card-background-color, #fff));
      }
      .description {
        margin: 10px 2px 0;
        min-height: 2.6em;
        font-size: 0.9rem;
      }
      .section.inactive .ruler,
      .section.inactive .value {
        opacity: 0.55;
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
        grid-template-columns: repeat(4, 1fr);
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
let rt = vt;
function Rt(n) {
  return Math.round(n * 1e3) / 1e3;
}
Y(
  "charging-coordinator-control-card-editor",
  mt([
    ft,
    { name: "compact", label: "Compact (two rows, no explanations)", selector: { boolean: {} } },
    gt
  ], Ii)
);
Y("charging-coordinator-control-card", rt);
je(
  "charging-coordinator-control-card",
  "Charging Coordinator control",
  "Charge mode and price limit, optionally compact"
);
const Dt = [
  { key: "priority_soc", name: "Battery first below" },
  { key: "buffer_soc", name: "May keep a charge going above" },
  { key: "buffer_start_soc", name: "May start a charge from" }
], Di = [
  { key: "battery_soc", domain: "sensor", label: "Battery state of charge" },
  { key: "battery_power", domain: "sensor", label: "Battery power (+ discharge, - charge)" },
  { key: "battery_hold", domain: "binary_sensor", label: "Battery hold" },
  { key: "priority_soc", domain: "number", label: "Battery first below (%)" },
  { key: "buffer_soc", domain: "number", label: "May keep a charge going above (%)" },
  { key: "buffer_start_soc", domain: "number", label: "May start a charge from (%)" },
  { key: "block_battery_on_ev_grid_charge", domain: "switch", label: "Hold while the car charges from the grid" },
  { key: "block_battery_on_cheap_price", domain: "switch", label: "Hold at a cheap price" }
], Ut = {
  battery: N(g.batteryIn, 45),
  car: N(g.home, 25),
  keep: N(g.batteryOut, 30),
  start: N(g.batteryOut, 60)
}, Vt = 30;
function Ft(n, e) {
  return n < e.priority_soc ? "battery" : e.buffer_start_soc > 0 && n >= e.buffer_start_soc ? "start" : e.buffer_soc > 0 && n > e.buffer_soc ? "keep" : "car";
}
const Ve = class Ve extends F {
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
    var s;
    if (!this.hass || !this._config) return p;
    if (!this.entity("number", "priority_soc")) return this.renderMissing("priority_soc");
    const e = _(this.entity("sensor", "battery_soc")), t = _(this.entity("sensor", "battery_power")), i = ((s = this.entity("binary_sensor", "battery_hold")) == null ? void 0 : s.state) === "on", r = Object.fromEntries(Dt.map((a) => [a.key, this.level(a.key)]));
    let o;
    return i ? o = "On hold, not discharging" : (t ?? 0) < -Vt ? o = `Charging · ${G(-(t ?? 0))}` : (t ?? 0) > Vt ? o = `Discharging · ${G(t)}` : o = t === void 0 ? "–" : "Idle", h`<ha-card>
      ${this._config.title ? h`<div class="title">${this._config.title}</div>` : p}
      <div class="spread">
        <div>
          <div class="label">Home battery</div>
          <div class="hint ${i ? "hold" : ""}">${o}</div>
        </div>
        <span class="value big">${e === void 0 ? "–" : `${Math.round(e)} %`}</span>
      </div>
      ${this.renderScale(r, e)} ${this.renderLegend(r)}
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
    const i = [0, 100, ...Object.values(e)].map((o) => Math.min(100, Math.max(0, o))).sort((o, s) => o - s).filter((o, s, a) => s === 0 || o !== a[s - 1]), r = i.slice(0, -1).map((o, s) => ({
      from: o,
      to: i[s + 1],
      zone: Ft((o + i[s + 1]) / 2, e)
    }));
    return h`<div class="scale">
      <div class="zones" @pointerdown=${(o) => o.preventDefault()}>
        ${r.map(
      (o) => h`<div style="left: ${o.from}%; width: ${o.to - o.from}%; background: ${Ut[o.zone]}"></div>`
    )}
      </div>
      ${t === void 0 ? p : h`<div class="soc" style="left: ${Math.min(100, Math.max(0, t))}%" title="Now ${Math.round(t)} %"></div>`}
      ${Dt.map((o) => this.renderMarker(o.key, o.name, e[o.key]))}
    </div>`;
  }
  renderMarker(e, t, i) {
    var s;
    const r = i <= 0, o = (a) => this.setNumber(e, Math.min(100, Math.max(0, Math.round(a))));
    return h`<div
      class="marker ${((s = this._drag) == null ? void 0 : s.key) === e ? "dragging" : ""}"
      style="left: ${i}%"
      role="slider"
      tabindex="0"
      aria-label=${t}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow=${i}
      aria-valuetext=${r ? "off" : `${i} %`}
      @keydown=${(a) => {
      const c = {
        ArrowLeft: -1,
        ArrowDown: -1,
        ArrowRight: 1,
        ArrowUp: 1,
        PageDown: -10,
        PageUp: 10
      };
      if (a.key in c) o(i + c[a.key]);
      else if (a.key === "Home") o(0);
      else if (a.key === "End") o(100);
      else return;
      a.preventDefault();
    }}
      @pointerdown=${(a) => this.startDrag(a, e)}
    >
      <span class="marker-label">${r ? "off" : `${i} %`}</span>
    </div>`;
  }
  startDrag(e, t) {
    const i = e.currentTarget, r = i.parentElement;
    i.setPointerCapture(e.pointerId), e.preventDefault();
    const o = (c) => {
      const l = r.getBoundingClientRect();
      return Math.round(Math.min(100, Math.max(0, (c.clientX - l.left) / l.width * 100)));
    };
    this._drag = { key: t, value: o(e) };
    const s = (c) => this._drag = { key: t, value: o(c) }, a = () => {
      i.removeEventListener("pointermove", s), i.removeEventListener("pointerup", a), i.removeEventListener("pointercancel", a);
      const c = this._drag;
      this._drag = null, c && this.setNumber(c.key, c.value);
    };
    i.addEventListener("pointermove", s), i.addEventListener("pointerup", a), i.addEventListener("pointercancel", a);
  }
  renderLegend(e) {
    const { priority_soc: t, buffer_soc: i, buffer_start_soc: r } = e, o = [];
    o.push(
      t > 0 ? ["battery", `Below ${t} %, PV charges the battery before the car.`] : ["car", "PV always goes to the car before the battery."]
    );
    const s = [...Array(100).keys()].some((a) => Ft(a + 0.5, e) === "car");
    return t > 0 && s && o.push(["car", "In the grey range, PV goes to the car first and the battery doesn't help."]), i > 0 && o.push(["keep", `Above ${i} %, the battery may keep a running charge going.`]), r > 0 && o.push(["start", `From ${r} %, the battery may start a charge.`]), i <= 0 && r <= 0 && o.push(["car", "The battery never helps charge the car."]), h`<ul class="legend">
      ${o.map(
      ([a, c]) => h`<li><i style="background: ${Ut[a]}"></i><span>${c}</span></li>`
    )}
    </ul>
    <div class="hint drag-hint">Drag a marker to change it; at 0 % it is off.</div>`;
  }
  renderSwitch(e, t) {
    const i = this.entity("switch", e);
    if (!i) return h``;
    const r = i.state === "on";
    return h`<div class="toggle">
      <span>${t}</span>
      <button
        class="switch"
        role="switch"
        aria-checked=${r ? "true" : "false"}
        aria-label=${t}
        @click=${() => this.toggle(e, !r)}
      ></button>
    </div>`;
  }
};
Ve.properties = {
  ...F.properties,
  _drag: { state: !0 }
}, Ve.styles = [
  ut,
  Me`
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
let ot = Ve;
Y("charging-coordinator-battery-card-editor", mt([ft, gt], Di));
Y("charging-coordinator-battery-card", ot);
je(
  "charging-coordinator-battery-card",
  "Charging Coordinator battery",
  "When the home battery comes before the car, and the battery hold switches"
);
const Ui = [
  { key: "price", domain: "sensor", label: "Current price" },
  { key: "price_threshold", domain: "number", label: "Price limit" },
  // defaults to the sensor named in the price sensor's `source` attribute
  { key: "price_forecast", domain: "forecast", label: "Sensor with the price forecast" }
], Ue = 36e5, O = 24 * Ue, Vi = 0.01, Fi = 5 * 6e4, Bi = ["start", "start_time", "startsAt", "starts_at", "time", "from", "datetime", "hour"], Wi = ["end", "end_time", "endsAt", "ends_at", "till", "to"], ji = ["value", "price", "total", "price_per_kwh", "price_eur_per_kwh", "marketprice"];
function st(n) {
  if (typeof n == "number") return n < 1e12 ? n * 1e3 : n;
  if (typeof n != "string") return;
  const e = Date.parse(n);
  return Number.isFinite(e) ? e : void 0;
}
function et(n, e) {
  for (const t of e) if (n[t] !== void 0 && n[t] !== null) return n[t];
}
function Gi(n) {
  const e = /* @__PURE__ */ new Map(), t = (i, r, o) => {
    e.has(i) || e.set(i, { start: i, end: r ?? NaN, price: o });
  };
  for (const [i, r] of Object.entries(n))
    if (!(!Array.isArray(r) || r.length === 0)) {
      if (r.every((o) => typeof o == "number")) {
        const o = i === "today" ? 0 : i === "tomorrow" ? O : void 0;
        if (o === void 0) continue;
        const s = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0) + o, a = O / r.length;
        r.forEach((c, l) => t(s + l * a, s + (l + 1) * a, c));
        continue;
      }
      for (const o of r) {
        if (typeof o != "object" || o === null) continue;
        const s = o, a = st(et(s, Bi)), c = Number(et(s, ji));
        a === void 0 || !Number.isFinite(c) || t(a, st(et(s, Wi)), c);
      }
    }
  return oi([...e.values()]);
}
function oi(n) {
  const e = n.sort((r, o) => r.start - o.start), t = e.slice(1).map((r, o) => r.start - e[o].start).filter((r) => r > 0), i = t.length ? Math.min(...t) : Ue;
  return e.map((r, o) => {
    var s;
    return {
      ...r,
      end: Number.isFinite(r.end) ? r.end : ((s = e[o + 1]) == null ? void 0 : s.start) ?? r.start + i
    };
  });
}
async function Xi(n, e) {
  if (!n.callWS) return [];
  const t = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0), i = await n.callWS({
    type: "history/history_during_period",
    start_time: new Date(t).toISOString(),
    entity_ids: [e],
    minimal_response: !0,
    no_attributes: !0
  }), r = [];
  for (const s of i[e] ?? []) {
    const a = Number(s.s ?? s.state), c = st(s.lu ?? s.lc ?? s.last_updated ?? s.last_changed);
    c === void 0 || !Number.isFinite(a) || r.push({ start: Math.max(c, t), end: NaN, price: a });
  }
  const o = oi(r);
  return o.length && (o[o.length - 1].end = Date.now()), o;
}
function Bt(n) {
  return new Date(n).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function qi(n) {
  const e = Math.round(n / 6e4);
  if (e < 60) return `${e} min`;
  const t = Math.floor(e / 60), i = e % 60;
  return i ? `${t} h ${i} min` : `${t} h`;
}
const Fe = class Fe extends F {
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
    var i, r, o, s;
    const e = ((r = (i = this._config) == null ? void 0 : i.entities) == null ? void 0 : r.price_forecast) || ((o = this.entity("sensor", "price")) == null ? void 0 : o.attributes.source), t = typeof e == "string" ? (s = this.hass) == null ? void 0 : s.states[e] : void 0;
    return t ? Gi(t.attributes) : [];
  }
  maybeLoadHistory() {
    !this.hass || this._historyLoading || Date.now() - this._historyAt < Fi || (this._historyLoading = !0, Xi(this.hass, this.entityId("sensor", "price")).then((e) => this._history = e).catch((e) => console.warn("Loading price history failed", e)).finally(() => {
      this._historyAt = Date.now(), this._historyLoading = !1;
    }));
  }
  render() {
    if (!this.hass || !this._config) return p;
    if (!this.entity("number", "price_threshold")) return this.renderMissing("price_threshold");
    const e = this.numberValue("price_threshold"), t = _(this.entity("sensor", "price")), i = Date.now(), r = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
    let o = this.forecast().filter((l) => l.end > r && l.start < r + 2 * O);
    const s = o.some((l) => l.end > i);
    s || (this.maybeLoadHistory(), o = this._history);
    const a = Math.max(r + O, ...o.map((l) => l.end)), c = a > r + O;
    return h`<ha-card>
      ${this._config.title ? h`<div class="title">${this._config.title}</div>` : p}
      <div class="spread">
        <div>
          <div class="label">${c ? "Prices today and tomorrow" : "Prices today"}</div>
          <div class="hint">${this.summary(o, e, t, s)}</div>
        </div>
        <div class="row">
          <span class="value" title="Price limit">${C(e)}</span>
          ${this.renderStepper(
      "Price limit",
      (l) => e === void 0 ? void 0 : this.setNumber("price_threshold", Math.round((e + l * Vi) * 1e3) / 1e3)
    )}
        </div>
      </div>
      ${o.length ? this.renderChart(o, e, r, a, i) : h`<div class="empty">No prices yet today.</div>`}
      ${s ? p : h`<div class="hint note">
            Your price sensor doesn't provide a forecast, so only today's prices so far are shown.
          </div>`}
    </ha-card>`;
  }
  summary(e, t, i, r) {
    if (t === void 0) return "";
    if (i !== void 0 && i <= t) return `Now ${C(i)}, at or below your limit`;
    if (!r) return i === void 0 ? "" : `Now ${C(i)}, above your limit`;
    const o = Date.now(), s = e.find((c) => c.start >= o && c.price <= t);
    if (!s) return "No upcoming price at or below your limit";
    let a = s.end;
    for (const c of e) c.start === a && c.price <= t && (a = c.end);
    return `At or below your limit from ${Bt(s.start)}, for ${qi(a - s.start)}`;
  }
  renderChart(e, t, i, r, o) {
    const c = e.map((f) => f.price).concat(t === void 0 ? [] : [t]), l = Math.max(...c), u = Math.min(...c), m = u < 0 ? u : Math.max(0, u - (l - u) * 0.5 - 0.01), v = l + (l - m) * 0.08, $ = u < 0 ? 0 : m, w = (f) => (f - i) / (r - i) * 388, x = (f) => 110 - (f - m) / (v - m) * 110, Ce = N(g.charger, 70), K = N(g.home, 35), ae = e.map((f) => {
      const k = w(Math.max(f.start, i)), B = w(Math.min(f.end, r)), Z = Math.max(0.5, B - k - (B - k > 3 ? 1 : 0)), z = Math.min(x(f.price), x($)), J = Math.max(1, Math.abs(x(f.price) - x($))), ce = t !== void 0 && f.price <= t, I = f.start <= o && o < f.end;
      return L`<rect class="bar ${f.end <= o ? "past" : ""} ${I ? "current" : ""}"
        x=${k} y=${z} width=${Z} height=${J} rx="1.5"
        style="fill: ${ce ? Ce : K}"
        @click=${() => this.setNumber("price_threshold", Math.round(f.price * 1e3) / 1e3)}>
        <title>${Bt(f.start)} · ${C(f.price)} · tap to use as limit</title>
      </rect>`;
    }), H = r - i, Ge = H > O ? 12 * Ue : 6 * Ue, T = [];
    for (let f = i; f <= r; f += Ge) {
      const k = f >= r ? "24" : f === i + O ? "tomorrow" : String(new Date(f).getHours());
      T.push({ at: f, text: k });
    }
    return h`<div class="chart">
      <svg viewBox="0 0 ${388} ${110}" preserveAspectRatio="none" aria-hidden="true">
        ${ae}
        ${H > O ? L`<line class="midnight" x1=${w(i + O)} x2=${w(i + O)} y1="0" y2=${110}></line>` : p}
        ${t === void 0 ? p : L`<line class="limit" x1="0" x2=${388} y1=${x(t)} y2=${x(t)}></line>`}
      </svg>
      ${t === void 0 ? p : h`<span class="limit-label" style="top: ${x(t) / 110 * 100}%">limit</span>`}
    </div>
    <div class="axis">
      ${T.map(
      (f) => h`<span style="left: ${(f.at - i) / H * 100}%">${f.text}</span>`
    )}
    </div>`;
  }
};
Fe.properties = {
  ...F.properties,
  _history: { state: !0 }
}, Fe.styles = [
  ut,
  Me`
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
let nt = Fe;
Y("charging-coordinator-price-card-editor", mt([ft, gt], Ui));
Y("charging-coordinator-price-card", nt);
je(
  "charging-coordinator-price-card",
  "Charging Coordinator prices",
  "Today's prices against the price limit"
);
const at = [
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
  { key: "connected_vehicle", domain: "text", label: "Plugged-in car (picked in the card)" },
  { key: "target_enabled", domain: "binary_sensor", label: "Charging released" },
  { key: "target_current", domain: "sensor", label: "Target current" },
  { key: "target_phases", domain: "sensor", label: "Target phases" },
  { key: "price", domain: "sensor", label: "Current price" },
  { key: "price_threshold", domain: "number", label: "Price limit" },
  { key: "price_cheap", domain: "binary_sensor", label: "Price at or below the limit" },
  { key: "pv_timer_remaining", domain: "sensor", label: "Start / stop timer" },
  { key: "phase_timer_remaining", domain: "sensor", label: "Phase switch timer" }
], Wt = [
  { value: "auto", label: "Auto", icon: "mdi:sine-wave" },
  { value: "1p", label: "1 phase", icon: "mdi:numeric-1-circle-outline" },
  { value: "3p", label: "3 phases", icon: "mdi:numeric-3-circle-outline" }
];
function ze(n) {
  if (n === void 0) return "";
  const e = Math.max(0, Math.round(n));
  return e >= 60 ? `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")} min` : `${e} s`;
}
function Yi(n) {
  return n && n[0].toUpperCase() + n.slice(1);
}
const ye = 388, $e = 140, jt = 122, ie = 262, j = 168, de = 216, A = { x: 192, top: 6, w: 40, h: 44 }, R = 26, D = 112, Ki = 36, Zi = 6e3, U = 30;
function Ji(n) {
  return Math.min(6, Math.max(0.9, 4e3 / (n + 400)));
}
function he(n, e) {
  return `${n / e * 100}%`;
}
function _e(n) {
  return Math.max(6, n / 2 + 4);
}
function V(...n) {
  return n.map((e) => typeof e == "number" && !Number.isInteger(e) ? e.toFixed(1) : String(e)).join(" ");
}
let Qi = 0;
const Be = class Be extends F {
  constructor() {
    var e;
    super(...arguments), this._menu = null, this._menuPos = { left: 16, top: 56 }, this._uid = `ccc${++Qi}`, this._reducedMotion = ((e = window.matchMedia) == null ? void 0 : e.call(window, "(prefers-reduced-motion: reduce)").matches) ?? !1;
  }
  setConfig(e) {
    if (e.vehicles !== void 0 && !Array.isArray(e.vehicles))
      throw new Error("vehicles must be a list of {name, soc}");
    super.setConfig(e);
  }
  getCardSize() {
    return 5;
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
  async select(e, t) {
    this._menu = null, await this.selectOption(e, t);
  }
  async pickVehicle(e) {
    await this.setText("connected_vehicle", e);
  }
  /** Which configured car is plugged in: the only one, or the one picked in the card. */
  vehicleState() {
    var s, a;
    const e = (((s = this._config) == null ? void 0 : s.vehicles) ?? []).map((c, l) => {
      var u;
      return {
        name: c.name || `Vehicle ${l + 1}`,
        soc: c.soc ? _((u = this.hass) == null ? void 0 : u.states[c.soc]) : void 0,
        entity: c.soc
      };
    }), t = (a = this.entity("binary_sensor", "vehicle_connected")) == null ? void 0 : a.state, i = t === "on" ? !0 : t === "off" ? !1 : void 0, r = this.entity("text", "connected_vehicle");
    let o;
    return i && (o = e.length === 1 ? e[0] : e.find((c) => c.name === (r == null ? void 0 : r.state))), {
      connected: i,
      car: o,
      others: e.filter((c) => c !== o),
      pickable: i === !0 && r !== void 0 && e.length > 1
    };
  }
  // --- render ---------------------------------------------------------------
  render() {
    var a;
    if (!this.hass || !this._config) return p;
    const e = this.entity("sensor", "status");
    if (!e)
      return h`<ha-card>
        <div class="warning">
          Charging Coordinator entities not found (looked for ${this.entityId("sensor", "status")}).
        </div>
      </ha-card>`;
    const t = ((a = this.entity("switch", "active_control")) == null ? void 0 : a.state) === "on", i = ke.find((c) => {
      var l;
      return c.value === ((l = this.entity("select", "charge_mode")) == null ? void 0 : l.state);
    }), r = Wt.find(
      (c) => {
        var l;
        return c.value === ((l = this.entity("select", "phase_mode")) == null ? void 0 : l.state);
      }
    ), o = _(this.entity("sensor", "target_phases")), s = this.vehicleState();
    return h`
      <ha-card>
        ${this._config.title ? h`<div class="title">${this._config.title}</div>` : p}
        <div class="top">
          <div class="chips">
            ${this.renderChip("mode", (i == null ? void 0 : i.icon) ?? "mdi:help", (i == null ? void 0 : i.label) ?? "–", "Charge mode")}
            ${this.renderChip(
      "phase",
      (r == null ? void 0 : r.icon) ?? "mdi:sine-wave",
      (r == null ? void 0 : r.value) === "auto" && o ? `Auto · ${o}p` : (r == null ? void 0 : r.label) ?? "–",
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
        ${this.renderMenu()} ${this.renderHeadline(e, i == null ? void 0 : i.value)}
        ${this.renderFlow(s)} ${this.renderFacts(e, s)}
      </ha-card>
    `;
  }
  renderChip(e, t, i, r) {
    const o = this._menu === e;
    return h`
      <button
        class="chip ${o ? "open" : ""}"
        title=${r}
        aria-haspopup="menu"
        aria-expanded=${o ? "true" : "false"}
        @click=${(s) => {
      const a = s.currentTarget;
      this._menuPos = { left: a.offsetLeft, top: a.offsetTop + a.offsetHeight + 4 }, this._menu = o ? null : e;
    }}
      >
        <ha-icon .icon=${t}></ha-icon>
        <span>${i}</span>
        <ha-icon class="chevron" .icon=${"mdi:chevron-down"}></ha-icon>
      </button>
    `;
  }
  renderMenu() {
    var o;
    if (!this._menu) return p;
    const e = this._menu, t = e === "mode" ? ke : Wt, i = e === "mode" ? "charge_mode" : "phase_mode", r = (o = this.entity("select", i)) == null ? void 0 : o.state;
    return h`
      <div class="scrim" @click=${() => this._menu = null}></div>
      <div
        class="menu"
        role="menu"
        style="left: ${this._menuPos.left}px; top: ${this._menuPos.top}px"
        @keydown=${(s) => {
      s.key === "Escape" && (this._menu = null);
    }}
      >
        ${t.map(
      (s) => h`
            <button
              role="menuitemradio"
              aria-checked=${s.value === r ? "true" : "false"}
              class=${s.value === r ? "selected" : ""}
              @click=${() => this.select(i, s.value)}
            >
              <ha-icon .icon=${s.icon}></ha-icon>
              <span>${s.label}</span>
              ${s.value === r ? h`<ha-icon class="check" .icon=${"mdi:check"}></ha-icon>` : p}
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
    var w, x;
    const i = (w = this.entity("binary_sensor", "vehicle_connected")) == null ? void 0 : w.state, r = ((x = this.entity("binary_sensor", "target_enabled")) == null ? void 0 : x.state) === "on", o = _(this.entity("sensor", "charger_power")), s = _(this.entity("sensor", "target_current")), a = _(this.entity("sensor", "target_phases")), c = e.state, l = c.indexOf(": "), u = Yi(l >= 0 ? c.slice(l + 2) : c);
    let m, v = "", $ = "";
    return i === void 0 || i === "unknown" || i === "unavailable" ? (m = "Waiting for charger data", $ = "muted") : i === "off" ? (m = "No vehicle connected", v = t === "off" ? "Charging is off" : "", $ = "muted") : t === "off" ? (m = "Charging off", $ = "muted") : r && (o ?? 0) > 100 ? (m = `Charging · ${G(o)}`, v = a && s ? `${a}p · ${s} A` : "", $ = "charging") : r ? (m = "Ready", v = "Charging released, the vehicle is not drawing power") : (m = "Paused", v = /^(enabling|disabling) in /i.test(u) ? "" : u), h`
      <div class="headline ${$}">
        <div class="state">${m}</div>
        ${v ? h`<div class="sub">${v}</div>` : p}
      </div>
    `;
  }
  renderFlow(e) {
    var kt;
    const t = _(this.entity("sensor", "grid_power")), i = _(this.entity("sensor", "pv_dc_power")), r = _(this.entity("sensor", "pv_inverter_power")), o = i === void 0 && r === void 0 ? void 0 : (i ?? 0) + (r ?? 0), s = _(this.entity("sensor", "battery_power")), a = _(this.entity("sensor", "battery_soc")), c = _(this.entity("sensor", "charger_power")), l = ((kt = this.entity("binary_sensor", "battery_hold")) == null ? void 0 : kt.state) === "on", u = t === void 0 ? void 0 : t + (o ?? 0) + (s ?? 0) - (c ?? 0), m = Math.max(0, o ?? 0), v = Math.max(0, t ?? 0), $ = Math.max(0, s ?? 0), w = Math.max(0, -(s ?? 0)), x = Math.min(w, Math.max(0, i ?? 0)), Ce = w - x, K = Math.min(m - x, Math.max(0, -(t ?? 0))), ae = Math.max(0, u ?? 0), H = Math.max(0, c ?? 0), Ge = Ki / Math.max(m + v + $, Zi), T = (b) => b > U ? Math.max(2, b * Ge) : 0, f = T(x), k = T(K), B = T(m - x - K), Z = T(v), z = B + Z, J = T(Ce), ce = T($), I = Math.max(0, z - J + ce), $t = ae > U ? ae : 0, _t = H > U ? H : 0, Oe = $t + _t, Xe = Oe > 0 ? I * $t / Oe : 0, Le = Oe > 0 ? I * _t / Oe : 0, qe = K > U || (t ?? 0) < -U ? g.gridOut : g.gridIn, Ye = l ? g.hold : (s ?? 0) < -U ? g.batteryIn : (s ?? 0) > U ? g.batteryOut : g.home, xt = H > U ? g.charger : g.idle, S = D + Math.max(z, I) / 2, M = A.x, fe = A.top + A.h, P = jt, Ne = R - (f + B + k) / 2, si = (b) => {
      const d = _e(b), y = Ne + f + b / 2, E = S - z + b / 2, le = j - 1 - 2 * d;
      return V(
        "M",
        P,
        y,
        "L",
        le,
        y,
        "A",
        d,
        d,
        0,
        0,
        1,
        le + d,
        y + d,
        "L",
        le + d,
        E - d,
        "A",
        d,
        d,
        0,
        0,
        0,
        le + 2 * d,
        E,
        "L",
        j + 0.5,
        E
      );
    }, ni = (b) => {
      const d = _e(b), y = Ne + f + B + b / 2;
      return V(
        "M",
        P,
        y,
        "A",
        d,
        d,
        0,
        0,
        1,
        P + d,
        y + d,
        "L",
        P + d,
        D - d,
        "A",
        d,
        d,
        0,
        0,
        1,
        P,
        D
      );
    }, ai = (b) => {
      const d = Ne + b / 2;
      return V("M", P, d, "L", M - A.w / 2 + 1, d);
    }, ci = (b) => {
      const d = S - b / 2;
      return V("M", P, d, "L", j + 0.5, d);
    }, li = (b) => {
      const d = _e(b), y = S - z + b / 2;
      return V(
        "M",
        j - 0.5,
        y,
        "L",
        M - d,
        y,
        "A",
        d,
        d,
        0,
        0,
        0,
        M,
        y - d,
        "L",
        M,
        fe
      );
    }, di = (b) => {
      const d = _e(b), y = S - I + b / 2;
      return V(
        "M",
        M,
        fe,
        "L",
        M,
        y - d,
        "A",
        d,
        d,
        0,
        0,
        0,
        M + d,
        y,
        "L",
        de + 0.5,
        y
      );
    }, hi = (b) => {
      const d = _e(b), y = S - I + b / 2, E = ie - 1 - 2 * d;
      return V(
        "M",
        de - 0.5,
        y,
        "L",
        E,
        y,
        "A",
        d,
        d,
        0,
        0,
        0,
        E + d,
        y - d,
        "L",
        E + d,
        R + d,
        "A",
        d,
        d,
        0,
        0,
        1,
        E + 2 * d,
        R,
        "L",
        ie,
        R
      );
    }, pi = (b) => {
      const d = S - b / 2;
      return V("M", de - 0.5, d, "L", ie, d);
    }, W = (b) => `${this._uid}-${b}`, wt = N(g.home), Q = (b, d, y, E, le, fi, gi) => L`<linearGradient id=${W(b)} gradientUnits="userSpaceOnUse" x1=${d} y1=${y} x2=${E} y2=${le}>
        <stop offset="0.25" style="stop-color: ${N(fi)}"></stop>
        <stop offset="1" style="stop-color: ${N(gi)}"></stop>
      </linearGradient>`, ui = L`<defs>
      ${Q("pv", 0, R, 0, S - z, g.pv, g.home)}
      ${Q("direct", P, 0, M - A.w / 2, 0, g.pv, g.batteryIn)}
      ${Q("grid", P, 0, j, 0, g.gridIn, g.home)}
      ${Q("export", 0, R, 0, D, g.pv, g.gridOut)}
      ${Q("charge", 0, S - z, 0, fe, g.home, g.batteryIn)}
      ${Q("discharge", 0, fe, 0, S - I, g.batteryOut, g.home)}
      ${Q("ev", de, 0, ie, 0, g.home, g.charger)}
    </defs>`, ge = (b, d, y, E) => d > 0 ? this.pipe(b(d), d, y, E) : p, ee = J ? I : z, be = (b, d, y, E) => y > 0 ? L`<rect x=${b - 1.5} y=${d} width="3" height=${y} rx="1.5" style="fill: ${E}"></rect>` : p, mi = Math.min(100, Math.max(0, a ?? 0)) / 100, He = (A.h - 4) * mi;
    return h`
      <div class="flow" style="aspect-ratio: ${ye} / ${$e}">
        <svg viewBox="0 0 ${ye} ${$e}" aria-hidden="true">
          ${ui}
          ${ee > 0 ? L`<rect x=${j} y=${S - ee} width=${de - j} height=${ee} style="fill: ${wt}"></rect>` : p}
          ${ge(ai, f, `url(#${W("direct")})`, x)}
          ${ge(si, B, `url(#${W("pv")})`, m - x - K)}
          ${k > 0 ? this.pipe(ni(k), k, `url(#${W("export")})`, K) : p}
          ${k > 0 ? p : ge(ci, Z, `url(#${W("grid")})`, v)}
          ${ce > 0 ? this.pipe(di(ce), ce, `url(#${W("discharge")})`, $) : J > 0 ? this.pipe(li(J), J, `url(#${W("charge")})`, Ce) : p}
          ${ge(hi, Xe, wt, ae)}
          ${ge(pi, Le, `url(#${W("ev")})`, H)}
          ${ee > 0 ? this.pulse(V("M", j, S - ee / 2, "L", de, S - ee / 2), ee, ae + H) : p}
          ${be(P - 1.5, Ne, f + B + k, g.pv)}
          ${k > 0 ? be(P - 1.5, D - k / 2, k, qe) : be(P - 1.5, Z ? S - Z : D, Z, qe)}
          ${be(ie + 1.5, R - Xe / 2, Xe, g.home)}
          ${be(ie + 1.5, Le ? S - Le : D, Le, xt)}
          <rect x=${M - 7} y=${A.top - 4} width="14" height="5" rx="1.5"
            style="fill: ${Ye}"></rect>
          <rect class="battery" x=${M - A.w / 2} y=${A.top} width=${A.w}
            height=${A.h} rx="7" style="stroke: ${Ye}"></rect>
          ${He > 0 ? L`<rect x=${M - A.w / 2 + 3} y=${fe - 3 - He}
                width=${A.w - 6} height=${He} rx=${Math.min(4, He / 2)}
                style="fill: ${N(Ye)}"></rect>` : p}
        </svg>

        ${this.renderSide("left", R, "mdi:solar-power-variant", g.pv, G(o), "PV")}
        ${this.renderSide(
      "left",
      D,
      "mdi:transmission-tower",
      qe,
      G(t === void 0 ? void 0 : Math.abs(t)),
      t === void 0 ? "Grid" : t >= 0 ? "Grid import" : "Grid export"
    )}
        ${this.renderSide("right", R, "mdi:home", g.home, G(u), "Home")}
        ${this.renderSide(
      "right",
      D,
      "mdi:ev-station",
      xt,
      G(c),
      this.renderChargerSub(e)
    )}
        <div
          class="battery-label"
          style="left: ${he(M, ye)}; top: ${he(A.top + A.h / 2, $e)}"
          title=${l ? "Battery hold: the home battery is not discharging" : "Home battery"}
        >
          <div class="value">${a === void 0 ? "–" : `${Math.round(a)}%`}</div>
          <div class="node-sub">
            ${l ? h`<b class="hold">hold</b>` : G(s === void 0 ? void 0 : Math.abs(s))}
          </div>
        </div>
      </div>
    `;
  }
  /** A pipe of the given width along `d` (drawn in flow direction), with moving dots. */
  pipe(e, t, i, r) {
    return L`<path class="pipe" d=${e} style="stroke: ${i}; stroke-width: ${t.toFixed(1)}"></path>
      ${this.pulse(e, t, r)}`;
  }
  pulse(e, t, i) {
    return this._reducedMotion || i <= U ? p : L`<path class="pulse" d=${e}
      style="stroke-width: ${Math.min(4, Math.max(2, t * 0.4)).toFixed(1)}">
      <animate attributeName="stroke-dashoffset" from="0" to="-36"
        dur="${Ji(i).toFixed(2)}s" repeatCount="indefinite"></animate>
    </path>`;
  }
  renderSide(e, t, i, r, o, s) {
    const a = e === "left" ? `right: calc(100% - ${he(jt - 8, ye)}); top: ${he(t, $e)}; text-align: right;` : `left: ${he(ie + 8, ye)}; top: ${he(t, $e)};`, c = h`<ha-icon .icon=${i} style="color: ${r}"></ha-icon>`;
    return h`
      <div class="side ${e}" style=${a}>
        ${e === "right" ? c : p}
        <div>
          <div class="value">${o}</div>
          ${typeof s == "string" ? h`<div class="node-sub">${s}</div>` : s}
        </div>
        ${e === "left" ? c : p}
      </div>
    `;
  }
  renderChargerSub(e) {
    const { connected: t, car: i, pickable: r } = e;
    return i ? h`<div class="car" title=${i.entity ?? ""}>
        <span>${i.name}</span>${this.renderSocBar(i.soc)}
        <b>${i.soc === void 0 ? "–" : `${Math.round(i.soc)} %`}</b>
      </div>` : h`<div class="node-sub ${r ? "ask" : ""}">${t === void 0 ? "–" : t ? r ? "Which car?" : "Vehicle connected" : "No vehicle"}</div>`;
  }
  renderSocBar(e) {
    return h`<span class="bar"
      ><span style="width: ${Math.min(100, Math.max(0, e ?? 0))}%"></span
    ></span>`;
  }
  /** Cars that aren't at the charger; tap one to mark it as plugged in. */
  renderVehicleChips(e) {
    const t = e.pickable && !e.car;
    return e.others.map((i) => {
      const r = h`<span class="vname">${i.name}</span>${this.renderSocBar(i.soc)}
        <b>${i.soc === void 0 ? "–" : `${Math.round(i.soc)} %`}</b>`;
      return e.pickable ? h`<button
            class="fact vehicle ${t ? "ask" : ""}"
            title="Mark ${i.name} as plugged in"
            @click=${() => this.pickVehicle(i.name)}
          >
            ${r}
          </button>` : h`<span class="fact vehicle" title=${i.entity ?? ""}>${r}</span>`;
    });
  }
  renderFacts(e, t) {
    var $, w;
    const i = this.renderVehicleChips(t), r = t.connected === !0, o = this.entity("sensor", "pv_timer_remaining"), s = this.entity("sensor", "phase_timer_remaining");
    r && (o == null ? void 0 : o.attributes.action) === "enable" ? i.push(this.fact("mdi:timer-play-outline", `Starts in ${ze(_(o))}`, "info")) : r && (o == null ? void 0 : o.attributes.action) === "disable" && i.push(this.fact("mdi:timer-stop-outline", `Stops in ${ze(_(o))}`, "warn")), r && (s == null ? void 0 : s.attributes.action) === "scale3p" ? i.push(this.fact("mdi:timer-sync-outline", `3 phases in ${ze(_(s))}`, "info")) : r && (s == null ? void 0 : s.attributes.action) === "scale1p" && i.push(this.fact("mdi:timer-sync-outline", `1 phase in ${ze(_(s))}`, "info")), e.state.includes("phase switch settling") && i.push(this.fact("mdi:timer-sand", "Phase switch settling", "info"));
    const a = _(this.entity("sensor", "price")), c = _(this.entity("number", "price_threshold")), l = (($ = this.entity("binary_sensor", "price_cheap")) == null ? void 0 : $.state) === "on";
    a !== void 0 && i.push(
      this.fact(
        l ? "mdi:cash-check" : "mdi:cash",
        `${a.toFixed(3)} ${c === void 0 ? "" : `${l ? "≤" : ">"} ${c.toFixed(3)}`}${l ? " · cheap" : ""}`,
        l ? "good" : "",
        "Price against threshold"
      )
    );
    const u = ((w = this.entity("binary_sensor", "battery_hold")) == null ? void 0 : w.state) === "on", m = e.attributes.battery_reason;
    u && i.push(
      this.fact(
        "mdi:battery-lock",
        `Battery hold${m ? ` · ${m.replace("ev ", "EV ")}` : ""}`,
        "warn",
        "The home battery is not discharging"
      )
    );
    const v = e.attributes.limit_reason;
    if (e.attributes.limited && v) {
      const x = e.state.includes("blocked by");
      i.push(
        this.fact(
          x ? "mdi:cancel" : "mdi:speedometer-slow",
          `${x ? "Blocked" : "Limited"} · ${v}`,
          "warn",
          "Protection limit"
        )
      );
    }
    return i.length ? h`<div class="facts">${i}</div>` : p;
  }
  fact(e, t, i, r = "") {
    return h`<span class="fact ${i}" title=${r}
      ><ha-icon .icon=${e}></ha-icon>${t}</span
    >`;
  }
};
Be.properties = {
  ...F.properties,
  _menu: { state: !0 }
}, Be.styles = Me`
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
    .node-sub.ask {
      color: var(--primary-color);
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
    button.fact {
      border: 1px solid transparent;
    }
    button.fact:hover,
    button.fact:focus-visible {
      border-color: var(--divider-color);
      outline: none;
    }
    button.fact.ask {
      border: 1px dashed var(--primary-color);
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
let ct = Be;
const Re = 3, er = [
  { name: "title", selector: { text: {} } },
  ...Array.from({ length: Re }, (n, e) => ({
    type: "grid",
    name: "",
    schema: [
      { name: `vehicle_${e + 1}_name`, selector: { text: {} } },
      { name: `vehicle_${e + 1}_soc`, selector: { entity: { domain: "sensor" } } }
    ]
  })),
  { name: "prefix", selector: { text: {} } },
  ii(at)
], Gt = {
  title: "Title (optional)",
  prefix: "Entity prefix (only if you renamed the integration's entities)"
}, yt = class yt extends se {
  setConfig(e) {
    this._config = e;
  }
  connectedCallback() {
    super.connectedCallback(), ti().then(() => this.requestUpdate());
  }
  get data() {
    var t, i, r, o;
    const e = {
      title: (t = this._config) == null ? void 0 : t.title,
      prefix: (i = this._config) == null ? void 0 : i.prefix,
      entities: (r = this._config) == null ? void 0 : r.entities
    };
    return (((o = this._config) == null ? void 0 : o.vehicles) ?? []).slice(0, Re).forEach((s, a) => {
      e[`vehicle_${a + 1}_name`] = s.name, e[`vehicle_${a + 1}_soc`] = s.soc;
    }), e;
  }
  changed(e) {
    if (!this._config) return;
    const t = e.detail.value, i = [];
    for (let s = 1; s <= Re; s++) {
      const a = t[`vehicle_${s}_name`], c = t[`vehicle_${s}_soc`];
      (a || c) && i.push({ ...a ? { name: a } : {}, ...c ? { soc: c } : {} });
    }
    i.push(...(this._config.vehicles ?? []).slice(Re));
    const r = { ...this._config, vehicles: i };
    for (const s of ["title", "prefix"])
      t[s] ? r[s] = t[s] : delete r[s];
    const o = ri(t.entities);
    o ? r.entities = o : delete r.entities, this._config = r, this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: r }, bubbles: !0, composed: !0 })
    );
  }
  render() {
    return !this.hass || !this._config ? p : h`
      <ha-form
        .hass=${this.hass}
        .data=${this.data}
        .schema=${er}
        .computeHelper=${(e) => {
      var t;
      return it(at, (t = this._config) == null ? void 0 : t.prefix).helper(e.name);
    }}
        .computeLabel=${(e) => {
      var r;
      if (Gt[e.name]) return Gt[e.name];
      const t = it(at, (r = this._config) == null ? void 0 : r.prefix).label(e.name);
      if (t) return t;
      const i = /^vehicle_(\d)_(name|soc)$/.exec(e.name);
      return i ? `Vehicle ${i[1]} ${i[2] === "name" ? "name" : "SoC sensor"}` : e.name;
    }}
        @value-changed=${this.changed}
      ></ha-form>
    `;
  }
};
yt.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 }
};
let lt = yt;
Y("charging-coordinator-card-editor", lt);
Y("charging-coordinator-card", ct);
je(
  "charging-coordinator-card",
  "Charging Coordinator",
  "Energy flow, charging state, vehicles and controls of the Charging Coordinator"
);
