/**
 * Escapes HTML special characters to prevent XSS in generated HTML content.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Escapes text for use in HTML attributes (escapes HTML plus newlines).
 */
export function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/\n/g, '&#10;');
}
