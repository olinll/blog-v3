---
title: 'Firefly 魔改：Umami Share API 浏览量展示'
date: 2026-07-03 21:40:29
updated: 2026-07-22 19:30:00
description: '集成 Umami 统计并通过公开 Share API 在博客前端展示页面/文章浏览量。'
image: https://img.olinl.com/file/post-img/umami-views/cover.webp
categories: [Firefly]
tags: [Firefly, 博客, 二开, Umami, 统计]
draft: false
pinned: false
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

::alert{type="info" title="> 本文部分内容由 AI 辅助整理，已结合实际操作进行校验，请根据自身环境谨慎使用。"}

::


访问量数据不仅是站长关心的事，展示给访客也能增加内容的可信度。Umami 是一个开源的网站统计工具，本文将介绍如何在前端展示 Umami 浏览量数据。

## 一、小巧思：Share ID

通常情况下调用 Umami API 需要先登录获取 Token（`POST /api/auth/login` → 返回 `token` → 后续请求带 `Authorization: Bearer <token>`）。但这样做有两个问题：

1. 需要在客户端暴露用户名密码
2. Token 会过期，需要刷新逻辑

Umami 提供了一个「分享」功能——在 Umami 后台创建一个分享链接，会得到一个 `shareId`。访问 `/api/share/{shareId}` 即可获取一个临时 Token，后续请求携带 `x-umami-share-token` 头即可查询统计数据。

**关键点**：Share Token 只能查询公开数据，无法修改任何配置，安全性远高于管理员 Token。整个流程只需一个 `shareId`，无需暴露任何凭证。

## 二、配置

在配置文件中填入 Umami 信息和 Share ID：

```typescript title="src/config/analyticsConfig.ts"
export const analyticsConfig = {
  umamiAnalytics: {
    websiteId: "xxxx",                          // 站点 ID
    scriptUrl: "https://umami.example.com/umami.js",
    shareId: "xxxx",                             // 公开分享 ID
    shareApiBase: "https://umami.example.com",
    trackOutboundLinks: true,
    collectWebVitals: true,
  },
};
```

`shareId` 从 Umami 后台的「分享」功能获取，`shareApiBase` 是你的 Umami 实例地址。

