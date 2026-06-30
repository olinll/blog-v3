# 跳过登录弹框：实现 Basic Auth 自动授权

> 详解如何通过 URL 传参、Nginx 反向代理注入 Header 以及浏览器插件等方式，实现对 Basic Auth 认证站点的免密自动登录。

## 前言

问题原因呢，是我在整理书签和密码填充工具的时候发现的一个问题，对于这样的弹框，因为是直接弹出在浏览器的，密码填充工具无法进行填充账号密码等信息。

下面的鉴权方式就是：`Basic Auth`

<pic caption="Basic Auth鉴权方式实例" src="https://oss.olinl.com/basic-auth-auto-login-bypass/20260627091109_dx09.webp">



</pic>

## 什么是Basic Auth？

Basic Auth，也称为 HTTP 基本认证（HTTP Basic Authentication），是一种用于 HTTP 协议的简单认证机制。在 Basic Auth 中，客户端在发送请求时，将用户名和密码以 Base64 编码的形式包含在请求头的 Authorization 字段中发送给服务器，服务器收到请求后，会解码 Authorization 字段并验证用户名和密码。

**如何判断你这个web页面是不是Basic Auth？**

先看弹窗样式，弹窗样式紧贴浏览器的搜索栏(上图)

打开F12 查看请求的接口响应头信息，看到Www-Authenticate的值包含Basic，并且状态码为401

<pic caption="验证是否为Basic Auth" src="https://oss.olinl.com/basic-auth-auto-login-bypass/20260627091054_88fo.webp">



</pic>

## 解决问题

那么堡垒机是怎么解决此类问题的？

selenium操作这里Basic Auth网站的实现方式是：直接把用户名和密码拼接到URL中进行访问。

```py
from selenium import webdriver
driver = webdriver.Chrome()
driver.get('http://admin:password@10.1.13.80:9100')
```

于是，我就使用他的方式进行拼接了一下，就访问成功了。

<alert :card="true" type="warning">

URL 中的凭据会出现在浏览器历史记录、服务器日志和 Referer 头中，仅在可信内网环境中使用此方式。

</alert>

格式如下：

<copy :prompt="true" code="http://<用户名>:<密码>@<ip地址或域名>:<端口号，如果是80可以不填>">



</copy>

<copy :prompt="true" code="https://<用户名>:<密码>@<ip地址或域名>:<端口号，如果是443可以不填>">



</copy>

例如：<br />

`http://admin:password@10.1.13.80:9100`

<alert :card="true" type="warning" title="使用FRP会报一个错误">

`Get server info from frps failed!`

这个错误是正常的用户名密码的参数传递和请求的不符，把url后面的路径删掉在访问就可以了。

</alert>
