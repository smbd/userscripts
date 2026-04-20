// ==UserScript==
// @name         X hide zombie's replies
// @namespace    smbd.jp
// @author       claude & smbd
// @version      1.0
// @description  引用リポのみの返信＆同一アカウントから2件以上のリプライを非表示にする
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @updateURL    https://github.com/smbd/userscripts/raw/refs/heads/main/X-hide-zombies-replies.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/refs/heads/main/X-hide-zombies-replies.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const THRESHOLD = 2; // この件数以上のリプライを非表示にする
    const BLOCKMODE = "block"; // block or highlight
    const BGCOLOR_LIST = ["red", "blue", "green"];

    function getAuthorHandle(article) {
        const userNameDiv = article.querySelector('[data-testid="User-Name"]');
        if (!userNameDiv) return null;
        const links = userNameDiv.querySelectorAll('a[href^="/"]');
        for (const link of links) {
            const href = link.getAttribute('href');
            const match = href && href.match(/^\/([A-Za-z0-9_]+)$/);
            if (match) return match[1].toLowerCase();
        }
        return null;
    }

    function getMainTweetAuthor() {
        const match = location.pathname.match(/^\/([^/]+)\/status\//);
        return match ? match[1].toLowerCase() : null;
    }

    function processReplies() {
        if (!location.pathname.match(/\/status\/\d+/)) return;

        const mainAuthor = getMainTweetAuthor();
        const articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));

        const replyCount = {};
        const replyArticles = {};
        let mainTweetSkipped = false;

        for (const article of articles) {
            // すでに非表示のものはスキップ
            const wrapper = article.closest('[data-testid="cellInnerDiv"]') || article.parentElement;
            if (wrapper && wrapper.dataset.blocked) continue;

            const handle = getAuthorHandle(article);
            if (!handle) continue;

            // メインツイート（1件目）はスキップ
            if (!mainTweetSkipped && handle === mainAuthor) {
                mainTweetSkipped = true;
                continue;
            }

            // 投稿者自身の返信はカウントしない
            if (handle === mainAuthor) continue;

            // 引用リポのみの返信を非表示
            if (article.querySelectorAll('div:has(> div[data-testid="Tweet-User-Avatar"])').length == 2
               && !article.querySelector('div > div:nth-of-type(3) > div[data-testid="tweetText"]')) {
                const wrapper = article.closest('[data-testid="cellInnerDiv"]') || article.parentElement;
                if (wrapper) {
                    if (BLOCKMODE == 'highlight') {
                        wrapper.style.backgroundColor = BGCOLOR_LIST[1];
                    } else {
                        wrapper.style.display = 'none';
                    }
                    wrapper.dataset.blocked = "true"
                    console.log(`[SpamHider] @${handle}`);
                }
            }

            // 他人のリプが着いてるリプはカウントしない(リセットする)
            if (article.querySelector('div[data-testid="Tweet-User-Avatar"] + div')) { // リプが着いている
                const nextArticle = article.closest('div[data-testid="cellInnerDiv"]').nextElementSibling.querySelector('article');
                if (nextArticle) {
                    const nextHandle = getAuthorHandle(nextArticle);
                    if (handle != nextHandle) {
                        replyCount[handle] = 0;
                        replyArticles[handle] = [];
                        continue;
                    }
                }
            }

            replyCount[handle] = (replyCount[handle] || 0) + 1;
            if (!replyArticles[handle]) replyArticles[handle] = [];
            replyArticles[handle].push(article);
        }

        for (const [handle, count] of Object.entries(replyCount)) {
            if (count >= THRESHOLD) {
                replyArticles[handle].forEach(article => {
                    const wrapper = article.closest('[data-testid="cellInnerDiv"]') || article.parentElement;
                    if (wrapper) {
                        if (BLOCKMODE == 'highlight') {
                            wrapper.style.backgroundColor = BGCOLOR_LIST[0];
                        } else {
                            wrapper.style.display = 'none';
                        }
                        wrapper.dataset.blocked = "true"
                    }
                });
                console.log(`[SpamHider] @${handle} (${count}件)`);
            }
        }
    }

    let debounceTimer = null;
    function debounceProcess() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processReplies, 500);
    }

    const observer = new MutationObserver(debounceProcess);
    observer.observe(document.body, { childList: true, subtree: true });

    // 初回・ページ遷移後の実行
    setTimeout(processReplies, 1500);
})();
