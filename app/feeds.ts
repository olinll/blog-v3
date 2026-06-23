import type { FeedGroup } from '../app/types/feed'
// 友链检测 CLI 需要使用显式导入和相对路径
import { myFeed } from '../blog.config'
// eslint-disable-next-line unused-imports/no-unused-imports
import { getFavicon, getGithubAvatar, getGithubIcon, getOciqGroupAvatar, getOicqAvatar, OicqAvatarSize } from './utils/img'

export default [
	// #region Clarity
	{
		name: '清晰体验',
		desc: '使用 Clarity 博客主题构建的网站。',
		// @keep-sorted { "keys": ["date"] }
		entries: [
			myFeed,
		],
	},
	// #endregion
	// #region 网上邻居
	{
		name: '网上邻居',
		desc: '哔——啵——电波通讯中，欢迎常来串门。',
		// @keep-sorted { "keys": ["date"] }
		entries: [
			// {
			// 	author: '是Yangs',
			// 	desc: '一个前端Bug构造师的博客',
			// 	link: 'https://www.isyangs.cn/',
			// 	feed: 'https://www.isyangs.cn/feed.xml',
			// 	icon: 'https://www.isyangs.cn/favicon.svg',
			// 	avatar: 'https://7.isyangs.cn/8/655c9835780a0-8.jpg',
			// 	archs: ['Vue', '国内 CDN'],
			// 	date: '2024-01-29',
			// 	comment: '高中时认识的小学校友，目前从事前端开发。',
			// },

			{
				author: '他说',
				desc: '梁栋烨的博客网站。',
				link: 'https://090909.top/',
				feed: 'https://090909.top/atom.xml',
				icon: 'https://090909.top/assets/images/logo.ico',
				avatar: 'https://090909.top/assets/images/logo.ico',
				archs: ['Hexo', 'Cloudflare'],
				date: '2026-06-23',
			},
			{
				author: 'Hyper001’s Blog',
				desc: '记录学习，分享生活，保持热爱，奔赴山海。',
				link: 'https://blog.hyper001.cn/',
				feed: 'https://blog.hyper001.cn/atom.xml',
				icon: 'https://blog.hyper001.cn/images/avatar.jpeg',
				avatar: 'https://blog.hyper001.cn/images/avatar.jpeg',
				archs: ['Valaxy', 'Cloudflare'],
				date: '2026-06-23',
			},

			{
				author: '小枫_QWQ的Blog',
				desc: '欢迎来到小枫_QWQ的Blog！这是一个致力于分享前后端技术的博客。同时也分享一些闲聊碎语',
				link: 'https://blog.xiaofengqwq.com/',
				feed: 'https://blog.xiaofengqwq.com/feed/',
				icon: 'https://q.qlogo.cn/headimg_dl?dst_uin=1432777209&spec=640&img_type=jpg',
				avatar: 'https://q.qlogo.cn/headimg_dl?dst_uin=1432777209&spec=640&img_type=jpg',
				archs: ['Typecho', 'Cloudflare'],
				date: '2026-06-23',
			},

			{
				author: 'TT清沫uk',
				desc: 'TT清沫ukの博客',
				link: 'https://ttquk.netlify.app/',
				// feed: 'https://ttquk.netlify.app/feed/',
				icon: 'https://ts1.tc.mm.bing.net/th/id/OIP-C.6WsD9caLSNQFhJOi77soRAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
				avatar: 'https://ts1.tc.mm.bing.net/th/id/OIP-C.6WsD9caLSNQFhJOi77soRAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
				archs: ['Hexo', 'Netlify'],
				date: '2026-06-23',
			},

			{
				author: '高新炀的小站',
				desc: '一个装着些稀奇古怪东西的个人小站，欢迎来逛逛~',
				link: 'https://gxy.cn.mt/',
				feed: 'https://gxy.cn.mt/rss.xml',
				icon: 'https://gxy.cn.mt/assets/avatar.webp',
				avatar: 'https://gxy.cn.mt/assets/avatar.webp',
				archs: ['Python', 'GitHub Pages'],
				date: '2026-06-23',
			},

			{
				author: '番茄主理人',
				desc: '坐而言不如起而行.',
				link: 'https://www.fqzlr.com/',
				feed: 'https://www.fqzlr.com/rss.xml',
				icon: 'https://q1.qlogo.cn/g?b=qq&nk=20447289&s=640',
				avatar: 'https://q1.qlogo.cn/g?b=qq&nk=20447289&s=640',
				archs: ['Astro', 'Vercel'],
				date: '2026-06-23',
			},
			{
				author: 'MmzMing的知识库',
				desc: '哈基米，南北绿豆',
				link: 'https://tblog.mmzhiku.xyz/',
				feed: 'https://tblog.mmzhiku.xyz/rss.xml',
				icon: 'https://i.stardots.io/784774835/StarDots-2026052116374135506.jpg',
				avatar: 'https://i.stardots.io/784774835/StarDots-2026052116374135506.jpg',
				archs: ['Astro', 'Cloudflare'],
				date: '2026-06-23',
			},


			{
				author: 'Hyde Blog',
				desc: '人心中的成见是一座大山',
				link: 'https://seasir.top/',
				feed: 'https://seasir.top/rss.xml',
				icon: 'https://seasir.top/assets/avatar.avif',
				avatar: 'https://seasir.top/assets/avatar.avif',
				archs: ['Astro', 'EdgeOne'],
				date: '2026-06-23',
			},

			{
				author: '涵哲子居',
				desc: '天哲地理，共公卿好',
				link: 'https://afipo.top/',
				feed: 'https://afipo.top/rss.xml',
				icon: 'https://afipo.top/logo.webp',
				avatar: 'https://afipo.top/logo.webp',
				archs: ['Astro', 'Cloudflare'],
				date: '2026-06-23',
			},

			{
				author: 'MineDensity',
				desc: '这个网站是我送给互联网的一本手绘笔记。如果你在这里找到了什么让你停留的东西，那我们就已经是朋友了。',
				link: 'https://www.minedensity.top/',
				feed: 'https://www.minedensity.top/rss.xml',
				icon: 'https://www.minedensity.top/favicon.svg',
				avatar: 'https://www.minedensity.top/favicon.svg',
				archs: ['Vue', '服务器'],
				date: '2026-06-23',
			},

		],
	},
	// #endregion
] satisfies FeedGroup[]
