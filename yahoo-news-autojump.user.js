// ==UserScript==
// @name         Yahoo!ニュース ピックアップ 自動遷移
// @namespace    https://news.yahoo.co.jp/
// @version      1.1.0
// @author       claude opus5
// @description  news.yahoo.co.jp/pickup/ を開いたら記事ページへ自動で移動する（元のURLは履歴に残り、戻るで戻っても再遷移しない）。Firefoxでは browser.navigation.requireUserInteraction = false にしないと履歴に積まれない
// @match        https://news.yahoo.co.jp/pickup/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yahoo.co.jp
// @run-at       document-end
// @grant        none
// @updateURL    https://github.com/smbd/userscripts/raw/main/yahoo-news-autojump.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/yahoo-news-autojump.user.js
// ==/UserScript==

(function () {
  'use strict';

  var LINK_SELECTOR =
    'article > div[data-ual-view-type="digest"] > a[href^="https://news.yahoo.co.jp/articles/"]';
  var STATE_KEY = '__yjPickupAutoJumped';
  var OBSERVE_TIMEOUT_MS = 5000;

  // 戻る/進む でこのページに来たか判定
  function isBackForward() {
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.type === 'back_forward') return true;
    } catch (e) { /* noop */ }
    try {
      // 旧API（フォールバック）: 2 === TYPE_BACK_FORWARD
      if (performance.navigation && performance.navigation.type === 2) return true;
    } catch (e) { /* noop */ }
    return false;
  }

  // この履歴エントリで既に自動遷移済みか（戻ってきたときに復元される）
  function alreadyJumped() {
    return !!(history.state && history.state[STATE_KEY]);
  }

  function stateWithFlag() {
    var s;
    try {
      s = Object.assign({}, history.state || {});
    } catch (e) {
      s = {};
    }
    s[STATE_KEY] = true;
    return s;
  }

  function jump() {
    var a = document.querySelector(LINK_SELECTOR);
    if (!a || !a.href) return false;

    // Firefox は「読み込み完了前のナビゲーション」を replace 扱いにするため、
    // location.href への代入では元のURLが履歴に残らない。
    // 自前で履歴エントリを積んでから replace することで、
    // ブラウザの push/replace 判定に依存せず [元ページ, 遷移先] の履歴にする。
    var flagged = stateWithFlag();
    try {
      // 現在のエントリ（＝戻ってくる先）に「遷移済み」フラグを記録
      history.replaceState(flagged, '');
      // 遷移先で潰すためのダミーエントリを追加
      history.pushState(flagged, '');
      location.replace(a.href);
    } catch (e) {
      // pushState が失敗した場合のフォールバック
      location.href = a.href;
    }
    return true;
  }

  if (isBackForward() || alreadyJumped()) return;

  if (jump()) return;

  // リンクが後から描画されるケースに備えて一定時間だけ監視
  var timer;
  var obs = new MutationObserver(function () {
    if (jump()) {
      obs.disconnect();
      clearTimeout(timer);
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  timer = setTimeout(function () { obs.disconnect(); }, OBSERVE_TIMEOUT_MS);
})();
