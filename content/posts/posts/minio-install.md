---
title: MinIO 对象存储部署与安全策略指南
description: 介绍使用 Docker Compose 和二进制文件部署 MinIO 最后免费版本，并配置存储桶最小权限策略以防止目录泄露。
date: 2026-01-20
updated: 2026-01-20
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [MinIO, 对象存储, Docker, 安全]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

MinIO 是一个兼容 Amazon S3 接口的高性能开源对象存储服务，适合存储非结构化数据（图片、视频、备份文件等）。

::alert{type="warning"}

MinIO 从 `RELEASE.2025-04-22T22-12-26Z` 版本起转为收费授权，本文部署的是该最后免费版本。

::

官网：[https://www.minio.org.cn](https://www.minio.org.cn)

## 一、Docker Compose 部署（推荐）

```yaml [docker-compose.yaml]
services:
  minio:
    image: minio/minio:RELEASE.2025-04-22T22-12-26Z
    container_name: minio
    hostname: minio
    ports:
      - 9000:9000   # API
      - 9001:9001   # Console
    volumes:
      - ./data:/data
    environment:
      - MINIO_ROOT_USER=admin
      - MINIO_ROOT_PASSWORD=Aa123456
    restart: always
    command: server --address ':9000' --console-address ':9001' /data
    networks:
      - app-net

networks:
  app-net:
    external: true
```

::alert{type="warning"}

示例中的 `MINIO_ROOT_PASSWORD` 仅用于演示。生产环境必须改为长度至少 16 位的随机强密码。

::

## 二、二进制文件部署

二进制文件归档下载地址：[minio-archive](https://dl.min.io/server/minio/release/linux-amd64/archive/)

### 1. 下载并配置

```bash
wget https://dl.min.io/server/minio/release/linux-amd64/archive/minio.RELEASE.2025-04-22T22-12-26Z
mkdir -p /opt/minio
mv minio.RELEASE.2025-04-22T22-12-26Z /opt/minio/minio
chmod +x /opt/minio/minio
```

### 2. 创建配置文件

```bash [/opt/minio/minio.conf]
# 数据存放目录
MINIO_VOLUMES="/opt/minio/data"
# 端口配置：API:9000，Console:9001
MINIO_OPTS="--address :9000 --console-address :9001"
# 管理员账号
MINIO_ROOT_USER="admin"
MINIO_ROOT_PASSWORD="Aa123456"
```

### 3. 配置 Systemd 服务

```ini [/etc/systemd/system/minio.service]
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/opt/minio/minio

[Service]
User=root
Group=root
EnvironmentFile=/opt/minio/minio.conf
ExecStart=/opt/minio/minio server $MINIO_OPTS $MINIO_VOLUMES
Restart=always
LimitNOFILE=65536
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

### 4. 启动服务

```bash
systemctl daemon-reload
systemctl enable minio
systemctl start minio
systemctl status minio
journalctl -u minio.service -f
```

## 三、存储桶安全策略

::alert{type="warning"}

将存储桶配置为 `public` 后，任何人均可通过 HTTP 请求上传、删除或列出目录。应通过自定义策略严格限制操作权限。

::

### 仅允许公共读

以下策略允许任何人读取文件（`GetObject`），但禁止写入、删除和列目录：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::your-bucket-name/*"]
    },
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

### 仅禁止列目录

如果只需防止目录遍历，可单独添加以下 `Deny` 规则：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

将 `your-bucket-name` 替换为实际存储桶名称，然后在 MinIO Console 的 **Bucket → Access Policy** 中粘贴并保存即可。
