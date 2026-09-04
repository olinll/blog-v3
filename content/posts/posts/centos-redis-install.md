---
title: CentOS 编译安装 Redis 6.2 并配置 Systemd 服务
description: 从源码编译安装 Redis 6.2，配置密码、外部访问与后台运行，并注册为 systemd 服务实现开机自启。
date: 2026-01-14
updated: 2026-01-14
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Redis, 数据库, CentOS]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

Redis 版本：6.2.6

通过源码下载本地编译，配置 systemd 服务文件，使用 `systemctl` 进行管理。

## 一、下载解压

```bash
# 下载 redis
wget https://cdn.olinl.com/redis-6.2.6.tar.gz
# 官方地址
# wget https://download.redis.io/releases/redis-6.2.6.tar.gz

# 解压并移动到 /opt
tar xzf redis-6.2.6.tar.gz
mv redis-6.2.6 /opt/redis
```

## 二、编译安装

```bash
# 安装编译依赖
yum -y install gcc automake autoconf libtool make

# 进入目录并编译
cd /opt/redis
make MALLOC=libc

# 安装到指定目录
make install PREFIX=/opt/redis

# 验证启动
./bin/redis-server redis.conf
```

## 三、修改配置文件

编辑 `/opt/redis/redis.conf`：

**设置访问密码**（第 901 行附近）

```bash [/opt/redis/redis.conf]
requirepass your_password
```

**允许外部访问**（第 75 行附近）

::alert{type="warning"}

`bind 0.0.0.0` 会使 Redis 监听所有网络接口，务必配合 `requirepass` 设置强密码，并通过防火墙限制访问来源。

::

```bash [/opt/redis/redis.conf]
bind 0.0.0.0
```

**设置后台运行**（第 257 行附近）

```bash [/opt/redis/redis.conf]
daemonize yes
```

## 四、注册 Systemd 服务

创建服务文件：

```bash [/etc/systemd/system/redis.service]
[Unit]
Description=redis-server
After=network.target

[Service]
Type=forking
ExecStart=/opt/redis/bin/redis-server /opt/redis/redis.conf
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

服务操作命令：

```bash
# 重载 systemd 配置
systemctl daemon-reload

# 启动
systemctl start redis
# 停止
systemctl stop redis
# 重启
systemctl restart redis
# 查看状态
systemctl status redis
# 开机自启
systemctl enable redis

# 确认进程是否运行
ps -ef | grep redis
```
