export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.warn('Clipboard write failed, fallback to execCommand', e);
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); return true; } catch { return false; }
    finally { document.body.removeChild(ta); }
  }
}

export function cleanTweetText(root: HTMLElement): string {
  // Twitter 的文本节点包含在 div[lang] 中，且可能包含内嵌 a / span
  const langDivs = root.querySelectorAll('div[lang]');
  const parts: string[] = [];
  langDivs.forEach(div => {
    parts.push(div.textContent || '');
  });
  return parts.join('\n').replace(/\s+$/,'').trim();
}
