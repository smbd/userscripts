// ==UserScript==
// @name         X.com absolute time
// @namespace    smbd.jp
// @version      1.0.0
// @description  show post time as absolute time
// @author       smbd
// @match        https://x.com/home
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @grant        none
// @require      https://raw.githubusercontent.com/smbd/userscripts/main/waitForKeyElements.js
// @updateURL    https://github.com/smbd/userscripts/raw/main/X-abs-time.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/X-abs-time.user.js
// ==/UserScript==

const postTimeSelector = 'div[data-testid="User-Name"] div a > time';
const waitSelector     = 'article[data-testid="tweet"]';
const timelineSelector = 'div[data-testid="primaryColumn"] h1[role="heading"] + div';

function isToday(unixTimestamp) {
    const inputDate = new Date(unixTimestamp);
    const now = new Date();

    return (
        inputDate.getFullYear() === now.getFullYear() &&
        inputDate.getMonth() === now.getMonth() &&
        inputDate.getDate() === now.getDate()
    );
}

function isThisYear (unixTimestamp) {
    const inputDate = new Date(unixTimestamp);
    const now = new Date();

    return (
        inputDate.getFullYear() === now.getFullYear()
    );
}

Number.prototype.zeroPad = function () {
    return this.toString().padStart(2, '0');
}

function updatePostTime(d) {
    d.querySelectorAll(postTimeSelector).forEach(e => {
        const postTimeUnixTimestamp = Date.parse(e.getAttribute('datetime'));
        const postTime = new Date(postTimeUnixTimestamp);

        const hhmm = `${postTime.getHours().zeroPad()}:${postTime.getMinutes().zeroPad()}`;
        const mmdd = `${postTime.getMonth()+1}/${postTime.getDate()}`;

        let absPostTime;
        if (isToday(postTimeUnixTimestamp)) {
            absPostTime = hhmm;
        } else {
            if (isThisYear(postTimeUnixTimestamp)) {
                absPostTime = `${mmdd} ${hhmm}`;
            } else {
                absPostTime = `${postTime.getFullYear()}/${mmdd} ${hhmm}`;
            }
        }

        e.textContent = absPostTime;
    });
}

(function() {
    'use strict';

    waitForKeyElements(waitSelector, function () {
        updatePostTime(document);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            updatePostTime(node);
                        }
                    }); // mutation forEach
                } // if
            }); // mutations
        }); // observer

        observer.observe(document.querySelector(timelineSelector), { childList: true, subtree: true });
    }, true); // 一度だけ待つ
})();
