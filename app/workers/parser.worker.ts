/// <reference lib="webworker" />
/**
 * Parser Web Worker
 *
 * 接收 Markdown/MDC 源文本，返回解析后的 AST（body + data + toc）。
 *
 * 设计要点：
 * - 使用 @nuxtjs/mdc 的 parseMarkdown，在浏览器端显式传入插件实例
 *   （构建期虚拟模块 #mdc-imports 在浏览器是空的，inline options 会覆盖）
 * - Shiki 高亮器懒加载一次，后续解析极快
 * - 错误以 { ok: false, error } 形式返回，不抛出
 */

import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkReadingTime from 'remark-reading-time'
import { createHighlighter, type Highlighter as ShikiHighlighter } from 'shiki'

import remarkMusic from '../../remark-plugins/remark-music'

// 精选高亮语言 —— 与 build 配置保持一致
const SHIKI_LANGS = [
	'bash',
	'css',
	'diff',
	'dockerfile',
	'go',
	'html',
	'ini',
	'javascript',
	'json',
	'markdown',
	'python',
	'rust',
	'scss',
	'shell',
	'sql',
	'toml',
	'typescript',
	'vue',
	'yaml',
]

// Shiki 单例
let shikiInstance: ShikiHighlighter | null = null
let shikiPromise: Promise<ShikiHighlighter> | null = null

async function getShiki(): Promise<ShikiHighlighter> {
	if (shikiInstance) return shikiInstance
	if (!shikiPromise) {
		shikiPromise = createHighlighter({
			themes: ['catppuccin-latte', 'one-dark-pro'],
			langs: SHIKI_LANGS,
		}).then((h) => {
			shikiInstance = h
			return h
		})
	}
	return shikiPromise
}

/** 适配 @nuxtjs/mdc 的 Highlighter 签名 */
async function makeHighlighter() {
	const shiki = await getShiki()
	return async (code: string, lang: string, theme: 'light' | 'dark') => {
		const themeName = theme === 'dark' ? 'one-dark-pro' : 'catppuccin-latte'
		const tree = shiki.codeToHast(code, {
			lang: lang || 'text',
			theme: themeName,
		})
		return {
			tree: tree.children,
			className: 'shiki',
			style: '',
			inlineStyle: '',
		}
	}
}

export type WorkerInboundMessage = {
	id: number
	md: string
	theme: 'light' | 'dark'
}

export type WorkerOutboundMessage =
	| { id: number; ok: true; result: { body: unknown; data: Record<string, unknown>; toc?: unknown } }
	| { id: number; ok: false; error: string }

self.onmessage = async (e: MessageEvent<WorkerInboundMessage>) => {
	const { id, md, theme } = e.data
	try {
		const highlighter = await makeHighlighter()
		const result = await parseMarkdown(
			md,
			{
				remark: {
					plugins: {
						math: { instance: remarkMath },
						readingTime: { instance: remarkReadingTime },
						music: { instance: remarkMusic },
					},
				},
				rehype: {
					plugins: {
						katex: { instance: rehypeKatex },
					},
				},
				highlight: {
					highlighter: highlighter as never,
					theme: {
						default: 'catppuccin-latte',
						dark: 'one-dark-pro',
					},
				},
				toc: { depth: 4, searchDepth: 4 },
			},
			{ fileOptions: { cwd: '/editor' } },
		)
		// @ts-expect-error - MDCParserResult body is the parsed HAST/minimark tree
		const body = result.body
		// @ts-expect-error - data is frontmatter
		const data = result.data ?? {}
		// @ts-expect-error - toc is optional
		const toc = result.toc
		const reply: WorkerOutboundMessage = { id, ok: true, result: { body, data, toc } }
		;(self as DedicatedWorkerGlobalScope).postMessage(reply)
	}
	catch (err) {
		const reply: WorkerOutboundMessage = {
			id,
			ok: false,
			error: err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err),
		}
		;(self as DedicatedWorkerGlobalScope).postMessage(reply)
	}
}