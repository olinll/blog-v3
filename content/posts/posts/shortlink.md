---
title: 'Firefly 魔改：基于 Astro redirects 的短链接系统'
date: 2026-07-04 17:30:50
updated: 2026-07-22 19:30:00
description: '基于 Astro 内置 redirects 的轻量短链系统，让访客可以轻松记住你的链接。'
image: https://img.olinl.com/file/post-img/shortlink/cover.webp
categories: [Firefly]
tags: [Firefly, 博客, 二开, Astro]
draft: false
pinned: false
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

::alert{type="info" title="> 本文部分内容由 AI 辅助整理，已结合实际操作进行校验，请根据自身环境谨慎使用。"}

::


有些页面路径太长了，比如「QQ 交流群」那篇文章的链接是 `/posts/qq-group//`，分享给别人时不太方便。如果能有一个 `/q` 短链接跳转过去就好了。

本文介绍如何用 Astro 自带的 `redirects` 功能，搭建一个零依赖的短链接/重定向系统。

## 一、设计思路

核心思路很简单：利用 Astro 的 `redirects` 配置项，在构建时生成静态重定向页面。

