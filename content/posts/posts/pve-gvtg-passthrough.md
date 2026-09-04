---
title: PVE Intel 核显 GVT-g 虚拟化教程
description: 在 Proxmox VE 上为 Intel 5-10 代 CPU 开启 GVT-g 核显虚拟化，实现多个虚拟机共享宿主机集成显卡，适合需要图形加速但不独占 GPU 的场景。
date: 2026-02-15
updated: 2026-02-15
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [虚拟化]
tags: [PVE, Homelab, 虚拟化, 核显]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

GVT-g（Intel Graphics Virtualization Technology - g）是 Intel 提供的轻量级 GPU 虚拟化技术，允许多个虚拟机共享宿主机的集成显卡（iGPU），同时为每个虚拟机提供接近原生的图形性能。

与传统 PCIe 直通不同，GVT-g 无需独占整个 GPU，宿主机仍可保留显示输出。

**支持范围：** Intel Broadwell（5代）到 Comet Lake（10代），不支持 Ice Lake（10代移动处理器）。

> 需要独占直通？参见 [PVE Intel 核显独占直通教程](/posts/pve-gpu-passthrough///)

::alert{type="info"}

Intel 11 代及以上请使用 SR-IOV 方案，参见 [PVE 9.0 安装与初始配置指南](/posts/pve9-install-guide///)。

::

## 一、确认显卡支持

```bash
lspci -vs 00:02.0

# 查看支持的虚拟显卡类型
ls /sys/bus/pci/devices/0000:00:02.0/mdev_supported_types/
```

各类型显存说明：

| 类型 | 显存范围 | 最大分辨率 |
|---|---|---|
| `i915-GVTg_V5_1` | 512MB ~ 2048MB | 1920x1200 |
| `i915-GVTg_V5_2` | 256MB ~ 1024MB | 1920x1200 |
| `i915-GVTg_V5_4` | 128MB ~ 512MB | 1920x1200 |
| `i915-GVTg_V5_8` | 64MB ~ 384MB | 1024x768 |

## 二、启用 GVT-g

### 1. 修改 grub

```bash
nano /etc/default/grub
# 修改为：
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt i915.enable_gvt=1"
```

### 2. 启用必要内核模块

```bash
nano /etc/modules
# 添加以下内容：
vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd
kvmgt
```

### 3. 重载配置并重启

```bash
update-grub
update-initramfs -u -k all
proxmox-boot-tool refresh
reboot
```

### 4. 验证 IOMMU 已启用

```bash
dmesg | grep -e DMAR -e IOMMU -e AMD-Vi
```

## 三、创建虚拟机

- 机型选择：**q35**
- 固件：**UEFI**
- 显卡：直接在硬件页面添加 GVT-g 设备

## 四、监控核显使用情况

```bash
apt install intel-gpu-tools
intel_gpu_top
```

## 五、Ubuntu 显卡性能测试

```bash
# glmark2 基准测试
sudo apt install glmark2
glmark2

# glxgears 快速测试
sudo apt install mesa-utils
glxgears
```

## 六、安装硬件加速相关软件包

用于 OpenCL、硬件编解码、媒体 SDK 等：

```bash
sudo apt install -y \
  intel-opencl-icd intel-level-zero-gpu level-zero \
  intel-media-va-driver-non-free libmfx1 libmfxgen1 libvpl2 \
  libigdgmm12 vainfo hwinfo clinfo
```

## 七、Linux系统安装Nvidia驱动

```bash
# 安装依赖和headers
apt install build-essential dkms mdevctl linux-headers-$(uname -r)

# 屏蔽开源驱动
echo "blacklist nouveau" >> /etc/modprobe.d/pve-blacklist.conf

# 重启
reboot

#安装驱动
chmod 755 NVIDIA-Linux-x86_64-580.126.16.run
./NVIDIA-Linux-x86_64-580.126.16.run

# 每秒刷新一次
watch -n 1 nvidia-smi
```
