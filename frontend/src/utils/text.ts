/** Plain text from a short markdown snippet (bold, italics, code, links, headings). */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .trim()
}

/** The first sentence of a markdown snippet, as plain text. */
export function firstSentence(text: string): string {
  const stripped = stripMarkdown(text)
  return stripped.split(/(?<=[.!?])\s/)[0] || stripped
}
