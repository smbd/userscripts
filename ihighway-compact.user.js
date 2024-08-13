// ==UserScript==
// @name         ihighway compact upbound/downbound
// @description  ihighwayの上り・下りをコンパクトにする
// @namespace    http://smbd.jp
// @version      2024-08-13-01
// @author       smbd
// @match        https://ihighway.jp/pcsite/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ihighway.jp
// @require      https://raw.githubusercontent.com/smbd/userscripts/main/waitForKeyElements.js
// @updateURL    https://github.com/smbd/userscripts/raw/main/ihighway-compact.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/ihighway-compact.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    waitForKeyElements('div.accident_area', function() {
        const brList = document.querySelectorAll('div.accident_area > ul > li > div.text > br');
        brList.forEach(function(e) {
            e.nextSibling.textContent = e.nextSibling.textContent.replace(/\[(上|下)(り：.*)/, " ($1)");
            e.remove();
        });
    });
})();
