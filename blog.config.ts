import type { FeedEntry } from './app/types/feed'

const basicConfig = {
	title: 'Olinl Blog',
	subtitle: '分享、实践、学习',
	// 长 description 利好于 SEO
	description: '记录技术成长路上的思考与实践，分享编程开发、技术探索和问题解决的心得体会。在这里，你可以找到实用的技术教程、开发经验总结、以及各种有趣的技术发现。让我们一起在代码的世界里不断学习，持续进步。',
	author: {
		name: '顾拾柒',
		avatar: 'https://q2.qlogo.cn/headimg_dl?dst_uin=9892214&spec=0',
		email: 'olinl@foxmail.com',
		homepage: 'https://www.olinl.com/',
	},
	copyright: {
		abbr: 'CC BY-NC-SA 4.0',
		name: '署名-非商业性使用-相同方式共享 4.0 国际',
		url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans',
	},
	favicon: 'https://q2.qlogo.cn/headimg_dl?dst_uin=9892214&spec=0',
	language: 'zh-CN',
	timeEstablished: '2026-06-10',
	timeZone: 'Asia/Shanghai',
	url: 'https://v3.olinl.com/',
	defaultCategory: '未分类',
}

// 存储 nuxt.config 和 app.config 共用的配置
// 此处为启动时需要的配置，启动后可变配置位于 app/app.config.ts
// @keep-sorted
const blogConfig = {
	...basicConfig,

	article: {
		categories: {
			[basicConfig.defaultCategory]: { icon: 'tabler:circle-dashed' },
			/** 服务：中间件/数据库/监控/建站等部署与运维 */
			服务: { icon: 'tabler:server', color: '#3b82f6' },          // 蓝
			/** 系统：OS 安装/初始化/磁盘/时间同步等 */
			系统: { icon: 'tabler:device-laptop', color: '#a855f7' },   // 紫
			/** 容器：Docker / Compose / K8s 相关 */
			容器: { icon: 'tabler:container', color: '#06b6d4' },       // 青
			/** 网络：代理/CDN/内网穿透/VPN */
			网络: { icon: 'tabler:network', color: '#22c55e' },         // 绿
			/** 开发：编程语言/IDE/代码片段 */
			开发: { icon: 'tabler:code', color: '#f97316' },            // 橙
			/** 杂项：浏览器调优/视频处理/随笔 */
			杂项: { icon: 'tabler:dots', color: '#6b7280' },            // 灰
			/** 虚拟化：PVE / TrueNAS / GPU 直通 */
			虚拟化: { icon: 'tabler:cube', color: '#ec4899' },          // 粉
		},
		/** 文章版式，首个为默认版式 */
		types: {
			tech: {},
			story: {},
		},
		/** 分类排序方式，键为排序字段，值为显示名称 */
		order: {
			date: '创建日期',
			updated: '更新日期',
			top: '置顶',
			// title: '标题',
		},
		/** 使用 pnpm new 新建文章时自动生成自定义链接（permalink/abbrlink） */
		useRandomPremalink: false,
		/** 隐藏基于文件路由（不是自定义链接）的 URL /post 路径前缀 */
		hidePostPrefix: true,
		/** 禁止搜索引擎收录的路径 */
		robotsNotIndex: ['/preview', '/previews/*'],
	},

	/** 博客 Atom 订阅源 */
	feed: {
		/** 订阅源最大文章数量 */
		limit: 50,
		/** 订阅源是否启用XSLT样式 */
		enableStyle: true,
	},

	/** 向 <head> 中添加脚本 */
	scripts: [
		// 自己部署的 Umami 统计服务
		{ 'src': 'https://umami.olinl.com/olinl_u.js', 'data-website-id': '71de627e-31d7-4e39-b44a-ad899c628a5b', 'defer': true },
		// 自己网站的 Cloudflare Insights 统计服务
		{ 'src': 'https://static.cloudflareinsights.com/beacon.min.js', 'data-cf-beacon': '{"token": "97a4fe32ed8240ac8284e9bffaf03962"}', 'defer': true },
		// Twikoo 评论系统
		{ src: 'https://lib.baomitu.com/twikoo/1.6.44/twikoo.min.js', defer: true },
	],

	/** 自己部署的 Twikoo 服务 */
	twikoo: {
		envId: 'https://twikoo.olinl.com/',
		preload: 'https://twikoo.olinl.com/',
	},
}

/** 用于生成 OPML 和友链页面配置 */
export const myFeed: FeedEntry = {
	author: blogConfig.author.name,
	sitenick: '摸鱼处',
	title: blogConfig.title,
	desc: blogConfig.subtitle || blogConfig.description,
	link: blogConfig.url,
	feed: new URL('/atom.xml', blogConfig.url).toString(),
	icon: blogConfig.favicon,
	avatar: blogConfig.author.avatar,
	archs: ['Nuxt', 'Vercel'],
	date: blogConfig.timeEstablished,
	comment: '这是我自己',
}

export default blogConfig
