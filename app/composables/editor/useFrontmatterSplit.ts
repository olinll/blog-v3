/**
 * useFrontmatterSplit —— 从 markdown 源中分离 frontmatter 和正文
 *
 * 容错：如果 frontmatter 未闭合（如正在编辑），则把整段视为正文。
 */

const FENCE_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export type SplitResult = {
	frontmatter: string | null
	body: string
}

export function splitFrontmatter(source: string): SplitResult {
	const m = source.match(FENCE_RE)
	if (!m) return { frontmatter: null, body: source }
	return {
		frontmatter: m[1],
		body: source.slice(m[0].length),
	}
}