(function (A, y) {
  typeof exports === "object" && typeof module < "u" ? (module.exports = y()) : typeof define === "function" && define.amd ? define(["fs"], y) : ((A = typeof globalThis < "u" ? globalThis : A || self), (A.LZString = y(A.fs)));
})(this, function (A) {
  "use strict";
  function y(e, n, i) {
    if (e == null) {
      return "";
    }
    let o;
    const u = {},
      r = {};
    let a = "",
      d = "",
      c = "",
      p = 2,
      w = 3,
      s = 2;
    const h = [];
    let t = 0,
      l = 0;
    for (let f = 0; f < e.length; f += 1) {
      if (((a = e.charAt(f)), Object.prototype.hasOwnProperty.call(u, a) || ((u[a] = w++), (r[a] = !0)), (d = c + a), Object.prototype.hasOwnProperty.call(u, d))) {
        c = d;
      } else {
        if (Object.prototype.hasOwnProperty.call(r, c)) {
          if (c.charCodeAt(0) < 256) {
            for (let g = 0; g < s; g++) {
              (t = t << 1), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++;
            }
            o = c.charCodeAt(0);
            for (let g = 0; g < 8; g++) {
              (t = (t << 1) | (o & 1)), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++, (o = o >> 1);
            }
          } else {
            o = 1;
            for (let g = 0; g < s; g++) {
              (t = (t << 1) | o), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++, (o = 0);
            }
            o = c.charCodeAt(0);
            for (let g = 0; g < 16; g++) {
              (t = (t << 1) | (o & 1)), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++, (o = o >> 1);
            }
          }
          p--, p == 0 && ((p = Math.pow(2, s)), s++), delete r[c];
        } else {
          o = u[c];
          for (let g = 0; g < s; g++) {
            (t = (t << 1) | (o & 1)), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++, (o = o >> 1);
          }
        }
        p--, p == 0 && ((p = Math.pow(2, s)), s++), (u[d] = w++), (c = String(a));
      }
    }
    if (c !== "") {
      if (Object.prototype.hasOwnProperty.call(r, c)) {
        if (c.charCodeAt(0) < 256) {
          for (let f = 0; f < s; f++) {
            (t = t << 1), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++;
          }
          o = c.charCodeAt(0);
          for (let f = 0; f < 8; f++) {
            (t = (t << 1) | (o & 1)), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++, (o = o >> 1);
          }
        } else {
          o = 1;
          for (let f = 0; f < s; f++) {
            (t = (t << 1) | o), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++, (o = 0);
          }
          o = c.charCodeAt(0);
          for (let f = 0; f < 16; f++) {
            (t = (t << 1) | (o & 1)), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++, (o = o >> 1);
          }
        }
        p--, p == 0 && ((p = Math.pow(2, s)), s++), delete r[c];
      } else {
        o = u[c];
        for (let f = 0; f < s; f++) {
          (t = (t << 1) | (o & 1)), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++, (o = o >> 1);
        }
      }
      p--, p == 0 && ((p = Math.pow(2, s)), s++);
    }
    o = 2;
    for (let f = 0; f < s; f++) {
      (t = (t << 1) | (o & 1)), l == n - 1 ? ((l = 0), h.push(i(t)), (t = 0)) : l++, (o = o >> 1);
    }
    let x = !0;
    do {
      (t = t << 1), l == n - 1 ? (h.push(i(t)), (x = !1)) : l++;
    }
    while (x);
    return h.join("");
  }
  function v(e, n, i) {
    const o = [],
      u = [],
      r = { val: i(0), position: n, index: 1 };
    let a = 4,
      d = 4,
      c = 3,
      p = "",
      w,
      s = 0,
      h = Math.pow(2, 2),
      t = 1;
    for (let f = 0; f < 3; f += 1) {
      o[f] = String(f);
    }
    for (; t != h; ) {
      const f = r.val & r.position;
      (r.position >>= 1), r.position == 0 && ((r.position = n), (r.val = i(r.index++))), (s |= (f > 0 ? 1 : 0) * t), (t <<= 1);
    }
    switch (s) {
    case 0:
      for (s = 0, h = Math.pow(2, 8), t = 1; t != h; ) {
        const f = r.val & r.position;
        (r.position >>= 1), r.position == 0 && ((r.position = n), (r.val = i(r.index++))), (s |= (f > 0 ? 1 : 0) * t), (t <<= 1);
      }
      w = String.fromCharCode(s);
      break;
    case 1:
      for (s = 0, h = Math.pow(2, 16), t = 1; t != h; ) {
        const f = r.val & r.position;
        (r.position >>= 1), r.position == 0 && ((r.position = n), (r.val = i(r.index++))), (s |= (f > 0 ? 1 : 0) * t), (t <<= 1);
      }
      w = String.fromCharCode(s);
      break;
    case 2:
      return "";
    }
    if (w === void 0) {
      throw new Error("No character found");
    }
    o[3] = String(w);
    let l = String(w);
    u.push(String(w));
    const x = !0;
    for (; x; ) {
      if (r.index > e) {
        return "";
      }
      for (s = 0, h = Math.pow(2, c), t = 1; t != h; ) {
        const f = r.val & r.position;
        (r.position >>= 1), r.position == 0 && ((r.position = n), (r.val = i(r.index++))), (s |= (f > 0 ? 1 : 0) * t), (t <<= 1);
      }
      switch ((w = s)) {
      case 0:
        for (s = 0, h = Math.pow(2, 8), t = 1; t != h; ) {
          const f = r.val & r.position;
          (r.position >>= 1), r.position == 0 && ((r.position = n), (r.val = i(r.index++))), (s |= (f > 0 ? 1 : 0) * t), (t <<= 1);
        }
        (o[d++] = String.fromCharCode(s)), (w = d - 1), a--;
        break;
      case 1:
        for (s = 0, h = Math.pow(2, 16), t = 1; t != h; ) {
          const f = r.val & r.position;
          (r.position >>= 1), r.position == 0 && ((r.position = n), (r.val = i(r.index++))), (s |= (f > 0 ? 1 : 0) * t), (t <<= 1);
        }
        (o[d++] = String.fromCharCode(s)), (w = d - 1), a--;
        break;
      case 2:
        return u.join("");
      }
      if ((a == 0 && ((a = Math.pow(2, c)), c++), o[w])) {
        p = String(o[w]);
      } else if (w === d) {
        p = l + l.charAt(0);
      } else {
        return null;
      }
      u.push(p), (o[d++] = l + p.charAt(0)), a--, (l = p), a == 0 && ((a = Math.pow(2, c)), c++);
    }
  }
  const m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  function O(e) {
    if (e == null) {
      return "";
    }
    const n = y(e, 6, (i) => m.charAt(i));
    switch (n.length % 4) {
    default:
    case 0:
      return n;
    case 1:
      return n + "===";
    case 2:
      return n + "==";
    case 3:
      return n + "=";
    }
  }
  const M = {};
  function T(e, n) {
    if (!M[e]) {
      M[e] = {};
      for (let i = 0; i < e.length; i++) {
        M[e][e.charAt(i)] = i;
      }
    }
    return M[e][n];
  }
  function B(e) {
    return e == null ? "" : e == "" ? null : v(e.length, 32, (n) => T(m, e.charAt(n)));
  }
  function _(e) {
    return e == null ? "" : y(e, 16, (n) => String.fromCharCode(n));
  }
  function L(e, n) {
    if (e == null) {
      return "";
    }
    const i = _(e),
      o = Math.ceil(Math.log(65536) / Math.log(n.length));
    let u = "";
    for (let r = 0, a = i.length; r < a; r++) {
      let d = i.charCodeAt(r);
      for (let c = o - 1; c >= 0; c--) {
        const p = Math.floor(d / Math.pow(n.length, c));
        (d = d % Math.pow(n.length, c)), (u += n.charAt(p));
      }
    }
    return u;
  }
  function S(e) {
    return e == null ? "" : e == "" ? null : v(e.length, 32768, (n) => e.charCodeAt(n));
  }
  function k(e, n) {
    if (e == null) {
      return "";
    }
    if (e == "" || n.length < 2) {
      return null;
    }
    const i = Math.ceil(Math.log(65536) / Math.log(n.length));
    if (e.length % i != 0) {
      return null;
    }
    let o = "",
      u,
      r;
    for (let a = 0, d = e.length; a < d; a = a + i) {
      u = 0;
      for (let c = 0; c < i; c++) {
        (r = n.indexOf(e[a + c])), (u = u + r * Math.pow(n.length, i - 1 - c));
      }
      o = o + String.fromCharCode(u);
    }
    return S(o);
  }
  const U = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
  function b(e) {
    return e == null ? "" : y(e, 6, (n) => U.charAt(n));
  }
  function E(e) {
    return e == null ? "" : e == "" ? null : ((e = e.replace(/ /g, "+")), v(e.length, 32, (n) => T(U, e.charAt(n))));
  }
  function R(e) {
    const n = _(e),
      i = new Uint8Array(n.length * 2);
    for (let o = 0, u = n.length; o < u; o++) {
      const r = n.charCodeAt(o);
      (i[o * 2] = r >>> 8), (i[o * 2 + 1] = r % 256);
    }
    return i;
  }
  function j(e, n) {
    if (typeof e === "string") {
      const i = !n && e.charCodeAt(e.length - 1) % 256 === 0,
        o = new Uint8Array(e.length * 2 - (i ? 1 : 0));
      for (let u = 0; u < e.length; u++) {
        const r = e.charCodeAt(u);
        (o[u * 2] = r >>> 8), (!i || u < e.length - 1) && (o[u * 2 + 1] = r % 256);
      }
      return o;
    }
    return e;
  }
  function C(e) {
    const n = Math.floor(e.byteLength / 2),
      i = [];
    for (let o = 0; o < n; o++) {
      i.push(String.fromCharCode(e[o * 2] * 256 + e[o * 2 + 1]));
    }
    return e.byteLength & 1 && i.push(String.fromCharCode(e[e.byteLength - 1] * 256)), i.join("");
  }
  function z(e) {
    return e == null ? S(e) : S(C(e));
  }
  function q(e, n) {
    A.writeFileSync(e, typeof n === "string" ? j(n) : n, null);
  }
  function D(e) {
    return C(A.readFileSync(e, null));
  }
  function F(e) {
    return e == null ? "" : y(e, 15, (n) => String.fromCharCode(n + 32)) + " ";
  }
  function Z(e) {
    return e == null ? "" : e == "" ? null : v(e.length, 16384, (n) => e.charCodeAt(n) - 32);
  }
  return { _compress: y, _decompress: v, compress: _, compressToBase64: O, compressToCustom: L, compressToEncodedURIComponent: b, compressToUint8Array: R, compressToUTF16: F, convertFromUint8Array: C, convertToUint8Array: j, decompress: S, decompressFromBase64: B, decompressFromCustom: k, decompressFromEncodedURIComponent: E, decompressFromUint8Array: z, decompressFromUTF16: Z, loadBinaryFile: D, saveBinaryFile: q };
});
//# sourceMappingURL=index.umd.js.map
