/** 模块级共享：所有文章卡片组件共用同一份评论数数据 */
const commentCounts = ref<Map<string, number> | null>(null)
const isFetching = ref(false)
let pendingResolve: (() => void) | null = null

function awaitTwikoo(): Promise<boolean> {
	return new Promise((resolve) => {
		if (!import.meta.client) return resolve(false)

		if (window.twikoo?.getCommentsCount) {
			return resolve(true)
		}

		// 轮询等待脚本加载（最多等 10 秒）
		let attempts = 0
		const timer = setInterval(() => {
			if (window.twikoo?.getCommentsCount) {
				clearInterval(timer)
				resolve(true)
				return
			}
			if (++attempts > 200) {
				clearInterval(timer)
				console.warn('[Twikoo] getCommentsCount 不可用，跳过评论数获取')
				resolve(false)
			}
		}, 50)
	})
}

/**
 * 批量拉取评论数。
 * 收集所有调用方传入的路径，一次性调用 twikoo.getCommentsCount，结果存入 commentCounts。
 */
async function fetchCounts(apiBase: string, urls: string[]) {
	if (!import.meta.client) return
	if (isFetching.value) {
		return new Promise<void>((resolve) => { pendingResolve = resolve })
	}

	const available = await awaitTwikoo()
	if (!available) return

	isFetching.value = true
	try {
		const resp = await window.twikoo!.getCommentsCount!({
			envId: apiBase,
			urls,
			includeReply: true,
		})
		// resp: Array<{ url: string, count: number }>
		const map = new Map<string, number>()
		for (const item of resp) {
			// 去掉末尾 / 以匹配组件传入的路径格式
			map.set(item.url.replace(/\/$/, ''), item.count || 0)
		}
		commentCounts.value = map
	}
	catch (err) {
		console.warn('[Twikoo] 评论数获取失败:', err)
		commentCounts.value = new Map()
	}
	finally {
		isFetching.value = false
		pendingResolve?.()
		pendingResolve = null
	}
}

/** 收集到的路径集合 */
const pendingPaths = new Set<string>()
let batchTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 注册一个路径并在评论数可用时返回对应的数量。
 * 多个组件调用会自动合并为单次批量请求。
 */
export function useTwikooCounts(path: MaybeRefOrGetter<string>) {
	if (!import.meta.client) {
		return { count: computed(() => '0' as const) }
	}

	const config = useAppConfig()
	const apiBase = (config as any).twikoo?.envId || 'https://twikoo.olinl.com/'
	const url = toValue(path).replace(/\/$/, '')

	pendingPaths.add(url)
	if (!batchTimer) {
		batchTimer = setTimeout(() => {
			batchTimer = null
			const urls = [...pendingPaths]
			pendingPaths.clear()
			fetchCounts(apiBase, urls)
		}, 100)
	}

	const count = computed(() => {
		const map = commentCounts.value
		if (!map) return '0'
		const n = map.get(url)
		return n !== undefined && n >= 0 ? formatNumber(n) : '0'
	})

	return { count }
}
