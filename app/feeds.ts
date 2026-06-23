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
] satisfies FeedGroup[]
