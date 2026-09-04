---
title: "Proxmox VE 9.0 安装与初始配置指南"
description: "从下载安装到换源、内核更新、SR-IOV 核显虚拟化、订阅弹窗去除、存储合并的 PVE 9.0 完整配置流程。"
date: 2026-02-17 00:00:00
updated: 2026-02-17 00:00:00
categories:
  - 技术
tags:
  - PVE
  - Homelab
  - 虚拟化
type: tech
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

PVE 下载地址：https://www.proxmox.com/en/downloads

安装完成后进入配置阶段。

## 一、使用脚本配置（推荐）

推荐使用 [Mapleawaa](https://github.com/Mapleawaa) 的脚本 [PVE-Tools-9](https://github.com/Mapleawaa/PVE-Tools-9)，可全程引导换源、内核更新、SR-IOV 配置等操作。

```bash
wget https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh
chmod +x PVE-Tools.sh
./PVE-Tools.sh
```

脚本主要功能使用顺序：

```
2. 软件源与更新
   1. 更换软件源 → 选择镜像站安全源
   2. 更新系统软件包

3. 启动与内核
   1. 内核管理
      2. 查看可用内核列表
      3. 安装新内核（选最新版）
      4. 设置默认启动内核
      6. 重启系统

4. 直通与显卡（Intel 11-15代 SR-IOV）
   1. Intel 核显虚拟化管理
      1. Intel 11-15代 SR-IOV 核显虚拟化
         release 版本：2025.12.10（注意：2026.02.04 有 bug）
         VFs 数量：1-7，按需填写

1. 系统优化
   1. 删除订阅弹窗
   2. 温度监控管理
   3. CPU 电源模式配置

6. 存储与硬盘
   1. 合并 local 与 local-lvm
   2. Ceph 管理（不需要可卸载）
```

::alert{type="warning"}

使用 SR-IOV 前请先将内核更新到最新版本，否则可能出现兼容问题。

::

## 二、手动配置

### 换源

```bash
rm -rf /etc/apt/sources.list.d/

cat > /etc/apt/sources.list << EOF
deb https://mirrors.ustc.edu.cn/debian/ trixie main contrib non-free non-free-firmware
deb https://mirrors.ustc.edu.cn/debian/ trixie-updates main contrib non-free non-free-firmware
deb https://mirrors.ustc.edu.cn/debian/ trixie-backports main contrib non-free non-free-firmware
deb https://mirrors.ustc.edu.cn/debian-security trixie-security main
deb https://mirrors.ustc.edu.cn/proxmox/debian trixie pve-no-subscription
EOF

apt update
```

### 配置 Intel SR-IOV 核显虚拟化

适用于 Intel 11-15 代（Rocket Lake / Alder Lake / Raptor Lake）。

仓库：[i915-sriov-dkms](https://github.com/strongtz/i915-sriov-dkms)

```bash
nano /etc/default/grub
# 修改为：
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt i915.enable_guc=3 i915.max_vfs=7 module_blacklist=xe"

update-grub

apt install -y build-essential git dkms sysfsutils proxmox-headers-$(uname -r) intel-gpu-tools

# 注意：2026.02.04 版本有 bug，使用 2025.12.10
wget https://github.com/strongtz/i915-sriov-dkms/releases/download/2025.12.10/i915-sriov-dkms_2025.12.10_amd64.deb
dpkg -i i915-sriov-dkms_*_amd64.deb

reboot
```

重启后验证并永久配置：

```bash
lspci | grep VGA

# 临时创建 7 个虚拟核显
echo 7 > /sys/devices/pci0000:00/0000:00:02.0/sriov_numvfs

# 永久配置
echo "devices/pci0000:00/0000:00:02.0/sriov_numvfs = 7" >> /etc/sysfs.conf
```

::alert{type="info"}

- 物理核显 `00:02.0` 不能直通给虚拟机
- 只能直通虚拟核显 `00:02.1 ~ 00:02.7`
- 虚拟机需勾选 ROM-Bar 和 PCIE 选项

::

### 删除订阅弹窗

```bash
sed -Ezi.bak "s/(Ext.Msg.show\({\s+title: gettext\('No valid sub)/void\({ \/\/\1/g" \
  /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js

systemctl restart pveproxy.service
```

### 合并 local 与 local-lvm

```bash
lvremove /dev/pve/data
lvextend -l +100%FREE /dev/pve/root
resize2fs /dev/pve/root
```

最后在 Web UI：数据中心 → 存储 → 移除 `local-lvm` → 编辑 `local` 勾选所有内容。

### 设置 硬盘RDM直通

```bash
ls -l /dev/disk/by-id/

qm set <虚拟机ID> -<总线类型><编号> /dev/disk/by-id/<硬盘ID>

qm set 102 -scsi2 /dev/disk/by-id/ata-Samsung_SSD_860_EVO_500GB_S3Z3NS0N408717X


```

### debian 显卡直通 关闭内置显卡，实现串口输出

1、添加虚拟机

正常安装

机型选择q35

2、 安装完成后

**修改grub配置**

```bash
nano /etc/default/grub

GRUB_CMDLINE_LINUX="console=tty0 console=ttyS0,115200n8"
GRUB_TERMINAL="console serial"
GRUB_SERIAL_COMMAND="serial --unit=0 --speed=115200 --word=8 --parity=no --stop=1"
```

```bash
update-grub
```

**修改虚拟机参数**

显示选择无(none)

添加串行端口(serial0)

添加显卡，勾选主GPU，取消Rom-Bar

```sql

agent: 1
boot: order=scsi0;ide2;net0
cores: 8
cpu: host
hostpci0: 0000:00:02.0,pcie=1,x-vga=1,rombar=0
ide2: local:iso/debian-13.3.0-amd64-DVD-1.iso,media=cdrom,size=3744M
machine: q35
memory: 8192
meta: creation-qemu=9.2.0,ctime=1770166724
name: debian-1panel
net0: virtio=BC:24:11:3F:EB:72,bridge=vmbr0
numa: 0
ostype: l26
scsi0: local:103/vm-103-disk-0.qcow2,iothread=1,size=50G
scsihw: virtio-scsi-single
serial0: socket
smbios1: uuid=d4d6de73-818b-429c-b23d-2030cfec9f99
sockets: 1
tags: 10.0.0.22
vga: none
vmgenid: ca00bb44-7047-4517-9581-242922204242

```
