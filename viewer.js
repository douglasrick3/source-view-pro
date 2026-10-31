// Source View Pro — página do visualizador
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const target = params.get("url");
  const codeEl = $("code");
  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync;

  const DEFAULTS = { theme: "dark", wrap: false, fontSize: 14, intercept: true };
  let settings = { ...DEFAULTS };
  let sourceText = "";

  // ------------------------------------------------------------ preferências
  const store = {
    async load() {
      if (hasChrome) return chrome.storage.sync.get(DEFAULTS);
      try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("svp") || "{}") }; } catch (e) { return { ...DEFAULTS }; }
    },
    save(patch) {
      Object.assign(settings, patch);
      if (hasChrome) chrome.storage.sync.set(patch);
      else try { localStorage.setItem("svp", JSON.stringify(settings)); } catch (e) {}
    }
  };

  const mql = matchMedia("(prefers-color-scheme: light)");
  function applyTheme() {
    const t = settings.theme === "auto" ? (mql.matches ? "light" : "dark") : settings.theme;
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("svp-theme", settings.theme); } catch (e) {}
    document.querySelectorAll("[data-theme-btn]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.themeBtn === settings.theme)));
  }
  mql.addEventListener("change", () => settings.theme === "auto" && applyTheme());

  function applyWrap() {
    document.body.classList.toggle("wrap", settings.wrap);
    $("wrapBtn").setAttribute("aria-pressed", String(settings.wrap));
  }
  function applyFont() {
    document.body.style.setProperty("--fs", settings.fontSize + "px");
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 1600);
  }

  // ------------------------------------------------------------ renderização
  const viewerLink = (href) => `${location.pathname}?url=${encodeURIComponent(href)}`;

  function render(text, lang, baseUrl) {
    const tokens = SVP.highlight(text, lang, baseUrl);
    const lines = SVP.tokensToLines(tokens, viewerLink);
    if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
    document.body.style.setProperty("--digits", String(Math.max(3, String(lines.length).length)));

    // monta em blocos para não travar a aba em páginas enormes
    const CHUNK = 4000;
    let idx = 0;
    codeEl.textContent = "";
    function step() {
      let html = "";
      const end = Math.min(lines.length, idx + CHUNK);
      for (; idx < end; idx++) {
        html += `<div class="l" id="L${idx + 1}"><span class="n" data-n="${idx + 1}"></span><span class="c">${lines[idx] || ""}</span></div>`;
      }
      codeEl.insertAdjacentHTML("beforeend", html);
      if (idx < lines.length) requestAnimationFrame(step);
      else goToHash();
    }
    step();
    return lines.length;
  }

  function goToHash() {
    document.querySelectorAll(".l.target").forEach((el) => el.classList.remove("target"));
    const m = /^#L(\d+)$/.exec(location.hash);
    if (!m) return;
    const el = document.getElementById("L" + m[1]);
    if (el) {
      el.classList.add("target");
      el.scrollIntoView({ block: "center" });
    }
  }
  window.addEventListener("hashchange", goToHash);

  codeEl.addEventListener("click", (e) => {
    const n = e.target.closest(".n");
    if (!n) return;
    history.replaceState(null, "", "#L" + n.dataset.n);
    goToHash();
  });

  function formatBytes(b) {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  }

  function showError(title, detail) {
    codeEl.innerHTML = "";
    const box = document.createElement("div");
    box.className = "msg";
    const h = document.createElement("h1"); h.textContent = title;
    const p = document.createElement("p"); p.innerHTML = detail;
    box.append(h, p);
    codeEl.append(box);
  }

  // ------------------------------------------------------------ carga
  async function load() {
    if (!target) {
      showError("Nenhuma URL informada",
        "Acesse <code>view-source:https://exemplo.com</code>, clique no ícone da extensão ou use <code>Alt+Shift+U</code> em qualquer página.");
      return;
    }

    let host = target;
    try { host = new URL(target).host || target; } catch (e) {}
    document.title = "view-source: " + host;
    const urlEl = $("url");
    urlEl.title = target;
    urlEl.innerHTML = "";
    const b = document.createElement("b"); b.textContent = "view-source:";
    urlEl.append(b, document.createTextNode(target));

    let res;
    try {
      res = await fetch(target, { credentials: "include", cache: "default", redirect: "follow" });
    } catch (err) {
      const isFile = /^file:/i.test(target);
      showError("Não foi possível carregar o código-fonte",
        isFile
          ? "Para arquivos locais, abra <code>chrome://extensions</code>, clique em <b>Detalhes</b> no Source View Pro e ative <b>Permitir acesso a URLs de arquivo</b>."
          : "A requisição falhou (" + String(err.message || err).replace(/</g, "&lt;") + "). Verifique a conexão ou se o site bloqueia o acesso.");
      return;
    }

    sourceText = await res.text();
    const ct = res.headers.get("content-type") || "";
    const lang = SVP.detectLanguage(ct, res.url || target, sourceText);
    const count = render(sourceText, lang, res.url || target);
    const bytes = new Blob([sourceText]).size;
    const status = res.ok ? "" : ` · HTTP ${res.status}`;
    $("meta").textContent = `${count.toLocaleString("pt-BR")} linhas · ${formatBytes(bytes)} · ${lang.toUpperCase()}${status}`;
  }

  // ------------------------------------------------------------ controles
  document.querySelectorAll("[data-theme-btn]").forEach((btn) =>
    btn.addEventListener("click", () => { store.save({ theme: btn.dataset.themeBtn }); applyTheme(); }));

  $("wrapBtn").addEventListener("click", () => { store.save({ wrap: !settings.wrap }); applyWrap(); });

  const setFont = (d) => {
    const fs = Math.min(28, Math.max(9, settings.fontSize + d));
    store.save({ fontSize: fs }); applyFont();
  };
  $("fsDown").addEventListener("click", () => setFont(-1));
  $("fsUp").addEventListener("click", () => setFont(1));

  $("copyBtn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(sourceText); toast("Código copiado"); }
    catch (e) { toast("Não foi possível copiar"); }
  });

  $("openBtn").addEventListener("click", () => { if (target) location.href = target; });

  $("interceptChk").addEventListener("change", (e) => {
    store.save({ intercept: e.target.checked });
    toast(e.target.checked ? "view-source: abrirá aqui" : "view-source: nativo do Chrome restaurado");
  });

  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "z" || e.key === "Z")) { e.preventDefault(); $("wrapBtn").click(); }
  });

  // ------------------------------------------------------------ início
  store.load().then((s) => {
    settings = { ...DEFAULTS, ...s };
    applyTheme(); applyWrap(); applyFont();
    $("interceptChk").checked = settings.intercept;
    load();
  });
})();
