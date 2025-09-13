import { ExtractedPost, ExtMessage, MessageAllPosts, MessageRequestSave, MessageRequestDelete, MessageRequestClear } from '../core/types.js';

const STORAGE_KEY = 'spx_posts_v1';

async function getAll(): Promise<ExtractedPost[]> {
  return new Promise(resolve => {
    chrome.storage.local.get([STORAGE_KEY], res => {
      resolve(res[STORAGE_KEY] || []);
    });
  });
}

async function save(post: ExtractedPost) {
  const all = await getAll();
  // 去重：同平台同 id
  const idx = all.findIndex(p => p.platform === post.platform && p.id === post.id);
  if (idx >= 0) all[idx] = post; else all.unshift(post);
  return new Promise<void>(resolve => {
    chrome.storage.local.set({ [STORAGE_KEY]: all }, () => resolve());
  });
}

chrome.runtime.onMessage.addListener((msg: ExtMessage, _sender, sendResponse) => {
  if (msg.type === 'REQUEST_SAVE') {
    const m = msg as MessageRequestSave;
    save(m.post).then(() => sendResponse({ ok: true }));
    return true; // async
  }
  if (msg.type === 'REQUEST_DELETE') {
    const { platform, id } = msg as MessageRequestDelete;
    console.log('[Background] Received delete request for:', platform, id);
    getAll().then(posts => {
      console.log('[Background] Posts before delete:', posts.length);
      const next = posts.filter(p => !(p.platform === platform && p.id === id));
      console.log('[Background] Posts after delete:', next.length);
      chrome.storage.local.set({ [STORAGE_KEY]: next }, () => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Storage set error:', chrome.runtime.lastError);
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('[Background] Delete completed');
          sendResponse({ ok: true });
        }
      });
    }).catch(error => {
      console.error('[Background] Delete error:', error);
      sendResponse({ ok: false, error: error.message });
    });
    return true; // Keep message port open for async response
  }
  if (msg.type === 'REQUEST_CLEAR') {
    console.log('[Background] Received clear request');
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Storage clear error:', chrome.runtime.lastError);
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('[Background] Clear completed');
        sendResponse({ ok: true });
      }
    });
    return true; // Keep message port open for async response
  }
  if (msg.type === 'GET_ALL') {
    getAll().then(posts => {
      const resp: MessageAllPosts = { type: 'ALL_POSTS', posts };
      sendResponse(resp);
    });
    return true;
  }
  return false;
});

console.log('[SocialPostExtractor] background worker loaded');
