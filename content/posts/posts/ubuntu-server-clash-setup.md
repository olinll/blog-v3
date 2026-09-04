---
title: 如何在 Ubuntu Server 上快速部署 Clash
description: 在没有图形界面的 Ubuntu Server 下，通过 Mihomo (Clash Meta) 二进制快速搭建代理，临时解决 GitHub 下载慢、外网 API 不通的问题。
date: 2026-03-10
updated: 2026-03-10
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [网络]
tags: [Ubuntu, Clash, Clash Meta, Mihomo, Proxy, Linux]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

在维护 Linux 服务器时，经常会遇到下载 GitHub 资源缓慢或无法访问外网 API 的情况。本文介绍一种**轻量、临时、可随时清理**的代理方案。

::alert{type="info" title="关于内核"}

本文使用的 Mihomo 是原 Clash.Meta 的后继项目。自 2023 年原版 Clash (clash-premium) 停止更新后，Mihomo 接手了 Meta 分支的维护，是目前社区最主流的 Clash 内核实现。下文中为了书写方便，仍统一称其为 "Clash"。

::

## 1. 环境准备

首先，确认你的服务器 CPU 架构：

```bash
uname -m
```

- 如果是 `x86_64`，下载 **amd64** 版本。
- 如果是 `aarch64`（如树莓派、甲骨文 ARM），下载 **arm64** 版本。

## 2. 下载并解压

以最新的 **Mihomo (Clash Meta)** 内核为例，执行以下命令：

```bash
# 下载二进制文件（以 amd64 为例）
wget https://github.com/MetaCubeX/mihomo/releases/download/v1.18.1/mihomo-linux-amd64-v1.18.1.gz

# 解压并重命名
gunzip mihomo-linux-amd64-v1.18.1.gz
mv mihomo-linux-amd64-v1.18.1 clash
chmod +x clash
```

## 3. 配置 Clash 运行环境

Clash 运行至少需要两个文件：执行程序 `clash` 和配置文件 `config.yaml`。

### 3.1 准备配置文件

订阅链接返回的本身就是一个 YAML 文档，直接把内容下载到当前目录即可：

```bash
curl -o config.yaml '你的订阅 URL'
```

::alert{type="warning" title="订阅 URL 必须用单引号"}

务必用**单引号**包裹订阅 URL，否则其中的 `&`、`?` 等特殊字符会被 shell 解析，导致参数截断或后台执行。

::

### 3.2 确认端口信息

在你的配置中，关键参数如下：

- **混合代理端口 (Mixed Port)**：`7890`（同时支持 HTTP / SOCKS）
- **API 访问密钥 (Secret)**：`603705`（用于 Clash REST API 的 Bearer 鉴权，不是网页登录密码）

## 4. 启动运行

建议使用 `nohup` 让其在后台运行，即便断开 SSH 也不会停止：

```bash
# 在当前目录下启动，指定配置文件
nohup ./clash -f config.yaml -d . > clash.log 2>&1 &
```

- **查看运行日志**：`tail -f clash.log`
- **停止运行**：`pkill -f 'clash -f config.yaml'`

::alert{type="tip" title="为什么不用 pkill clash"}

如果系统里还有其他含 `clash` 字样的进程（如 `clash-verge`、旧版 `clash-premium`），`pkill clash` 会一并误杀。通过 `-f` 精确匹配启动参数更安全。

::

::alert{type="warning" title="日志会无限增长"}

上面的命令会让 `clash.log` 一直追加写入，长期运行可能吃光磁盘。临时使用场景下用完清理即可；长期运行请使用下面第 7 节的 systemd 方案（交给 journald 自动管理），或给 `clash.log` 配一条 `logrotate` 规则。

::

## 5. 激活服务器代理

Clash 运行后，你需要告诉系统将流量转发到 `7890` 端口。

### 5.1 临时激活（当前会话有效）

```bash
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890
```

### 5.2 配置 no_proxy 白名单

配完代理后，访问本机或内网服务也会被转发到 Clash，轻则走外网绕一圈，重则超时失败。需要把这些流量排除掉：

```bash
export no_proxy="localhost,127.0.0.1,::1"
# 如果还有内网服务、K8s Service，按需追加域名后缀或显式 IP
export no_proxy="$no_proxy,.svc,.cluster.local,192.168.1.100"
```

::alert{type="tip" title="关于 CIDR"}

不同工具对 `no_proxy` 中 CIDR 网段的支持差异较大（如 `curl` 不支持 `10.0.0.0/8` 这种写法），推荐使用**域名后缀**（`.internal`、`.svc`）或**显式 IP** 更可靠。

::

### 5.3 验证代理是否真正生效

仅凭 `curl https://www.google.com` 返回 200 并不能证明代理生效——某些地区裸连 Google 也能通。可靠的做法是**比对出口 IP**：

```bash
# 不走代理
unset http_proxy https_proxy
curl -s https://ipinfo.io/ip

# 走代理
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890
curl -s https://ipinfo.io/ip
```

两次返回的 IP 应当不同，且第二次应为你订阅节点所在地的 IP。若两次一致，说明流量没走 Clash，回头检查端口监听和进程状态。

## 6. 常用工具的代理配置

`http_proxy` / `https_proxy` 环境变量只对**显式读取环境变量**的程序生效（curl、wget、pip、npm 等）。下面这些工具需要单独配置。

### 6.1 Git

```bash
# 推荐：仅对 GitHub 走代理，避免访问国内 Git 仓库（Gitee、Coding）时误走代理
git config --global http.https://github.com.proxy http://127.0.0.1:7890

# 或全局代理
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 6.2 APT

APT **不读** `http_proxy` 环境变量，需要写配置文件：

```bash
sudo tee /etc/apt/apt.conf.d/99proxy <<EOF
Acquire::http::Proxy "http://127.0.0.1:7890";
Acquire::https::Proxy "http://127.0.0.1:7890";
EOF
```

不用时直接 `sudo rm /etc/apt/apt.conf.d/99proxy` 即可恢复。

### 6.3 Docker

Docker 代理分两层：

**让 `docker pull` 走代理**（作用于 Docker daemon）：

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf <<EOF
[Service]
Environment="HTTP_PROXY=http://127.0.0.1:7890"
Environment="HTTPS_PROXY=http://127.0.0.1:7890"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

**让容器内进程走代理**：需要配置 `~/.docker/config.json` 的 `proxies` 段，或在 `docker run` 时通过 `-e HTTP_PROXY=...` 传入。

## 7. 进阶：注册为 systemd 服务

`nohup` 适合临时验证，长期运行推荐托管给 systemd：开机自启、崩溃自拉、日志统一交给 journald。

### 7.1 移动文件到标准位置

```bash
sudo mkdir -p /etc/clash
sudo mv clash /usr/local/bin/clash
sudo mv config.yaml /etc/clash/
```

### 7.2 创建 systemd 单元

新建 `/etc/systemd/system/clash.service`：

```ini
[Unit]
Description=Clash (Mihomo) Proxy Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/clash -f /etc/clash/config.yaml -d /etc/clash
Restart=on-failure
RestartSec=5s
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
```

### 7.3 启用并管理

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now clash      # 开机自启 + 立即启动

sudo systemctl status clash            # 查看状态
sudo systemctl restart clash           # 重启
sudo journalctl -u clash -f            # 实时日志
```

::alert{type="tip"}

用 systemd 管理后，`nohup`、`pkill` 相关命令都可以忘掉了。日志由 journald 自动轮转，不用担心磁盘被写满。

::

## 8. 版本升级

Mihomo 迭代频繁，升级只需替换二进制：

```bash
# 1. 在 https://github.com/MetaCubeX/mihomo/releases 查看最新版本
# 2. 下载并覆盖
wget https://github.com/MetaCubeX/mihomo/releases/download/v1.19.0/mihomo-linux-amd64-v1.19.0.gz
gunzip mihomo-linux-amd64-v1.19.0.gz
sudo mv mihomo-linux-amd64-v1.19.0 /usr/local/bin/clash
sudo chmod +x /usr/local/bin/clash

# 3. 重启服务（systemd 方案）
sudo systemctl restart clash
```

升级前建议备份一份旧二进制，方便回滚。

## 9. 常见故障排查

| 现象 | 可能原因 | 对策 |
|------|---------|------|
| `curl: (7) Failed to connect to 127.0.0.1:7890` | Clash 进程没起来 | `ps aux \| grep clash` 确认进程；查看 `clash.log` 或 `journalctl -u clash` 是否有报错 |
| 日志反复刷 `no available proxies` | 订阅节点全部失联，或策略组未选中节点 | 更新订阅；检查 `config.yaml` 中 `proxy-groups` 配置 |
| 代理后仍访问不通境外站点 | DNS 污染（本地解析到被污染 IP 后再走代理） | 在 `config.yaml` 启用 `dns.enhanced-mode: fake-ip` |
| 启动报 `bind: address already in use` | 7890 / 9090 端口被其他进程占用 | `ss -lntp \| grep 7890` 定位占用进程并释放 |
| apt / docker 不走代理 | 这两者不读 `http_proxy` 环境变量 | 按本文第 6 节配置对应的代理方式 |
| `curl -s https://ipinfo.io/ip` 两次返回相同 | 流量没走 Clash | 检查环境变量是否生效（`echo $http_proxy`）、Clash 是否在监听 7890 |

## 安全小贴士

::alert{type="warning" title="端口暴露风险"}

真正决定 7890 端口是否"裸奔"的，不是配置里的 `allow-lan`，而是 **`bind-address` 的监听地址 + 云厂商安全组规则**。

如果 Clash 监听在 `0.0.0.0:7890` 且云安全组对公网放行，任何人都能拿你这台机器当免费跳板。建议把 `bind-address` 显式设为 `127.0.0.1`，或在云安全组里把 7890 锁死为仅本机 / 可信 IP 可访问。

::

::alert{type="tip" title="任务结束后的清理"}

临时使用完毕后，别忘了执行 `unset http_proxy https_proxy no_proxy` 取消环境变量，并用 `pkill -f 'clash -f config.yaml'`（或 `sudo systemctl stop clash`）彻底关闭程序，避免遗留代理影响后续操作。

::

::alert{type="info" title="作者注"}

本教程适用于 Ubuntu Server 20.04 / 22.04 / 24.04 等主流 Linux 发行版。

::
