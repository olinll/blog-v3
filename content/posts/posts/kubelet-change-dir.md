---
title: 修改 Kubelet 默认工作目录
description: 介绍如何将 Kubelet 的默认工作目录从系统盘迁移到数据盘，包括修改配置法和软链法两种方案，以及 kubeadm 初始化时直接指定工作目录的方法。
date: 2026-02-05
updated: 2026-02-05
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [容器]
tags: [Kubernetes, 运维]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

Kubelet 默认工作目录为 `/var/lib/kubelet`，存放 volume、plugin 等文件，默认挂载在系统盘。生产环境建议迁移到数据盘。

::alert{type="warning"}

操作前建议先对节点执行禁止调度和驱逐，避免影响线上服务。

::

## 方法一：修改配置法（推荐）

```shell
# 1. 停止 kubelet
systemctl stop kubelet

# 2. 拷贝数据到新路径（以下文件必须保留在原路径，不要移动）
#    - /var/lib/kubelet/config.yaml
#    - /var/lib/kubelet/kubeadm-flags.env
#    - /var/lib/kubelet/pki
#    - /var/lib/kubelet/device-plugins
mkdir -p /app/kubelet
cp -rf /var/lib/kubelet/pods /app/kubelet/
cp -rf /var/lib/kubelet/pod-resources /app/kubelet/
mv /var/lib/kubelet/pods{,.old}
mv /var/lib/kubelet/pod-resources{,.old}

# 3. 添加 root-dir 参数
# CentOS/RHEL: /etc/sysconfig/kubelet
# Ubuntu/Debian: /etc/default/kubelet
echo 'KUBELET_EXTRA_ARGS="--root-dir=/app/kubelet"' >> /etc/default/kubelet

# 4. 重启 kubelet
systemctl daemon-reload && systemctl restart kubelet
systemctl status kubelet

# 5. 确认工作目录已生效
ps -aux | grep kubelet | grep root-dir

# 6. 清理旧目录（可选）
rm -rf /var/lib/kubelet/pods.old /var/lib/kubelet/pod-resources.old
```

::alert{type="tip"}

如果 kubelet 启动失败，通过以下命令查看详细日志排查：

```shell
journalctl -xu kubelet -r
```

::

## 方法二：软链法

```shell
# 1. 停止 kubelet
systemctl stop kubelet

# 2. 拷贝数据到新路径
mkdir -p /data/kubelet
cp -rf /var/lib/kubelet/. /data/kubelet
mv /var/lib/kubelet /var/lib/kubelet.old

# 3. 创建软链
ln -s /data/kubelet /var/lib/kubelet

# 4. 启动 kubelet
systemctl daemon-reload && systemctl restart kubelet

# 5. 清理旧目录（可选）
rm -rf /var/lib/kubelet.old
```

## kubeadm 初始化时直接指定

在 `kubeadm init` 前修改 `kubeadm.conf`，添加 `kubeletExtraArgs`：

```yaml
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
nodeRegistration:
  kubeletExtraArgs:
    root-dir: "/data/kubelet"
```
