---
title: Docker 常用命令速查
description: 整理 Docker 日常运维中最常用的命令，涵盖容器生命周期管理、镜像操作、日志查看、镜像导入导出等核心操作。
date: 2026-01-28
updated: 2026-01-28
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Docker]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## systemctl 服务命令

```bash
# 启动
systemctl start docker
# 停止
systemctl stop docker
# 查看状态
systemctl status docker
# 开机自启
systemctl enable docker
```

## docker run

```bash
docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
```

常用参数：

- `-d`：后台运行容器并返回容器 ID
- `-it`：交互式运行，分配伪终端
- `--name`：指定容器名称
- `-p`：端口映射，格式 `host_port:container_port`
- `-v`：挂载卷，格式 `host_dir:container_dir`
- `--rm`：容器停止后自动删除
- `-e`：设置环境变量
- `--network`：指定网络模式
- `--restart`：重启策略（`no` / `on-failure` / `always` / `unless-stopped`）

## docker exec

```bash
# 进入容器交互式终端
docker exec -it my_container /bin/bash
```

## docker ps

```bash
docker ps        # 运行中的容器
docker ps -a     # 所有容器
docker ps -q     # 只显示容器 ID
```

## docker logs

```bash
docker logs my_container
docker logs -f my_container       # 实时跟随
docker logs --tail 10 my_container # 最后 10 行
```

## docker images

```bash
docker images
docker images -q
```

## docker pull / tag / push

```bash
docker pull nginx:latest
docker tag myapp:latest harbor.example.com/myproject/myapp:v1.0.0
docker push harbor.example.com/myproject/myapp:v1.0.0
```

## docker save / load

```bash
docker save -o myimage.tar myimage:latest
docker load -i myimage.tar
```
