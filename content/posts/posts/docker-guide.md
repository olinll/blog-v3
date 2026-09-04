---
title: Docker 安装与配置指南
description: 介绍 Docker 在 CentOS、Ubuntu、Alpine 上的安装方法，以及生产环境中常用的 daemon.json 配置（存储目录迁移、日志限制、私服镜像等）。
date: 2022-09-18 13:25:00
updated: 2026-06-27 13:25:00
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Docker, 软件安装]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 一、安装

::alert{type="info"}

安装前必读：本文的命令使用的是 root 用户登录执行，不是 root 的话所有命令前面要加 sudo

::

::alert{type="tip"}

现在可以使用[轩辕镜像站](https://xuanyuan.cloud)的一键安装脚本进行安装了

::

### CentOS

```bash
# 查看当前内核版本（官方建议 3.10 以上）
uname -r

# 卸载旧版本
yum remove docker docker-common docker-selinux docker-engine

# 安装需要的软件包
yum install -y yum-utils device-mapper-persistent-data lvm2

# 设置 yum 源（推荐阿里源）
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 查看可用版本
yum list docker-ce --showduplicates | sort -r

# 安装 Docker
yum -y install docker-ce
```

### Ubuntu

```bash
# 卸载旧版本
sudo apt-get remove docker docker-engine docker.io containerd runc

# 安装必要支持
sudo apt install apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release

# 添加 Docker 阿里源 GPG key
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 apt 源
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 更新源并安装
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# 查看版本和状态
sudo docker version
sudo systemctl status docker
```

### Alpine

```bash
# 启用 cgroups（不启用会导致 Docker 无法启动）
rc-update add cgroups boot
rc-service cgroups start
mount | grep cgroup

# 安装 Docker
apk add docker docker-compose

# 创建配置目录
mkdir -p /etc/docker

# 写入基础配置
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "5m",
    "max-file": "2"
  },
  "storage-driver": "overlay2",
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 1024,
      "Soft": 512
    }
  },
  "max-concurrent-downloads": 1,
  "max-concurrent-uploads": 1
}
EOF

# 重启 Docker
rc-service docker restart
```

### 常用服务命令

```bash
# systemctl 系统（CentOS / Ubuntu）
systemctl start docker
systemctl stop docker
systemctl restart docker
systemctl enable docker

# rc-service 系统（Alpine）
rc-service docker start
rc-service docker stop
rc-service docker restart
```

## 二、daemon.json 配置

::alert{type="tip"}

Docker Compose 的安装与使用参见：[Docker Compose 安装配置](/posts/docker-compose-setup)，YML 编写参见：[Docker Compose YML 编写](/posts/docker-compose-yml)

::

### 迁移存储目录

Docker 默认将所有数据（镜像、容器、卷）存储在 `/var/lib/docker/`，生产环境系统盘通常空间有限，建议迁移到数据盘。

::alert{type="warning"}

此操作建议在**刚安装完 Docker 后**执行，迁移前务必停止所有容器，避免数据丢失。

::

```bash
# 1. 停止 Docker 服务
sudo systemctl stop docker

# 2. 创建新的数据目录
mkdir -p /opt/docker/
chmod -R 755 /opt/docker/

# 3. 迁移现有数据（如有）
sudo cp -a /var/lib/docker/* /opt/docker/

# 4. 修改配置
mkdir -p /etc/docker
vim /etc/docker/daemon.json
```

```json [/etc/docker/daemon.json]
{
  "data-root": "/opt/docker"
}
```

```bash
# 5. 重载配置并重启
sudo systemctl daemon-reload
sudo systemctl restart docker

# 6. 验证新目录是否生效
sudo docker info | grep "Docker Root Dir"

# 7. 确认数据无误后删除旧目录（可选）
rm -rf /var/lib/docker
```

### 限制容器日志大小

**方法一：全局配置（推荐，对新容器生效）**

```json [/etc/docker/daemon.json]
{
  "log-opts": {
    "max-size": "500m",
    "max-file": "3"
  }
}
```

- `max-size`：单个日志文件最大 500MB
- `max-file`：最多保留 3 个日志文件（滚动）

```bash
systemctl daemon-reload
systemctl restart docker
```

::alert{type="info"}

此配置只对**重启后新创建的容器**生效，已运行的容器需重建才能应用。

::

**方法二：脚本主动清理日志**

```bash [/opt/scripts/clean-docker-logs.sh]
#!/bin/bash
# 根据实际 data-root 修改此路径（默认 /var/lib/docker/containers）
log_path="/var/lib/docker/containers"
for container_id in $(ls "$log_path"); do
    log_file="${log_path}/${container_id}/${container_id}-json.log"
    if [ -f "$log_file" ]; then
        echo "清理容器 ${container_id} 的日志"
        truncate -s 0 "$log_file"
    fi
done
echo "日志清理完成"
```

### 私服仓库地址

::alert{type="info"}

如需搭建私有镜像仓库，参见：[Harbor 私有镜像仓库安装指南](/posts/harbor-install)。使用自签名证书时还需配置信任：[Docker 配置私服自签名证书信任](/posts/docker-private-cert)

::

```json [/etc/docker/daemon.json]
{
  "insecure-registries": [
    "http://harbor:30001"
  ]
}
```

### 镜像加速

```json [/etc/docker/daemon.json]
{
  "registry-mirrors": [
    "http://harbor:30001",
    "https://docker.1panel.live"
  ]
}
```

## 三、完整 daemon.json 参考

```json [/etc/docker/daemon.json]
{
  "data-root": "/opt/docker",
  "log-opts": {
    "max-size": "500m",
    "max-file": "3"
  },
  "insecure-registries": [
    "harbor.example.com"
  ],
  "registry-mirrors": [
    "https://docker.example.com"
  ]
}
```
