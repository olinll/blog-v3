/**
 * Editor Pinia Store
 *
 * 编辑器全局状态：源文本、解析结果、解析状态、主题。
 * useEditorParser 调用在 EditorShell.client.vue 中通过 watch(source) 触发。
 */

import { defineStore } from 'pinia'
import type { useEditorParser } from '~/composables/editor/useEditorParser'

type ParseFn = ReturnType<typeof useEditorParser>['parseInWorker']
type CancelFn = ReturnType<typeof useEditorParser>['cancelInflight']
type DisposeFn = ReturnType<typeof useEditorParser>['disposeParserWorker']

export const useEditorStore = defineStore('editor', () => {
	const source = ref('')
	const parsed = ref<{
		body: unknown
		data: Record<string, unknown>
		toc?: unknown
	} | null>(null)

	const parseStatus = ref<'idle' | 'parsing' | 'ok' | 'error'>('idle')
	const parseLatencyMs = ref(0)
	const parseError = ref<string | null>(null)
	const lastSavedAt = ref<number | null>(null)

	// 注入的依赖（在 onMounted 时设置）
	let _parse: ParseFn | null = null
	let _cancel: CancelFn | null = null
	let _dispose: DisposeFn | null = null

	let parseSeq = 0
	let debounceTimer: ReturnType<typeof setTimeout> | null = null

	function bindParser(deps: {
		parseInWorker: ParseFn
		cancelInflight: CancelFn
		disposeParserWorker: DisposeFn
	}) {
		_parse = deps.parseInWorker
		_cancel = deps.cancelInflight
		_dispose = deps.disposeParserWorker
	}

	function setSource(next: string) {
		source.value = next
		if (debounceTimer) clearTimeout(debounceTimer)
		debounceTimer = setTimeout(() => {
			void reparse()
		}, 250)
	}

	async function reparse(theme: 'light' | 'dark' = 'light') {
		if (!_parse) {
			// Worker 还没初始化（SSR 或 pre-mount）
			return
		}
		parseSeq++
		const mySeq = parseSeq
		const t0 = performance.now()
		parseStatus.value = 'parsing'
		try {
			const result = await _parse(source.value, theme)
			if (mySeq !== parseSeq) return
			parsed.value = result
			parseLatencyMs.value = performance.now() - t0
			parseStatus.value = 'ok'
			parseError.value = null
		}
		catch (err) {
			if (mySeq !== parseSeq) return
			parseStatus.value = 'error'
			parseError.value = err instanceof Error ? err.message : String(err)
		}
	}

	function cancelPending() {
		if (debounceTimer) clearTimeout(debounceTimer)
		parseSeq++ // 使在飞请求过期
		_cancel?.()
	}

	function markSaved(at: number = Date.now()) {
		lastSavedAt.value = at
	}

	function teardown() {
		if (debounceTimer) clearTimeout(debounceTimer)
		_cancel?.()
		_dispose?.()
		_parse = null
		_cancel = null
		_dispose = null
	}

	const wordCount = computed(() => {
		const t = source.value.trim()
		if (!t) return 0
		// 中文按字符计，英文按词计：简化用 Unicode 长度
		return t.length
	})

	return {
		// state
		source,
		parsed,
		parseStatus,
		parseLatencyMs,
		parseError,
		lastSavedAt,
		wordCount,
		// actions
		bindParser,
		setSource,
		reparse,
		cancelPending,
		markSaved,
		teardown,
	}
})