---
title: OpenClaw (小龙虾) 部署指南：打造企业级 AI 自动化助手
description: 在 Windows WSL / Linux 环境下导入 Ubuntu 子系统、安装 OpenClaw (小龙虾)，配置 gateway、token 认证与 systemd 开机自启的完整流程。
date: 2026-03-07
updated: 2026-03-07
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [OpenClaw, AI, Automation, WSL, Ubuntu, Windows, systemd, HomeLab]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

本文记录在 Windows WSL 子系统下部署 OpenClaw（社区昵称"小龙虾"）的完整流程：从导入 Ubuntu WSL 镜像、执行安装脚本、配置 gateway，到注册 systemd 开机自启与常用故障排查。

## 1. 前置条件

- Windows 10（版本 2004 及以上）或 Windows 11
- 已安装 **WSL 2**（未装可执行 `wsl --install` 安装）
- 预留 **8 GB 以上** 磁盘空间（Ubuntu 镜像 + OpenClaw 运行数据）
- 已下载好 Ubuntu WSL 镜像文件（如 `ubuntu-24.04.4-wsl-amd64.wsl`）

## 2. 导入 Ubuntu WSL 子系统

**在宿主机 PowerShell 中执行**：

```powershell
# 格式：wsl --import <自定义系统名称> <安装路径> <镜像文件路径>
wsl --import openclaw F:\openclaw "$env:USERPROFILE\Downloads\ubuntu-24.04.4-wsl-amd64.wsl"

# 进入 WSL 子系统
wsl -d openclaw
```

## 3. 安装 OpenClaw（在 WSL 内部）

进入 WSL 子系统后，先装好基础依赖：

```bash
# 如果网络环境不好（apt 更新缓慢或失败），请自行更换 apt 源（tuna、阿里云等）
apt update
apt install -y curl zip unzip
```

执行 OpenClaw 官方安装脚本：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash

# 将工具权限配置为完整模式
openclaw config set tools.profile full
```

::alert{type="warning" title="`curl | bash` 的安全提醒"}

`curl ... | bash` 会把远程脚本直接喂给 bash 执行，一旦上游或你当时的 DNS 解析被污染，就相当于在本机执行了不可控的代码。如果对安全有要求，建议先下载审查再执行：

```bash
curl -fsSL https://openclaw.ai/install.sh -o install.sh
less install.sh           # 浏览脚本内容确认无异常
bash install.sh
```

::

## 4. 配置文件说明

编辑 OpenClaw 配置文件：

```bash
nano ~/.openclaw/openclaw.json
```

### 4.1 推荐配置（本机使用）

默认情况下推荐 `bind: local`，只监听本机回环，需要远程访问时用 SSH 隧道打通（见 4.3）。

```json
{
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "local",
    "auth": {
      "mode": "token",
      "token": "your_token_here"
    },
    "tailscale": {
      "mode": "off"
    }
  }
}
```

### 4.2 开启局域网访问（谨慎使用）

如果确实需要让局域网其他设备直连，修改为以下配置：

```json
{
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "your_token_here"
    },
    "controlUi": {
      "dangerouslyAllowHostHeaderOriginFallback": true,
      "allowInsecureAuth": true,
      "dangerouslyDisableDeviceAuth": true
    },
    "tailscale": {
      "mode": "off",
      "resetOnExit": false
    }
  }
}
```

::alert{type="warning" title="`bind: lan` + dangerously 开关的安全影响"}

上述配置会把 OpenClaw 暴露到整个局域网，同时关闭三重安全校验：

- **`dangerouslyAllowHostHeaderOriginFallback`**：关闭 Origin 校验，允许任意来源调用
- **`allowInsecureAuth`**：允许明文（非 HTTPS）认证
- **`dangerouslyDisableDeviceAuth`**：禁用设备绑定

配置项里出现 `dangerously` 是作者对使用者最强的警告。结合 `tools.profile full`（完整系统工具权限），**任何能访问 18789 端口的设备都能用这个 AI 助手在本机做任意事**，包括读写文件、执行命令。

**推荐替代方案**：

- 本机使用：保留 `bind: local`（4.1 节），配合下面的 SSH 隧道
- 远程访问：开启 `tailscale` 段，基于身份认证的 Mesh VPN，比裸 lan 安全得多
::

### 4.3 SSH 隧道访问（推荐的远程用法）

从其他机器访问时，SSH 隧道比 `bind: lan` 安全得多：

```bash
# 在客户端执行，把远程 18789 映射到本地 18789
ssh -N -L 18789:127.0.0.1:18789 user@10.0.0.53
```

这样本地浏览器访问 `http://localhost:18789` 就是在访问远端机器的 OpenClaw，且端口仅对你的 SSH 可见。

::alert{type="info" title="改完配置要重启服务"}

本节的配置修改都需要**重启 OpenClaw 服务**后才会生效。如果已经按第 5 节注册了 systemd 服务，执行：

```bash
sudo systemctl restart openclaw
```

::

## 5. 启动服务

### 5.1 前台运行（首次调试）

首次安装建议前台运行，确认一切正常：

```bash
source ~/.bashrc
openclaw gateway
```

终端会打印启动日志，能看到 `Listening on :18789` 之类的信息即为成功。按 `Ctrl+C` 退出。

### 5.2 注册为 systemd 服务（长期运行）

前台运行正常后，推荐注册成 systemd 服务，方便开机自启与异常自拉。

**先查找 `openclaw` 二进制的绝对路径**（systemd 不读用户 PATH，必须写死）：

```bash
which openclaw
# 示例输出：/usr/local/bin/openclaw
```

创建服务文件（把 `ExecStart` 里的路径换成上一步查到的值）：

```bash
sudo tee /etc/systemd/system/openclaw.service > /dev/null <<'EOF'
[Unit]
Description=OpenClaw Gateway Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/usr/local/bin/openclaw gateway
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now openclaw
sudo systemctl status openclaw
```

::alert{type="warning" title="生产环境建议用专用用户，不要 root 跑"}

上面的服务文件 `User=root` 是为了匹配 WSL 默认导入的 root 环境（`wsl --import` 进去默认就是 root）。但 `tools.profile full` 给了 OpenClaw 执行命令、读写文件的完整能力——**以 root 运行等于把整台机器的 root 权限交给 AI**。

对安全有要求时，创建专用用户并把 OpenClaw 装到该用户下：

```bash
sudo useradd -r -m -s /bin/bash openclaw
sudo -iu openclaw bash -c 'curl -fsSL https://openclaw.ai/install.sh | bash'
sudo -iu openclaw openclaw config set tools.profile full
sudo -iu openclaw which openclaw     # 查询准确路径，一般是 /home/openclaw/.openclaw/bin/openclaw
```

然后把服务文件里改成：

```ini
User=openclaw
WorkingDirectory=/home/openclaw
ExecStart=/home/openclaw/.openclaw/bin/openclaw gateway
```

::

## 6. 访问 OpenClaw

服务起来之后：

1. 如果是 `bind: local`：在 WSL 本机浏览器打开 `http://localhost:18789`，或从宿主机/其他机器通过 SSH 隧道（见 4.3）访问
2. 如果是 `bind: lan`：直接在局域网任意设备打开 `http://<WSL 宿主机 IP>:18789`
3. 使用 `openclaw.json` 里配置的 `token` 登录 Web 控制台

::alert{type="info"}

OpenClaw 具体的 Web UI 操作、工具使用示例与最佳实践超出本文部署指南的范围，建议参考官方文档或社区资料进一步了解。

::

## 7. 故障排查

### 7.1 `Systemd user services are unavailable`

安装时若输出：

```
Systemd user services are unavailable. Skipping lingering checks and service install.
```

这是 WSL 默认没启用用户级 systemd 导致的。两种解法：

- **方案 A**：直接前台运行 `openclaw gateway`（见 5.1），开机启动需手动操作
- **方案 B（推荐）**：按第 5.2 节注册为 **system 级** systemd 服务（不是 user 级），不受此限制

### 7.2 改了配置后没生效

配置文件修改后必须重启服务：

```bash
sudo systemctl restart openclaw
```

### 7.3 服务起不来 / 状态 failed

查看详细日志：

```bash
sudo journalctl -u openclaw -n 100 --no-pager
```

常见原因：`ExecStart` 里的二进制路径不对（不同用户安装位置不同）、端口 18789 被占用、配置文件 JSON 语法错误。

## 8. 常用命令速查

### 8.1 PowerShell（宿主机）

```powershell
# 进入 WSL 子系统
wsl -d openclaw

# 关闭 WSL 子系统
wsl -d openclaw --shutdown

# 查看已安装的 WSL 子系统列表
wsl -l -v
```

### 8.2 Linux（WSL 内部，systemd 服务方式）

```bash
# 查看服务状态
sudo systemctl status openclaw

# 启动 / 停止 / 重启
sudo systemctl start openclaw
sudo systemctl stop openclaw
sudo systemctl restart openclaw

# 查看实时日志
sudo journalctl -u openclaw -f
```

::alert{type="info" title="作者注"}

本教程在 Windows 11 + WSL 2 + Ubuntu 24.04 环境下验证过。OpenClaw 本身的功能和使用方法请查阅其官方文档。

::
