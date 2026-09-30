import {
  getLegalDoc,
  LEGAL_LANG_LABELS,
  LEGAL_LANGS,
  LEGAL_UPDATED_AT,
  LEGAL_UPDATED_LABEL,
  LegalLang,
  LegalPage,
} from '@eda/legal';

const escapeAttr = (s: string) => s.replace(/"/g, '&quot;');

export function renderLegalPage(page: LegalPage, lang: LegalLang): string {
  const doc = getLegalDoc(page, lang);
  const langOptions = LEGAL_LANGS.map(
    (l) => `<option value="${l}"${l === lang ? ' selected' : ''}>${LEGAL_LANG_LABELS[l]}</option>`,
  ).join('');
  const body = doc.sections
    .map((s) => `<h2>${s.h}</h2>${s.p.map((p) => `<p>${p}</p>`).join('')}`)
    .join('');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeAttr(doc.title)} — CaloSnap</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; color: #1f2937; line-height: 1.6; }
  h1 { color: #059669; font-size: 28px; margin-bottom: 4px; }
  h2 { font-size: 18px; margin-top: 28px; }
  .meta { color: #6b7280; font-size: 14px; }
  .langs { display: flex; justify-content: flex-end; margin-bottom: 16px; }
  .langs select { font: inherit; font-size: 14px; color: inherit; background: transparent; padding: 8px 32px 8px 12px; border: 1px solid #d1d5db; border-radius: 10px; appearance: none; -webkit-appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%236b7280' stroke-width='2'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; }
  .langs select option { color: #1f2937; }
  a { color: #059669; }
  @media (prefers-color-scheme: dark) { body { background: #0f1115; color: #e5e7eb; } .meta { color: #9ca3af; } }
</style>
</head>
<body>
<form class="langs" method="get">
  <select name="lang" aria-label="Language" onchange="this.form.submit()">${langOptions}</select>
  <noscript><button type="submit">OK</button></noscript>
</form>
<h1>${doc.title}</h1>
<p class="meta">${LEGAL_UPDATED_LABEL[lang]}: ${LEGAL_UPDATED_AT}</p>
<p>${doc.intro}</p>
${body}
</body>
</html>`;
}
