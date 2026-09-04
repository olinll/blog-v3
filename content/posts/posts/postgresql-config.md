---
title: "PostgreSQL 远程访问与数据目录迁移"
description: "介绍 PostgreSQL 的远程访问配置（pg_hba.conf / postgresql.conf）以及将数据目录从默认路径迁移到自定义路径的操作步骤。"
date: 2026-01-25 00:00:00
updated: 2026-01-25 00:00:00
categories:
  - 技术
tags:
  - PostgreSQL
  - 数据库
type: tech
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

> 尚未安装 PostgreSQL？参见
>
> ::link-card
> ---
> title: PostgreSQL 安装指南
> link: /posts/202x/postgresql-install/
> ---
> ::

## 一、配置远程访问

### 1. 修改认证方式

::alert{type="warning"}

以下操作会降低数据库安全性。`trust` 认证允许本地用户免密连接为任意数据库用户，仅建议在开发/测试环境使用。生产环境应保持 `peer` 或使用 `scram-sha-256`。

::

```bash
# 将 host 连接的认证方式从 ident 改为 md5（密码认证）
sudo sed -i '/^host/s/ident/md5/' /etc/postgresql/14/main/pg_hba.conf

# 将本地连接的认证方式从 peer 改为 trust
sudo sed -i '/^local/s/peer/trust/' /etc/postgresql/14/main/pg_hba.conf
```

### 2. 允许任意 IP 连接

编辑 `/etc/postgresql/14/main/pg_hba.conf`，添加：

::alert{type="warning"}

`0.0.0.0/0` 表示允许所有 IP 连接，生产环境应限制为特定 IP 段，并确保使用强密码。

::

```
# 允许所有 IP 使用密码连接
host   all   all   0.0.0.0/0   md5
```

### 3. 监听所有网络接口

编辑 `/etc/postgresql/14/main/postgresql.conf`，取消注释并修改：

```
listen_addresses = '*'
```

### 4. 重启服务

```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

## 二、数据目录迁移

::alert{type="warning"}

数据目录迁移操作风险较高，权限设置不正确或拷贝不完整会导致 PostgreSQL 无法启动。操作前务必停止服务并做好备份。

::

```bash
# 1. 停止服务
systemctl stop postgresql

# 2. 拷贝数据到新目录
cp -rf /var/lib/postgresql/14/main /opt/postgresql/

# 3. 设置权限
chown -R postgres:postgres /opt/postgresql/
chmod 700 /opt/postgresql/

# 4. 修改配置文件中的数据目录
vim /etc/postgresql/14/main/postgresql.conf
# 修改：data_directory = '/opt/postgresql/main'

# 5. 启动服务
systemctl start postgresql

# 6. 验证
psql -U postgres -c 'SHOW data_directory;'
```
