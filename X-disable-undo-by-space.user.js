// ==UserScript==
// @name         X disable undo by space
// @description  いいね・リポスト直後にSpaceキーでundoしようとするのを防ぐ
// @namespace    smbd.jp
// @version      1.0.0
// @author       smbd.jp@gmail.com
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @updateURL    https://github.com/smbd/userscripts/raw/main/X-disable-undo-by-space.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/X-disable-undo-by-space.user.js
// @run-at       document-idle
// ==/UserScript==

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.code === 'Space') {
    const active = document.activeElement;
    if (active && ( active.closest('button[data-testid="unretweet"]') || active.closest('button[data-testid="unlike"]') )) {
      e.stopPropagation();
      active.blur(); // フォーカス外す
      window.scrollBy(0, window.innerHeight * 0.9); // 通常スクロール代替
      e.preventDefault();
    }
  }
}, true);
