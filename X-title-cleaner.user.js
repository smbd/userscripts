// ==UserScript==
// @name         X title cleaner
// @description  X title cleaner
// @namespace    http://smbd.jp/
// @version      2024-08-13-02
// @author       smbd
// @match        https://x.com/*/status/*
// @match        https://twitter.com/*/status/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @require      https://raw.githubusercontent.com/smbd/userscripts/main/waitForKeyElements.js
// @updateURL    https://github.com/smbd/userscripts/raw/main/X-title-cleaner.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/X-title-cleaner.user.js
// ==/UserScript==

waitForKeyElements('div.public-DraftEditorPlaceholder-inner', function() {
    const match = document.title.match(/^(?:\(\d+\) )?Xユーザーの(.*)さん: (.*)\s+\/ X/i);
    document.title = `${match[1]} ${match[2]}`;
});
