// ==UserScript==
// @name         X title cleaner
// @description  X title cleaner
// @namespace    http://smbd.jp/
// @version      2024-08-14-01
// @author       smbd
// @match        https://x.com/*
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @updateURL    https://github.com/smbd/userscripts/raw/main/X-title-cleaner.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/X-title-cleaner.user.js
// ==/UserScript==

const intervalID = setInterval(function () {
    const match = document.title.match(/^(?:\(\d+\) )?Xユーザーの(.*)さん: 「(.*)」\s+\/ X/i);
    if ( document.URL.match(/\/status\//) && match ) {
            const userid = document.querySelector('div[data-testid="User-Name"] > div:nth-child(2) > div > div > a > div > span').innerText;
            document.title = `${match[1]} (${userid}): ${match[2]}`;
            clearInterval(intervalID);
    }
}, 1000);
