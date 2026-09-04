---
title: 'Firefly 博客魔改记'
date: 2026-07-22 19:30:00
updated: 2026-07-22 19:30:00
description: 'Firefly 博客二次开发全记录，汇总所有自定义改动及其实现方式。'
image: https://img.olinl.com/file/post-img/customization-log/cover.webp
categories: [Firefly]
tags: [Firefly, 博客, 二开]
draft: false
pinned: false
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

::alert{type="info" title="> 本文部分内容由 AI 辅助整理，已结合实际操作进行校验，请根据自身环境谨慎使用。"}

::


本文记录了基于 Firefly 主题的二次开发过程。


## 全站 Umami 统计与浏览量展示

2026-07-03

集成 Umami 开源统计工具采集全站访问数据并通过 Share API 在前端展示浏览量。核心巧妙之处在于利用 Umami 的分享功能获取 shareId，无需暴露管理员凭证即可安全查询统计数据。前端配合 LocalStorage 分层缓存策略（Token 缓存 24 小时、Metrics 缓存 5 分钟），既保证了数据实时性又避免了对 Umami 服务造成压力。支持文章详情页、动态页、友链页等多页面浏览量展示。

文章：[全站 Umami 统计与浏览量展示](/posts/umami-views)

## 时段问候小部件

2026-07-04

侧边栏实时时钟组件，动态显示当前时间、日期和星期信息。根据深夜、早晨、上午、中午、下午、晚上六个时段自动切换问候语和对应的 Material Symbols 图标，搭配随机风景背景图增加视觉层次感。采用 IIFE 包裹脚本逻辑避免变量污染全局作用域，通过全局变量判断确保 Swup SPA 页面切换时不会重复声明导致错误，同时支持 `astro:page-load` 事件触发更新。

文章：[时段问候小部件](/posts/time-greeting)

## GitHub 贡献热力图小部件

2026-07-04

侧边栏展示近 100 天的 GitHub 贡献热力图，通过 jogruber 公开 API 拉取数据，无需配置 Token 即可使用。服务端构建时发起请求并设置 8 秒超时兜底，请求失败则返回空数据并在前端显示降级提示文案。按 7 天一列排列网格，每格根据贡献等级设置透明度，颜色自动跟随主题色 var(--primary) 适配。鼠标悬停时显示具体日期和提交数的 tooltip。

文章：[GitHub 贡献热力图小部件](/posts/github-heatmap)

## 欢迎弹窗组件

2026-07-04

首次访问时右下角弹出轻巧的欢迎提示 Toast，调用 IP 定位 API 获取访客所在地并显示个性化问候语（如"你好，来自 XX 的朋友"）。5 秒后自动关闭退出，使用 sessionStorage 记录访问状态确保同一会话内不再重复弹出，既不打扰回访用户又让首次访客感受到博客的温度。API 请求失败时显示默认文案，具备完整的降级处理能力。

文章：[欢迎弹窗组件](/posts/welcome-toast)

## 短链接与重定向系统

2026-07-04

基于 Astro 内置 redirects 配置项的轻量短链接系统，无需安装任何额外 Node 包即可实现。支持两类目标：内部路径跳转（如 /q 短链接指向 /posts/qq-group// 文章页）和外部 URL 跳转（如 /avatar-qlogo 指向 QQ 头像 API）。构建时 Astro 自动生成静态重定向页面，生产环境使用 301 状态码，访客访问短链接即自动跳转，零运行时性能损耗。

文章：[为博客添加短链接与重定向系统](/posts/shortlink)

## 动态页集成 Memos API

2026-07-19

将自建的 Memos 轻量笔记服务作为博客动态数据源，替代传统的本地 content/dynamic/ 集合维护方式。通过 Astro 文件路由创建 API 代理层（src/pages/api/dynamic.json.ts），服务端请求 Memos 数据并渲染 Markdown 为 HTML。支持标签过滤（只显示包含特定标签的 memo）和可见性控制（仅公开/全部），Memos 不可用时自动降级返回空数组，保证页面正常渲染。

文章：[动态页集成 Memos API](/posts/memos-dynamic)

## 自定义页脚

2026-07-19

通过 FooterConfig.html 纯内联 HTML 模板定制博客页脚，无需修改组件代码即可生效。页脚包含五大区域：顶部装饰插画、技术徽章（Astro、TailwindCSS、Twikoo、EdgeOne、Umami、CC 协议）、社交链接（博客、网盘、随笔、文档）、工信部 ICP 备案与公安备案号、以及自动计算的建站运行时长。颜色使用 CSS 变量 var(--primary) 跟随主题自动适配深浅模式。

文章：[自定义页脚](/posts/footer-config)

## 复制成功提示浮层

2026-07-21

监听全局 copy 事件，当访客复制博客内容时顶部自动滑入提示浮层，显示"复制成功，转载请标注本文地址"。进度条从左到右做 3 秒扫描动画模拟倒计时消失效果，CSS 采用 z-index 三层结构（背景层、进度条层、文字层）隔离渲染互不干扰。新增移动端响应式适配和深色模式专用渐变背景，代码中增加定时器置空操作确保内存安全。

文章：[复制成功提示浮层](/posts/copy-toast)

## 自定义鼠标指针样式

2026-07-21

使用 .cur 静态光标文件替换浏览器默认鼠标样式，通过 CSS 变量统一管理默认态和可点击态两种光标。纯 CSS 实现零 JavaScript 开销，选择器全面覆盖所有按钮类元素：原生 button、input 按钮类型、ARIA 角色选择器乃至属性选择器，确保跨浏览器行为一致。鼠标文件放在 public/mouse/ 目录下，按需替换即可完成个性化定制。

文章：[自定义鼠标指针样式](/posts/custom-cursor)

## 今日一言小部件

2026-07-21

侧边栏每日一句名言展示，通过日期字符串每个字符的 charCode 累加形成伪随机种子，对名言数组取模得到每日固定索引，确保同一天显示相同名言而不同天自动切换。数据存储在 content/ziyuan/quote.md 的 frontmatter 中，构建时通过 Astro 内容集合读取，零运行时依赖。可选客户端脚本接入一言 API 实时获取无限名言库。

文章：[今日一言小部件](/posts/quote-of-the-day)

## 时间进度条小部件

2026-07-21

年/月/周三个维度的进度条组件，直观展示时间流逝情况。硬编码中国法定节假日（元旦、清明、劳动节、端午、中秋、国庆）实现倒计时功能，支持自动跨年计算。纯客户端运行，页面加载时立即计算并更新 DOM，设置每日零点定时器自动刷新。进度条使用原生 progress 元素配合 CSS 伪元素自定义样式，支持深色模式适配。

文章：[时间进度条小部件](/posts/schedule-progress)

## 🔗 最后

以上功能覆盖统计、展示、交互、工具四个维度，全部基于 Firefly 主题扩展开发。每篇文章都有详细的实现步骤和代码变更，点击链接即可查看。
