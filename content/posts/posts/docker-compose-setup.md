---
title: Docker Compose 工具使用教程
description: Docker容器的Compose工具
date: 2022-09-18 13:25:00
updated: 2026-06-27 13:25:00
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Docker]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

Compose 是用于定义和运行多容器 Docker 应用程序的工具。通过 Compose，您可以使用 YML 文件来配置应用程序需要的所有服务。然后，使用一个命令，就可以从 YML 文件配置中创建并启动所有服务。  

::alert{type="info"}

`docker-compose`是一个已不再维护的旧版本（V1），目前推荐使用`docker compose`是集成到 Docker CLI 中的新版本（V2），也是现在官方推荐使用的命令

|对比维度|docker-compose (旧版 V1)|docker compose (新版 V2)|
| --- | --- | --- |
|发布时间与状态|2014年首次发布，目前已停止维护。|2020年宣布，是当前活跃的版本，也是未来趋势。|
|技术实现|使用 Python 编写。|使用 Go 语言编写，与 Docker CLI 相同。|
|命令形式|独立的命令，使用连字符：docker-compose。|是 docker 命令的一个子命令，使用空格：docker compose。|
|安装与集成|需要单独安装，是一个独立的二进制文件。|已集成到 Docker Engine 或作为 CLI 插件，通常随 Docker 一起安装。|
|Compose 文件|需要在 YAML 文件中指定 version 字段（如 version: '3.8'）。|推荐忽略 version 字段，直接使用最新的 Compose 规范（services 顶级字段）。|

::

## 一、安装旧版（不推荐）

Linux 上我们可以从 Github 上下载它的二进制包来使用，最新发行的版本地址：  https://github.com/docker/compose/releases

运行以下命令以下载 Docker Compose 的当前稳定版本：  

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v5.0.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

要安装其他版本的 Compose，请替换v5.0.1

```bash
# 将可执行权限应用于二进制文件
sudo chmod +x /usr/local/bin/docker-compose

# 创建软链（可选）
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 测试是否安装成功
docker-compose version
cker-compose version 1.24.1, build 4667896b
```

## 二、安装新版

由于新版的Compose工具集成在Docker的Ctl里面，所以只需正常安装Docker后使用即可，下面是常见的Linux发行版的Docker安装方式：

- 「**通用**」：轩辕镜像站一键安装脚本：`bash <(wget -qO- https://xuanyuan.cloud/docker.sh)`
- [Docker 安装与配置指南（CentOS / Ubuntu / Alpine）](/posts/docker-guide///)
