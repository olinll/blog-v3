<script setup lang="ts">
// EditorShell —— 编辑器主壳
//
// Phase 9：导出对话框 + 键盘快捷键

// 显式导入 editor 子目录的 composables（Nuxt 自动导入未扫描到此层级）
import { useEditorPersistence } from '~/composables/editor/useEditorPersistence'
import { useEditorParser } from '~/composables/editor/useEditorParser'
import { useEditorShortcuts } from '~/composables/editor/useEditorShortcuts'

const colorMode = useColorMode()
const toast = useToast()
const store = useEditorStore()
const persistence = useEditorPersistence()
const { parseInWorker, cancelInflight, disposeParserWorker } = useEditorParser()
const codePaneRef = useTemplateRef('codePaneRef')

// 视图模式：write / preview / split
const viewMode = ref<'write' | 'preview' | 'split'>('split')

// 导出对话框状态
const showExport = ref(false)

provide('editor-code-pane', codePaneRef)


// 导出动作
function doDownload() {
	const fm = store.parsed?.data ?? {}
	const slug = (fm.slug as string) || (fm.permalink as string) || (fm.abbrlink as string)
	const dateStr = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-').slice(0, 16)
	const filename = slug ? `${slug}.md` : `untitled-${dateStr}.md`
	const blob = new Blob([store.source], { type: 'text/markdown;charset=utf-8' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}


function doClear() {
		const cm = codePaneRef.value?.setValue
		if (cm) cm("")
		store.source = ""
		persistence.clearDraft()
		toast.info("已清空")
	}

	async function doCopyAll() {
		try {
			await navigator.clipboard.writeText(store.source)
		} catch {
			// 静默
		}
	}

// 键盘快捷键
useEditorShortcuts({
	save: () => { showExport.value = true },
	copyAll: doCopyAll,
	toggleView: () => {
		viewMode.value = viewMode.value === 'split' ? 'write' : viewMode.value === 'write' ? 'preview' : 'split'
	},
})

onMounted(() => {
	store.bindParser({ parseInWorker, cancelInflight, disposeParserWorker })
	if (!store.source.trim()) {
		persistence.restoreOnMount()
	}
	persistence.watchAndSave()
	void store.reparse(colorMode.value === 'dark' ? 'dark' : 'light')
		.catch((err) => {
			// 把 Worker 启动失败的真实错误抛到控制台 + 显示给用户
			console.error('[editor] Worker 启动失败：', err)
			toast.error('解析器初始化失败', String(err))
		})
})

watch(() => colorMode.value, () => {
	void store.reparse(colorMode.value === 'dark' ? 'dark' : 'light')
})

onBeforeUnmount(() => {
	persistence.teardown()
	store.teardown()
})
</script>

<template>
	<div class="editor-shell">
		<EditorToolbar v-model:view-mode="viewMode" @open-export="showExport = true" @clear="doClear" />

		<EditorSplitPane v-if="viewMode === 'split'">
			<template #left>
				<EditorCodePane ref="codePaneRef" :model-value="store.source" @update:model-value="store.setSource" />
			</template>
			<template #right>
				<EditorEmptyState v-if="!store.source.trim()" />
				<EditorPreviewPane v-else />
			</template>
		</EditorSplitPane>

		<div v-else-if="viewMode === 'write'" class="single-pane">
			<EditorCodePane :model-value="store.source" @update:model-value="store.setSource" />
		</div>

		<div v-else class="single-pane single-pane--preview">
			<EditorEmptyState v-if="!store.source.trim()" />
			<EditorPreviewPane v-else />
		</div>

		<EditorStatusBar />

		<EditorExportDialog :open="showExport" @close="showExport = false" />
	</div>
</template>

<style scoped>
.single-pane {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
}
.single-pane--preview {
	background-color: var(--c-bg-1);
}
</style>