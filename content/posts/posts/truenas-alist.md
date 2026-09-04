---
title: 使用 TrueNAS 运行 Alist 容器
description: 介绍如何在 TrueNAS Scale 上通过自定义 Docker 容器运行 Alist，实现对 TrueNAS 存储文件的 Web 管理访问。
date: 2026-02-10
updated: 2026-02-10
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [虚拟化]
tags: [TrueNAS, Alist, Homelab, Docker]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

TrueNAS 是专注于存储的文件系统，仅提供 SMB、NFS、iSCSI 等协议，无 Web 文件管理界面。TrueNAS Scale 底层使用 Docker，可以部署自定义容器来弥补这一不足。

::alert{type="info"}

OpenList 官方文档已提供 TrueNAS 安装教程：[使用 TrueNAS Scale - OpenList 文档](https://doc.oplist.org/guide/installation/truenas)

::

## 使用镜像

本文使用 Alist v3.40.0-ffmpeg（Alist 被收购前的版本，已托管至阿里云镜像仓库）：

```
crpi-xntgazlqn787usm7.cn-shanghai.personal.cr.aliyuncs.com/olinl/alist:v3.40.0-ffmpeg
```

## TrueNAS 容器配置

在 TrueNAS Scale 的应用管理中添加自定义容器，填写以下信息：

| 配置项 | 值 |
|---|---|
| Repository | `crpi-xntgazlqn787usm7.cn-shanghai.personal.cr.aliyuncs.com/olinl/alist` |
| Tag | `v3.40.0-ffmpeg` |
| 宿主机端口 | `5244` |
| 容器端口 | `5244` |
| 容器挂载路径 | `/mnt/truenas` |
| 宿主机路径 | TrueNAS 存储路径（位于 `/mnt/` 下） |

::alert{type="tip"}

TrueNAS 的文件都在 `/mnt/` 下，Alist 可使用**本机存储**方式创建存储归档，直接访问 TrueNAS 的文件。

::
