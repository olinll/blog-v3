---
title: 多个docker-compose实例共享网络
description: 让你的多个docker-compose实例共同使用一个内部网络
date: 2026-01-25
updated: 2026-01-25
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Docker]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 创建容器内的网络

```yaml
services:
  app:
    networks:
      - net

networks:
  net:
    driver: bridge
    name: app-network
```

## 绑定容器外的网络

::alert{type="info"}

使用 `external: true` 时，目标网络必须预先通过 `docker network create` 创建，否则 compose 启动会报错。

::

**这个网络必须存在**

```yaml
services:
  app:
    networks:
      - net

networks:
  net:
    external: true
    name: lin-net
```

## 绑定ip地址

```yaml
services:
  app:
    networks:
      net:
        ipv4_address: 172.20.0.102
```

## Docker网络允许外部访问

::alert{type="warning"}

`iptables -A FORWARD -j ACCEPT` 会放行所有转发流量，存在安全风险。生产环境应使用更精确的 iptables 规则限制来源和目标。

::

```shell
# 临时放行所有转发流量
iptables -A FORWARD -j ACCEPT

yum install iptables-services
service iptables save
systemctl enable iptables
systemctl start iptables
```
