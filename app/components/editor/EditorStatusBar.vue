<script setup lang="ts">
/**
 * EditorStatusBar —— 编辑器底栏
 *
 * 使用 ZDlGroup 紧凑布局展示：字符数、解析延迟、状态、上次保存时间。
 */

const colorMode = useColorMode()
const store = useEditorStore()

const statusItems = computed(() => [
	{ label: '字符', value: String(store.wordCount) },
	{ label: '解析', value: store.parseStatus === 'parsing' ? '…' : `${Math.round(store.parseLatencyMs)}ms` },
	{ label: '主题', value: colorMode.value === 'dark' ? '暗' : '亮' },
])

const savedAtText = computed(() => {
	if (!store.lastSavedAt) return '未保存'
	const ago = Math.round((Date.now() - store.lastSavedAt) / 60000)
	if (ago < 1) return '刚刚保存'
	if (ago < 60) return `${ago} 分钟前保存`
	const hours = Math.round(ago / 60)
	return `${hours} 小时前保存`
})
</script>

<template>
	<footer class="editor-statusbar">
		<ZDlGroup :items="statusItems" size="small" />
		<span style="flex: 1" />
		<span :class="['save-status', { 'save-status--dirty': !store.lastSavedAt }]">
			<Icon :name="store.lastSavedAt ? 'tabler:check' : 'tabler:circle-dot'" />
			{{ savedAtText }}
		</span>
	</footer>
</template>

<style scoped>
.editor-statusbar {
	flex-shrink: 0;
	padding: 0.4em 1em;
	background-color: var(--c-bg-1);
	border-top: 1px solid var(--c-bg-soft);
	color: var(--c-text-2);
	font-size: 0.85em;
	display: flex;
	align-items: center;
	gap: 1em;
}
.save-status {
	display: inline-flex;
	align-items: center;
	gap: 0.3em;
	color: var(--c-text-3);
}
.save-status--dirty {
	color: var(--c-warning, orange);
}
.save-status :deep(.iconify) {
	font-size: 1.1em;
}
</style>