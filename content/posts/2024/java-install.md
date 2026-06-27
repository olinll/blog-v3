---
title: Linux 手动安装 JDK 1.8 并配置环境变量
description: 使通过下载 tar.gz 包手动安装 JDK 1.8，配置 JAVA_HOME 等环境变量，适用于 CentOS、Debian、Ubuntu 等主流发行版。
date: 2024-06-20
updated: 2026-06-27 14:11:19
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [docker, harbor]
---

::chat
{:2602-12-31 23:59:59}

{.}

老大，都2602年了，这样的教程还值得放在我的博客文章里吗？


{喵墩}

JDK 8 在2026年还在大量生产环境跑着（Spring Boot 2.x、Hadoop、老项目一堆）\
这篇教程对新人踩坑还是有参考价值的。

{:渋夜旅 撤回了一条消息}

{喵墩}

但你应该在文章头部加一段提示："新项目建议直接装 JDK 21+，本文仅适用于维护旧项目"。

{:娜娜奇 不知道在做什么 反正就是有了个踪迹在这}

{.}

那我就把这个聊天记录加上去，但我不想改哇。\
算了，等用得到的时候再改吧

{.}

其实就是下载不同版本的jdk包，然后替换就行了。



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

::alert{type="info"}

如果服务器上需要同时管理多个 JDK 版本，可以将不同版本分别解压到 `/opt/jdk1.8/`、`/opt/jdk11/`、`/opt/jdk17/` 等目录，通过修改 `JAVA_HOME` 快速切换。

::
