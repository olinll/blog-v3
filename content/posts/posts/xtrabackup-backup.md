---
title: Xtrabackup MySQL 热备份工具使用指南
description: 介绍 Percona Xtrabackup 的安装配置与全量备份操作，支持不停机热备份 MySQL 数据库，适用于生产环境数据保护。
date: 2026-01-13
updated: 2026-01-13
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [MySQL, 备份, 运维]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

Xtrabackup 是 Percona 公司开发的 MySQL 开源热备份工具，支持在不停止数据库服务的情况下进行全量和增量备份。

> 相关文章：[CentOS 安装 MySQL 5.7 完整指南](/posts/centos-mysql-57) · [Ubuntu 安装 MySQL 8.1 完整指南](/posts/ubuntu-mysql-81)

## 一、安装

```bash
# 下载二进制包
wget https://downloads.percona.com/downloads/Percona-XtraBackup-LATEST/Percona-XtraBackup-8.1.0-1/binary/tarball/percona-xtrabackup-8.1.0-1-Linux-x86_64.glibc2.17.tar.gz

# 解压并安装
tar -zxvf percona-xtrabackup-8.1.0-1-Linux-x86_64.glibc2.17.tar.gz
mv percona-xtrabackup-8.1.0-1-Linux-x86_64.glibc2.17 /app/xtrabackup

# 配置软链接（使命令全局可用）
ln -sf /app/xtrabackup/bin/* /usr/bin/

# 验证安装
xtrabackup --version
```

## 二、MySQL 配置要求

备份前需在 `/etc/my.cnf` 中启用 GTID：

```ini [/etc/my.cnf]
gtid_mode=ON
enforce_gtid_consistency=ON
```

## 三、创建备份专用用户

MySQL 8.1 起必须使用非 root 用户执行备份：

```sql
-- 创建备份用户
CREATE USER 'bkpuser'@'localhost' IDENTIFIED BY 's3cr%T';

-- 授予必要权限
GRANT BACKUP_ADMIN, PROCESS, RELOAD, LOCK TABLES, REPLICATION CLIENT ON *.* TO 'bkpuser'@'localhost';
GRANT SELECT ON performance_schema.log_status TO 'bkpuser'@'localhost';
GRANT SELECT ON performance_schema.keyring_component_status TO 'bkpuser'@'localhost';
GRANT SELECT ON performance_schema.replication_group_members TO 'bkpuser'@'localhost';
```

::alert{type="tip"}

各权限用途说明：

- `RELOAD`：执行 `FLUSH TABLES WITH REDO LOCK`
- `REPLICATION CLIENT`：查询 binlog 位点信息
- `BACKUP_ADMIN`：执行 `LOCK INSTANCE FOR BACKUP`
- `PROCESS`：查询 InnoDB 状态和进程列表

::

## 四、全量备份

```bash
mkdir -p /app/backup

# 执行全量备份（带压缩）
xtrabackup --backup \
  --slave-info \
  -u bkpuser \
  -H 127.0.0.1 \
  -P 3306 \
  -p 's3cr%T' \
  --compress \
  --parallel=5 \
  --target-dir=/app/backup/backup_$(date +"%F_%H_%M_%S")
```

直接压缩为 gz 文件：

```bash
xtrabackup --backup -u bkpuser -H 127.0.0.1 -P 3306 -p 's3cr%T' \
  --stream=xbstream | gzip > /app/backup/backup_$(date +"%F_%H_%M_%S").gz
```
