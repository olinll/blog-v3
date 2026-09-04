---
title: 服务器初始化完整配置流程
description: 记录生产环境服务器从零开始的完整初始化流程，包括换源、时区配置、K8s 集群搭建、MinIO、Redis 集群、MySQL 单节点安装。
date: 2026-02-13
updated: 2026-02-13
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [系统]
tags: [运维, Linux, Homelab]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

本文记录生产环境服务器的完整初始化配置流程，适用于新机器的快速上线。

## 1. 基础配置

```shell
hostnamectl set-hostname your-hostname
vim /etc/hosts
```

## 2. 换源

根据发行版替换为国内镜像源（阿里云 / 腾讯云 / 清华 TUNA）。

## 3. 时区配置

```shell
timedatectl set-timezone Asia/Shanghai
timedatectl status
```

## 4. 安装 K8s 集群（KubeSphere 离线）

::alert{type="info"}

K8s 集群使用 Harbor 作为私有镜像仓库，安装参见：[Harbor 私有镜像仓库安装指南](/posts/harbor-install)

::

```shell
apt install -y socat conntrack

mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-opts": { "max-size": "5m", "max-file": "3" },
  "exec-opts": ["native.cgroupdriver=systemd"],
  "data-root": "/opt/docker"
}
EOF

./kk init registry -f config.yaml -a kubesphere-4.1.tar.gz
sh create_project_harbor.sh
./kk artifact image push -f config.yaml -a kubesphere-4.1.tar.gz
./kk create cluster -f config.yaml -a kubesphere-4.1.tar.gz --with-local-storage

helm upgrade --install -n kubesphere-system --create-namespace ks-core ks-core-1.1.3.tgz \
  --set global.imageRegistry=harbor.local/ks \
  --set extension.imageRegistry=harbor.local/ks \
  --debug --wait
```

## 5. 安装 MinIO

```shell
wget https://dl.min.io/server/minio/release/linux-amd64/archive/minio.RELEASE.2025-04-22T22-12-26Z
mkdir -p /opt/minio
mv minio.RELEASE.2025-04-22T22-12-26Z /opt/minio/minio
chmod +x /opt/minio/minio
systemctl daemon-reload
systemctl enable --now minio
systemctl status minio
```

详细安装步骤参见：[MinIO 安装指南](/posts/minio-install)

## 6. 搭建 Redis 集群（3 主 3 从）

::alert{type="info"}

单机 Redis 编译安装参见：[CentOS 编译安装 Redis 6.2](/posts/centos-redis-install)

::

```bash
wget https://download.redis.io/releases/redis-7.4.6.tar.gz
tar -zxvf redis-7.4.6.tar.gz
apt install gcc make -y
cd redis-7.4.6 && make && sudo make install

mkdir -p /opt/redis/cluster/{7001,7002}

# 启动所有实例后建集群
redis-cli --cluster create \
  node1:7001 node2:7001 node3:7001 \
  node1:7002 node2:7002 node3:7002 \
  --cluster-replicas 1 -a your-password

redis-cli -c -h node1 -p 7001 -a your-password cluster nodes
```

## 7. 安装 MySQL 8.1（Ubuntu）

::alert{type="info"}

更详细的 MySQL 8.1 安装配置（含外部访问、数据目录迁移）参见：[Ubuntu MySQL 8.1 安装指南](/posts/ubuntu-mysql-81)

::

```shell
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-server_8.1.0-1ubuntu22.04_amd64.deb-bundle.tar
tar -xf mysql-server_8.1.0-1ubuntu22.04_amd64.deb-bundle.tar

apt install ./mysql-common_8.1.0-*.deb \
  ./mysql-community-client-plugins_8.1.0-*.deb \
  ./libmysqlclient22_8.1.0-*.deb \
  ./mysql-community-client-core_8.1.0-*.deb \
  ./mysql-community-client_8.1.0-*.deb \
  ./mysql-community-server-core_8.1.0-*.deb \
  ./mysql-community-server_8.1.0-*.deb

# 修改数据目录
vim /etc/mysql/mysql.conf.d/mysqld.cnf
# datadir = /opt/mysql/data

vim /etc/apparmor.d/usr.sbin.mysqld
# 添加：/opt/mysql/ r,  /opt/mysql/** rwk,

systemctl reload apparmor
mkdir -p /opt/mysql && chown -R mysql:mysql /opt/mysql
```

::alert{type="warning"}

`--initialize-insecure` 会创建无密码的 root 账户，初始化完成后必须立即设置 root 密码。

::

```shell
sudo -u mysql mysqld --initialize-insecure --user=mysql --datadir=/opt/mysql/data
systemctl start mysql && systemctl enable mysql
```
