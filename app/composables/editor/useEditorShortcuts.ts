/**
 * useEditorShortcuts —— 编辑器键盘快捷键
 *
 * - Cmd/Ctrl+S：保存文章属性
 * - Cmd/Ctrl+Shift+C：复制全部
 * - Cmd/Ctrl+E：切换视图模式（write/preview/split）
 */

import { onKeyStroke } from '@vueuse/core'

export interface ShortcutHandlers {
	save?: () => void
	copyAll?: () => void
	toggleView?: () => void
}

export function useEditorShortcuts(handlers: ShortcutHandlers) {
	onKeyStroke(['s'], (e) => {
		if (!(e.ctrlKey || e.metaKey)) return
		if (e.shiftKey) return
		e.preventDefault()
		handlers.save?.()
	})

	onKeyStroke(['c'], (e) => {
		if (!(e.ctrlKey || e.metaKey)) return
		if (!e.shiftKey) return
		e.preventDefault()
		handlers.copyAll?.()
	})

	onKeyStroke(['e'], (e) => {
		if (!(e.ctrlKey || e.metaKey)) return
		e.preventDefault()
		handlers.toggleView?.()
	})
}