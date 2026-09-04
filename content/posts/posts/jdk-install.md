---
title: Linux 手动安装 JDK 1.8 并配置环境变量
description: 通过下载 tar.gz 包手动安装 JDK 1.8，配置 JAVA_HOME 等环境变量，适用于 CentOS、Debian、Ubuntu 等主流发行版。
date: 2024-06-20
updated: 2026-06-27 14:11:19
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [JDK, Java, 环境配置]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

一般情况下推荐直接下载 tar.gz 包配置环境变量，而不是通过包管理器安装，便于管理多个 JDK 版本。

## 一、下载解压

```bash
# 下载 JDK 1.8
# 华为云官方地址
wget https://repo.huaweicloud.com/java/jdk/8u201-b09/jdk-8u201-linux-x64.tar.gz

# 解压并移动到 /opt
tar -zxvf jdk-8u201-linux-x64.tar.gz
mv jdk1.8.0_201 /opt/jdk1.8/
```

## 二、配置环境变量

```bash
# 编辑系统环境变量
vim /etc/profile

# 在文件末尾追加以下内容
# Java 1.8
export JAVA_HOME=/opt/jdk1.8
export PATH=$JAVA_HOME/bin:$PATH
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

# 使配置立即生效
source /etc/profile

# 验证安装，显示版本号即成功
java -version
```

```bash
# 预期输出
java version "1.8.0_201"
Java(TM) SE Runtime Environment (build 1.8.0_201-b09)
Java HotSpot(TM) 64-Bit Server VM (build 25.201-b09, mixed mode)
```

::alert{type="tip"}

如果服务器上需要同时管理多个 JDK 版本，可以将不同版本分别解压到 `/opt/jdk1.8/`、`/opt/jdk11/`、`/opt/jdk17/` 等目录，通过修改 `JAVA_HOME` 快速切换。

::
