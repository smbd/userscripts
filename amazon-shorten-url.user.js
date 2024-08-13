// ==UserScript==
// @name         Amazon shorten URL
// @description  Amazon shorten URL
// @namespace    http://smbd.jp/
// @version      2024-08-13-01
// @author       smbd
// @match        https://www.amazon.co.jp/*/dp/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.co.jp
// ==/UserScript==

(function() {
    const asin = document.getElementsByName('ASIN')[0];

    if ( asin && location.pathname != '/dp/' + asin.value ) {
        window.history.replaceState(null, "", "/dp/" + asin.value );
        window.history.go(0);
    }
})();
