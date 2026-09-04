---
title: WordPress建站
description: 详解在WordPress中建站的步骤。
date: 2025-11-11
updated: 2025-11-11
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [WordPress]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

> **什么是WordPress?**
> 
> WordPress是一款免费开源的内容管理系统，它是目前世界上使用最广泛的网站建设平台之一。WordPress可以帮助用户快速创建和管理各种类型的网站，例如博客、企业网站、电子商务网站等。
> 
> WordPress是使用PHP语言开发的博客平台，用户可以在支持PHP和MySQL数据库的服务器上架设属于自己的网站。也可以把WordPress当做一个内容管理系统

WordPress官网：[WordPress](https://cn.wordpress.org/)

> 我之前是使用WordPress的，不得不承认，确实好用，自定义的地方很多很多。但是遇到了几个问题，让我考虑放弃这款程序。
> - 网站加载卡顿：因为WordPress体量比较大，而且使用PHP开发，访问时加载较慢，不适合作为个人轻量级网站使用，适合作为大型网站，或公司站点等。当然可以优化，但是比较耗费精力，而且需要加CDN等才可以做到快速访问。
> - 高度自定义：一把双刃剑，我们可以对站点进行各种各样的美化，做各种组件，效果，但是同时，另一面，增加了越来越多的组件，各种各样的自定义配置，使得站点比较卡顿。
>
> ---
>
> `以上仅代表我个人观点，但是我个人认为WordPress还是非常好用的一款博客程序。`

## 部署

部署的方式分为2种，`Docker部署`、`直接部署`。

- 使用Docker部署的方式比较方便，适用于测试环境，迁移数据方便，但是修改php配置不是很方便。
- 使用直接部署的方式，直接部署到服务器上，适用于生产环境，可以随时对目前的请求压力进行调整php配置，或者其他操作，缺点就是部署较为繁琐。

::alert{type="tip"}

推荐：测试环境用 Docker 部署快速验证，生产环境用直接部署以便灵活调优。

::

### Docker部署

安装完Docker之后，直接运行`docker run`命令即可，个人习惯使用`docker-compose.yaml`文件，便于存储和修改配置。所以这里展示`docker-compose`的方法进行部署。

::alert{type="warning"}

数据库密码为硬编码示例，生产环境应使用环境变量文件（`.env`）或 Docker Secrets 管理敏感信息。

::

```yaml
services:
  redis:
    image: 'docker.olinl.com.cn/wordpress:6.6.0'
    container_name: wordpress
    hostname: wordpress
    restart: always
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./data:/var/www/html
      - ./conf/uploads.ini:/usr/local/etc/php/conf.d/uploads.ini
    environment: # 数据库链接信息
      WORDPRESS_DB_HOST: mysql:3306
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_DB_PASSWORD: root
      WORDPRESS_DB_USER: root
      WORDPRESS_DEBUG: 0
# 个人配置
    networks:
      - net
networks:
  net:
    external: true
    name: lin-net
```

uploads.ini 配置信息

```ini
file_uploads = On
memory_limit = 256M
upload_max_filesize = 60M
post_max_size = 50M
max_execution_time = 360


extension=ixed.8.2.lin
```

### 直接部署

配置完PHP、nginx、MySQL环境之后直接解压到网站根目录，然后访问绑定ip+端口或者域名就可以了。

::alert{type="info"}

Nginx 配置参见：[Nginx 安装与配置指南](/posts/nginx-guide)

::

这里部署环境推荐使用[宝塔面板](https://www.bt.cn/)、或者[LNMP](https://lnmp.org/)一键安装包。

- 宝塔面板安装页：[bt.cn](https://www.bt.cn/new/download.html)
- LNMP安装页：[LNMP.COM](https://lnmp.org/download.html)
