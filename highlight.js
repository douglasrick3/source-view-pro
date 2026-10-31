// Source View Pro — destaque de sintaxe (HTML, CSS e JavaScript)
// Tokenizador próprio, sem dependências. Gera uma lista de tokens [classe, texto, extra].

(function (root) {
  "use strict";

  // ---------------------------------------------------------------- JS
  const JS_KEYWORDS = new Set(("var let const function class extends this super true false null undefined " +
    "typeof instanceof new void delete in of async get set static NaN Infinity").split(" "));
  const JS_CONTROL = new Set(("if else for while do return switch case default break continue try catch " +
    "finally throw await yield import export from as with debugger").split(" "));
  const REGEX_PRECEDERS = new Set(["return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "yield", "await"]);

  function tokenizeJS(src, out) {
    const n = src.length;
    let i = 0;
    let prevSignificant = ""; // para decidir se "/" é regex ou divisão
    let prevWasDot = false;

    const push = (cls, text) => { if (text) out.push([cls, text]); };

    while (i < n) {
      const ch = src[i];
      const next = src[i + 1];

      // espaços
      if (/\s/.test(ch)) {
        let j = i + 1;
        while (j < n && /\s/.test(src[j])) j++;
        push("", src.slice(i, j)); i = j; continue;
      }
      // comentários
      if (ch === "/" && next === "/") {
        let j = src.indexOf("\n", i); if (j < 0) j = n;
        push("cm", src.slice(i, j)); i = j; continue;
      }
      if (ch === "/" && next === "*") {
        let j = src.indexOf("*/", i + 2); j = j < 0 ? n : j + 2;
        push("cm", src.slice(i, j)); i = j; continue;
      }
      // strings
      if (ch === '"' || ch === "'" || ch === "`") {
        let j = i + 1;
        while (j < n && src[j] !== ch) {
          if (src[j] === "\\") j++;
          else if (ch !== "`" && src[j] === "\n") break;
          j++;
        }
        j = Math.min(n, j + 1);
        push("v", src.slice(i, j)); i = j; prevSignificant = "str"; prevWasDot = false; continue;
      }
      // regex literal
      if (ch === "/") {
        const canBeRegex = prevSignificant === "" || /^[(,=:[!&|?{};+\-*%<>~^]$/.test(prevSignificant) || REGEX_PRECEDERS.has(prevSignificant);
        if (canBeRegex) {
          let j = i + 1, inClass = false, ok = false;
          while (j < n && src[j] !== "\n") {
            const c = src[j];
            if (c === "\\") { j += 2; continue; }
            if (c === "[") inClass = true;
            else if (c === "]") inClass = false;
            else if (c === "/" && !inClass) { ok = true; break; }
            j++;
          }
          if (ok) {
            j++;
            while (j < n && /[a-z]/i.test(src[j])) j++;
            push("rx", src.slice(i, j)); i = j; prevSignificant = "rx"; prevWasDot = false; continue;
          }
        }
      }
      // números
      if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(next || ""))) {
        const m = /^(0[xX][0-9a-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?n?)/.exec(src.slice(i, i + 64));
        const t = m ? m[0] : ch;
        push("nu", t); i += t.length; prevSignificant = "num"; prevWasDot = false; continue;
      }
      // identificadores
      if (/[A-Za-z_$À-￿]/.test(ch)) {
        let j = i + 1;
        while (j < n && /[\w$À-￿]/.test(src[j])) j++;
        const word = src.slice(i, j);
        let k = j; while (k < n && (src[k] === " " || src[k] === "\t")) k++;
        const isCall = src[k] === "(";
        let cls;
        if (prevWasDot) cls = isCall ? "fn" : "vr";
        else if (JS_CONTROL.has(word)) cls = "ct";
        else if (JS_KEYWORDS.has(word)) cls = "kw";
        else if (isCall) cls = "fn";
        else if (/^[A-Z][A-Za-z0-9_$]*[a-z]/.test(word)) cls = "ty";
        else cls = "vr";
        push(cls, word); i = j;
        prevSignificant = (cls === "ct" || cls === "kw") ? word : "id";
        prevWasDot = false;
        continue;
      }
      // pontuação / operadores
      push("", ch);
      prevWasDot = ch === "." ;
      prevSignificant = (ch === ")" || ch === "]") ? "id" : ch;
      i++;
    }
    return out;
  }

  // ---------------------------------------------------------------- CSS
  function tokenizeCSS(src, out) {
    const n = src.length;
    let i = 0;
    const stack = [];            // tipos de bloco: "sel" (contém regras) ou "decl" (contém declarações)
    let state = "sel";           // sel | prop | val | at
    let atName = "";
    const push = (cls, text) => { if (text) out.push([cls, text]); };
    const blockState = () => (stack.length ? (stack[stack.length - 1] === "decl" ? "prop" : "sel") : "sel");

    while (i < n) {
      const ch = src[i];
      const next = src[i + 1];

      if (/\s/.test(ch)) {
        let j = i + 1; while (j < n && /\s/.test(src[j])) j++;
        push("", src.slice(i, j)); i = j; continue;
      }
      if (ch === "/" && next === "*") {
        let j = src.indexOf("*/", i + 2); j = j < 0 ? n : j + 2;
        push("cm", src.slice(i, j)); i = j; continue;
      }
      if (ch === '"' || ch === "'") {
        let j = i + 1;
        while (j < n && src[j] !== ch && src[j] !== "\n") { if (src[j] === "\\") j++; j++; }
        j = Math.min(n, j + 1);
        push(state === "sel" ? "sel" : "v", src.slice(i, j)); i = j; continue;
      }
      if (ch === "@") {
        let j = i + 1; while (j < n && /[\w-]/.test(src[j])) j++;
        atName = src.slice(i + 1, j).toLowerCase();
        push("ct", src.slice(i, j)); i = j; state = "at"; continue;
      }
      if (ch === "{") {
        let type;
        if (state === "at") type = /^(media|supports|container|layer|document|scope|starting-style)$/.test(atName) ? "sel" : "decl";
        else if (state === "sel") type = "decl";
        else type = "decl"; // aninhamento CSS
        stack.push(type);
        push("", ch); i++; state = blockState(); atName = ""; continue;
      }
      if (ch === "}") {
        stack.pop();
        push("", ch); i++; state = blockState(); continue;
      }
      if (ch === ";") {
        push("", ch); i++;
        state = state === "at" ? blockState() : (stack.length && stack[stack.length - 1] === "decl" ? "prop" : "sel");
        continue;
      }

      if (state === "sel") {
        let j = i;
        while (j < n && !/[{};\/"']/.test(src[j])) {
          if (src[j] === "/" && src[j + 1] === "*") break;
          j++;
        }
        if (j === i) j = i + 1;
        push("sel", src.slice(i, j)); i = j; continue;
      }

      if (state === "prop") {
        if (ch === ":") { push("", ch); i++; state = "val"; continue; }
        let j = i; while (j < n && /[\w-]/.test(src[j])) j++;
        if (j > i) { push("pr", src.slice(i, j)); i = j; continue; }
        // provavelmente seletor aninhado (&:hover, .x)
        let k = i; while (k < n && !/[{};]/.test(src[k])) k++;
        if (src[k] === "{") { push("sel", src.slice(i, k)); i = k; state = "sel"; continue; }
        push("", ch); i++; continue;
      }

      // val e at (prelúdio de @regra)
      if (ch === "#") {
        let j = i + 1; while (j < n && /[0-9a-fA-F]/.test(src[j])) j++;
        push("cv", src.slice(i, j)); i = j; continue;
      }
      if (/[0-9]/.test(ch) || ((ch === "." || ch === "-" || ch === "+") && /[0-9.]/.test(next || ""))) {
        const m = /^[+-]?(?:\d*\.\d+|\d+\.?)(?:e[+-]?\d+)?(%|[a-zA-Z]+)?/.exec(src.slice(i, i + 40));
        if (m) { push("nu", m[0]); i += m[0].length; continue; }
      }
      if (ch === "!") {
        let j = i + 1; while (j < n && /[\w]/.test(src[j])) j++;
        push("kw", src.slice(i, j)); i = j; continue;
      }
      if (/[\w-]/.test(ch)) {
        let j = i; while (j < n && /[\w-]/.test(src[j])) j++;
        const word = src.slice(i, j);
        if (src[j] === "(") {
          push("fn", word);
          if (word.toLowerCase() === "url") {
            // url(...) sem aspas
            let k = j + 1; while (k < n && /\s/.test(src[k])) k++;
            if (src[k] !== '"' && src[k] !== "'") {
              const end = src.indexOf(")", k);
              if (end > 0) { push("", "("); push("v", src.slice(j + 1, end)); push("", ")"); i = end + 1; continue; }
            }
          }
        } else if (state === "at") {
          push(/^(and|not|only|or)$/i.test(word) ? "ct" : "cv", word);
        } else {
          push("cv", word);
        }
        i = j; continue;
      }
      push("", ch); i++;
    }
    return out;
  }

  // ---------------------------------------------------------------- HTML
  const RAW_TEXT = new Set(["script", "style", "textarea", "title", "xmp", "noscript", "plaintext"]);
  const URL_ATTRS = new Set(["href", "src", "action", "data", "poster", "cite", "formaction", "background", "manifest", "srcset"]);

  function scriptLang(attrs) {
    const type = (attrs.type || "").trim().toLowerCase();
    if (!type || /(java|ecma)script|^module$|json|babel|jsx|importmap/.test(type)) return "js";
    return "text";
  }

  function tokenizeHTML(src, out, baseUrl) {
    const n = src.length;
    let i = 0;
    const push = (cls, text, extra) => { if (text) out.push(extra ? [cls, text, extra] : [cls, text]); };
    const resolve = (u) => {
      try { return new URL(u.trim(), baseUrl).href; } catch (e) { return null; }
    };

    while (i < n) {
      const lt = src.indexOf("<", i);
      const amp = src.indexOf("&", i);
      // texto até o próximo "<" ou "&"
      let stop = lt < 0 ? n : lt;
      if (amp >= 0 && amp < stop) {
        if (amp > i) push("tx", src.slice(i, amp));
        const m = /^&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i.exec(src.slice(amp, amp + 40));
        if (m) { push("en", m[0]); i = amp + m[0].length; }
        else { push("tx", "&"); i = amp + 1; }
        continue;
      }
      if (stop > i) push("tx", src.slice(i, stop));
      if (lt < 0) break;
      i = lt;

      // comentário
      if (src.startsWith("<!--", i)) {
        let j = src.indexOf("-->", i + 4); j = j < 0 ? n : j + 3;
        push("cm", src.slice(i, j)); i = j; continue;
      }
      // CDATA
      if (src.startsWith("<![CDATA[", i)) {
        let j = src.indexOf("]]>", i); j = j < 0 ? n : j + 3;
        push("cm", src.slice(i, j)); i = j; continue;
      }
      // doctype / declaração
      if (src[i + 1] === "!" || src[i + 1] === "?") {
        let j = src.indexOf(">", i); j = j < 0 ? n : j + 1;
        const body = src.slice(i, j);
        const m = /^(<[!?])([\w-]*)([\s\S]*?)(\??>)?$/.exec(body);
        if (m) {
          push("p", m[1]); push("dt", m[2]);
          // atributos dentro do doctype / xml
          m[3].split(/("[^"]*"|'[^']*')/).forEach((part) => {
            if (!part) return;
            push(/^["']/.test(part) ? "v" : "at", part);
          });
          if (m[4]) push("p", m[4]);
        } else push("dt", body);
        i = j; continue;
      }
      // tag de fechamento
      if (src[i + 1] === "/" && /[A-Za-z]/.test(src[i + 2] || "")) {
        let j = i + 2; while (j < n && /[^\s>\/]/.test(src[j])) j++;
        push("p", "</"); push("tg", src.slice(i + 2, j));
        let k = src.indexOf(">", j); k = k < 0 ? n : k;
        push("", src.slice(j, k));
        if (k < n) push("p", ">");
        i = k + 1; continue;
      }
      // tag de abertura
      if (/[A-Za-z]/.test(src[i + 1] || "")) {
        let j = i + 1; while (j < n && /[^\s>\/]/.test(src[j])) j++;
        const tagName = src.slice(i + 1, j).toLowerCase();
        push("p", "<"); push("tg", src.slice(i + 1, j));
        i = j;
        const attrs = {};
        let selfClosing = false;
        // atributos
        while (i < n) {
          const c = src[i];
          if (/\s/.test(c)) {
            let k = i + 1; while (k < n && /\s/.test(src[k])) k++;
            push("", src.slice(i, k)); i = k; continue;
          }
          if (c === ">") { push("p", ">"); i++; break; }
          if (c === "/" && src[i + 1] === ">") { push("p", "/>"); i += 2; selfClosing = true; break; }
          if (c === "/") { push("p", "/"); i++; continue; }
          // nome do atributo
          let k = i; while (k < n && /[^\s"'>\/=]/.test(src[k])) k++;
          if (k === i) k = i + 1;
          const name = src.slice(i, k);
          push("at", name); i = k;
          // espaços + "="
          let s = i; while (s < n && /\s/.test(src[s])) s++;
          if (src[s] !== "=") { attrs[name.toLowerCase()] = ""; continue; }
          push("", src.slice(i, s)); push("p", "="); i = s + 1;
          s = i; while (s < n && /\s/.test(src[s])) s++;
          push("", src.slice(i, s)); i = s;
          // valor
          let value, raw;
          if (src[i] === '"' || src[i] === "'") {
            const q = src[i];
            let e = src.indexOf(q, i + 1); e = e < 0 ? n : e + 1;
            raw = src.slice(i, e); value = raw.slice(1, raw.endsWith(q) && raw.length > 1 ? -1 : undefined);
            i = e;
          } else {
            let e = i; while (e < n && /[^\s>]/.test(src[e])) e++;
            raw = src.slice(i, e); value = raw; i = e;
          }
          const lname = name.toLowerCase();
          attrs[lname] = value;
          const linkable = URL_ATTRS.has(lname) && lname !== "srcset" && value && !/^\s*(javascript|data|mailto|tel|#)/i.test(value);
          const href = linkable ? resolve(value) : null;
          push("v", raw, href ? { href } : null);
        }
        // conteúdo bruto de script/style
        if (!selfClosing && RAW_TEXT.has(tagName)) {
          const re = new RegExp("</" + tagName + "[\\s>/]", "ig");
          re.lastIndex = i;
          const m = re.exec(src);
          const end = m ? m.index : n;
          const content = src.slice(i, end);
          if (tagName === "script" && scriptLang(attrs) === "js") tokenizeJS(content, out);
          else if (tagName === "style") tokenizeCSS(content, out);
          else push("tx", content);
          i = end;
        }
        continue;
      }
      // "<" solto
      push("tx", "<"); i++;
    }
    return out;
  }

  // ---------------------------------------------------------------- renderização
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ESC[c]);

  /**
   * Converte tokens em um array de linhas HTML (uma string por linha),
   * fechando e reabrindo spans quando um token atravessa quebras de linha.
   */
  function tokensToLines(tokens, linkFor) {
    const lines = [];
    let cur = "";
    for (const [cls, text, extra] of tokens) {
      const parts = text.split("\n");
      for (let p = 0; p < parts.length; p++) {
        if (p > 0) { lines.push(cur); cur = ""; }
        const piece = parts[p].replace(/\r$/, "");
        if (!piece) continue;
        let html = esc(piece);
        if (extra && extra.href && parts.length === 1 && linkFor) {
          html = `<a class="lk" href="${esc(linkFor(extra.href))}">${html}</a>`;
        }
        cur += cls ? `<span class="${cls}">${html}</span>` : html;
      }
    }
    lines.push(cur);
    return lines;
  }

  function detectLanguage(contentType, url, text) {
    const ct = (contentType || "").toLowerCase();
    const path = (() => { try { return new URL(url).pathname.toLowerCase(); } catch (e) { return ""; } })();
    if (/css/.test(ct) || /\.css$/.test(path)) return "css";
    if (/javascript|ecmascript|json/.test(ct) || /\.(m?js|json|cjs)$/.test(path)) return "js";
    if (/html|xml|svg/.test(ct) || /\.(html?|xhtml|xml|svg)$/.test(path)) return "html";
    if (/^\s*</.test(text)) return "html";
    if (/text\/plain/.test(ct)) return "text";
    return "html";
  }

  function highlight(text, lang, baseUrl) {
    const out = [];
    if (lang === "css") tokenizeCSS(text, out);
    else if (lang === "js") tokenizeJS(text, out);
    else if (lang === "text") out.push(["tx", text]);
    else tokenizeHTML(text, out, baseUrl);
    return out;
  }

  const api = { highlight, tokensToLines, detectLanguage, tokenizeHTML, tokenizeCSS, tokenizeJS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SVP = api;
})(typeof self !== "undefined" ? self : this);
