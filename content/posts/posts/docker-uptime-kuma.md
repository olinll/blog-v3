---
title: Docker 部署 Uptime Kuma 监控服务
description: 使用 Docker Compose 部署 Uptime Kuma 开源监控工具，支持 HTTP、Ping、TCP 等多种监控方式，故障时及时通知。
date: 2025-10-10 15:16:40
updated: 2026-06-27 15:16:40
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Docker, 监控, HomeLab]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

Uptime Kuma 是一款开源的自托管监控工具，可实时监测网站或服务状态，支持 HTTP、Ping、TCP 等多种监控方式，故障时发送通知。

GitHub：[louislam/uptime-kuma](https://github.com/louislam/uptime-kuma)

## 部署

```yaml [docker-compose.yml]
services:
  uptime-kuma:
    image: louislam/uptime-kuma:2
    container_name: uptime-kuma
    volumes:
      - ./data:/app/data
    ports:
      - 3001:3001
    restart: always
    networks:
      - app-net

networks:
  app-net:
    external: true
```
