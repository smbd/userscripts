// ==UserScript==
// @name         ihighway: 事故マークの点滅を止めて常時表示
// @namespace    local
// @version      1.0
// @author       claude
// @description  ihighway: 事故マークの点滅を止めて常時表示
// @match        https://ihighway.jp/pcsite/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
        'use strict';

        // 点滅開始関数を「opacity を 1 に固定するだけ」の関数に差し替える。
        // 元の実装は setInterval で opacity を 0/1 トグルしていた。
        function patch() {
                if (typeof MP_TRAFFIC_LAYER === 'undefined' || !MP_TRAFFIC_LAYER.accidentLayerInterval) {
                        return false;
                }
                MP_TRAFFIC_LAYER.accidentLayerInterval = function () {
                        try {
                                if (MP_TRAFFIC_LAYER.config.ACCIDENT_VISIBLE_TIMER != null) {
                                        clearInterval(MP_TRAFFIC_LAYER.config.ACCIDENT_VISIBLE_TIMER);
                                        MP_TRAFFIC_LAYER.config.ACCIDENT_VISIBLE_TIMER = null;
                                }
                                MP_TRAFFIC_LAYER.layer['accident'].setOpacity(1);
                        } catch (e) {}
                };
                // 既に走っているタイマーを止め、消えている状態なら表示に戻す
                MP_TRAFFIC_LAYER.accidentLayerInterval();
                return true;
        }

        if (patch()) { return; }
        // スクリプト読み込み完了前ならポーリングで待つ（最大 30 秒）
        var tries = 0;
        var timer = setInterval(function () {
                if (patch() || ++tries > 150) { clearInterval(timer); }
        }, 200);
})();
