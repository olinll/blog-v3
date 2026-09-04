---
title: Beszel 服务器监控工具部署指南
description: 介绍 Beszel 监控工具的 Hub 和 Agent 部署方式，支持 Docker 和二进制两种方式，可监控服务器资源、Docker、Systemd、S.M.A.R.T.、GPU 等。
date: 2026-02-11
updated: 2026-02-11
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [监控, Homelab, Docker]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

Beszel 是一款服务监控程序，分为 **Hub（管理端）** 和 **Agent（监控节点）** 两个组件，可监控服务器资源、Docker、Systemd、S.M.A.R.T.、GPU 等。

官网：[beszel.dev](https://beszel.dev/zh/)

## 部署 Hub

### Docker Compose

::alert{type="info"}

Docker Compose 安装与使用参见：[Docker Compose 安装配置](/posts/docker-compose-setup///)

::

```yaml [docker-compose.yml]
services:
  beszel:
    image: henrygd/beszel
    container_name: beszel
    restart: unless-stopped
    ports:
      - 8090:8090
    volumes:
      - ./beszel_data:/beszel_data
```

### 二进制部署

```bash
# 一键安装
curl -sL https://get.beszel.dev/hub -o /tmp/install-hub.sh && chmod +x /tmp/install-hub.sh && /tmp/install-hub.sh

# 配置 Systemd 服务
cat > /etc/systemd/system/beszel.service << 'EOF'
[Unit]
Description=Beszel Hub
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=3
User=root
WorkingDirectory=/opt/beszel
ExecStart=/opt/beszel/beszel serve --http "0.0.0.0:8090"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now beszel
```

## 部署 Agent

在 Hub 页面添加客户端后，复制对应命令执行即可。

### Docker Compose

::alert{type="info"}

挂载 `docker.sock:ro` 为只读模式，但仍可枚举宿主机上的容器信息。如需更高安全性，可考虑使用 Docker Socket Proxy。

::

```yaml [docker-compose.yml]
services:
  beszel-agent:
    image: henrygd/beszel-agent
    container_name: beszel-agent
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./beszel_agent_data:/var/lib/beszel-agent
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      LISTEN: 45876
      KEY: "<公钥>"
      HUB_URL: "http://<hub-ip>:8090"
      TOKEN: "<令牌>"
```

## 常见问题

### SMART 监控 UNKNOWN

确保 `smartctl` 已安装：

```bash
apt install smartmontools
smartctl --scan
```

Docker 方式需切换 `:alpine` 镜像并添加设备权限：

```yaml
beszel-agent:
  image: henrygd/beszel-agent:alpine
  devices:
    - /dev/sda:/dev/sda
    - /dev/nvme0:/dev/nvme0
  cap_add:
    - SYS_RAWIO
    - SYS_ADMIN
```

### 监控其他磁盘

```yaml
volumes:
  - /mnt/disk1/.beszel:/extra-filesystems/sdb1:ro
```

二进制方式在 systemd 服务中添加：

```ini
[Service]
Environment="EXTRA_FILESYSTEMS=sdb,sdc1"
```

### 手动部署Agent

```bash
# 下载文件
curl -sL "https://github.com/henrygd/beszel/releases/latest/download/beszel-agent_$(uname -s)_$(uname -m | sed -e 's/x86_64/amd64/' -e 's/armv6l/arm/' -e 's/armv7l/arm/' -e 's/aarch64/arm64/').tar.gz" | tar -xz -O beszel-agent | tee ./beszel-agent >/dev/null && chmod +x beszel-agent

# 运行命令
./beszel-agent -listen "45876" -key "ssh-ed25519 xxxxx"  -t "df0-xxx-3a3b-xxx" -url "http://xx.xx.xx.xx:8090" --china-mirrors

# 服务配置
#/etc/systemd/system/beszel-agent.service

cat > /etc/systemd/system/beszel-agent.service << 'EOF'
[Unit]
Description=Beszel Agent Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/root/beszel-agent -listen 45876 -key "ssh-ed25519 xxxxx" -t "df0-8287837bcd8-3a3b-1b8209ab7e" -url "http://xx.xx.xx.xx:8090" --china-mirrors
Restart=always
RestartSec=10
WorkingDirectory=/root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF


# 重新加载 systemd 配置
systemctl daemon-reload

# 启用服务（开机自启）
systemctl enable beszel-agent

# 启动服务
systemctl start beszel-agent

# 查看状态
systemctl status beszel-agent

# 查看日志
journalctl -u beszel-agent -f

```
