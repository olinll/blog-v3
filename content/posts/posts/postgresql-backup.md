---
title: "PostgreSQL 备份与恢复"
description: "介绍使用 pg_dumpall 和 pg_dump 对 PostgreSQL 进行全量备份与单表备份，以及在实体机和 Docker 容器中的恢复方法。"
date: 2026-01-27 00:00:00
updated: 2026-01-27 00:00:00
categories:
  - 技术
tags:
  - PostgreSQL
  - 数据库
  - 备份
type: tech
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

> 相关文章：
>
> ::link-card
> ---
> title: PostgreSQL 安装指南
> link: /posts/202x/postgresql-install/
> ---
> ::
>
> ::link-card
> ---
> title: PostgreSQL 远程访问与数据目录迁移
> link: /posts/202x/postgresql-config/
> ---
> ::

## 一、备份与恢复整个数据库

### 备份

```bash
# 导出整个集群（所有数据库）
sudo -u postgres pg_dumpall -h localhost -p 5432 -v > /tmp/pg_full_backup.sql
```

### 传输到目标服务器

```bash
rsync -avz --progress /tmp/pg_full_backup.sql user@192.168.1.100:/tmp/
```

### 恢复

```bash
# 实体 PostgreSQL
sudo -u postgres psql -f /tmp/pg_full_backup.sql

# Docker 容器 PostgreSQL
docker cp /tmp/pg_full_backup.sql postgres:/tmp/
docker exec -i postgres psql -U postgres -f /tmp/pg_full_backup.sql
```

## 二、备份与恢复单个表

### 备份

```bash
# 备份指定表
sudo -u postgres pg_dump -h localhost -p 5432 \
  -d mydb -t users -v > /tmp/users_backup.sql

# 备份时包含 DROP/CREATE 语句（便于重复恢复）
sudo -u postgres pg_dump -h localhost -p 5432 \
  -d mydb -t users --clean --if-exists -v > /tmp/users_backup_clean.sql
```

### 传输到目标服务器

```bash
rsync -avz --progress /tmp/users_backup.sql user@192.168.1.100:/tmp/
```

### 恢复

::alert{type="info"}

如果目标表已存在，需要先删除或重命名，否则恢复会报错。

::

```bash
# 实体 PostgreSQL
sudo -u postgres psql -d target_database -f /tmp/users_backup.sql

# Docker 容器 PostgreSQL
docker cp /tmp/users_backup.sql postgres:/tmp/
docker exec -i postgres psql -U postgres -d target_database -f /tmp/users_backup.sql
```
