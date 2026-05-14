import { marked } from "marked";

marked.use({
  gfm: true,
  breaks: false,
  async: false,
});

/**
 * Render Markdown to HTML for trusted server-authored content only.
 * Seed and admin-edited copy go through this path; never pass
 * user-submitted content here without first sanitizing.
 */
export function renderMarkdown(md: string): string {
  if (!md) return "";
  return marked.parse(md) as string;
}
