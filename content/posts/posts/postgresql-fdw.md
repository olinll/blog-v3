---
title: "PostgreSQL 外部表（FDW）跨库查询配置"
description: "使用 postgres_fdw 扩展配置 PostgreSQL 外部数据包装器，实现跨数据库实例的表查询，解决 PostgreSQL 不支持跨库查询的限制。"
date: 2026-01-26 00:00:00
updated: 2026-01-26 00:00:00
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

PostgreSQL 不支持跨库查询，可通过 **Foreign Data Wrapper（FDW）** 访问外部数据库的表，实现类似跨库查询的效果。

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

## 一、安装扩展

```sql
-- 在本地数据库执行
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
```

## 二、创建远程服务器

```sql
CREATE SERVER remote_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
  host '192.168.1.100',
  dbname 'target_db',
  port '5432'
);
```

## 三、创建用户映射

```sql
CREATE USER MAPPING FOR postgres
SERVER remote_server
OPTIONS (
  user 'postgres',
  password 'remote-password'
);
```

## 四、导入远程表

```sql
-- 导入单个表
IMPORT FOREIGN SCHEMA public
LIMIT TO (table_name)
FROM SERVER remote_server
INTO public;

-- 导入多个表
IMPORT FOREIGN SCHEMA public
LIMIT TO (table1, table2, table3)
FROM SERVER remote_server
INTO public;

-- 导入整个 schema（慎用）
IMPORT FOREIGN SCHEMA public
FROM SERVER remote_server
INTO public;
```

::alert{type="warning"}

导入整个 schema 可能与本地表名冲突，建议使用 `LIMIT TO` 指定需要的表。

::

导入后即可像本地表一样使用。

## 五、管理命令

```sql
-- 查看所有外部服务器
SELECT * FROM pg_foreign_server;

-- 查看导入的外部表
SELECT * FROM information_schema.foreign_tables;

-- 修改服务器连接信息
ALTER SERVER remote_server
OPTIONS (SET host '192.168.1.200', SET port '5432', SET dbname 'new_db');

-- 修改用户映射密码
ALTER USER MAPPING FOR CURRENT_USER
SERVER remote_server
OPTIONS (SET password 'new-password');

-- 增加批量获取行数（优化性能）
ALTER SERVER remote_server OPTIONS (ADD fetch_size '50000');

-- 删除外部表
DROP FOREIGN TABLE table_name;

-- 删除用户映射
DROP USER MAPPING FOR postgres SERVER remote_server;

-- 删除服务器（CASCADE 同时删除依赖的外部表）
DROP SERVER remote_server CASCADE;

-- 删除扩展
DROP EXTENSION postgres_fdw;
```

::alert{type="warning"}

`CASCADE` 会同时删除所有依赖该服务器的外部表，可能导致业务中断。请确认无依赖后再执行。

::
