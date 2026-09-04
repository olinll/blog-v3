---
title: PostgreSQL 实战指南：安装、配置、备份与跨库查询
description: 介绍 PostgreSQL 的 Ubuntu/Docker 部署、远程访问和数据目录迁移、备份恢复与 FDW 跨库查询配置。
date: 2026-01-24
updated: 2026-01-27
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [PostgreSQL, 数据库, Docker, 备份, FDW]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 一、Ubuntu 二进制安装

```bash
# 安装 PostgreSQL 14
apt install -y postgresql-14

# 查看服务状态
systemctl status postgresql
```

### 修改数据库密码

```bash
# 切换到 postgres 用户并登录
su - postgres
psql

# 或直接以 root 身份登录
psql -U postgres
```

```sql
-- 修改密码
ALTER USER postgres WITH PASSWORD 'your-password';
```

## 二、Docker Compose 部署

适合测试环境，可在一台主机运行多个 PostgreSQL 实例：

```yaml [docker-compose.yml]
services:
  pgsql:
    image: postgres:14
    container_name: postgres
    restart: always
    command: >
      postgres
      -c config_file=/etc/postgresql/postgresql.conf
      -c hba_file=/etc/postgresql/pg_hba.conf
    environment:
      POSTGRES_PASSWORD: Passwd@2026
      TZ: Asia/Shanghai
    ports:
      - "5432:5432"
    volumes:
      - /opt/pgsql/data:/var/lib/postgresql/data
      - /opt/pgsql/config/postgresql.conf:/etc/postgresql/postgresql.conf:ro
      - /opt/pgsql/config/pg_hba.conf:/etc/postgresql/pg_hba.conf:ro
    networks:
      - app-net

networks:
  app-net:
    external: true
```

## 三、远程访问与数据目录迁移

### 修改认证方式

::alert{type="warning"}

以下操作会降低数据库安全性。`trust` 认证允许本地用户免密连接为任意数据库用户，仅建议在开发/测试环境使用。生产环境应保持 `peer` 或使用 `scram-sha-256`。

::

```bash
# 将 host 连接的认证方式从 ident 改为 md5（密码认证）
sudo sed -i '/^host/s/ident/md5/' /etc/postgresql/14/main/pg_hba.conf

# 将本地连接的认证方式从 peer 改为 trust
sudo sed -i '/^local/s/peer/trust/' /etc/postgresql/14/main/pg_hba.conf
```

### 允许指定 IP 连接

编辑 `/etc/postgresql/14/main/pg_hba.conf`，添加：

::alert{type="warning"}

`0.0.0.0/0` 表示允许所有 IP 连接，生产环境应限制为特定 IP 段，并确保使用强密码。

::

```
# 允许所有 IP 使用密码连接
host   all   all   0.0.0.0/0   md5
```

### 监听所有网络接口

编辑 `/etc/postgresql/14/main/postgresql.conf`，取消注释并修改：

```
listen_addresses = '*'
```

重启并设置服务开机自启：

```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### 数据目录迁移

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

## 四、备份与恢复

### 备份与恢复整个数据库

```bash
# 导出整个集群（所有数据库）
sudo -u postgres pg_dumpall -h localhost -p 5432 -v > /tmp/pg_full_backup.sql

# 传输到目标服务器
rsync -avz --progress /tmp/pg_full_backup.sql user@192.168.1.100:/tmp/

# 实体 PostgreSQL 恢复
sudo -u postgres psql -f /tmp/pg_full_backup.sql

# Docker 容器 PostgreSQL 恢复
docker cp /tmp/pg_full_backup.sql postgres:/tmp/
docker exec -i postgres psql -U postgres -f /tmp/pg_full_backup.sql
```

### 备份与恢复单个表

```bash
# 备份指定表
sudo -u postgres pg_dump -h localhost -p 5432 \
  -d mydb -t users -v > /tmp/users_backup.sql

# 备份时包含 DROP/CREATE 语句（便于重复恢复）
sudo -u postgres pg_dump -h localhost -p 5432 \
  -d mydb -t users --clean --if-exists -v > /tmp/users_backup_clean.sql

# 传输到目标服务器
rsync -avz --progress /tmp/users_backup.sql user@192.168.1.100:/tmp/
```

::alert{type="info"}

如果目标表已存在，需要先删除或重命名，否则恢复会报错。

::

```bash
# 实体 PostgreSQL 恢复
sudo -u postgres psql -d target_database -f /tmp/users_backup.sql

# Docker 容器 PostgreSQL 恢复
docker cp /tmp/users_backup.sql postgres:/tmp/
docker exec -i postgres psql -U postgres -d target_database -f /tmp/users_backup.sql
```

## 五、FDW 跨库查询

PostgreSQL 不支持跨库查询，可通过 **Foreign Data Wrapper（FDW）** 访问外部数据库的表，实现类似跨库查询的效果。

### 安装扩展

```sql
-- 在本地数据库执行
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
```

### 创建远程服务器

```sql
CREATE SERVER remote_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
  host '192.168.1.100',
  dbname 'target_db',
  port '5432'
);
```

### 创建用户映射

```sql
CREATE USER MAPPING FOR postgres
SERVER remote_server
OPTIONS (
  user 'postgres',
  password 'remote-password'
);
```

### 导入远程表

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

### 管理命令

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
