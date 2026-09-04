---
title: 使用 Squid 为内网服务器搭建 HTTP 代理
description: 在有网络的边缘服务器上安装 Squid 代理，让无公网访问的内网机器通过代理完成软件安装与网络请求。
date: 2024-07-20 09:48:41
updated: 2026-06-27 09:48:41
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Squid, 代理, 网络]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

::alert{type="info"}

Squid 通常部署在已完成初始化的 CentOS 服务器上，初始化步骤参见：[CentOS 安装与初始化配置](/posts/centos-install-config)

::

在实际运维中，经常遇到部分服务器没有公网访问权限的情况。此时可以找一台同时接入局域网和互联网的机器，安装 Squid 作为代理服务器，让内网机器借道访问外网。

## 一、安装（在有网络的服务器上）

```bash
# 安装 Squid
yum install -y squid

# 启动并设置开机自启
systemctl start squid
systemctl enable squid
```

## 二、配置 Squid

```bash
# 编辑配置文件
vim /etc/squid/squid.conf
```

找到所有 `http_access deny` 行并注释掉，然后添加：

```bash [/etc/squid/squid.conf]
# 允许所有来源访问
http_access allow all
```

```bash
# 重启使配置生效
systemctl restart squid
```

Squid 默认监听 **3128** 端口。

## 三、在无网络的服务器上使用代理

```bash
# 配置 HTTP/HTTPS 代理（仅当前终端会话有效）
export http_proxy=http://192.168.0.217:3128
export https_proxy=http://192.168.0.217:3128

# 验证配置
echo $http_proxy
echo $https_proxy

# 测试是否生效
curl -I https://www.baidu.com
```

::alert{type="warning"}

`export` 设置的代理仅对当前 Shell 会话有效，**不能使用 `sudo` 命令**（sudo 不会继承普通用户的环境变量）。

如需 `yum` 通过代理安装软件，请直接在 root 用户下设置，或在 `/etc/yum.conf` 中配置 `proxy`。

::

### 在 yum.conf 中永久配置代理

```bash
vim /etc/yum.conf

# 添加以下行
proxy=http://192.168.0.217:3128
```
