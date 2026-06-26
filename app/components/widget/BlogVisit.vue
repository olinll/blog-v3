<script setup lang="ts">
const route = useRoute()
const isHome = computed(() => route.path === '/')

const overview = useUmamiOverview()
const pageViews = useUmamiPageViews(() => route.path)

/** 首页：全站 PV + UV */
const homeItems = computed(() => [
	{
		label: '访问量',
		value: computed(() => overview.data.value ? formatNumber(overview.data.value.pageviews) : '--'),
	},
	{
		label: '访客',
		value: computed(() => overview.data.value ? formatNumber(overview.data.value.visitors) : '--'),
	},
])

/** 其他页面：当前页阅读次数 */
const pageItems = computed(() => [
	{
		label: '阅读次数',
		value: pageViews.count,
	},
])

const visitItems = computed(() => isHome.value ? homeItems.value : pageItems.value)
</script>

<template>
	<BlogWidget card title="统计">
		<ZDlGroup :items="visitItems" size="small" />
	</BlogWidget>
</template>
