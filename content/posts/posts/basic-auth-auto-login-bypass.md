---
title: 跳过登录弹框：实现 Basic Auth 自动授权
description: 详解如何通过 URL 传参、Nginx 反向代理注入 Header 以及浏览器插件等方式，实现对 Basic Auth 认证站点的免密自动登录。
date: 2026-01-03
updated: 2026-06-27 09:08:39
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [网络]
tags: [Basic Auth, Nginx, 安全]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 前言

问题原因呢，是我在整理书签和密码填充工具的时候发现的一个问题，对于这样的弹框，因为是直接弹出在浏览器的，密码填充工具无法进行填充账号密码等信息。

下面的鉴权方式就是：`Basic Auth`

![](./images/basicauth-nopass-cover.webp)

## 什么是Basic Auth？

Basic Auth，也称为 HTTP 基本认证（HTTP Basic Authentication），是一种用于 HTTP 协议的简单认证机制。在 Basic Auth 中，客户端在发送请求时，将用户名和密码以 Base64 编码的形式包含在请求头的 Authorization 字段中发送给服务器，服务器收到请求后，会解码 Authorization 字段并验证用户名和密码。

**如何判断你这个web页面是不是Basic Auth？**

先看弹窗样式，弹窗样式紧贴浏览器的搜索栏(上图)

打开F12 查看请求的接口响应头信息，看到Www-Authenticate的值包含Basic，并且状态码为401

![](./images/basicauth-nopass-1.webp)

## 解决问题

那么堡垒机是怎么解决此类问题的？

selenium操作这里Basic Auth网站的实现方式是：直接把用户名和密码拼接到URL中进行访问。

```sql
from selenium import webdriver
driver = webdriver.Chrome()
driver.get('http://admin:password@10.1.13.80:9100')
```

于是，我就使用他的方式进行拼接了一下，就访问成功了。

::alert{type="warning"}

URL 中的凭据会出现在浏览器历史记录、服务器日志和 Referer 头中，仅在可信内网环境中使用此方式。

::

```sql
# 格式
http://<用户名>:<密码>@<ip地址或域名>:<端口号，如果是80可以不填>
https://<用户名>:<密码>@<ip地址或域名>:<端口号，如果是443可以不填>

#例如：
http://admin:password@10.1.13.80:9100
```

但是会报一个错误`Get server info from frps failed!`

这个错误是正常的用户名密码的参数传递和请求的不符，把url后面的路径删掉在访问就可以了。
