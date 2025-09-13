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
    getAll().then(posts => {
      const next = posts.filter(p => !(p.platform === platform && p.id === id));
      chrome.storage.local.set({ [STORAGE_KEY]: next }, () => sendResponse({ ok: true }));
    });
    return true;
  }
  if (msg.type === 'REQUEST_CLEAR') {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => sendResponse({ ok: true }));
    return true;
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
