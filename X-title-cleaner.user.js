// ==UserScript==
// @name         X title cleaner
// @description  タイトルの余計な文字を消す
// @namespace    http://smbd.jp/
// @version      1.1.0
// @author       smbd
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @updateURL    https://github.com/smbd/userscripts/raw/main/X-title-cleaner.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/X-title-cleaner.user.js
// ==/UserScript==

const intervalID = setInterval(function () {
    const match = document.title.match(/^(?:\(\d+\) )?Xユーザーの(.*)さん: 「(.*)」\s+\/ X/i);
    if ( document.URL.match(/\/status\//) && match ) {
            const useridEl = document.querySelector('div[data-testid="User-Name"] > div:nth-child(2) > div > div > a > div > span')
            if (useridEl) {
                const userid = useridEl.innerText;
                document.title = `${match[1]} (${userid}): ${match[2]}`;
                clearInterval(intervalID);
            }
    }
}, 1000);
