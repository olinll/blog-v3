<script setup lang="ts">
/**
 * EditorToolbar —— 编辑器顶部工具栏
 *
 * - 左侧：标题 + 插入菜单
 * - 中部：视图模式切换（写 / 预览 / 分栏）
 * - 右侧：复制、导出、设置、清空、状态
 */

const store = useEditorStore()
const toast = useToast()

const emit = defineEmits<{
	openExport: []
	clear: []
}>()

// 视图模式
const viewMode = defineModel<'write' | 'preview' | 'split'>('viewMode', { default: 'split' })

const viewItems = [
	{ label: '写', icon: 'tabler:pencil', value: 'write' as const },
	{ label: '预览', icon: 'tabler:eye', value: 'preview' as const },
	{ label: '分栏', icon: 'tabler:layout-columns', value: 'split' as const },
]

// 下载 .md
function download() {
	const blob = new Blob([store.source], { type: 'text/markdown;charset=utf-8' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url

	const fm = store.parsed?.data ?? {}
	const slug = (fm.slug as string) || (fm.permalink as string) || (fm.abbrlink as string)
	const dateStr = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-').slice(0, 16)
	a.download = slug ? `${slug}.md` : `untitled-${dateStr}.md`

	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
	toast.success('已下载', a.download)
}

async function copyAll() {
	try {
		await navigator.clipboard.writeText(store.source)
		toast.success('已复制到剪贴板', `${store.source.length} 字符`)
	}
	catch (err) {
		toast.error('复制失败', err instanceof Error ? err.message : String(err))
	}
}
</script>

<template>
	<header class="editor-toolbar">
		<Icon name="tabler:pencil" />
		<span class="title">编辑器</span>

		<EditorInsertMenu />

		<span style="flex: 1" />

		<div class="view-mode-group">
			<button
				v-for="item in viewItems"
				:key="item.value"
				type="button"
				class="view-mode-btn"
				:class="{ active: viewMode === item.value }"
				@click="viewMode = item.value"
			>
				<Icon :name="item.icon" />
				<span>{{ item.label }}</span>
			</button>
		</div>

		<span style="flex: 1" />

		<ZButton icon="tabler:copy" text="复制" @click="copyAll" />
		<ZButton icon="tabler:file-download" text="导出" primary @click="download" />
		<ZButton icon="tabler:settings" text="设置" @click="emit('openExport')" />

		<ZButton icon="tabler:trash" text="清空" @click="emit('clear')" />
		<span class="status-text">
			{{ store.wordCount }} 字符 ·
			{{ store.lastSavedAt ? '已保存' : '未保存' }}
		</span>
	</header>
</template>

<style scoped>
.title {
	font-weight: 500;
}

/* 视图模式切换组 */
.view-mode-group {
	display: inline-flex;
	background-color: var(--c-bg-2);
	border-radius: 0.6em;
	padding: 3px;
	gap: 2px;
}

.view-mode-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.35em;
	padding: 0.35em 0.75em;
	border: none;
	border-radius: 0.45em;
	background: transparent;
	color: var(--c-text-2);
	font: inherit;
	font-size: 0.88em;
	cursor: pointer;
	transition: all 0.15s;
}

.view-mode-btn:hover {
	color: var(--c-text-1);
}

.view-mode-btn.active {
	background-color: var(--ld-bg-card);
	color: var(--c-primary);
	box-shadow: 0 1px 3px var(--ld-shadow);
}

.view-mode-btn :deep(.iconify) {
	font-size: 1.05em;
}

.status-text {
	font-size: 0.85em;
	color: var(--c-text-3);
	margin-left: 0.5em;
}
</style>
