---
title: "MinIO 存储桶安全策略配置"
description: "通过配置 MinIO 存储桶 JSON 策略，限制 ListBucket 等危险操作，防止存储桶文件目录泄露。"
date: 2026-01-21 00:00:00
updated: 2026-01-21 00:00:00
categories:
  - 技术
tags:
  - MinIO
  - 对象存储
  - 安全
type: tech
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

::alert{type="warning"}

将存储桶配置为 `public` 后，任何人均可通过 HTTP 请求直接上传、删除和列目录。应通过自定义策略严格限制操作权限。

::

将 MinIO 存储桶配置为 `public` 后，任何人均可通过 HTTP 请求直接操作存储桶内容。应通过自定义存储桶策略限制操作权限。

> 尚未部署 MinIO？参见
>
> ::link-card
> ---
> title: MinIO 对象存储安装指南
> link: /posts/minio-install
> ---
> ::

## 问题原因

MinIO 的 `public` 策略等同于完全开放，包括列目录（`s3:ListBucket`）、上传（`s3:PutObject`）、删除（`s3:DeleteObject`）等操作均无限制。

## 推荐策略：仅允许公共读

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

## 仅禁止列目录

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
