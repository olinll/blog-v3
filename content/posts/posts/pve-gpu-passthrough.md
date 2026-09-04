---
title: PVE Intel 核显独占直通教程
description: 在 Proxmox VE 上为虚拟机配置 Intel 核显 PCIe 独占直通，包含 IOMMU 启用、内核模块加载、VFIO 绑定及虚拟机配置的完整流程。
date: 2026-02-16
updated: 2026-02-16
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [虚拟化]
tags: [PVE, Homelab, 虚拟化, 核显]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

PCIe 直通（Passthrough）将物理显卡独占分配给单个虚拟机，虚拟机获得接近裸机的 GPU 性能。与 GVT-g 共享模式不同，直通后宿主机无法使用该显卡。

> 相关文章：[PVE 9.0 安装与初始配置指南](/posts/pve9-install-guide) · [PVE Intel 核显 GVT-g 虚拟化教程（共享模式）](/posts/pve-gvtg-passthrough)

## 一、查看 IOMMU 分组

在配置直通前，先确认设备的 IOMMU 分组情况：

```bash
for d in /sys/kernel/iommu_groups/*/devices/*; do
    n=${d#*/iommu_groups/*}; n=${n%%/*}
    printf 'IOMMU Group %s ' "$n"
    lspci -nns "${d##*/}"
done
```

理想情况下，核显和声卡应在不同的 IOMMU 分组，否则需要添加 `pcie_acs_override` 参数强制拆分。

## 二、启用 IOMMU

```bash
nano /etc/default/grub

# Intel CPU
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt initcall_blacklist=sysfb_init pcie_acs_override=downstream,multifunction pci=nommconf"

# AMD CPU
GRUB_CMDLINE_LINUX_DEFAULT="quiet iommu=pt initcall_blacklist=sysfb_init pcie_acs_override=downstream,multifunction pci=nommconf"
```

参数说明：

| 参数 | 说明 |
|---|---|
| `intel_iommu=on` | 启用 Intel VT-d |
| `iommu=pt` | Pass-through 模式，提升未直通设备性能 |
| `initcall_blacklist=sysfb_init` | 屏蔽帧缓冲初始化，防止干扰直通 |
| `pcie_acs_override=downstream,multifunction` | 强制拆分 IOMMU 分组 |
| `pci=nommconf` | 禁用 PCI 配置空间内存映射 |

## 三、加载内核模块

```bash
nano /etc/modules
# 添加：
vfio
vfio_iommu_type1
vfio_pci
# vfio_virqfd  # 内核 6.2 以下需要取消注释
```

## 四、屏蔽宿主机驱动（可选）

防止宿主机占用显卡，确保虚拟机能独占：

```bash
nano /etc/modprobe.d/pve-blacklist.conf
# 添加：
blacklist i915
blacklist nouveau
blacklist nvidia
blacklist amdgpu
blacklist radeon
blacklist snd_hda_intel
blacklist snd_hda_codec_hdmi
blacklist snd_hda_codec
blacklist snd_hda_core
```

## 五、绑定设备到 VFIO

查看核显和声卡的 PCI ID：

```bash
lspci -D -nn | grep VGA
lspci -D -nn | grep Audio
# Intel 核显通常为 0000:00:02.0，声卡为 0000:00:1f.3
```

```bash
nano /etc/modprobe.d/vfio.conf
# 填入提取到的 ID，例如：
options vfio-pci ids=8086:3e96,8086:a348
```

## 六、重载配置并重启

```bash
update-grub
update-initramfs -u -k all
proxmox-boot-tool refresh
reboot

# 验证 IOMMU 已启用
dmesg | grep -e DMAR -e IOMMU -e AMD-Vi
```

## 七、虚拟机配置

- 机型：**i440fx**（不能选 q35）
- 固件：**OVMF UEFI**
- CPU 类型：**host**

编辑虚拟机配置文件（以 ID 100 为例）：

```bash
nano /etc/pve/qemu-server/100.conf

# 添加以下内容（Intel 核显）
args: -set device.hostpci0.addr=02.0 -set device.hostpci0.x-igd-gms=1 -set device.hostpci0.x-igd-opregion=on
hostpci0: 0000:00:02.0,legacy-igd=1,romfile=vbios_intel_uefi.rom
# hostpci1: 0000:00:1f.3  # 可选：同时直通声卡
```

## 八、允许不安全中断（部分平台需要）

```bash
nano /etc/modprobe.d/iommu_unsafe_interrupts.conf
# 添加：
options vfio_iommu_type1 allow_unsafe_interrupts=1
```

::alert{type="warning"}

此选项可能使系统不稳定，仅在直通无法正常工作时尝试。

::
