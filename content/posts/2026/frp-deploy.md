---
title: frp-deploy
description: 讲述关于frp-deploy的故事，并根据FRP、内网穿透、HomeLab给出网络。
date: 2026-06-27 15:31:19
updated: 2026-06-27 15:31:19
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [网络]
tags: [FRP, 内网穿透, HomeLab]
---


::alert{type="warning"}
服务端需要一台有公网 IP 的服务器。
:::

FRP 通过有公网 IP 的服务器将内网主机端口暴露到互联网。分为 **服务端（frps）** 和 **客户端（frpc）**，服务端需部署在有公网 IP 的机器上，客户端部署在内网主机上。

GitHub：[fatedier/frp](https://github.com/fatedier/frp)

## 下载

前往 Releases 页面下载对应系统的压缩包，Linux 选择 `frp_xxxx_linux_amd64.tar.gz`。

```bash
# 赋予执行权限
chmod +x frps frpc
```

## 配置文件

### 服务端（frps.toml）

::alert{type="warning"}

`auth.token` 和 `webServer.password` 必须修改为强随机值，弱凭据会导致隧道被未授权访问。

::

```toml
bindAddr = "0.0.0.0"
bindPort = 65001

transport.tls.force = true

auth.method = "token"
auth.token = "your-token"

# Dashboard
webServer.addr = "0.0.0.0"
webServer.port = 65002
webServer.user = "admin"
webServer.password = "your-password"
```

### 客户端（frpc.toml）

```toml
serverAddr = "your-public-ip"
serverPort = 65001

transport.tls.enable = true

auth.token = "your-token"

# 代理规则示例
[[proxies]]
name = "web80"
type = "tcp"
localIP = "127.0.0.1"
localPort = 80
remotePort = 80

[[proxies]]
name = "web443"
type = "tcp"
localIP = "127.0.0.1"
localPort = 443
remotePort = 443
```

## Systemd 服务管理

```bash
# frps 服务文件
cat > /etc/systemd/system/frps.service << 'EOF'
[Unit]
Description=frps
After=network.target

[Service]
TimeoutStartSec=30
ExecStart=/opt/frps/frps -c /opt/frps/frps.toml
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# frpc 服务文件
cat > /etc/systemd/system/frpc.service << 'EOF'
[Unit]
Description=frpc
After=network.target

[Service]
TimeoutStartSec=30
ExecStart=/opt/frpc/frpc -c /opt/frpc/frpc.toml
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now frps
systemctl status frps
```