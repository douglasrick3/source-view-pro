// Source View Pro — service worker
// O Chrome não permite que extensões injetem scripts em páginas view-source:.
// Por isso a extensão detecta a navegação para view-source: e redireciona a aba
// para o próprio visualizador, que baixa o HTML e aplica o destaque de sintaxe.

const VIEWER = chrome.runtime.getURL("viewer.html");
const DEFAULTS = { intercept: true };

function viewerUrlFor(target) {
  return `${VIEWER}?url=${encodeURIComponent(target)}`;
}

function isViewable(url) {
  return /^(https?|file):/i.test(url || "");
}

async function interceptEnabled() {
  const { intercept } = await chrome.storage.sync.get(DEFAULTS);
  return intercept;
}

// 1) Intercepta qualquer aba que navegue para view-source:...
async function maybeRedirect(tabId, url) {
  if (!url || !url.startsWith("view-source:")) return;
  const target = url.slice("view-source:".length);
  if (!isViewable(target)) return;
  if (!(await interceptEnabled())) return;
  chrome.tabs.update(tabId, { url: viewerUrlFor(target) });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  maybeRedirect(tabId, changeInfo.url || (changeInfo.status === "loading" ? tab.url : null));
});
chrome.tabs.onCreated.addListener((tab) => {
  maybeRedirect(tab.id, tab.pendingUrl || tab.url);
});

// 2) Abre o visualizador a partir de uma aba comum
function openFor(tab) {
  if (!tab) return;
  let url = tab.url || "";
  if (url.startsWith("view-source:")) url = url.slice(12);
  if (url.startsWith(VIEWER)) return;
  if (!isViewable(url)) return;
  chrome.tabs.create({ url: viewerUrlFor(url), index: tab.index + 1, openerTabId: tab.id });
}

chrome.action.onClicked.addListener(openFor);

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "open-source-view") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  openFor(tab);
});

// 3) Menu de contexto (botão direito)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "svp-page",
      title: "Ver código-fonte (Source View Pro)",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
      id: "svp-link",
      title: "Ver código-fonte do link (Source View Pro)",
      contexts: ["link"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "svp-link" && isViewable(info.linkUrl)) {
    chrome.tabs.create({ url: viewerUrlFor(info.linkUrl), index: tab.index + 1 });
  } else if (info.menuItemId === "svp-page") {
    openFor(tab);
  }
});
