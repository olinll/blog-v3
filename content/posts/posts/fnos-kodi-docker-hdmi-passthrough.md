---
title: NAS 变身播放机：Kodi Docker-Compose 硬解直通手册
description: 在 FNOS 等 NAS 系统下用 Docker Compose 部署 Kodi，直通 Intel 核显实现 VA-API 硬解、HDMI 输出与手机遥控，把 NAS 变成客厅播放机。
date: 2026-03-07
updated: 2026-03-07
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [虚拟化]
tags: [FNOS, Kodi, Docker, Docker Compose, HDMI, VA-API, Intel, HomeLab, 多媒体]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

FNOS 这类 x86 NAS 自带 HDMI 口，空着不插电视有点浪费。直接在 NAS 上跑一个 Kodi 容器、直通 Intel 核显做硬解，就能把 NAS 当成客厅播放机——媒体文件就在本地，不用经过网络中转，4K HEVC 播放 CPU 占用极低。本文记录完整部署流程，包括特权容器、网络模式、VA-API 硬解验证与遥控配置。

## 1. 前置条件

- **FNOS 已经正常运行**（飞牛 OS 或其他基于 Debian/Ubuntu 的 NAS 系统都适用）
- **NAS 宿主机 HDMI 接入电视或显示器**——这是整套方案的基石，HDMI 没接东西就没有"直通"一说
- **CPU 带 Intel 核显**（常见如 N100、N5105、J4125、11 代以上 i3/i5 等）；核显是 VA-API 硬解的硬件基础
- **Docker + Docker Compose** 已安装
- 具备 SSH 终端访问权限

## 2. Docker Compose 配置

在 NAS 上新建一个目录（比如 `/vol1/1000/docker/kodi`），创建 `docker-compose.yaml`：

```yaml
services:
  syno-kodi:
    image: wjz304/syno-kodi:latest
    container_name: kodi
    privileged: true
    stdin_open: true
    tty: true
    restart: unless-stopped
    # 网络模式二选一（见 3.2 节对比），默认用 bridge 模式显式映射端口
    # network_mode: host
    ports:
      - "8080:8080"             # Kodi Web UI (Chorus2)
      - "9090:9090"             # JSONRPC over TCP
      - "9777:9777/udp"         # EventServer（Kore 遥控 App）
    volumes:
      - /dev/dri:/dev/dri       # Intel 核显（VA-API 硬解）
      - /dev/snd:/dev/snd       # 音频输出（ALSA）
      - /dev/input:/dev/input   # 键鼠 / 遥控输入
      - /run/udev:/run/udev:ro  # 设备热插拔事件
      - ./data:/root            # Kodi 配置持久化（~/.kodi）
      - /vol1/1000/download/media:/media  # 媒体库路径（按需替换）
```

## 3. 配置项逐项说明

### 3.1 `privileged: true` 的安全取舍

`privileged: true` 等于把容器当半个 root 对待——能访问宿主机所有设备、加载内核模块、修改 sysctl。对 Kodi 这种只要用 GPU / 音频 / 输入设备的场景，属于过度授权。

::alert{type="warning" title="推荐：先试用最小权限，实在不行再退回特权"}

对安全敏感时可以尝试用精确的 `devices` + `group_add` 替代 `privileged`：

```yaml
# 去掉 privileged: true
devices:
  - /dev/dri:/dev/dri
  - /dev/snd:/dev/snd
  - /dev/input:/dev/input
group_add:
  - video
  - audio
  - input
```

如果改完 CEC、HDMI framebuffer 输出不正常，再退回 `privileged: true`——某些 DRM master 的场景确实需要特权才能拿到完整控制。

::

### 3.2 网络模式：bridge vs host

Kodi 容器的网络模式是本文最值得展开的一处，两种模式各有明显的优缺点：

| 模式 | 优点 | 缺点 |
|------|------|------|
| **bridge（默认）** | 网络隔离性好、端口边界清晰；与其他容器/宿主机服务互不干扰 | **HDMI-CEC 设备发现可能失败**；DLNA / UPnP / AirPlay / Bonjour 自动发现不工作；Kore App 局域网扫描可能扫不到 |
| **host（推荐）** | CEC 正常；所有自动发现协议（SSDP、mDNS）工作；性能略好 | 容器直接用宿主机网络栈，端口冲突风险（必须确保宿主机 8080/9090 没被占用）；隔离性弱 |

**推荐用 host 模式**，除非你的 NAS 上已经有其他服务占用了 8080 等端口。切换方式：

```yaml
# 取消这一行的注释
network_mode: host
# 同时把 ports: 段整块删掉（host 模式下端口映射不起作用）
```

::alert{type="tip"}

如果不知道宿主机 8080 有没有被占用，先 `ss -lntp | grep 8080` 确认一下，再决定用哪个模式。

::

### 3.3 设备挂载说明

| 挂载 | 作用 |
|------|------|
| `/dev/dri` | Intel 核显节点，VA-API 硬解的入口 |
| `/dev/snd` | ALSA 声卡设备，HDMI 音频输出 |
| `/dev/input` | 键盘 / 鼠标 / USB 遥控接收器 |
| `/run/udev:ro` | 让容器感知宿主机的设备热插拔事件（CEC、U 盘挂载） |

严格讲，设备类挂载更适合用 `devices:` 段声明（语义更准确），但在 `privileged: true` 下写在 `volumes:` 里也能正常工作，功能等价。

### 3.4 数据卷说明

- **`./data:/root`**：Kodi 的全部用户数据会写到容器内 `/root`，映射到宿主机当前目录下的 `data` 子文件夹（即 `~/.kodi`：媒体库数据库、刮削缩略图、插件、设置都在这里）。

  ::alert{type="warning"}

  删除 `./data` 目录等于重置 Kodi——所有媒体库、观看进度、插件配置全部丢失，需要重新扫库。建议定期备份这个目录。

  ::

- **`/vol1/1000/download/media:/media`**：FNOS 特有的存储路径约定：
  - `/vol1/` 是第一个存储池的挂载点
  - `1000/` 是 UID 为 1000 的用户空间目录
  - `download/media/` 是具体的媒体文件夹

  **如果你不是 FNOS 用户，或者 UID 不同，替换成自己的媒体目录即可**。通用写法：

  ```yaml
  - /mnt/media:/media
  # 或
  - /data/movies:/media
  ```

### 3.5 端口含义

| 端口 | 协议 | 作用 |
|------|------|------|
| `8080` | TCP (HTTP) | Kodi Web UI (Chorus2)，浏览器访问管理、看媒体库状态 |
| `9090` | TCP | JSONRPC 远程控制接口（程序化调用用） |
| `9777` | **UDP** | EventServer，Kore 等遥控 App 发按键事件走这个端口 |

::alert{type="warning" title="9777 必须加 /udp"}

`9777` 是 UDP 协议，Docker Compose 里 `"9777:9777"` 会默认当成 TCP 映射，结果是 Kore App 表面能连上但按键无效。**务必写成 `"9777:9777/udp"`**。

::

## 4. 启动与验证

### 4.1 启动容器

```bash
docker compose up -d
docker compose logs -f kodi
```

看到 `Kodi is starting` 或 Kodi 启动日志即表示容器跑起来了。

### 4.2 确认 HDMI 输出

宿主机接好的电视 / 显示器上应该**直接出现 Kodi 的启动画面**（可能要先切到对应 HDMI 输入源）。黑屏时的排查：

- 宿主机 HDMI 线是否实际接着——FNOS 开机时如果能看到 bootloader 画面，说明硬件层 HDMI 工作正常
- `docker compose logs kodi` 有没有 DRM / framebuffer 相关错误
- FNOS 宿主机上有没有其他进程已经占用了显卡（部分 FNOS 版本自带桌面环境）

### 4.3 验证 VA-API 硬解

**第一步：容器内确认驱动可用**

```bash
docker exec -it kodi vainfo
```

输出应该包含一堆 `VAProfile*` 条目（`VAProfileH264*`、`VAProfileHEVCMain*`、`VAProfileVP9*` 等）。若报 `failed to initialize display` 或 `ERROR`，说明 `/dev/dri` 权限或驱动没对上，检查 `group_add` 或退回 `privileged: true`。

**第二步：在 Kodi 里启用 VAAPI**

用电视遥控（或手机 Kore App、浏览器打开 `http://<NAS IP>:8080`）操作：

1. **设置 → 系统 → 设置级别** 切到"专家级"
2. **设置 → 玩家 → 视频**
3. 启用 **"允许硬件加速 – VAAPI"**

**第三步：实际播放验证**

1. 播放一段 4K HEVC 测试片源（Jellyfin 社区有免费测试片）
2. 播放时按 **`Ctrl+Shift+O`** 打开调试浮层
3. 看 `VC:`（video codec）那一行，出现 `vaapi` 即为硬解生效
4. 另开 SSH 终端跑 `top`，正常播放 4K HEVC CPU 占用应该 **<30%**；如果接近 100% 说明还在走软解

## 5. 遥控与使用

### 5.1 手机遥控（Kore，推荐）

官方 **Kore** App（Android / iOS）是最顺手的方案：

1. Kodi 里 **设置 → 服务 → 控制** → 启用"允许远程控制应用程序"和"允许其他设备的远程控制"
2. 手机装好 Kore，确保和 NAS 在同一局域网
3. Kore 首次启动会自动扫描（bridge 模式下可能扫不到，手动添加：IP 填 NAS 地址，端口 8080）
4. 首次连接 Kodi 在电视上弹出授权提示，确认即可

### 5.2 HDMI-CEC（电视遥控器）

大多数支持 HDMI-CEC 的电视（Sony BRAVIA Sync / Samsung Anynet+ / LG SimpLink）：

1. 建议使用 `network_mode: host`，CEC 走底层设备通信、host 模式更稳
2. 电视设置里启用 HDMI-CEC 相关选项
3. Kodi **设置 → 系统 → 输入 → 外设** → 配置 CEC 适配器
4. 之后直接用电视遥控器的方向键 / OK / 返回键即可操作 Kodi

### 5.3 键盘 / 鼠标

因为挂载了 `/dev/input`，插在 NAS USB 口的任意键盘、鼠标、无线遥控接收器（如飞利浦、Rii mini）都能开箱即用。

## 6. 常见故障排查

| 现象 | 可能原因 | 对策 |
|------|---------|------|
| HDMI 黑屏 | 宿主机其他进程占用了显卡 / DRM master | 关掉 FNOS 自带的桌面服务；检查容器日志 |
| 有画面无声音 | ALSA 设备权限 / 通道选错 | 容器内 `aplay -l` 列设备；Kodi 里把音频输出设到 `ALSA: HDMI` |
| 画面卡顿、CPU 占满 | VAAPI 未启用，走的软解 | 按 4.3 节重新检查 VAAPI |
| Kore 手机连得上但按键无响应 | `9777` 端口没映射成 UDP | 确认 compose 里是 `"9777:9777/udp"` |
| 重启容器后媒体库丢失 | `./data` 目录被清理或权限问题 | 检查 `./data` 是否存在并有写权限；备份该目录 |
| 中文字幕乱码 | 字体不支持中文字符集 | Kodi **设置 → 外观 → 字体** 切到 "Arial"；或在容器内挂载 `wqy-microhei.ttc` 等中文字体 |
| Kore 在局域网扫不到 Kodi | bridge 模式下 mDNS / SSDP 发现受限 | 改 `network_mode: host` 或在 Kore 里手动填 IP+端口 |
| CEC 遥控器不工作 | bridge 模式下 CEC 发现失败 | 改 `network_mode: host` |

## 7. 初次使用：扫描媒体库

Kodi 起来后默认是空的，需要把 `/media` 目录加进媒体库：

1. **视频 → 文件 → 添加视频**
2. 浏览 → 选择 `/media`（即宿主机的 `/vol1/1000/download/media`）
3. 设置该目录的内容类型（电影 / 剧集）
4. 选择刮削器（TMDB 中文版对中文片名识别较好）
5. Kodi 开始扫描、下载元数据和封面

::alert{type="tip" title="首次扫描会很慢"}

几百上千部视频的 NAS，首次刮削可能要几小时。挂在后台跑就行，`./data/userdata/Database/` 下的 SQLite 文件会持续写入。

::

::alert{type="info" title="作者注"}

本文基于 FNOS + Intel 核显 x86 NAS 的典型配置写成。不同 NAS 硬件（不同代 Intel 核显、内核/驱动版本、`wjz304/syno-kodi` 的镜像版本）在 VAAPI 表现上可能有差异，最终以 `vainfo` 输出和实际播放时的 CPU 占用为准。

::
