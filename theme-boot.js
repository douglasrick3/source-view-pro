// Aplica o tema antes da primeira pintura (evita "piscar" branco/preto).
(function () {
  var pref = "dark";
  try { pref = localStorage.getItem("svp-theme") || "dark"; } catch (e) {}
  var t = pref === "auto"
    ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : pref;
  document.documentElement.setAttribute("data-theme", t);
})();
