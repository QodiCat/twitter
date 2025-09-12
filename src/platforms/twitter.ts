import { ExtractedPost, PlatformExtractor } from '../core/types.js';
import { cleanTweetText } from '../core/utils.js';

// 经验匹配：推文主容器 (article[data-testid="tweet"]) 常见
function isTweetArticle(el: HTMLElement): boolean {
  return el.tagName === 'ARTICLE' && el.getAttribute('data-testid') === 'tweet';
}

function findAncestorTweet(el: HTMLElement | null): HTMLElement | null {
  while (el) {
    if (isTweetArticle(el)) return el;
    el = el.parentElement;
  }
  return null;
}

export const twitterExtractor: PlatformExtractor = {
  platform: 'twitter',
  matchElement(el: HTMLElement) { return isTweetArticle(el); },
  extract(el: HTMLElement): ExtractedPost | null {
    try {
      const idMatch = el.innerHTML.match(/status\/(\d+)/); // 粗略方式
      const id = idMatch?.[1] || crypto.randomUUID();
      const text = cleanTweetText(el);
      // 作者: 在 aria-label or link
      let handle: string | undefined; let name: string | undefined;
      const authorLink = el.querySelector('a[href*="/status/"]')?.parentElement?.querySelector('a[href^="/"]');
      if (authorLink) {
        const spanName = authorLink.querySelector('span');
        name = spanName?.textContent || undefined;
        const href = (authorLink as HTMLAnchorElement).getAttribute('href') || '';
        if (href) handle = href.replace('/', '');
      }
      const timeEl = el.querySelector('time');
      const createdAt = timeEl ? new Date(timeEl.getAttribute('datetime') || Date.now()).toISOString() : undefined;
      const url = timeEl?.parentElement instanceof HTMLAnchorElement ? timeEl.parentElement.href : undefined;
      return {
        platform: 'twitter',
        id,
        url,
        author: { handle, name },
        text,
        createdAt,
        collectedAt: new Date().toISOString(),
        raw: { htmlSnippet: el.innerHTML.slice(0, 500) }
      };
    } catch (e) {
      console.warn('extract tweet failed', e);
      return null;
    }
  },
  injectButton(el: HTMLElement, onClick: (post: ExtractedPost) => void) {
    if (el.querySelector('.spx-copy-btn')) return;
    const toolbar = el.querySelector('[role="group"]');
    const btn = document.createElement('button');
    btn.textContent = '复制文案';
    btn.className = 'spx-copy-btn';
    btn.style.cssText = 'margin-left:4px;padding:2px 6px;font-size:12px;cursor:pointer;border:1px solid #ccc;border-radius:4px;background:#fff;';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const p = this.extract(el);
      if (p) onClick(p);
    });
    if (toolbar) toolbar.appendChild(btn); else el.appendChild(btn);
  }
};

export function registerTwitter(registry: { register: (ex: PlatformExtractor) => void }) {
  registry.register(twitterExtractor);
}

export function tryExtractFromEventTarget(target: EventTarget | null): ExtractedPost | null {
  if (!(target instanceof HTMLElement)) return null;
  const tweet = findAncestorTweet(target);
  if (!tweet) return null;
  return twitterExtractor.extract(tweet);
}
