---
title: Nacos 安装与鉴权配置指南
description: Nacos 配置中心的单机安装、MySQL 持久化以及鉴权配置完整指南，适用于 2.x 版本。
date: 2026-01-22
updated: 2026-01-22
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Nacos, 配置中心, Java, 安全]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 一、安装

```shell
# 解压到安装目录
tar -zxvf nacos-server-x.x.x.tar.gz -C /opt/
```

目录说明：

| 目录 | 说明 |
|---|---|
| `bin` | 启动脚本 |
| `conf` | 配置文件 |
| `target` | 启动依赖 |
| `data` | 运行数据 |

## 二、启动

```shell
# 单机模式启动
sh /opt/nacos/bin/startup.sh -m standalone
```

## 三、访问

- 地址：`http://ip:8848/nacos/`
- 默认账号密码：`nacos` / `nacos`

::alert{type="info"}

阿里云服务器需在安全组中开放 `8848` 端口。

::

## 四、持久化到 MySQL

默认使用内嵌数据库，重启后数据丢失。生产环境建议持久化到 MySQL（5.6.5+）。

::alert{type="info"}

尚未安装 MySQL？参见：[CentOS MySQL 5.7 安装](/posts/centos-mysql-57///) 或 [Ubuntu MySQL 8.1 安装](/posts/ubuntu-mysql-81///)

::

**步骤：**

1. 在 MySQL 中创建 `nacos` 数据库，执行 `nacos/conf/nacos-mysql.sql` 初始化
2. 修改 `conf/application.properties`，添加以下配置：

```properties
spring.datasource.platform=mysql

db.num=1
db.url.0=jdbc:mysql://127.0.0.1:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTC
db.user.0=nacos
db.password.0=your-password
```

3. 重启 Nacos

## 五、开启鉴权

修改 `conf/application.properties` 文件。

### 开启鉴权

```properties
nacos.core.auth.system.type=nacos
nacos.core.auth.enabled=true
```

### 配置 Token 密钥

::alert{type="warning"}

2.2.0.1 版本后必须手动配置 Token 密钥，否则无法启动。密钥需为 Base64 编码字符串，原始长度不低于 32 字符。

::

```properties
# 2.1.0 版本后使用此配置项
nacos.core.auth.plugin.nacos.token.secret.key=VGhpc0lzTXlDdXN0b21TZWNyZXRLZXkwMTIzNDU2Nzg=
```

生成 Base64 密钥：

```bash
echo -n 'YourCustomSecretKey0123456789012' | base64
```

### 配置节点身份标识

```properties
nacos.core.auth.server.identity.key=example
nacos.core.auth.server.identity.value=example
```

### 完整鉴权配置示例

```properties
### 开启鉴权
nacos.core.auth.system.type=nacos
nacos.core.auth.enabled=true
nacos.core.auth.caching.enabled=true
nacos.core.auth.enable.userAgentAuthWhite=false

### 节点身份标识（集群节点间通信白名单）
nacos.core.auth.server.identity.key=example
nacos.core.auth.server.identity.value=example

### Token 配置
nacos.core.auth.plugin.nacos.token.cache.enable=false
nacos.core.auth.plugin.nacos.token.expire.seconds=18000
nacos.core.auth.plugin.nacos.token.secret.key=VGhpc0lzTXlDdXN0b21TZWNyZXRLZXkwMTIzNDU2Nzg=
```

配置完成后重启 Nacos 即可生效。
