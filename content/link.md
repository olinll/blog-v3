---
date: 2024-01-29 21:26:26
updated: 2026-09-01
---

## 申请友链

- 原则上与多数独立博客的友链要求一致，也可以参考 [加入开往](https://www.travellings.cn/docs/join.html) 的规则。
- 网站应能长期稳定访问，使用 HTTPS，并持续更新维护。
- 内容应以原创的技术、生活或兴趣分享为主；不接受主要用于广告、采集、镜像或违法违规内容的网站。
- 如站点设有友链页面，欢迎先添加本站；这不是审核的唯一条件。

## 提交方式

- 在评论区留言，或发送邮件至 `olinl@foxmail.com`{copy}。
- 邮件标题请注明 `友链申请: 你的昵称`。
- 请以 :tip[任意形式]{tip="指向信息的 URL、自然语言、编程语言"} 提供以下信息：

::tab{:tabs='["简洁", "全量"]'}
#tab1
```ts
export default {
	title: '网站名称',
	desc: '一句话描述',
	link: '网站地址',
	avatar: '头像地址',
}
```

#tab2
```ts
export default {
	author: '昵称或作者名',
	title: '网站名称',
	desc: '一句话描述',
	link: '网站地址',
	avatar: '头像地址',
	icon: '站点图标地址',
	feed: 'RSS / Atom 地址（可选）',
	archs: ['技术栈（可选）'],
}
```
::

## 本站资料

```ts
export default {
	author: '顾拾柒',
	title: 'Olinl Blog',
	desc: '分享、实践、学习',
	link: 'https://blog.olinl.com/',
	avatar: 'https://q2.qlogo.cn/headimg_dl?dst_uin=9892214&spec=0',
	feed: 'https://blog.olinl.com/atom.xml',
}
```

## 审核与维护

- 友链信息可能会为展示效果作适当调整。
- 网站长期无法访问、内容明显不再维护，或不再符合上述要求时，友链可能会被隐藏或移除。
- 如站点域名、订阅源或头像发生变化，欢迎通过原申请渠道告知更新。
