---
title: 为了护住我那几块硬盘：我的 UPS 监控“三部曲
description: 从 PVE 备注里的简陋脚本，到独立的 Node.js Web 监控页，记录一个 HomeLab 玩家的 UPS 监控进阶之路。
date: 2026-04-01
updated: 2026-04-01
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [UPS, HomeLab, Node.js, PVE, NUT]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

搞 HomeLab 的人，最后都会殊途同归地买台 UPS。毕竟看着那几块存满了“学习资料”的硬盘，谁也不想在停电时赌一把运气。

但 UPS 买回来后，怎么看状态就成了个问题。为了能随时随地盯一眼电量，我前前后后折腾了三个版本。

## 🛠️ 从“能看”到“优雅”：三个版本的演进

### v1.0：PVE 备注栏的“暴力补丁”

最开始的想法特别简单直接：既然我天天盯着 PVE 后台，那把 UPS 信息塞进 PVE 不就行了？

于是我写了个 Python 脚本，定时抓取 `upsc` 的数据，然后通过 PVE 的 API 强行写进节点的“备注”里。

* **现状**：能看，但丑。备注栏那一堆乱糟糟的字符，每次看都觉得自己像个原始人。

> ![v1 版本 PVE 节点备注展示截图](./images/ups-v1-pve-note.webp)

### v2.0：魔改 PVE 的状态面板

后来不满足于备注栏，我开始打 PVE 源码的主意。通过修改 PVE 的 ExtJS 文件，我强行在宿主机的状态监控页里插了一个 UPS 的展示位。

* **现状**：看着很高级，和系统融为一体。但有个致命伤：只要 PVE 一更新，改动就全没了，得重新修代码，简直是体力活。

> ![v2 版本魔改 PVE 状态页截图](./images/ups-v2-pve-ui.webp)

### v3.0：独立 Web 版（UPS Web）

也就是这次要分享的终极方案：**不依赖宿主机系统，做一个彻底独立的监控页。**

这一次我用 Node.js 重新写了一套逻辑，最核心的一点是：**我用纯 JS 实现了 NUT（Network UPS Tools）客户端协议。** 这意味着它不再需要你安装任何 `upsc` 命令，只要能跑 Node 或 Docker 的地方，它就能直接和你的 UPS 服务器对话。

> ![v3 版本独立 Web 监控页截图](./images/ups-v3-pve-ui.webp)


## 📦 部署指南

为了方便复刻，我将 v3.0 整理成了标准项目。推荐使用 Docker 部署，以保持环境整洁。

### 方法一：使用 Docker（推荐）

为了确保你在网页上修改的配置不会因为容器重启而丢失，请务必挂载配置文件：

```bash
# 创建配置存储文件
touch config.json

# 运行容器
docker run -d \
  --name ups-web \
  -p 8765:8765 \
  -v $(pwd)/config.json:/app/config.json \
  -e HOST=0.0.0.0 \
  -e PORT=8765 \
  --restart always \
  ups-web
```

### 方法二：源码运行

如果你想直接在 Node.js 环境下跑：

```bash
git clone https://github.com/olinll/nut-guard.git
cd nut-guard
npm install
npm start
```


## ⚠️ 安全与避坑提醒

::alert{type="warning"}

该项目暂未内置登录鉴权，暴露到公网存在安全风险。建议配合 Nginx Access List 限制访问，或仅在局域网内使用。

::

1.  **权限控制**：该项目暂未内置登录鉴权，建议配合 **Nginx Proxy Manager** 加上 Access List，或者仅在局域网内使用。
2.  **配置冲突**：通过 URL 参数 `?ip=10.0.0.1` 临时查看时，不会改写 `config.json`。
3.  **持久化**：如果是在 PVE 容器（LXC）里跑，记得开启相应的网络权限。

## 🎬 结语

从最开始在备注栏抠字，到如今拥有一个独立的监控大屏，这不仅是为了护住那几块硬盘，更是折腾 HomeLab 的乐趣所在。

目前项目已在 GitHub 开源：

[olinll/nut-guard](https://github.com/olinll/nut-guard)
