<script setup lang="ts">
/**
 * EditorPreviewPane —— 预览面板
 *
 * 接收 Pinia store 中的 parsed 结果，喂给 <ContentRenderer> 渲染。
 * ContentRenderer 会自动解析 MDC 组件（::alert, ::tab, ::music-abc 等），
 * KaTeX 由 rehype-katex 注入，代码高亮由 Shiki 处理（都在 Worker 里完成）。
 *
 * ContentRenderer 期望的 value 结构：{ body: AST, data: frontmatter, ... }
 * Worker 返回的 parsed 已经是这个结构。
 */

const store = useEditorStore()

// 构建 ContentRenderer 需要的 value 对象
const renderValue = computed(() => {
	if (!store.parsed) return null
	return {
		body: store.parsed.body,
		data: store.parsed.data,
		// ContentRenderer 还可能看 excerpt/path 等元数据，此处仅提供必要字段
	}
})
</script>

<template>
	<div class="editor-preview-pane">
		<ZError
			v-if="store.parseStatus === 'error'"
			icon="tabler:alert-triangle"
			title="解析失败"
			:message="store.parseError ?? ''"
		/>
		<div v-else-if="!store.parsed" class="editor-empty">
			<Icon name="tabler:loader" size="2em" />
			<p>解析中…</p>
		</div>
		<ContentRenderer
			v-else
			:value="renderValue"
			class="editor-preview-content"
		/>
	</div>
</template>

<style scoped>
.editor-preview-pane {
	height: 100%;
	min-height: 0;
	overflow: auto;
}

.editor-preview-content {
	padding: 1.5em 2em;
	max-width: 50rem;
	margin: 0 auto;
}
</style>