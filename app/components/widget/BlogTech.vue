<script setup lang="ts">
import { Icon } from '#components'
import { merge } from 'es-toolkit/object'
import { packageManager, version } from '~~/package.json'
import pnpmWorkspace from '~~/pnpm-workspace.yaml'

const appConfig = useAppConfig()
const { public: { arch, cdn: cdnPreset, ci, nodeVersion, platform } } = useRuntimeConfig()

const ciPlatform = computed(() => {
	const iconName = ciIcons[ci]
	if (!iconName)
		return ''

	const iconNode = iconName.startsWith('http')
		? h('img', { src: iconName, alt: '' })
		: h(Icon, { name: iconName })

	return h('span', {}, [iconNode, ` ${ci.split(' ')[0]}`])
})

/**
 * CDN 加速平台:
 *   1. 初值:构建时 `BLOG_CDN` 环境变量烤入产物(EdgeOne/Cloudflare/空),首屏无闪动
 *   2. 校正:挂载后用响应头 `server` 字段实时探测
 *      - `edgeone-pages` → EdgeOne
 *      - `cloudflare`    → Cloudflare
 *      若与初值不一致(同一份产物部署到多个平台时会发生),静默更新
 */
const cdn = ref(cdnPreset)
const cdnPlatform = computed(() => {
	const iconName = cdnIcons[cdn.value]
	if (!iconName)
		return ''

	const iconNode = iconName.startsWith('http')
		? h('img', { src: iconName, alt: '' })
		: h(Icon, { name: iconName })

	return h('span', {}, [iconNode, ` ${cdn.value}`])
})

onMounted(async () => {
	try {
		const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' })
		const server = (res.headers.get('server') || '').toLowerCase()
		let detected = ''
		if (server.includes('edgeone'))
			detected = 'EdgeOne'
		else if (server.includes('cloudflare'))
			detected = 'Cloudflare'

		// 探测到具体 CDN 且与当前值不一致才更新,避免本地预览或未知 CDN 时把预设值清掉
		if (detected && detected !== cdn.value)
			cdn.value = detected
	}
	catch {
		// 失败时保持构建时的预设值
	}
})

// @ts-expect-error pnpm-workspace.yaml 无类型定义
const packages = merge(...Object.values(pnpmWorkspace.catalogs))
const [pm, pmVersion] = packageManager.split('@') as [string, string]

const service = computed(() => ([
	{ label: '构建平台', value: () => ci ? ciPlatform.value : [h(Icon, { name: 'tabler:server-2' }), ' Self-Hosted'] },
	// CDN 加速:初值来自构建时 BLOG_CDN 环境变量,客户端用响应头校正;空值时不渲染该行
	...(cdn.value ? [{ label: 'CDN 加速', value: () => cdnPlatform.value }] : []),
	{ label: '图片存储', value: () => [h(Icon, { name: 'simple-icons:alibabacloud' }), ' Aliyun OSS'] },
	{ label: '软件协议', value: 'MIT' },
	{ label: '文章许可', value: appConfig.copyright.abbr },
	{ label: '规范域名', value: getDomain(appConfig.url) },
]))

const techstack = computed(() => ([
	{ label: 'Blog', value: version },
	{ label: 'Vue', value: packages.vue },
	{ label: 'Nuxt', value: packages.nuxt },
	{ label: 'Content', value: packages['@nuxt/content'] },
	{ label: 'Node', value: nodeVersion },
	{ label: pm, value: pmVersion },
	{ label: 'OS', value: platform },
	{ label: 'Arch', value: arch },
]))

const expand = ref(false)
</script>

<template>
<BlogWidget card title="技术信息">
	<ZDlGroup :items="service" />
	<ZExpand v-model="expand" in-place name="构建信息">
		<ZDlGroup size="small" :items="techstack" />
	</ZExpand>
</BlogWidget>
</template>

<style lang="scss" scoped>
.z-expand {
	margin-top: 0.2em;
}

.dl-group :deep(img) {
	height: 1.2em;
	vertical-align: sub;
}
</style>
