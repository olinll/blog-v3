---
title: iStoreOS 安装 OpenClash 配置旁路由
description: 在 iStoreOS 上安装 OpenClash 客户端，将其配置为旁路由，解决 Docker 拉取镜像、GitHub 访问等网络问题。
date: 2025-07-20
updated: 2026-06-27 15:16:40
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [网络]
tags: [iStoreOS, OpenClash]
---

在 Linux 系统或容器中无法安装科学上网软件时，可以搭建旁路由并将网关指向它来解决网络访问问题。

- [iStoreOS](https://site.istoreos.com/)：功能丰富的路由存储系统
- [OpenClash](https://github.com/vernesong/OpenClash)：运行在 OpenWrt 上的 Clash 客户端
- [Clash 内核（mihomo）](https://github.com/MetaCubeX/mihomo)

## 安装 OpenClash

从 [OpenClash Releases](https://github.com/vernesong/OpenClash/releases) 下载最新版本的 `.ipk` 或 `.apk` 文件，上传到路由器 `/tmp/` 目录后执行：

```shell
# iptables 版本
opkg update
opkg install bash iptables dnsmasq-full curl ca-bundle ipset ip-full \
  iptables-mod-tproxy iptables-mod-extra ruby ruby-yaml \
  kmod-tun kmod-inet-diag unzip luci-compat luci luci-base
opkg install /tmp/openclash.ipk
```

```shell
# nftables 版本
opkg update
opkg install bash dnsmasq-full curl ca-bundle ip-full ruby ruby-yaml \
  kmod-tun kmod-inet-diag unzip kmod-nft-tproxy luci-compat luci luci-base
opkg install /tmp/openclash.ipk
```

安装完成后刷新网页即可在菜单中看到 OpenClash。

## 配置

::alert{type="info"}

仅当在线下载内核失败时才需要手动下载。手动下载 [mihomo 内核](https://github.com/MetaCubeX/mihomo/releases) 后，解压并将二进制文件命名为 `clash_meta` 放入 `/etc/openclash/core/` 目录。

::

插件启动前需确认 Clash 内核已安装。若无法在线下载内核，可手动下载 [mihomo 内核](https://github.com/MetaCubeX/mihomo/releases)，解压后将二进制文件命名为 `clash_meta` 并放入 `/etc/openclash/core/` 目录。

配置订阅链接后启动 OpenClash，将其他设备的网关指向此路由器 IP 即可实现旁路由模式。
