---
title: Linux 搭建 Nexus Maven 私服完整指南
description: 在 Linux 上安装 Sonatype Nexus 3 搭建 Maven 私服，配置专用用户、systemd 服务与开机自启，附常见问题解决方案。
date: 2026-01-07
updated: 2026-01-07
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Nexus, Maven, 私服]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

> Nexus 是目前最主流的免费 Maven 私服工具，官网称其为「世界上第一个也是唯一的免费使用的仓库解决方案」。

::alert{type="info" title="安装前提"}

最新版本要求内存 **大于 4G**，JDK **最低 1.8**。不满足条件将无法正常启动。尚未安装 JDK？参见：[Linux 手动安装 JDK 1.8](/posts/jdk-install///)

::

> 尚未安装 Maven？参见 [Linux 安装 Maven 并配置私服镜像](/posts/maven-install///)

## 一、下载安装

Nexus 官网：[https://www.sonatype.com/download-oss-sonatype](https://www.sonatype.com/download-oss-sonatype)

```bash
# CDN 一键下载
wget https://cdn.olinl.com/centos/nexus-3.87.1-01-linux-x86_64.tar.gz

# 解压（安装目录推荐 /opt/nexus）
tar -zxvf nexus-3.87.1-01-linux-x86_64.tar.gz

# 进入 bin 目录并启动
cd nexus-3.87.1-01/bin
./nexus start
```

Nexus 常用命令：

```bash
./nexus start    # 后台启动
./nexus stop     # 停止
./nexus restart  # 重启
./nexus status   # 查看状态（显示 PID）
./nexus run      # 前台运行（调试用）
```

## 二、创建专用用户（推荐）

直接以 root 运行会触发警告，建议创建专用的 `nexus` 系统用户：

```bash
# 创建 nexus 系统用户
sudo useradd -r -s /sbin/nologin -U -m -d /opt/nexus nexus

# 授权安装目录和数据目录
sudo chown -R nexus:nexus /opt/nexus
sudo chown -R nexus:nexus /opt/sonatype-work
```

## 三、配置 Systemd 服务

```bash [/etc/systemd/system/nexus.service]
[Unit]
Description=Nexus Repository Manager
After=network.target

[Service]
Type=forking
User=nexus
Group=nexus
ExecStart=/opt/nexus/bin/nexus start
ExecStop=/opt/nexus/bin/nexus stop
Restart=on-failure
RestartSec=10
LimitNOFILE=65536
# 按实际 Java 路径调整
Environment=JAVA_HOME=/opt/jdk1.8

[Install]
WantedBy=multi-user.target
```

```bash
# 重载 systemd 配置
sudo systemctl daemon-reload

# 设置开机自启
sudo systemctl enable nexus

# 启动服务
sudo systemctl start nexus

# 验证运行状态
sudo systemctl status nexus
```

## 四、常见问题

**问题：提示 `NOT RECOMMENDED TO RUN AS ROOT`**

修改 `/bin/nexus` 文件，在其中添加：

```bash
RUN_AS_USER=root
```

::alert{type="warning"}

以 root 运行 Nexus 存在安全风险，仅建议在测试环境使用。生产环境务必按第二节创建专用用户。

::

然后重启服务即可。如果是生产环境，建议按第二节创建专用用户解决。
