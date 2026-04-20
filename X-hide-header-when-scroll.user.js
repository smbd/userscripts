// ==UserScript==
// @name         X.com hide header when scroll
// @namespace    smbd.jp
// @version      1.1.0
// @description  hide header when scroll
// @author       smbd
// @match        https://x.com/home
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @grant        none
// @require      https://raw.githubusercontent.com/smbd/userscripts/main/waitForKeyElements.js
// @updateURL    https://github.com/smbd/userscripts/raw/main/X-hide-header-when-scroll.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/X-hide-header-when-scroll.user.js
// ==/UserScript==

const sentinelSelector = 'header[role="banner"] + main[role="main"] h1[role="heading"] + div div[data-testid="cellInnerDiv"]';
const headerSelector = 'div[data-testid="primaryColumn"] > div:nth-of-type(1) > div:nth-of-type(1):has(> div > div > nav.TimelineTabs)';

(function() {
    'use strict';

    waitForKeyElements(sentinelSelector, function () {
        const sentinel = document.querySelector(sentinelSelector);
        const header = document.querySelector(headerSelector);

        if (header) {
            const io = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    // sentinel が見えていればヘッダを表示、見えなければ非表示
                    if (!entry.isIntersecting) {
                        header.style.display = 'none';
                        io.disconnect();
                    }
                });
            //}, { threshold: 0 }); // 少しでも見えなくなったら
            }); // 全く見えなくなったら
            io.observe(sentinel);
        }
    }, false); // ページ遷移したときも再度変更されるように
})();
