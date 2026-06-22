/**
 * useEditorPersistence —— 编辑器草稿持久化
 *
 * 策略：
 * - key: blog-editor:draft:v1
 * - 内容变化 500ms 后写入 localStorage
 * - 写入上限 1MB，超出时提示用户
 * - 挂载时尝试恢复，并发 toast 通知
 * - 不持久化 parsed AST（按需重新解析更轻）
 */

const STORAGE_KEY = 'blog-editor:draft:v1'
const MAX_SIZE = 1024 * 1024 // 1MB

type Stored = {
	source: string
	savedAt: number
}

function safeRead(): Stored | null {
	if (typeof window === 'undefined') return null
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		const data = JSON.parse(raw) as Stored
		if (typeof data.source !== 'string') return null
		return data
	}
	catch {
		return null
	}
}

function safeWrite(source: string, savedAt: number): { ok: boolean, error?: string } {
	if (typeof window === 'undefined') return { ok: false, error: 'SSR' }
	try {
		const serialized = JSON.stringify({ source, savedAt })
		if (serialized.length > MAX_SIZE) {
			return { ok: false, error: `文档过大 (${Math.round(serialized.length / 1024)}KB > 1MB)，已停止自动保存` }
		}
		window.localStorage.setItem(STORAGE_KEY, serialized)
		return { ok: true }
	}
	catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : String(err) }
	}
}

export function useEditorPersistence() {
	const store = useEditorStore()
	const toast = useToast()
	let writeTimer: ReturnType<typeof setTimeout> | null = null
	let warnedSize = false

	/** 挂载时调用一次：恢复草稿 */
	function restoreOnMount() {
		const stored = safeRead()
		if (!stored) return { restored: false }
		// 仅当 store 当前为空时才恢复（避免覆盖用户已输入内容）
		if (!store.source) {
			store.source = stored.source
			store.markSaved(stored.savedAt)
			return { restored: true, source: stored.source }
		}
		return { restored: false }
	}

	/** 监听 store.source 变化，自动写入 */
	function watchAndSave() {
		watch(() => store.source, (newSource) => {
			if (writeTimer) clearTimeout(writeTimer)
			writeTimer = setTimeout(() => {
				const result = safeWrite(newSource, Date.now())
				if (result.ok) {
					store.markSaved(Date.now())
					if (warnedSize) {
						warnedSize = false
						toast.success('已恢复自动保存')
					}
				}
				else if (!warnedSize) {
					warnedSize = true
					toast.error('自动保存失败', result.error ?? '')
				}
			}, 500)
		}, { flush: 'post' })
	}

	function clearDraft() {
		if (typeof window === 'undefined') return
		window.localStorage.removeItem(STORAGE_KEY)
		store.markSaved(null)
		toast.info('草稿已清空')
	}

	function teardown() {
		if (writeTimer) {
			clearTimeout(writeTimer)
			// 立即写入一次，确保最新内容落地
			if (store.source) safeWrite(store.source, Date.now())
			writeTimer = null
		}
	}

	return { restoreOnMount, watchAndSave, clearDraft, teardown }
}