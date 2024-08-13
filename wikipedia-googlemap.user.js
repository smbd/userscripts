// ==UserScript==
// @name         Wikipedia link location to Google map
// @description  Wikipedia link location to Google map
// @namespace    http://smbd.jp
// @author       smbd
// @version      2024-08-13-01
// @match        https://*.wikipedia.org/wiki/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wikipedia.org
// @grant        none
// @updateURL    https://github.com/smbd/userscripts/raw/main/wikipedia-googlemap.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/wikipedia-googlemap.user.js
// ==/UserScript==

(function() {
    'use strict';

    const GOOGLEMAP_URL = "https://maps.google.com/maps?hl=ja&t=m&z=12&ll=";

    const GEOHACK_HOSTNAME = "geohack.toolforge.org"
    const GEOHACK_SELECTOR = 'a[href*="//' + GEOHACK_HOSTNAME + '/"]';

    document.querySelectorAll(GEOHACK_SELECTOR).forEach(e => {
        let latitude, longitude
        [ latitude, longitude ] = e.querySelector("a:has(span.geo-default) > span.geo-nondefault > span > span.geo").innerText.replace(';','').split(' ');
        let ll = latitude + "," + longitude
        e.href = GOOGLEMAP_URL + ll + '&q=' + ll
    });
})();
