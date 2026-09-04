---
title: 使用CloudFlare优选任何网站！
date: 2026-06-13 19:54:38
updated: 2026-06-21 16:57:55
description: 通过 Worker 反代为网站做 IP 分流优选，提高国内访问速度与可用性
image: https://img.olinl.com/file/post-img/cf-fastip/0001.webp
categories: [技术]
tags:
  - CloudFlare
draft: false
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

::alert{type="info" title="> 本文部分内容由 AI 辅助整理，已结合实际操作进行校验，请根据自身环境谨慎使用。"}

::


优选前：
![优选前 ITDOG IP数量](https://img.olinl.com/file/post-img/cf-fastip/0002.webp)
优选后：
![优选后 ITDOG IP数量](https://img.olinl.com/file/post-img/cf-fastip/0001.webp)

## 优选原理

简单说，Cloudflare 的小黄云会同时托管两件事——DNS 解析层和路由规则层；只要开启小黄云，你就没法单独改解析、指向更快的节点。而 Worker 路由的出现，让规则层和解析层都可以自己配置，这就是优选能落地的关键。

