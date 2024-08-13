// ==UserScript==
// @name         ihighway open jam
// @description  ihighwayで「渋滞」を開く
// @namespace    http://smbd.jp/
// @version      2024-08-13-01
// @author       smbd
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ihighway.jp
// @require      https://raw.githubusercontent.com/smbd/userscripts/main/waitForKeyElements.js
// @updateURL    https://github.com/smbd/userscripts/raw/main/ihighway-open-jam.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/ihighway-open-jam.user.js
// @grant        none
// ==/UserScript==

(function() {
    waitForKeyElements('div#mp_data_box_list_box_kisei', function() {
        document.querySelector('div#mp_data_box_list_box_kisei > div.mp_map_accident_jam > div.accident_title > h5').click();
    });
}());
