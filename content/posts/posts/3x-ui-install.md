---
title: 「教程」部署 3X-UI 面板
description: 记录一下搭建3x-ui面板的过程
date: 2026-05-30 18:00:00
updated: 2026-05-30 18:00:00
image: https://img.olinl.com/blog_img/2026/06/20260611124401850-bed1f7.png
categories:
  - 技术
tags:
  - 代理
  - linux
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

这里使用的面板是：[mhsanaei/3x-ui](https://github.com/mhsanaei/3x-ui)

::alert{type="info" title="3X-UI"}
作为原始 X-UI 项目的增强版本，3X-UI 提供了更好的稳定性、更广泛的协议支持和额外的功能。
::

## 一、准备工作

1. 一台 Ubuntu 22.04 服务器
2. 用 Xshell、Finalshell 等工具连上 SSH
3. 全程用 root 权限，别用普通用户

## 二、更新系统依赖

```bash
apt update && apt install curl socat -y
```

## 三、安装 3X-UI

```bash
bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)
```

### 选择安装的数据库

（通常选择`SQLite`）

```bash
═══════════════════════════════════════════
     Database Selection
═══════════════════════════════════════════
  1) SQLite     (default — recommended for < 500 clients)
  2) PostgreSQL (recommended for high client counts / many nodes)
Choose [1]: 1  # 选择 1) SQLite 
```

### 自定义面板端口

（这里可以输入N，让面板随机生成）

```bash
Would you like to customize the Panel Port settings? (If not, a random port will be applied) [y/n]: n # 输入n 随机生成端口
Generated random port: 47176
Port set successfully: 47176
Username and password updated successfully
Base URI path set successfully

```

### 配置SSL证书

这里如果有域名选择1（提供90天有效期的SSL证书，自动更新），没有域名选择2（提供6天有效期的SSL证书，自动更新）

::alert{type="warning" title="注意"}
如果你有域名，请将域名解析至你的vps的ip 以便自动申请SSL证书
::

```bash
═══════════════════════════════════════════
     SSL Certificate Setup (RECOMMENDED)
═══════════════════════════════════════════
SSL is strongly recommended. Skip only if a reverse proxy
or SSH tunnel handles TLS for you.
Let's Encrypt now supports both domains and IP addresses!

Choose SSL certificate setup method:
1. Let's Encrypt for Domain (90-day validity, auto-renews)
2. Let's Encrypt for IP Address (6-day validity, auto-renews)
3. Custom SSL Certificate (Path to existing files)
4. Skip SSL (advanced — behind reverse proxy / SSH tunnel only)
Note: Options 1 & 2 require port 80 open. Option 3 requires manual paths.
Note: Option 4 serves the panel over plain HTTP — only safe behind nginx/Caddy or an SSH tunnel.
Choose an option (default 2 for IP): 1  # 选择使用域名证书
Using Let's Encrypt for domain certificate...
......
[Sat May 30 03:57:52 AM UTC 2026] Install success!
acme.sh installed successfully
Please enter your domain name: 3x.xxxxx.xx # 在这里输入你的域名
Your domain is: 3x.xxxxx.xx, checking it...
Your domain is ready for issuing certificates now...
Please choose which port to use (default is 80): # 直接回车
Your input  is invalid, will use default port 80.
Will use port: 80 to issue certificates. Please make sure this port is open.
Stopping panel temporarily...
......
Issuing certificate succeeded, installing certificates...
Default --reloadcmd for ACME is: systemctl restart x-ui || rc-service x-ui restart
This command will run on every certificate issue and renew.
Would you like to modify --reloadcmd for ACME? (y/n): y # 输入y进行重载证书

        1. Preset: systemctl reload nginx ; systemctl restart x-ui
        2. Input your own command
        3. Keep default reloadcmd
Choose an option: 1 # 重启nginx和面板服务
Reloadcmd is: systemctl reload nginx ; systemctl restart x-ui
......
Auto renew succeeded, certificate details:
total 20K
drwxr-xr-x 2 root root 4.0K May 30 03:58 .
drwxr-xr-x 3 root root 4.0K May 30 03:58 ..
-rw-r--r-- 1 root root 4.7K May 30 03:58 fullchain.pem
-rw------- 1 root root  227 May 30 03:58 privkey.pem
Would you like to set this certificate for the panel? (y/n): y #将面板设置为此证书
set certificate public key success
set certificate private key success
set certificate for subscription public key success
set certificate for subscription private key success
Certificate paths set for the panel

Access URL: https://3x.xxxxx.xx:0000/xxxxxxxxx/
Panel will restart to apply SSL certificate...
✓ SSL certificate configured successfully with domain: 3x.xxxxx.xx

═══════════════════════════════════════════
     Panel Installation Complete!
═══════════════════════════════════════════
Username:    xxxxxxxxxxxxxx
Password:    xxxxxxxxxxxxxxxx
Port:        0000
WebBasePath: xxxxxxxxx
Database:    SQLite (/etc/x-ui/x-ui.db)
Access URL:  https://3x.xxxxx.xx:0000/xxxxxxxxx/
API Token:   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
═══════════════════════════════════════════
⚠ IMPORTANT: Save these credentials securely!
⚠ SSL Certificate: Enabled and configured
Start migrating database...
Migration done!
Service files not found in tar.gz, downloading from GitHub...
Setting up systemd unit...
Created symlink /etc/systemd/system/multi-user.target.wants/x-ui.service → /etc/systemd/system/x-ui.service.
x-ui v3.2.0 installation finished, it is running now...

┌───────────────────────────────────────────────────────┐
│  x-ui control menu usages (subcommands):              │
│                                                       │
│  x-ui              - Admin Management Script          │
│  x-ui start        - Start                            │
│  x-ui stop         - Stop                             │
│  x-ui restart      - Restart                          │
│  x-ui status       - Current Status                   │
│  x-ui settings     - Current Settings                 │
│  x-ui enable       - Enable Autostart on OS Startup   │
│  x-ui disable      - Disable Autostart on OS Startup  │
│  x-ui log          - Check logs                       │
│  x-ui banlog       - Check Fail2ban ban logs          │
│  x-ui update       - Update                           │
│  x-ui legacy       - Legacy version                   │
│  x-ui install      - Install                          │
│  x-ui uninstall    - Uninstall                        │
└───────────────────────────────────────────────────────┘
```

### 安装完成

安装完成后，将最后的内容复制下来，以便后续访问

```bash
═══════════════════════════════════════════
     Panel Installation Complete!
═══════════════════════════════════════════
Username:    xxxxxxxxxxxxxx
Password:    xxxxxxxxxxxxxxxx
Port:        0000
WebBasePath: xxxxxxxxx
Database:    SQLite (/etc/x-ui/x-ui.db)
Access URL:  https://3x.xxxxx.xx:0000/xxxxxxxxx/
API Token:   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
═══════════════════════════════════════════
```

:::alert{title="信息"}
**Username**：面板登录的用户名  
**Password**：面板登录的密码  
**Port**：面板登录的端口  
**WebBasePath**：面板的URL路径  
**Database**：面板的数据存储位置  
**Access URL**：最终的访问地址  
**API Token**：新版本的Api接口Token，安装时自动创建，可在后台删除
:::

:::alert{type="warning" title="关于SSL证书"}
如果你的面板没有配置SSL证书，切勿直接在浏览器中访问，需要使用SSH隧道访问，否则后期容易出现安全漏洞等问题
:::

### 开启 BBR 加速

:::alert{type="question" title="什么是BBR?"}
BBR 是 Google 设计的 TCP 拥塞控制算法，能根据网络带宽和延迟动态调整传输速度，提升网络吞吐量并降低延迟。
:::

**一键开启BBR加速**

```bash
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf sysctl -p
```

执行完用`lsmod | grep bbr`检查，出现 `bbr` 就成功。

## 四、配置面板

新版的面板多出来几个选项 客户端、节点  
客户端：将以前的入站列表配置的客户端单独伶出来了，另外客户端的群组也可以单独配置  
节点：顾名思义就是可以联合多台vps进行配置了，同时也可以实现订阅。

### 修改基本配置

安装完成后，URL路径都是默认值，很容易被扫描出来，所以我们要进行修改  
面板设置-->订阅设置-->常规-->**URL路径**  
面板设置-->订阅设置（Formats）-->常规-->**Clash URI 路径**

其他的安全设置可自行参考 面板设置-->安全设定

:::pic
---
src: https://img.olinl.com/blog_img/2026/06/20260611123827936-0902b9.png
---
#caption
安全设置
:::

:::alert{type="warning" title="注意"}
所有的配置修改完成后需要保存并重启面板才能生效。
:::

### 添加节点（可选）

如果你只有一台VPS且不愿意折腾，可以跳过  
默认入站配置的是本机配置，所以该配置可选。

点击左侧菜单的节点，点击页面的添加节点按钮

:::pic
---
src: https://img.olinl.com/blog_img/2026/06/20260611123923573-5c615a.png
---
#caption
添加节点
:::

地址就填写上面配置SSL的域名或者IP地址  
`Base Path`需要填写安装完成时的`WebBasePath`或者到 `面板设置-->常规--> URL路径` 里面进行查看  
允许私有地址：如果VPC处于同一局域网，或者有组网工具，可启用此选项  
`API Token`：远程面板在 设置 → API 令牌 中显示其 API 令牌

填写完成后，点击测试连接，测试通过后，即可。

### 添加入站

这里只介绍2种协议（`vless+websocket+tls`、`vless+xhttp+reality`）

:::alert{type="question" title="科普"}
1. VLESS + WebSocket + TLS
   **必须拥有并解析域名**，通过 WebSocket 将流量伪装成正常的 HTTPS 网站浏览，由 TLS 证书提供强制加密与身份验证。
2. VLESS + xHTTP + Reality
   **无需域名**，通过协议直接借用目标网站的 TLS 证书与指纹特征进行模拟，在免去域名配置的同时实现极高的隐蔽性与抗封锁能力。
**如果想要了解更多，请自行AI**
:::

**vless+websocket+tls**

点击添加入站，**基础配置**，协议选择`vless`。**传输**，传输选择`WebSocket`，路径自定一个不易猜到的，以/开头。**安全**，选择`TLS`，数字证书1点击`从面板设置证书`。随后点击保存更改即可。其他配置保持默认即可。

整体配置如下：

:::pic
---
src: https://img.olinl.com/blog_img/2026/06/20260611124119349-45eff8.png
---
#caption
vless-websocket-tls 添加入站信息
:::

**vless+xhttp+reality**

点击添加入站，**基础配置**，协议选择`vless`。**传输**，传输选择`XHTTP`，路径自定一个不易猜到的，以/开头。**安全**，选择Reality，目标和SNI随机一个合适的，然后下面点击获取新证书。随后点击保存更改即可。其他配置保持默认即可。

:::alert{type="question" title="寻找目标域名的条件："}
**基础条件**：
- 不要使用跳转域名（使用跳转完成的域名）
- 目标网站必须支持 TLS1.3
- 目标网站必须支持 X25519
- 目标网站必须支持HTTP/2 (H2)
- 目标域名必须和 SNI 匹配
**加分项**：
- 尽量别用带 CDN 的网站当目标站
- 尽量不要使用热门网站
- 尽量选择 TLS 握手延迟小的网站
- IP 相近 （使用 RealiTLScanner 扫描即可）
:::

整体配置如下：

:::pic
---
src: https://img.olinl.com/blog_img/2026/06/20260611124242011-b97c1d.png
---
#caption
less-xhttp-reality 添加入站信息
:::

### 添加客户端

点击菜单的客户端，点击添加客户端，填写完**邮箱**，**关联入站** 点击创建即可。

:::pic
---
src: https://img.olinl.com/blog_img/2026/06/20260611124255583-a122ac.png
---
#caption
添加客户端
:::

### 连接节点

点击客户端前面操作栏的二维码，可以扫码导入订阅信息或者分入站导入。

:::pic
---
src: https://img.olinl.com/blog_img/2026/06/20260611124303601-b4fce9.png
---
#caption
连接节点信息
:::



点击详情按钮可查看详情，和导入链接，订阅链接，可导入相应软件进行订阅

:::pic
---
src: https://img.olinl.com/blog_img/2026/06/20260611124311178-a3689a.png
---
#caption
连接节点-详情
:::

## 鸣谢

::link-card
---
title: 你真的会配置Reality？科学上网翻车频发，其实节点搭建这些坑90%的人都踩过！Reality部署全流程拆解！
link: https://v2rayssr.com/reality-2.html
---
::
