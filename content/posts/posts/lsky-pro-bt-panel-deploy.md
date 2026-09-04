---
title: 自建图床：基于宝塔部署兰空图床
description: 详解如何使用宝塔面板高效部署 Lsky Pro 兰空图床，涵盖环境检查、权限设置及常见坑点避让。
date: 2025-11-09
updated: 2025-11-09
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Lsky Pro, 宝塔面板, 图床]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

兰空图床是一个开源的图床，使用php编写，目前主要是使用其强大的系统后台，结合本地的minio去搭建一个线上图库。这里使用的是Lsky Pro+(付费版本)。

![](./images/baota-depoy-lskypro-824310.webp)

兰空图床官网：[Lsky](https://www.lsky.pro/)

官方文档：[Lsky Pro+文档](https://docs.lsky.pro/)
