import { ExtractedPost, ExtMessage } from '../core/types.js';

function requestAll(): Promise<ExtractedPost[]> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_ALL' } as ExtMessage, resp => {
      resolve(resp?.posts || []);
    });
  });
}

function render(posts: ExtractedPost[]) {
  const container = document.getElementById('posts')!;
  container.innerHTML = '';
  posts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
      <div style="font-size:12px;color:#555;">${p.author.handle || ''} ${p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</div>
      <pre>${escapeHtml(p.text)}</pre>
      <div class="actions">
        <button data-act="copy">复制</button>
        <button data-act="open">打开</button>
      </div>
    `;
    div.querySelector('[data-act="copy"]')!.addEventListener('click', () => {
      navigator.clipboard.writeText(p.text);
    });
    div.querySelector('[data-act="open"]')!.addEventListener('click', () => {
      if (p.url) chrome.tabs.create({ url: p.url });
    });
    container.appendChild(div);
  });
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s] as string));
}

async function refresh() {
  const posts = await requestAll();
  render(posts);
}

(document.getElementById('refreshBtn') as HTMLButtonElement).addEventListener('click', refresh);
(document.getElementById('exportBtn') as HTMLButtonElement).addEventListener('click', async () => {
  const posts = await requestAll();
  const blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'posts.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
});

refresh();
