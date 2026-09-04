---
title: PVE 疑难解答与系统优化
description: 汇总 Proxmox VE 常见问题的解决方法，包括 CPU 调度优化、温度传感器显示、网卡配置修复、qemu-guest-agent 安装及黑群晖型号选择备忘。
date: 2026-02-14
updated: 2026-02-14
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [虚拟化]
tags: [PVE, Homelab, 运维]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

## 一、CPU 调度模式优化

```bash
apt install cpufrequtils
cpufreq-info

# 设置为按需动态调频（推荐）
cpupower -c all frequency-set -g ondemand
systemctl restart cpufrequtils
```

| 模式 | 说明 |
|---|---|
| `performance` | 固定最高频率 |
| `powersave` | 固定最低频率 |
| `ondemand` | 按需快速动态调频（推荐）|
| `conservative` | 渐变式调频 |
| `schedutil` | 调度器回调触发调频 |

## 二、添加温度传感器显示

```bash
curl -Lf -o /tmp/temp.sh \
  https://raw.githubusercontent.com/a904055262/PVE-manager-status/main/showtempcpufreq.sh
chmod +x /tmp/temp.sh
/tmp/temp.sh remod
```

来源：[右键论坛](https://www.right.com.cn/forum/thread-6754687-1-1.html)

## 三、网卡配置修复（加网卡后无法进入后台）

查看当前网络配置，找到绑定管理 IP 的网桥：

```bash
vim /etc/network/interfaces
```

找到类似如下配置：

```
auto vmbr2
iface vmbr2 inet static
    address 192.168.1.100/24
    gateway 192.168.1.1
    bridge-ports enp67s0   # 修改此处为目标网卡
    bridge-stp off
    bridge-fd 0
```

修改 `bridge-ports` 为目标网卡后刷新网络：

```bash
systemctl restart networking
ping <pve-ip> -c 4
```

## 四、安装 qemu-guest-agent

在虚拟机内安装，使 PVE 控制台可直接显示虚拟机 IP，提升监控精度。

**Linux**

```bash
# Ubuntu / Debian
apt install -y qemu-guest-agent

# CentOS / RHEL
yum install -y qemu-guest-agent

systemctl enable qemu-guest-agent
systemctl start qemu-guest-agent
systemctl status qemu-guest-agent
```

**Windows**

下载 [virtio-win](https://virtio-win.github.io/) 驱动包，安装 ISO 内的 `virtio-win-gt-x64`，可选安装 QEMU Guest Agent 和 SPICE Agent 提升远程体验。

安装 Intel 核显驱动：[Intel 显卡驱动下载](https://www.intel.cn/content/www/cn/zh/search.html#cf-tabfilter=Downloads)

## 五、黑群晖型号选择备忘

rr 引导镜像：https://github.com/RROrg/rr/releases

创建引导盘：

```bash
qm importdisk 103 /var/lib/vz/template/iso/rr.img local
```

**推荐型号速查：**

| 场景 | 推荐型号 |
|---|---|
| CPU 核心 < 24 | DS3622xs+、RS1619xs+ |
| CPU 核心 > 24 | FS6400、HD6500 |
| 11-14 代 Intel iGPU | SA6400 |
| 4-10 代 Intel iGPU（NVMe < 2）| DS1019+、DS918+ |
| 独显使用 | SA6400、DS1819+ |
| 不使用硬解 + HBA 卡 | DS3622xs+ |
| 免费 8 路摄像头 | DVA3221、DVA3219、DVA1622 |

::alert{type="tip"}

不知如何选型可直接使用热门型号：DS3622xs+、DS1019+、DS918+、SA6400

::

## 六、直通PCIE设备报错

直通了PCIE设备，无法启动报错：`TASK ERROR: cannot prepare PCI pass-through, IOMMU not present`

### 1、BIOS设置

在BIOS里面必须开启Intel Virtualization Technology (VT-x)、开启虚拟化 等选项

必须开启Intel VT for Directed I/O (VT-d)等

### 2、内核启动参数

Proxmox 需要通过内核参数来初始化 IOMMU。具体操作取决于你的系统是使用 **GRUB** 还是 **systemd-boot** 引导。

#### **确定引导方式**

在终端运行：

```bash
[ -d /sys/firmware/efi ] && echo "EFI" || echo "BIOS/Legacy"
```

- 如果是 BIOS/Legacy，必然使用 GRUB。
- 如果是 EFI，检查是否存在 /etc/kernel/cmdline。如果有，则是 systemd-boot；否则通常仍为 GRUB。
