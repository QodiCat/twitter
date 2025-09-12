import { platformRegistry } from '../core/registry.js';
import { registerTwitter } from '../platforms/twitter.js';
import { copyToClipboard } from '../core/utils.js';
import { ExtractedPost, MessageRequestSave } from '../core/types.js';

registerTwitter(platformRegistry);

function savePost(post: ExtractedPost) {
  const msg: MessageRequestSave = { type: 'REQUEST_SAVE', post };
  chrome.runtime.sendMessage(msg);
}

function handleExtracted(post: ExtractedPost) {
  copyToClipboard(post.text).then(ok => {
    if (!ok) console.warn('Clipboard copy failed');
  });
  savePost(post);
}

function injectOnExisting() {
  const exts = platformRegistry.getAll();
  exts.forEach(ex => {
    document.querySelectorAll<HTMLElement>('article[data-testid="tweet"]').forEach(a => {
      ex.injectButton?.(a, handleExtracted);
    });
  });
}

const observer = new MutationObserver(muts => {
  for (const m of muts) {
    m.addedNodes.forEach(n => {
      if (n instanceof HTMLElement) {
        if (n.matches && n.matches('article[data-testid="tweet"]')) {
          const extractor = platformRegistry.findForElement(n);
            extractor?.injectButton?.(n, handleExtracted);
        } else {
          // 查找内部新增的 tweets
          n.querySelectorAll?.('article[data-testid="tweet"]').forEach(el => {
            if (el instanceof HTMLElement) {
              const extractor = platformRegistry.findForElement(el);
              extractor?.injectButton?.(el, handleExtracted);
            }
          });
        }
      }
    });
  }
});

function start() {
  injectOnExisting();
  observer.observe(document.body, { childList: true, subtree: true });
  console.log('[SocialPostExtractor] content script started');
}

start();
