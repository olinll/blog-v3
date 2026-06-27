---
title: 使用 Squid 为内网服务器搭建 HTTP 代理
description: 在有网络的边缘服务器上安装 Squid 代理，让无公网访问的内网机器通过代理完成软件安装与网络请求。
date: 2024-07-20 09:48:41
updated: 2026-06-27 09:48:41
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [Squid,代理]
---

::alert{type="question" title="何意味？"}

在实际运维中，经常遇到部分服务器没有公网访问权限的情况。此时可以找一台同时接入局域网和互联网的机器，安装 Squid 作为代理服务器，让内网机器借道访问外网。

**本篇教程只适用于在内网使用，如果您部署在外网，请自行配置防火墙等策略！！**

::


### 安装（在有网络的服务器上）

```bash
# 安装 Squid

## Centos
yum install -y squid

## Ubuntu\Debian
apt install -y squid


# 启动并设置开机自启
systemctl start squid
systemctl enable squid
```

### 配置 Squid

```bash
# 编辑配置文件
vim /etc/squid/squid.conf
```

找到所有 `http_access deny` 行并注释掉，然后添加：

```bash [/etc/squid/squid.conf]
# 允许所有来源访问
http_access allow all
```

```bash
# 重启使配置生效
systemctl restart squid
```

Squid 默认监听 **3128** 端口。

### 在无网络的服务器上使用代理

```bash
# 配置 HTTP/HTTPS 代理（仅当前终端会话有效）
export http_proxy=http://192.168.0.217:3128
export https_proxy=http://192.168.0.217:3128

# 验证配置
echo $http_proxy
echo $https_proxy

# 测试是否生效
curl -I https://www.baidu.com
```
复制命令区(您可以直接对下方输入框进行修改，随后复制)：  
:copy{code="export https_proxy=http://192.168.0.217:3128 http_proxy=http://192.168.0.217:3128 all_proxy=http://192.168.0.217:3128"}


::alert{type="warning"}
`export` 设置的代理仅对当前 Shell 会话有效，**不能使用 `sudo` 命令**（sudo 不会继承普通用户的环境变量）。

如需 `yum` 通过代理安装软件，请直接在 root 用户下设置，或在 `/etc/yum.conf` 中配置 `proxy`。
::

#### 在 yum.conf 中永久配置代理

```bash
vim /etc/yum.conf

# 添加以下行
proxy=http://192.168.0.217:3128
```

### SSH信息打印

我们可以在SSH登录的欢迎信息上把配置信息打印出来

::alert{type="question"}
在 Ubuntu 22.04 中，这种登录时显示的提示词被称为 MOTD (Message of the Day)。
::

1. 创建自定义提示脚本
在 Ubuntu 中，登录提示是按数字顺序执行 /etc/update-motd.d/ 下的脚本生成的。我们创建一个高优先级的脚本（例如 99-proxy-tip）：
```bash
sudo nano /etc/update-motd.d/99-proxy-tip
```
2. 写入提示内容
将以下代码粘贴进去。你可以使用 ANSI 转义码来给关键信息加粗或上色（例如用红色提醒“切勿使用 sudo”）：
```bash
#!/bin/sh

echo ""
echo "************************ 重要提示 ************************"
echo "此服务器无互联网，如需连接互联网请运行如下命令："
echo "export http_proxy=http://192.168.1.63:3128"
echo "export https_proxy=http://192.168.1.63:3128"
echo ""
# 使用红色加粗显示警告
echo "\033[1;31m警告：请直接在当前用户下运行，切勿使用 sudo！\033[0m"
echo "********************************************************"
echo ""
```
3. 赋予执行权限
只有具备可执行权限的脚本才会被 update-motd 调用：
```bash
sudo chmod +x /etc/update-motd.d/99-proxy-tip
```
4. 即时测试查看效果
不需要重新登录，直接运行以下命令即可预览
```bash
sudo run-parts /etc/update-motd.d/
```

**进阶：如果你想让用户“一键启用”**

为了避免用户手动复制粘贴出错，你可以在 /etc/profile.d/ 下放一个别名（Alias）：
```bash
sudo nano /etc/profile.d/proxy.sh

# 写入
alias setproxy="export http_proxy=http://192.168.1.63:3128 && export https_proxy=http://192.168.1.63:3128"
alias unsetproxy="unset http_proxy && unset https_proxy"
```
这样你在登录提示里就可以写：“输入 setproxy 即可开启上网模式”。