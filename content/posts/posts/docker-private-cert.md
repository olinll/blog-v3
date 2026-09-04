---
title: Docker 配置私服自签名证书信任
description: 介绍如何在 Linux 和 Windows 客户端上配置 Docker 信任私有镜像仓库的自签名 SSL 证书，解决拉取推送时的证书验证失败问题。
date: 2025-09-21 14:27:16
updated: 2026-06-27 14:27:16
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Docker, Harbor, SSL]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

在内网部署私有镜像仓库（如 Harbor）时，通常使用自签名证书。客户端需要手动信任该证书，否则 `docker push` / `docker pull` 会报证书验证失败。

> 如果你使用 Harbor 作为私服，参见 [Harbor 私有镜像仓库安装指南](/posts/harbor-install)

## Linux

```bash
# 1. 获取 Harbor 服务器的证书
openssl s_client -connect harbor.example.com:443 -showcerts </dev/null 2>/dev/null \
  | openssl x509 -outform PEM > harbor-cert.pem

# 2. 创建 Docker 证书目录
sudo mkdir -p /etc/docker/certs.d/harbor.example.com

# 3. 复制证书到 Docker 信任目录
sudo cp harbor-cert.pem /etc/docker/certs.d/harbor.example.com/ca.crt

# 4. 同时添加到系统 CA 证书（推荐）
sudo cp harbor-cert.pem /usr/local/share/ca-certificates/harbor.example.com.crt
sudo update-ca-certificates
```

::alert{type="info"}

重启 Docker 会短暂停止所有正在运行的容器，请在维护窗口内操作。

::

```bash
# 5. 重启 Docker 服务
sudo systemctl restart docker
```

## Windows

在 Git Bash 中执行以下命令获取证书：

```bash
echo | openssl s_client -connect harbor.example.com:443 -servername harbor.example.com 2>/dev/null \
  | openssl x509 > harbor-ca.crt
```

然后将 `harbor-ca.crt` 安装到系统受信任的根证书：

1. 双击 `harbor-ca.crt`
2. 点击 **安装证书...**
3. 选择 **本地计算机** → 下一步
4. 选择 **将所有证书放入下列存储** → 浏览
5. 选择 **受信任的根证书颁发机构** → 确定 → 下一步 → 完成
6. 重启 Docker Desktop
