import { useState } from 'preact/hooks';

export default function CopyCode({ code, label = 'Copy' }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    try { navigator.clipboard?.writeText(code).catch(() => {}); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div class="tr">
      <pre class="tr__code"><code>{code}</code></pre>
      <button class="tr__btn" onClick={copy}>{copied ? 'Copied' : `${label} ⧉`}</button>
    </div>
  );
}
