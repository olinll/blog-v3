/** localStorage 缓存键 */
const SHARE_CACHE_KEY = 'umami-share'
const STATS_CACHE_KEY = 'umami-stats'
const METRICS_CACHE_KEY = 'umami-metrics'
/** 缓存时长：Share 令牌 24h，统计数据 5min */
const SHARE_TTL = 24 * 60 * 60 * 1000
const DATA_TTL = 5 * 60 * 1000

interface ShareData { token: string, websiteId: string }
interface StatsData { pageviews: number, visitors: number }
interface MetricRow { x: string, y: number }

/** 模块级共享状态，同一页面多个组件复用同一份数据 */
const shareData = ref<ShareData | null>(null)
const shareLoading = ref(false)
const siteStats = ref<StatsData | null>(null)
const statsLoading = ref(false)
const metricsMap = ref<Map<string, number> | null>(null)
const metricsLoading = ref(false)

// ---------- localStorage 缓存工具 ----------

function cacheRead<T>(key: string, ttl: number): T | null {
	if (!import.meta.client) return null
	const raw = localStorage.getItem(key)
	if (!raw) return null
	try {
		const { t, v } = JSON.parse(raw)
		if (Date.now() - t < ttl) return v as T
	}
	catch { /* 格式损坏 */ }
	localStorage.removeItem(key)
	return null
}

function cacheWrite(key: string, value: unknown) {
	if (!import.meta.client) return
	try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value })) }
	catch { /* 存储满 */ }
}

/** 路径标准化：去首尾 /，转小写 */
function normalize(p: string) {
	return p.replace(/^\/|\/$/g, '').toLowerCase()
}

// ---------- API 请求 ----------

async function getShare(apiUrl: string, shareId: string): Promise<ShareData | null> {
	if (shareData.value) return shareData.value
	// 防止多个 call site 同时触发重复请求
	if (shareLoading.value) return null

	const cached = cacheRead<ShareData>(SHARE_CACHE_KEY, SHARE_TTL)
	if (cached) { shareData.value = cached; return cached }

	shareLoading.value = true
	try {
		const resp = await fetch(`${apiUrl}/api/share/${shareId}`)
		if (!resp.ok) throw new Error(`share: ${resp.status}`)
		const data = (await resp.json()) as ShareData
		shareData.value = data
		cacheWrite(SHARE_CACHE_KEY, data)
		return data
	}
	catch (err) {
		console.warn('[Umami] Share 令牌获取失败:', err)
		shareData.value = null
		return null
	}
	finally { shareLoading.value = false }
}

async function getSiteStats(apiUrl: string, share: ShareData) {
	if (siteStats.value) return
	const cached = cacheRead<StatsData>(STATS_CACHE_KEY, DATA_TTL)
	if (cached) { siteStats.value = cached; return }

	statsLoading.value = true
	try {
		const url = `${apiUrl}/api/websites/${share.websiteId}/stats?startAt=0&endAt=${Date.now()}`
		const resp = await fetch(url, { headers: { 'x-umami-share-token': share.token, 'x-umami-share-context': '1' } })
		if (!resp.ok) throw new Error(`stats: ${resp.status}`)
		siteStats.value = (await resp.json()) as StatsData
		cacheWrite(STATS_CACHE_KEY, siteStats.value)
	}
	catch (err) {
		console.warn('[Umami] 全站统计获取失败:', err)
		// 设空值阻止后续重试
		siteStats.value = {} as StatsData
	}
	finally { statsLoading.value = false }
}

async function getMetrics(apiUrl: string, share: ShareData) {
	if (metricsMap.value) return
	const cached = cacheRead<MetricRow[]>(METRICS_CACHE_KEY, DATA_TTL)
	if (cached) { metricsMap.value = buildLookup(cached); return }

	metricsLoading.value = true
	try {
		const url = `${apiUrl}/api/websites/${share.websiteId}/metrics?startAt=0&endAt=${Date.now()}&type=path&limit=1000`
		const resp = await fetch(url, { headers: { 'x-umami-share-token': share.token, 'x-umami-share-context': '1' } })
		if (!resp.ok) throw new Error(`metrics: ${resp.status}`)
		const rows = (await resp.json()) as MetricRow[]
		metricsMap.value = buildLookup(rows)
		cacheWrite(METRICS_CACHE_KEY, rows)
	}
	catch (err) {
		console.warn('[Umami] 页面指标获取失败:', err)
		// 设空值阻止后续重试
		metricsMap.value = new Map()
	}
	finally { metricsLoading.value = false }
}

function buildLookup(rows: MetricRow[]): Map<string, number> {
	const m = new Map<string, number>()
	for (const r of rows) m.set(normalize(r.x), (m.get(normalize(r.x)) || 0) + (r.y || 0))
	return m
}

// ---------- 数据获取协调 ----------

async function ensureData(apiUrl: string, shareId: string, needs: { stats?: boolean, metrics?: boolean }) {
	if (!shareData.value && !shareLoading.value) {
		const share = await getShare(apiUrl, shareId)
		if (!share) return
		if (!siteStats.value) getSiteStats(apiUrl, share)
		if (!metricsMap.value) getMetrics(apiUrl, share)
		return
	}

	// share 已在请求中，等待完成后在下方按需补拉
	if (shareLoading.value) return

	// share 已有，按需补拉
	const share = shareData.value
	if (!share) return
	if (needs.stats && !siteStats.value && !statsLoading.value) getSiteStats(apiUrl, share)
	if (needs.metrics && !metricsMap.value && !metricsLoading.value) getMetrics(apiUrl, share)
}

// ---------- Composables ----------

export function useUmamiOverview() {
	if (!import.meta.client) {
		return { data: computed(() => null as StatsData | null), loading: computed(() => false) }
	}

	const config = useAppConfig()
	ensureData(config.umami.apiUrl, config.umami.shareId, { stats: true, metrics: true })

	return {
		data: computed<StatsData | null>(() => {
			const d = siteStats.value
			// 失败时 siteStats 被设为 {}，不返回空对象
			return (d && 'pageviews' in d) ? d : null
		}),
		loading: computed(() => shareLoading.value || statsLoading.value),
	}
}

export function useUmamiPageViews(path: MaybeRefOrGetter<string>) {
	if (!import.meta.client) {
		return { count: computed(() => '--' as const), loading: computed(() => false) }
	}

	const config = useAppConfig()
	ensureData(config.umami.apiUrl, config.umami.shareId, { metrics: true })

	const count = computed(() => {
		const map = metricsMap.value
		if (!map || map.size === 0) return '--'
		const key = normalize(toValue(path))
		const n = map.get(key)
		return n !== undefined && n > 0 ? formatNumber(n) : '--'
	})

	return {
		count,
		loading: computed(() => shareLoading.value || metricsLoading.value),
	}
}
