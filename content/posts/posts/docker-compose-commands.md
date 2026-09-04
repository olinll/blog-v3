---
title: Docker Compose 常用命令
description: 整理 Docker Compose 最常用的启动、停止、重建等命令，适合日常快速查阅。
date: 2026-01-29
updated: 2026-01-29
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Docker, Docker Compose]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

```bash
# 前台启动（查看日志输出）
docker-compose up

# 后台启动
docker-compose up -d

# 停止并移除容器
docker-compose down

# 重建镜像后启动
docker-compose up -d --build

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启指定服务
docker-compose restart <service>

# 进入容器
docker-compose exec <service> /bin/bash
```
