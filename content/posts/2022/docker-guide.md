---
title: Docker基础篇
description: 介绍Docker安装方法，以及生产环境常用的配置
date: 2022-09-18 13:25:00
updated: 2026-06-27 13:25:00
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Docker, 软件安装]
---

## 一、简介

**什么是Docker?**

Docker的主要目标是“Build，Ship and Run Any App,Anywhere”，也就是通过对应用组件的封装、分发、部署、运行等生命周期的管理，使用户的APP（可以是一个WEB应用或数据库应用等等）**及其运行环境**能够做到“一次构建，处处运行”,避免了因运行环境不一致而导致的异常

**他有什么好处呢？优缺点**

- 传统虚拟机技术：模拟一个完整的操作系统，先虚拟出一套硬件，然后在其上安装操作系统，最后在系统上再运行应用程序  
  缺点：资源占用多，启动慢

- Docker容器技术：不是模拟一个完整的操作系统，没有进行硬件虚拟，而是对进程进行隔离，封装成容器，容器内的应用程序是直接使用宿主机的内核，且容器之间是互相隔离的，互不影响  
  优点：更轻便、效率高、启动快、秒级

## 二、安装Docker

### 一键安装脚本
::alert{type="info" title="一键安装"}
现在我们可以使用一键安装脚本进行安装，然后再进行各种配置，这里可以使用[轩辕镜像站](https://xuanyuan.cloud)的一键安装脚本进行安装

:copy{code="bash <(wget -qO- https://xuanyuan.cloud/docker.sh)"}
::

**或者，您可以选择手动安装，下面是各大发行版的安装命令**

### 手动安装命令

::folding{title="Centos"}

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

::

::folding{title="Ubuntu、Debian"}
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
::

::folding{title="Alpine"}
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
::

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

## 三、配置文件

Docker的主要配置文件是`daemon.json`，他默认在`/etc/docker`下面

## 四、生产化配置


### 迁移存储目录

Docker 默认将所有数据（镜像、容器、卷）存储在 `/var/lib/docker/`，生产环境系统盘通常空间有限，建议迁移到数据盘。

::alert{type="warning" title="重要提示！}
此操作建议在**刚安装完 Docker 后**执行，迁移前务必停止所有容器，避免数据丢失。
::

**我们先迁移现有数据**
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

**接下来我们修改配置文件**
```json [/etc/docker/daemon.json]
{
  "data-root": "/opt/docker"
}
```

**重载并验证**
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

::alert
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

## 五、配置镜像加速地址

由于Docker的官方仓库在国外，我们拉取镜像会出现超时，拉取不到等问题，所以我们经常需要配置私有仓库，或者镜像仓库进行加速拉取。这里提供2种方式如何使用。

**第一种方式：在配置文件里面去配置镜像加速**

```json [/etc/docker/daemon.json]
{
  "registry-mirrors": [
    "https://docker.1panel.live"
  ]
}
```

**第二种方式：在拉取命令的前缀使用**

```bash
# 官方拉取命令
docker pull nginx
# 我们使用镜像加速地址：
docker pull docker.1panel.live/nginx
```
