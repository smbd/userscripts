// ==UserScript==
// @name         hide X impression zombie
// @namespace    http://smbd.jp/
// @version      2024-08-13-01
// @description  hide X impression zombie
// @author       smbd
// @match        https://x.com/*
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @require      https://raw.githubusercontent.com/smbd/userscripts/main/waitForKeyElements.js
// @grant        none
// @updateURL    https://github.com/smbd/userscripts/raw/main/hide-x-impression-zombie.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/hide-x-impression-zombie.user.js
// ==/UserScript==

(function () {
	'use strict'

	// 普通に使われない海外文字2連続
	const block_char_regex = /[\u{0600}-\u{1FFF}]{2,}/gu;

	const commentsSelector = 'section[role="region"] > h1 + div > div > div:nth-child(n+2)[data-testid="cellInnerDiv"]:has(article)';
	const idSelector = 'div[data-testid="User-Name"] > div:nth-child(1) > div > a'
	// 絵文字を含むアカウント名は <span><span>foo</span><img><span>bar</span></span> となることに注意
	const accountSelector = `${idSelector} > div > div > span`

	// 日本以外の国旗: "Regional indicator symbol" で "[A-IK-Z][A-Z]" OR "J[A-OQ-Z]"
	const countryflag_regex = /([\u{1F1E6}-\u{1F1EE}\u{1F1F0}-\u{1F1FF}][\u{1F1E6}-\u{1F1FF}]|\u{1F1EF}[\u{1F1E6}-\u{1F1F4}\u{1F1F6}-\u{1F1FF}])/gu;

	const emoji_regex_class = "[\u{2600}-\u{27BF}\u{1F000}-\u{1FFFF}]"
	const emoji_regex = new RegExp(String.raw`${emoji_regex_class}`, "gu");
	const emoji_cont_regex = new RegExp(String.raw`${emoji_regex_class}{2,}`, "gu");

	function hidereply(e) {
		e.style.display = 'none';
	}

	function emoji_img2text(e) {
		// 異字体セレクタを落とす用。1F3F[B-F]: 肌の色。(\u{E0100}-\u{E01FE} 要検討)
		const ivs_regex = new RegExp("[\u{FE0E}\u{FE0F}\u{1F3FB}-\u{1F3FF}]", "gu");

		var text = "";
		e.childNodes.forEach(c => {
			switch (c.tagName) {
				case 'SPAN':
					text += c.innerText;
					break;
				case 'IMG':
					text += c.alt.replace(ivs_regex, '');
					break;
			}
		});
		return text;
	}

	waitForKeyElements('div.DraftEditor-editorContainer', function () {
		var block_id_hrefs = [];

		const tn = document.querySelector('section > h1 + div');

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type != "childList") { return; }

				mutation.addedNodes.forEach(comment_elem => {
					if (!comment_elem.querySelector(idSelector)) { return; }

					// blueアイコンに限る
					if (!comment_elem.querySelector(`${accountSelector} > svg[data-testid="icon-verified"]`)) { return; }

					// 非表示対象ポストをしていたアカウントは全部非表示にする
					block_id_hrefs.forEach(id_href => {
						if (comment_elem.querySelector(`article:has(a[href="${id_href}"])`)) { hidereply(comment_elem) }
					});

					var id_href = comment_elem.querySelector(idSelector).getAttribute('href');

					// tweet内容で非表示
					var tweet = emoji_img2text(comment_elem.querySelector('div[data-testid="tweetText"]'));

					// 絵文字が2文字連続 OR 絵文字を3文字以上含む OR ブロック対象文字列を含む
					if (tweet.match(emoji_cont_regex)
						|| (tweet.match(emoji_regex) || []).length >= 3
						|| tweet.match(block_char_regex)
					) {
						if (!block_id_hrefs.includes(id_href)) { block_id_hrefs.push(id_href); }
						hidereply(comment_elem);
					}

					// アカウント名(display name)で非表示
					var account = emoji_img2text(comment_elem.querySelector(accountSelector));

					// 国旗が含まれる OR 絵文字が3文字以上含まれる OR ブロック対象文字列を含む
					if (account.match(countryflag_regex)
						|| (account.match(emoji_regex) || []).length >= 3
						|| account.match(block_char_regex)
					) {
						if (!block_id_hrefs.includes(id_href)) { block_id_hrefs.push(id_href); }
						hidereply(comment_elem);
					}
				}); //mutation
			}); // mutations
		}); // observer

		observer.observe(tn, { childList: true, subtree: true });
	}); // waitForKeyElements
})(); // function()
