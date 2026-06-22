/**
 * useEditorParser —— 主线程 MDC 解析
 *
 * 原方案使用 Web Worker（?raw + Blob URL / ?worker import），但
 * @nuxtjs/mdc/runtime 内部会动态 import("#mdc-imports") 这个 Vite
 * 虚拟模块，Worker 上下文无法解析，导致解析失败。
 *
 * 改为在主线程直接调用 parseMarkdown，虚拟模块 fallback 由 MDC
 * 自身处理（catch 后使用 inline options）。解析耗时在 250ms 防抖下
 * 对 UI 无感知影响。
 */
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { createHighlighter, type Highlighter as ShikiHighlighter } from 'shiki'

import remarkMusic from '../../../remark-plugins/remark-music'

// 与 nuxt.config.ts 中 optimizeDeps 保持一致
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

type ParseResult = {
	body: unknown
	data: Record<string, unknown>
	toc?: unknown
}

let abortController: AbortController | null = null

/**
 * 提交一次解析（保留 parseInWorker 命名以兼容 Store 接口）。
 * 支持通过 cancelInflight 取消在飞请求。
 */
export async function parseInWorker(md: string, theme: 'light' | 'dark'): Promise<ParseResult> {
	// 取消上一次在飞请求
	cancelInflight()
	abortController = new AbortController()
	const signal = abortController.signal

	const highlighter = await makeHighlighter()
	if (signal.aborted) throw new Error('cancelled')

	const result = await parseMarkdown(
		md,
		{
			remark: {
				plugins: {
					math: { instance: remarkMath },
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

	if (signal.aborted) throw new Error('cancelled')

	// result.body / result.data / result.toc — MDC 标准返回结构
	const body = (result as { body: unknown }).body
	const data = (result as { data?: Record<string, unknown> }).data ?? {}
	const toc = (result as { toc?: unknown }).toc

	return { body, data, toc }
}

/** 取消正在进行的解析 */
export function cancelInflight() {
	if (abortController) {
		abortController.abort()
		abortController = null
	}
}

/** 清理资源（页面卸载时调用） */
export function disposeParserWorker() {
	cancelInflight()
	if (shikiInstance) {
		shikiInstance.dispose()
		shikiInstance = null
		shikiPromise = null
	}
}

export function useEditorParser() {
	return { parseInWorker, cancelInflight, disposeParserWorker }
}
