// ==UserScript==
// @name         X: 「興味がない」ボタンを追加
// @namespace    https://x.com/
// @version      1.0.3
// @author       smbd
// @description  ポストの操作列に「このポストに興味がない」ボタンを追加。
// @match        https://x.com/home
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @run-at       document-start
// @grant        none
// @updateURL    https://github.com/smbd/userscripts/raw/main/X-not-interested-button.user.js
// @downloadURL  https://github.com/smbd/userscripts/raw/main/X-not-interested-button.user.js
// ==/UserScript==

(() => {
  'use strict';

  const TWEET_SELECTOR = 'article[data-testid="tweet"]';
  const INSERT_AFTER_SELECTOR = 'button[data-testid="bookmark"]';
  const MORE_SELECTOR = 'button[data-testid="caret"][aria-haspopup="menu"]';
  const NOTINTERESTED_SELECTOR = 'div[role="menu"] div[data-testid="Dropdown"] > div[role="menuitem"]:nth-of-type(1), div[data-testid="sheetDialog"] > div[role="menuitem"]:nth-of-type(1)';
  const BUTTON_ATTRIBUTE = 'data-x-not-interested-button';
  const WRAPPER_ATTRIBUTE = 'data-x-not-interested-wrapper';
  const BUTTON_LABEL = 'このポストに興味がない';
  const BUTTON_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-18jsvk2 r-1q142lx"><g><path d="M12 13.6c1.64-.013 3.278.76 4.284 2.02.114.14.218.282.317.43l-1.202.9c-.088-.102-.177-.197-.272-.289-.844-.823-1.98-1.264-3.125-1.26-1.146-.002-2.282.441-3.129 1.263-.095.092-.185.186-.273.287l-1.2-.902c.1-.149.205-.29.319-.429C8.728 14.364 10.36 13.59 12 13.6zM9.25 8c.828 0 1.5.796 1.5 1.9 0 1.105-.672 1.85-1.5 1.85s-1.5-.745-1.5-1.85c0-1.104.672-1.9 1.5-1.9zm5.5 0c.828 0 1.5.796 1.5 1.9 0 1.105-.672 1.85-1.5 1.85s-1.5-.745-1.5-1.85c0-1.104.672-1.9 1.5-1.9z"></path><path clip-rule="evenodd" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z" fill-rule="evenodd"></path></g></svg>';

  const STYLE = `
    [${WRAPPER_ATTRIBUTE}] {
      align-items: stretch;
      display: flex;
      flex: 1;
      justify-content: end;
      position: relative;
      top: 3px;
    }

    [${BUTTON_ATTRIBUTE}] {
      align-items: stretch;
      background: transparent;
      border: 0;
      box-sizing: border-box;
      color: rgb(83, 100, 113);
      cursor: pointer;
      height: 36px;
      width: 36px;
      margin: -10px;
      padding: 8px;
      transition: background-color 0.2s, color 0.2s;
    }

    [${BUTTON_ATTRIBUTE}] > svg {
      display: block;
      fill: currentColor;
    }

    [${BUTTON_ATTRIBUTE}]:hover {
      background-color: rgb(29, 155, 240, 0.2);
      border-radius: 9999px;
    }
  `;

  const normalize = (value) => String(value || '')
    .toLocaleLowerCase()
    .replace(/\s+/g, '');

  const isVisible = (element) => {
    if (!(element instanceof HTMLElement)) return false;

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    return element.getClientRects().length > 0;
  };

  const belongsToTweet = (element, tweet) => (
    element?.closest(TWEET_SELECTOR) === tweet
  );

  const isNotInterestedLabel = (value) => {
    const label = normalize(value);

    // 日本語 UI の表記揺れ（「ない」/「無い」）と英語 UI に対応する。
    if (/このポストに興味が(?:ない|無い|ありません)/.test(label)) return true;
    if (label.includes('notinterestedinthispost')) return true;

    // 将来の英語 UI で冠詞や大文字が変わっても拾えるようにする。
    return label.includes('notinterested') && label.includes('post');
  };

  const findNotInterestedMenuItem = () => {
    return [...document.querySelectorAll(NOTINTERESTED_SELECTOR)].find((element) => {
      if (!isVisible(element)) return false;

      const label = [
        element.textContent,
        element.getAttribute('aria-label'),
        element.getAttribute('title'),
      ].join(' ');
      return isNotInterestedLabel(label);
    });
  };

  const waitForNotInterestedMenuItem = (timeout = 5000) => new Promise((resolve, reject) => {
    const target = document.body || document.documentElement;
    let observer;
    let timer;

    const finish = (callback, value) => {
      observer?.disconnect();
      window.clearTimeout(timer);
      callback(value);
    };

    const check = () => {
      const item = findNotInterestedMenuItem();
      if (item) finish(resolve, item);
    };

    check();
    if (findNotInterestedMenuItem()) return;

    observer = new MutationObserver(check);
    observer.observe(target, {
      attributes: true,
      attributeFilter: ['aria-hidden', 'class', 'style'],
      childList: true,
      subtree: true,
    });
    timer = window.setTimeout(() => {
      finish(reject, new Error('「このポストに興味がない」が見つかりませんでした。'));
    }, timeout);
  });

  const findInsertControl = (tweet) => [...tweet.querySelectorAll(INSERT_AFTER_SELECTOR)]
    .find((element) => belongsToTweet(element, tweet));

  const findMoreButton = (tweet) => {
    const directCandidates = [...tweet.querySelectorAll(MORE_SELECTOR)]
      .filter((element) => belongsToTweet(element, tweet));
    const visibleDirectCandidate = directCandidates.find(isVisible);
    if (visibleDirectCandidate) return visibleDirectCandidate;
  };

  const setButtonState = (button, state) => {
    if (!button.isConnected) return;

    if (state === 'busy') {
      button.dataset.state = state;
      button.disabled = true;
      return;
    }

    button.disabled = false;
    button.removeAttribute('aria-busy');

    if (state === 'done') {
      button.dataset.state = state;
      return;
    }

    button.dataset.state = state;
    button.setAttribute('aria-label', BUTTON_LABEL);

    button.title = state === 'error'
      ? '項目を見つけられませんでした。もう一度クリックしてください'
      : BUTTON_LABEL;
  };

  const activateNotInterested = async (button) => {
    if (button.dataset.state === 'busy' || button.dataset.state === 'done') return;

    const tweet = button.closest(TWEET_SELECTOR);
    if (!tweet) return;

    setButtonState(button, 'busy');

    try {
      const moreButton = findMoreButton(tweet);
      if (!moreButton) {
        throw new Error('ポストの「…」メニューが見つかりませんでした。');
      }

      moreButton.click();
      const menuItem = await waitForNotInterestedMenuItem();
      menuItem.click();
      setButtonState(button, 'done');
      console.log('「興味なし」送信');
    } catch (error) {
      console.warn('[X: 興味がないボタン]', error);
      setButtonState(button, 'error');
      window.setTimeout(() => {
        if (button.isConnected && button.dataset.state === 'error') {
          setButtonState(button, 'ready');
        }
      }, 2500);
    }
  };

  const addButtonToTweet = (tweet) => {
    if (!(tweet instanceof HTMLElement)) return;
    if (tweet.querySelector(`[${BUTTON_ATTRIBUTE}]`)) return;

    const insertControl = findInsertControl(tweet);
    if (!insertControl) return;

    const actionGroup = insertControl.closest('[role="group"]');
    const reference = actionGroup
      ? (() => {
        let item = insertControl;
        while (item.parentElement && item.parentElement !== actionGroup) {
          item = item.parentElement;
        }
        return item;
      })()
      : insertControl;
    const parent = reference.parentElement;
    if (!parent) return;

    const wrapper = document.createElement('div');
    wrapper.setAttribute(WRAPPER_ATTRIBUTE, 'true');

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute(BUTTON_ATTRIBUTE, 'true');
    button.setAttribute('aria-label', BUTTON_LABEL);
    button.title = BUTTON_LABEL;
    button.innerHTML = BUTTON_ICON;
    button.dataset.state = 'ready';

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void activateNotInterested(button);
    });
    button.addEventListener('pointerdown', (event) => event.stopPropagation());
    button.addEventListener('mousedown', (event) => event.stopPropagation());

    wrapper.append(button);
    parent.insertBefore(wrapper, reference.nextSibling);
  };

  const processNode = (node) => {
    if (!(node instanceof HTMLElement)) return;

    if (node.matches(TWEET_SELECTOR)) addButtonToTweet(node);

    const containingTweet = node.closest(TWEET_SELECTOR);
    if (containingTweet) addButtonToTweet(containingTweet);

    node.querySelectorAll(TWEET_SELECTOR).forEach(addButtonToTweet);
  };

  const installStyles = () => {
    if (document.getElementById('x-not-interested-button-style')) return;

    const style = document.createElement('style');
    style.id = 'x-not-interested-button-style';
    style.textContent = STYLE;
    (document.head || document.documentElement).append(style);
  };

  const start = () => {
    installStyles();
    document.querySelectorAll(TWEET_SELECTOR).forEach(addButtonToTweet);

    const observer = new MutationObserver((records) => {
      // HOME TL以外はskip
      if (document.URL != "https://x.com/home") return

      records.forEach((record) => {
        record.addedNodes.forEach(processNode);
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
