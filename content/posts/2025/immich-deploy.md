---
title: Immich 图片管理软件部署备忘录
description: 记录 Immich 自托管照片管理软件的 Docker Compose 部署方式，支持 Intel 核显 OpenVINO 加速，以及中文地理编码和 CLIP 大模型配置。
date: 2025-10-09
updated: 2026-06-27 15:16:40
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Immich, Docker, HomeLab]
---

Immich 是一款自托管照片和视频管理软件，支持 Web、Android、iOS 多端同步，保护用户隐私。

官网：[immich.app](https://immich.app) | 安装文档：[docker-compose](https://immich.app/docs/install/docker-compose)


## 下载配置文件

```bash
wget -O docker-compose.yml https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
wget -O .env https://github.com/immich-app/immich/releases/latest/download/example.env
```

## docker-compose.yml（支持 Intel 核显 OpenVINO）

```yaml [docker-compose.yaml]
name: immich

services:
  immich-server:
    container_name: immich_server
    image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION:-release}
    devices:
      - /dev/dri:/dev/dri
    volumes:
      - ${UPLOAD_LOCATION}:/data
      - /etc/localtime:/etc/localtime:ro
      # 反向地理编码汉化
      - ./geodata-cn/geodata:/build/geodata
      - ./geodata-cn/i18n-iso-countries/langs:/usr/src/app/server/node_modules/i18n-iso-countries/langs
    env_file:
      - .env
    ports:
      - '2283:2283'
    depends_on:
      - redis
      - database
    restart: always

  immich-machine-learning:
    container_name: immich_machine_learning
    image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION:-release}-openvino
    devices:
      - /dev/dri:/dev/dri
    volumes:
      - model-cache:/cache
    env_file:
      - .env
    restart: always

  redis:
    container_name: immich_redis
    image: docker.io/valkey/valkey:9
    restart: always

  database:
    container_name: immich_postgres
    image: ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_DB: ${DB_DATABASE_NAME}
    volumes:
      - ${DB_DATA_LOCATION}:/var/lib/postgresql/data
    restart: always

volumes:
  model-cache:
```

## .env 配置

```bash [.env]
UPLOAD_LOCATION=./library
DB_DATA_LOCATION=./postgres
TZ=Asia/Shanghai
IMMICH_VERSION=v2
DB_PASSWORD=postgres
DB_USERNAME=postgres
DB_DATABASE_NAME=immich
```

::alert{type="info"}

使用国内镜像加速：

```bash
sed -i 's|ghcr\.io|ghcr.example.com|g' docker-compose.yml
sed -i 's|docker\.io|docker.example.com|g' docker-compose.yml
```

:::

## 扩展功能

- 中文地理编码：[ZingLix/immich-geodata-cn](https://github.com/ZingLix/immich-geodata-cn)
- 中文 CLIP 模型：参考 [Bilibili 教程](https://www.bilibili.com/opus/921308194821636097)