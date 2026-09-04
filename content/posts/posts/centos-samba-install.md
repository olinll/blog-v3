---
title: CentOS 安装 Samba 实现跨系统文件共享
description: 在 CentOS 上安装 Samba 服务，配置 SMB 共享目录与专用访问用户，实现 Windows 与 Linux 之间的文件互访。
date: 2026-01-17
updated: 2026-01-17
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Samba, 文件共享, CentOS]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

> Samba 是一个开源软件，实现了 SMB/CIFS 协议，允许在不同操作系统之间共享文件和打印机。

## 一、安装前准备

::alert{type="warning"}

Samba 与 SELinux 存在冲突，安装前请确认 SELinux 已关闭。

::

```bash
# 查看 SELinux 状态
getenforce

# 临时关闭
setenforce 0

# 永久关闭：编辑配置文件
vim /etc/sysconfig/selinux
# 将 SELINUX=enforcing 改为 SELINUX=disabled
# 修改后需重启系统生效

# 关闭防火墙（或手动开放 139、445 端口）
systemctl stop firewalld.service
systemctl disable firewalld.service
```

## 二、安装

```bash
yum install -y samba samba-client
```

## 三、配置共享目录

```bash
# 备份默认配置
mv /etc/samba/smb.conf /etc/samba/smb.conf.bak

# 创建新配置文件
vim /etc/samba/smb.conf
```

在文件中写入以下内容（以共享 `/var/www/html` 为例）：

```ini [/etc/samba/smb.conf]
[global]
    workgroup = WORKGROUP
    security = user

[share]
    comment = Shared Directory
    path = /var/www/html
    browseable = yes
    writable = yes
```

## 四、创建 Samba 用户

```bash
# 创建系统用户（如已存在可跳过）
useradd smbuser

# 为该用户设置 Samba 密码
smbpasswd -a smbuser
# 按提示输入密码

# 查看已创建的 Samba 用户
pdbedit -L
```

## 五、启动服务

```bash
# 启动 Samba
systemctl start smb
# 设置开机自启
systemctl enable smb

# 确认服务正在运行
ss -antp | grep smbd
```

## 六、设置目录权限

```bash
# 给指定用户设置目录的读写执行权限
setfacl -m u:smbuser:rwx /var/www/html

# 通用格式
# setfacl -m u:<用户名>:rwx /<目录>
```
