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
        <button data-act="del" style="color:#b00;">删除</button>
      </div>
    `;
    div.querySelector('[data-act="copy"]')!.addEventListener('click', () => {
      navigator.clipboard.writeText(p.text);
      // Send to background for saving to server
      chrome.runtime.sendMessage({ type: 'REQUEST_COPY', text: p.text, platform: p.platform } as ExtMessage);
    });
    div.querySelector('[data-act="open"]')!.addEventListener('click', () => {
      if (p.url) chrome.tabs.create({ url: p.url });
    });
    div.querySelector('[data-act="del"]')!.addEventListener('click', () => {
      console.log('[Popup] Sending delete request for:', p.platform, p.id);
      chrome.runtime.sendMessage({ type: 'REQUEST_DELETE', platform: p.platform, id: p.id } as ExtMessage, (response) => {
        console.log('[Popup] Delete response:', response);
        if (response && response.ok) {
          refresh();
        } else {
          alert('删除失败: ' + (response?.error || '未知错误'));
        }
      });
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

const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement | null;
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (!confirm('确定清空所有保存的帖子？')) return;
    console.log('[Popup] Sending clear request');
    chrome.runtime.sendMessage({ type: 'REQUEST_CLEAR' } as ExtMessage, (response) => {
      console.log('[Popup] Clear response:', response);
      if (response && response.ok) {
        refresh();
      } else {
        alert('清空失败: ' + (response?.error || '未知错误'));
      }
    });
  });
}

refresh();
