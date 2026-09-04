---
title: CentOS 安装 MongoDB 3.4 并配置认证
description: 在 CentOS 上通过 YUM 仓库安装 MongoDB 3.4，配置外部访问与用户密码认证，适合内网开发环境快速搭建。
date: 2026-01-16
updated: 2026-01-16
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [MongoDB, 数据库, CentOS]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

::alert{type="warning"}

本文内容来源于参考教程整理，部分步骤未经实机验证，仅供参考。如有问题请以官方文档为准。

::

## 一、添加 YUM 仓库并安装

创建 MongoDB 仓库文件：

```ini [/etc/yum.repos.d/mongodb-org-3.4.repo]
[mongodb-org-3.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc
```

```bash
# 安装 MongoDB
yum install -y mongodb-org
```

## 二、启动服务

```bash
# 启动
systemctl start mongod.service
# 停止
systemctl stop mongod.service
# 重启
systemctl restart mongod.service
# 设置开机自启
systemctl enable mongod
```

## 三、配置外部访问

```bash
# 修改配置文件
vim /etc/mongod.conf
```

找到 `bindIp` 字段，将其改为 `0.0.0.0`：

```yaml [/etc/mongod.conf]
# 修改前
bindIp: 127.0.0.1
# 修改后
bindIp: 0.0.0.0
```

```bash
# 重启使配置生效
systemctl restart mongod
```

连接 MongoDB：

```bash
mongo 127.0.0.1:27017
```

默认数据目录：`/var/lib/mongo`

默认日志目录：`/var/log/mongodb`

如需修改，在 `/etc/mongod.conf` 中调整对应路径。

## 四、配置用户认证

先以无认证方式登录：

```bash
mongo 127.0.0.1:27017
```

在 MongoDB Shell 中创建管理员用户：

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "your_password",
  roles: [{ role: "root", db: "admin" }]
})
```

开启认证：

```yaml [/etc/mongod.conf]
security:
  authorization: enabled
```

```bash
# 重启服务
systemctl restart mongod
```

重启后使用认证方式登录：

```bash
mongo 127.0.0.1:27017 -u admin -p your_password --authenticationDatabase admin
```
