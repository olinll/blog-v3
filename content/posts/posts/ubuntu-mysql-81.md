---
title: Ubuntu 安装 MySQL 8.1 完整指南
description: 在 Ubuntu 22.04 上通过 DEB 包安装 MySQL 8.1 社区版，涵盖安装顺序、外部访问配置及自定义数据目录迁移。
date: 2026-01-12
updated: 2026-01-12
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [MySQL, Ubuntu, 数据库]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 一、确定 Ubuntu 版本

```bash
lsb_release -a
```

```bash
# 示例输出
root@huanfa:/# lsb_release -a
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 22.04.5 LTS
Release:        22.04
Codename:       jammy
```

## 二、下载安装包

前往 MySQL 官网下载 DEB Bundle：[https://downloads.mysql.com/archives/community/](https://downloads.mysql.com/archives/community/)

```bash
# 下载对应版本（DEB Bundle）
sudo wget https://downloads.mysql.com/archives/get/p/23/file/mysql-server_8.1.0-1ubuntu22.04_amd64.deb-bundle.tar
```

## 三、解压文件

```bash
# 建议先创建一个目录再解压，避免文件散落
mkdir mysql-deb && cd mysql-deb
sudo tar -xvf ../mysql-server_8.1.0-1ubuntu22.04_amd64.deb-bundle.tar
```

## 四、安装 MySQL

::alert{type="info"}

安装过程中可能提示缺少 `libaio1`、`libmecab2`，按以下方式处理：

```bash
sudo apt-get update
sudo apt-get install libaio1 libmecab2
```

`libmecab2` 安装时会要求设置 root 密码。

::

```bash
# 按顺序依次安装，包之间有依赖关系，顺序不能乱
sudo dpkg -i mysql-common_8.1.0-1ubuntu22.04_amd64.deb
sudo dpkg -i mysql-community-client-plugins_8.1.0-1ubuntu22.04_amd64.deb
sudo dpkg -i libmysqlclient22_8.1.0-1ubuntu22.04_amd64.deb
sudo dpkg -i libmysqlclient-dev_8.1.0-1ubuntu22.04_amd64.deb
sudo dpkg -i mysql-community-client-core_8.1.0-1ubuntu22.04_amd64.deb
sudo dpkg -i mysql-community-client_8.1.0-1ubuntu22.04_amd64.deb
sudo dpkg -i mysql-client_8.1.0-1ubuntu22.04_amd64.deb
sudo dpkg -i mysql-community-server-core_8.1.0-1ubuntu22.04_amd64.deb
sudo dpkg -i mysql-community-server_8.1.0-1ubuntu22.04_amd64.deb
sudo dpkg -i mysql-server_8.1.0-1ubuntu22.04_amd64.deb
```

## 五、验证安装

```bash
mysql -u root -p
# 密码为安装 libmecab2 时设置的密码
```

```bash
# 正常安装后输出示例
mysql> status
--------------
mysql  Ver 8.1.0 for Linux on x86_64 (MySQL Community Server - GPL)
...
```

## 六、配置外部访问

```sql
-- 查看用户信息
select host, user from mysql.user;

-- 新建允许外部访问的 root 用户（推荐）
CREATE USER root@'%' IDENTIFIED WITH mysql_native_password BY 'your_password';
GRANT ALL ON *.* TO root@'%' WITH GRANT OPTION;
flush privileges;
exit;
```

```bash
# 修改 MySQL 配置文件，允许外部连接
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
# 修改或添加：
bind-address = 0.0.0.0

# 重启 MySQL
sudo service mysql restart
```

## 七、修改数据存储位置

```bash
# 停止 MySQL 服务
sudo service mysql stop

# 创建新目录并复制数据
sudo mkdir -p /data/mysql
sudo cp -ar /var/lib/mysql /data/mysql
sudo chown -R mysql:mysql /data/mysql

# 修改 MySQL 配置
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
# 将 datadir 修改为：
datadir = /data/mysql
```

::alert{type="warning"}

Ubuntu 有 AppArmor 访问控制，仅修改 MySQL 配置不够，还需同步修改 AppArmor 规则。

::

```bash
# 修改 AppArmor 配置
sudo vim /etc/apparmor.d/usr.sbin.mysqld
# 找到：
#   /var/lib/mysql/ r,
#   /var/lib/mysql/** rwk,
# 修改为：
#   /data/mysql/ r,
#   /data/mysql/** rwk,

# 修改 abstractions 配置
sudo vim /etc/apparmor.d/abstractions/mysql
# 找到：
#   /var/lib/mysql{,d}/mysql{,d}.sock rw
# 修改为：
#   /data/mysql{,d}/mysql{,d}.sock rw

# 重启 AppArmor 和 MySQL
sudo service apparmor restart
sudo service mysql start

# 验证数据目录
mysql -uroot -p -e "show variables like '%datadir%';"
```

::alert{type="tip"}

安装完成后，建议使用 XtraBackup 定期备份数据库：[XtraBackup 备份与恢复](/posts/xtrabackup-backup///)

::
