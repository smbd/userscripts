// ==UserScript==
// @name         weathercock-detector-userscript
// @namespace    smbd.jp
// @version      0.1.0
// @author       smbd and codex gpt-5.6-luna max
// @description  Google検索結果に表示されている、特定のfaviconを使うサイトを非表示にする (base: https://github.com/kawa-nobu/weathercock-detector)
// @icon         https://www.google.com/s2/favicons?sz=64&domain=komeri.com
// @match        https://www.google.com/*
// @run-at       document-start
// @noframes
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      gstatic.com
// @connect      *.gstatic.com
// @updateURL    https://github.com/smbd/userscripts/raw/main/weathercock-detector-userscript.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/weathercock-detector-userscript.user.js
// ==/UserScript==

(function () {
  "use strict";

  // ログを有効にする場合は、必要なフラグを true に変更する
  const LOG_HIDE_SEARCH = true;
  const LOG_FAVICON_HASH = false;

  // 詐欺サイトが使用するコメリfaviconのSHA-256ハッシュ
  const HASH_RULES = {
    "5449de972eaaa6162d46af7f52bc108f4cf615096506be5700c2d3927df0b6a8":
      "new-komeri",
    "c2080ff1963e45caf6907e61d48c80e64e9c66eae89828279c7dacc083391cb0":
      "komeri-favicon",
    "e72c52e5d1366d96b335496f005631cfff5efe6080d82e55c2ffc7ec0c93fd76":
      "komeri-favicon-small",
    "a633dc291107032eaa5ddb02e2b970f2513997cf37a164334251d5601ceaf8a3":
      "ajinomoto-favicon",
    "c9955a1a04c5a2a725a46a92e442647b177beed5e2a61f3b6859a9d7a849e57d":
      "rakuma-favicon-small",
    "380538c0ebfabe6586c0314d754f1541eedebc247f56a6577d01a38259e5d357":
      "rakuma-favicon",
    "3cf589e14b7ccac2b844e572b5fbcb43b4ae1ffc4ecc4872de7136e818a2ca28":
      "rakuten-blue-favicon",
    "a0a95953233a2d2c0c8003f66af1ee1f892518babed6212fdab6a0811acecdbc":
      "askul-favicon",
    "a843a3a3d1563154dc0fb9a19a07cf4804bc76649eba9196d794c825db4ea4c2":
      "askul-favicon-large",
  };

  // コメリ公式ドメインの除外パターン
  const EXCLUSION_URLS = new RegExp('(?:' + [
    String.raw`^www\.komeri\.com`,
    String.raw`toyu\.komeri\.com`,
    String.raw`^www\.komeri\.bit\.or\.jp`,
    String.raw`fril\.jp`,
    String.raw`rakuten\.co\.jp`,
    String.raw`^www\.askul\.co\.jp`,
    String.raw`solution\.soloel\.com`,
    String.raw`ajinomoto\.co\.jp`,
    String.raw`^www\.ajioligos\.com`,
    String.raw`rakuten\.com`,
    String.raw`rakuten-card\.co\.jp`,
    String.raw`rakuten-bank\.co\.jp`,
    String.raw`rakuten-sec\.co\.jp`,
    String.raw`rakuten-life\.co\.jp`,
  ].join('|') + ')$');

  const PROCESSED_ATTRIBUTE = "data-weathercock-processed";
  const VERIFIED_ATTRIBUTE = "data-weathercock-verified";
  const HIDDEN_ATTRIBUTE = "data-weathercock-hidden";

  // 検証が終わるまで検索結果を表示しない（元の拡張機能の hide.css 相当）
  GM_addStyle(`
    #search div[jscontroller][data-hveid][data-ved]:not([${VERIFIED_ATTRIBUTE}]):not([id^="kp-wp-tab-cont-"]):has(cite),
    #search div[data-attrid="images universal"]:not([${VERIFIED_ATTRIBUTE}]) {
      display: none;
    }
  `);

  function bytesFromDataUrl(dataUrl) {
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return null;

    const metadata = dataUrl.slice(5, comma);
    if (!/^image\//i.test(metadata) || !/;base64(?:;|$)/i.test(metadata)) {
      return null;
    }

    try {
      const binary = atob(dataUrl.slice(comma + 1));
      return Uint8Array.from(binary, (character) => character.charCodeAt(0));
    } catch {
      return null;
    }
  }

  async function createHash(bytes) {
    const buffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function getDataHash(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith("data:")) return null;

    const bytes = bytesFromDataUrl(dataUrl);
    if (!bytes) return null;

    return createHash(bytes);
  }

  function getRemoteHash(url) {
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        responseType: "arraybuffer",
        timeout: 10000,
        onload: async (response) => {
          if (response.status < 200 || response.status >= 300 || !response.response) {
            resolve(null);
            return;
          }

          try {
            resolve(await createHash(response.response));
          } catch {
            resolve(null);
          }
        },
        onerror: () => resolve(null),
        onabort: () => resolve(null),
        ontimeout: () => resolve(null),
      });
    });
  }

  function markVerified(resultElement) {
    resultElement.setAttribute(VERIFIED_ATTRIBUTE, "");
  }

  function logFaviconHash(hash, targetLink) {
    if (!LOG_FAVICON_HASH) return;
    console.log(`komeri block: favicon hash: ${hash} at ${targetLink.href}`);
  }

  function logHideSearch(targetLink) {
    if (!LOG_HIDE_SEARCH) return;
    console.log(`komeri block: hide search: ${targetLink.href}`);
  }

  function resetImage(image) {
    image.removeAttribute(PROCESSED_ATTRIBUTE);

    const targetLink = image.closest('a[jsname][data-ved], a[target="_blank"]');
    const targetElement = targetLink?.closest(
      "div[jscontroller][data-hveid][data-ved]",
    );
    if (!targetElement) return;

    targetElement.removeAttribute(VERIFIED_ATTRIBUTE);
    if (targetElement.hasAttribute(HIDDEN_ATTRIBUTE)) {
      targetElement.removeAttribute(HIDDEN_ATTRIBUTE);
      targetElement.style.removeProperty("display");
    }
  }

  async function processImage(image) {
    image.setAttribute(PROCESSED_ATTRIBUTE, "");

    const targetLink = image.closest('a[jsname][data-ved], a[target="_blank"]');
    if (!targetLink) return;

    const targetElement = targetLink.closest(
      "div[jscontroller][data-hveid][data-ved]",
    );
    if (!targetElement) return;

    let targetHost;
    try {
      targetHost = new URL(targetLink.href, document.baseURI).host;
    } catch {
      markVerified(targetElement);
      return;
    }

    // 公式ドメインはスキップする
    if (EXCLUSION_URLS.test(targetHost)) {
      markVerified(targetElement);
      return;
    }

    const source = image.currentSrc || image.src;
    const hash = source.startsWith("https://")
      ? await getRemoteHash(source)
      : await getDataHash(source);

    // 非同期取得中に favicon が差し替えられた場合は、古い結果を適用しない
    if ((image.currentSrc || image.src) !== source) return;

    logFaviconHash(hash, targetLink);

    const detectResult = HASH_RULES[hash] ?? null;
    if (!detectResult) {
      markVerified(targetElement);
      return;
    }

    // faviconが一致した場合は検索結果から非表示にする
    logHideSearch(targetLink);
    targetElement.setAttribute(HIDDEN_ATTRIBUTE, "");
    targetElement.style.setProperty("display", "none");
  }

  async function processAll() {
    const targetImages = [...document.querySelectorAll(
      `#search img[src^="data:image"]:not([${PROCESSED_ATTRIBUTE}]),
       #search img[src^="https://"]:not([${PROCESSED_ATTRIBUTE}])`,
    )].filter((image) => image.naturalWidth <= 32);

    await Promise.all(targetImages.map((image) => processImage(image)));
  }

  let processScheduled = false;
  let processing = false;
  let processAgain = false;

  function scheduleProcess() {
    if (processScheduled) return;
    processScheduled = true;

    queueMicrotask(async () => {
      processScheduled = false;
      if (processing) {
        processAgain = true;
        return;
      }

      processing = true;
      try {
        await processAll();
      } finally {
        processing = false;
        if (processAgain) {
          processAgain = false;
          scheduleProcess();
        }
      }
    });
  }

  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        shouldProcess = true;
        continue;
      }

      if (mutation.type === "attributes" && mutation.attributeName === "src") {
        resetImage(mutation.target);
        shouldProcess = true;
      }
    }

    if (shouldProcess) {
      scheduleProcess();
    }
  });

  function start() {
    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
    scheduleProcess();
  }

  start();
})();
