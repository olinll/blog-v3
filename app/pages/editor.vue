<script setup lang="ts">
// 文章编辑器入口。
const layoutStore = useLayoutStore()
const colorMode = useColorMode()

// 关闭右栏，避免编辑器被侧栏挤窄
onMounted(() => layoutStore.setAside([]))
onBeforeUnmount(() => layoutStore.setAside([]))

definePageMeta({
	title: '编辑器',
	titleTemplate: '%s',
})
</script>

<template>
	<div class="editor-scope">
		<ClientOnly>
			<LazyEditorShell />
			<template #fallback>
				<div class="editor-empty">
					<div class="editor-empty-title">编辑器</div>
					<p>加载中…</p>
				</div>
			</template>
		</ClientOnly>
	</div>
</template>
