<script setup lang="ts">
/**
 * EditorEmptyState —— 编辑器首访欢迎
 *
 * 从 blogConfig.article.categories 渲染分类芯片。
 * 点击分类加载对应模板。
 */

const appConfig = useAppConfig()
const store = useEditorStore()

// 拿到所有分类（不含默认 '未分类'）
const categories = computed(() => {
	const raw = appConfig.article?.categories ?? {}
	const entries = Object.entries(raw as Record<string, { icon?: string, color?: string }>)
		.filter(([key]) => key !== '未分类')
	return entries
})

function dateStr() {
	return new Date().toISOString().slice(0, 10)
}

const templates: Record<string, string> = {
	服务: '---\ntitle: 服务部署示例\ndate: ' + dateStr() + '\ncategory: 服务\n---\n\n# 服务部署示例\n\n::alert{type="info" title="提示"}\n填写说明文字\n::\n\n```bash\n# 部署命令\ndocker run -d -p 80:80 nginx\n```\n',
	系统: '---\ntitle: 系统配置示例\ndate: ' + dateStr() + '\ncategory: 系统\n---\n\n# 系统配置示例\n\n::alert{type="warning" title="注意"}\n需要 root 权限\n::\n\n```bash\nsudo apt update\n```\n',
	容器: '---\ntitle: 容器使用示例\ndate: ' + dateStr() + '\ncategory: 容器\n---\n\n# 容器使用示例\n\n```yaml [docker-compose.yml]\nservices:\n  web:\n    image: nginx\n```\n',
	网络: '---\ntitle: 网络配置示例\ndate: ' + dateStr() + '\ncategory: 网络\n---\n\n# 网络配置示例\n',
	开发: '---\ntitle: 开发笔记示例\ndate: ' + dateStr() + '\ncategory: 开发\n---\n\n# 开发笔记示例\n\n```ts\nconst greeting = "Hello!"\n```\n',
	杂项: '---\ntitle: 杂项笔记\ndate: ' + dateStr() + '\ncategory: 杂项\n---\n\n# 杂项笔记\n',
	虚拟化: '---\ntitle: 虚拟化示例\ndate: ' + dateStr() + '\ncategory: 虚拟化\n---\n\n# 虚拟化示例\n',
}

function loadTemplate(category: string) {
	const tpl = templates[category]
	if (!tpl) return
	store.source = tpl
}
</script>

<template>
<div class="editor-empty">
	<Icon name="tabler:edit" size="3em" />
	<div class="editor-empty-title">开始一篇文章</div>
	<p>选择一个分类加载模板，或直接在上方输入：</p>
	<div class="editor-empty-categories">
		<button
			v-for="[key, conf] in categories"
			:key="key"
			type="button"
			class="category-chip"
			:style="{ '--chip-color': conf.color || 'var(--c-primary)' }"
			@click="loadTemplate(key)"
		>
			<Icon :name="conf.icon || 'tabler:circle'" />
			<span>{{ key }}</span>
		</button>
	</div>
</div>
</template>

<style scoped>
.category-chip {
	display: inline-flex;
	align-items: center;
	gap: 0.4em;
	padding: 0.5em 0.9em;
	border: 1px solid var(--c-bg-soft);
	border-radius: 1.5em;
	background-color: var(--c-bg-1);
	color: var(--c-text-1);
	font-size: 0.9em;
	cursor: pointer;
	transition: border-color 0.15s, background-color 0.15s;
}
.category-chip:hover {
	border-color: var(--chip-color);
	background-color: var(--c-bg-soft);
}
.category-chip :deep(.iconify) {
	color: var(--chip-color);
	font-size: 1.1em;
}
</style>
