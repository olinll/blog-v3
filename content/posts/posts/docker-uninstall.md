---
title: Docker 卸载指南
description: 介绍在 Ubuntu 和 CentOS/RHEL 系统上完整卸载 Docker 的步骤，包括停止服务、移除软件包、清理残留文件和目录。
date: 2026-02-01
updated: 2026-02-01
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Docker, 运维]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

::alert{type="warning"}

卸载前请确认是否需要保留容器、镜像、卷或配置文件，以下操作将**永久删除**所有 Docker 数据。

::

## Ubuntu / Debian

```bash
# 1. 停止 Docker 相关服务
sudo systemctl stop docker docker.socket containerd.service

# 2. 移除 Docker 包
sudo apt purge -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-scan-plugin
sudo apt autoremove -y

# 3. 删除残留文件与目录
sudo rm -rf /var/lib/docker /var/lib/containerd
sudo rm -rf /etc/docker /etc/default/docker
rm -rf ~/.docker
sudo rm -rf /var/log/docker /var/log/containerd
```

## CentOS / RHEL

```bash
# 1. 停止服务
sudo systemctl stop docker containerd
sudo systemctl disable docker containerd

# 2. 移除 Docker 包
sudo yum remove -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo yum autoremove -y

# 3. 清理残留文件
sudo rm -rf /var/lib/docker /var/lib/containerd /etc/docker ~/.docker
sudo rm -rf /usr/lib/systemd/system/docker.service /usr/lib/systemd/system/docker.socket
sudo systemctl daemon-reload
```
