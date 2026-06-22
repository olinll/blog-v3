<script setup lang="ts">
/**
 * EditorCodePane —— CodeMirror 6 的轻量 Vue 3 包装
 *
 * 为什么不直接用 @vueup/vue-codemirror：该包已不在 npm 维护。
 * CodeMirror 6 的 vanilla API 设计为可在任何框架中集成，我们手写 30 行 wrapper 即可。
 *
 * 暴露给父组件的方法（通过 defineExpose）：
 *   - insert(text, cursorOffset?) 在当前选区插入文本并把光标移到指定偏移
 *   - focus() 聚焦编辑器
 *   - getValue() / setValue(v) 读写内容
 */
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { bracketMatching, indentOnInput, foldGutter, foldKeymap, defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

const props = defineProps<{
	modelValue: string
	placeholder?: string
}>()

const emit = defineEmits<{
	'update:modelValue': [value: string]
	change: [value: string]
}>()

const containerRef = useTemplateRef('containerRef')
const colorMode = useColorMode()

let view: EditorView | null = null
// 缓存外部值，仅在真正变化时同步到编辑器（避免循环更新）
let lastEmittedValue = ''

const isDark = computed(() => colorMode.value === 'dark')

function buildExtensions() {
	const exts = [
		lineNumbers(),
		highlightActiveLine(),
		highlightActiveLineGutter(),
		foldGutter(),
		drawSelection(),
		history(),
		indentOnInput(),
		bracketMatching(),
		syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
		highlightSelectionMatches(),
		keymap.of([
			...defaultKeymap,
			...historyKeymap,
			...searchKeymap,
			...foldKeymap,
			indentWithTab,
		]),
		markdown(),
		EditorView.lineWrapping,
		EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				const value = update.state.doc.toString()
				lastEmittedValue = value
				emit('update:modelValue', value)
				emit('change', value)
			}
		}),
	]
	if (isDark.value) exts.push(oneDark)
	return exts
}

function syncFromProps() {
	if (!view) return
	const current = view.state.doc.toString()
	if (current === props.modelValue) return
	view.dispatch({
		changes: { from: 0, to: current.length, insert: props.modelValue },
	})
}

watch(() => props.modelValue, () => syncFromProps())
watch(isDark, () => {
	// 主题切换：销毁重建（CodeMirror 主题是创建时确定的）
	if (view) {
		view.destroy()
		view = null
	}
	createView()
})

function createView() {
	if (!containerRef.value) return
	const state = EditorState.create({
		doc: props.modelValue,
		extensions: buildExtensions(),
	})
	view = new EditorView({
		state,
		parent: containerRef.value,
	})
}

onMounted(() => {
	createView()
})

onBeforeUnmount(() => {
	if (view) {
		view.destroy()
		view = null
	}
})

/** 暴露给父组件使用 */
defineExpose({
	/** 在当前光标位置插入文本，可选 cursorOffset 调整最终光标位置
	 * cursorOffset 是相对插入文本**末尾**的偏移（负值表示落在文本内部），
	 * 例如插入 "::alert{title=\"提示\"}" + cursorOffset=-7 时，光标落在「|提示」的位置 */
	insert(text: string, cursorOffset = 0) {
		if (!view) return
		const { from, to } = view.state.selection.main
		view.dispatch({
			changes: { from, to, insert: text },
			selection: { anchor: from + text.length + cursorOffset },
		})
		view.focus()
	},
	focus() {
		view?.focus()
	},
	getValue() {
		return view?.state.doc.toString() ?? ''
	},
	setValue(v: string) {
		if (!view) return
		view.dispatch({
			changes: { from: 0, to: view.state.doc.length, insert: v },
		})
	},
	getView() {
		return view
	},
})
</script>

<template>
	<div ref="containerRef" class="editor-code" />
</template>

<style scoped>
.editor-code {
	height: 100%;
	min-height: 0;
}
.editor-code :deep(.cm-editor) {
	height: 100%;
}
</style>