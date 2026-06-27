---
title: Harbor 私有镜像仓库安装指南
description: 使用 Docker Compose 部署 Harbor 私有镜像仓库，包含自签名 SSL 证书生成、YAML 配置、Nginx 反向代理等完整流程。
date: 2024-07-19 14:11:19
updated: 2026-06-27 14:11:19
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [服务]
tags: [docker, harbor]
---

Harbor 是一个开源镜像仓库，通过策略和基于角色的访问控制保护镜像，是 CNCF 毕业项目。内网搭建 Harbor 可避免依赖第三方镜像仓库，对无网环境尤为友好。

::alert
本文统一使用 `harbor.local` 作为示例域名、`192.168.2.11` 作为示例服务器 IP。实际部署请替换为你自己的值，**各处保持完全一致**（证书 CN / Docker certs.d 目录名 / hosts 映射 / Nginx server_name 等）。
::


## 前置条件

::alert

尚未安装 Docker？参见：[Docker 安装与配置指南](/2022/docker-guide/)

Docker Compose 安装与使用参见：[Docker Compose 安装配置](/2022/docker-compose-guide/)

::

- **Docker Engine ≥ 20.10**（Harbor 2.x 要求）
- **Docker Compose**（Harbor 安装脚本会自动识别 `docker compose` 插件或老版 `docker-compose` 二进制）
- **内存 ≥ 4 GB**（官方建议，低于 4 GB 部分组件会启动失败）
- **磁盘 ≥ 40 GB**（Harbor 自身约 1 GB，其余留给镜像仓库存储）
- **端口 80 / 443**（或你自定义的端口）未被其他服务占用
- **root 或 sudo 权限**

## 下载安装包

Harbor Releases：[Harbor - Github](https://github.com/goharbor/harbor/releases)

建议选择 `offline` 离线包，安装时自动解压内置的 Docker 镜像，无需在线拉取。

## 生成自签名 SSL 证书

```bash
sudo apt update && sudo apt install -y openssl
vim harbor_cert.cnf
```

```ini [harbor_cert.cnf]
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = CN                     # 国家代号
ST = Beijing               # 省份
L = Beijing                # 城市
O = MyOrg                  # 组织
OU = DevOps                # 部门
CN = harbor.local          # ← 替换为你的 Harbor 域名或 IP

[v3_req]
keyUsage = keyEncipherment, dataEncipherment, digitalSignature
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = harbor.local         # 主域名
DNS.2 = *.local              # 可选：泛域名
IP.1 = 192.168.2.11          # ← 裸 IP 访问场景必须加，否则 Docker 推镜像会报 "no IP SANs"
```

```bash
# 生成私钥 + 自签名证书（有效期 10 年）
openssl req -x509 \
  -newkey rsa:4096 \
  -sha256 \
  -days 3650 \
  -nodes \
  -keyout harbor.key \
  -out harbor.crt \
  -config harbor_cert.cnf \
  -extensions v3_req

# 把证书放到后续 Harbor 和 Nginx 都方便引用的位置
sudo mkdir -p /opt/harbor/crt
sudo cp harbor.crt harbor.key /opt/harbor/crt/

# Docker 客户端信任证书
# 注意：目录名必须和 docker login 时用的域名完全一致
sudo mkdir -p /etc/docker/certs.d/harbor.local/
sudo cp harbor.crt /etc/docker/certs.d/harbor.local/ca.crt
```

## 配置 harbor.yml

```bash
cp harbor.yml.tmpl harbor.yml
vim harbor.yml
```

关键配置项：

| 配置项 | 说明 |
|---|---|
| `hostname` | Harbor 访问域名或 IP（本文用 `harbor.local`） |
| `http.port` | HTTP 端口（默认 80） |
| `https.port` | HTTPS 端口（默认 443） |
| `https.certificate` | CRT 证书路径（建议 `/opt/harbor/crt/harbor.crt`） |
| `https.private_key` | KEY 私钥路径（建议 `/opt/harbor/crt/harbor.key`） |
| `harbor_admin_password` | admin 初始密码（默认 `Harbor12345`）|
| `external_url` | 外部 URL 地址 |
| `data_volume` | 数据持久化目录（建议配置到大容量盘）|

::alert{type="warning" title="务必修改默认密码 Harbor12345"}

`Harbor12345` 是 Harbor 官方文档里的**公开默认密码**——任何扫描器都会第一时间尝试它。部署完成后**第一件事**就是改掉：

- 首次部署前：直接在 `harbor.yml` 里把 `harbor_admin_password` 改成强密码，再 `./install.sh`
- 已经部署完成：Web UI 登录后进 **用户管理 → admin → 修改密码**

不改就部署、尤其是公网可达的 Harbor，基本等于当场被接管。

::

::alert{type="info" title="推荐在第一次 install.sh 之前就调整好的配置"}

首次 `./install.sh` 之后改部分配置需要重新 `./prepare` + 重建容器，**一次到位更省事**。首次安装前至少检查以下几项：

- **`hostname`**：改成 `harbor.local`（或你的实际域名），要和证书 CN 一致
- **`harbor_admin_password`**：改成强密码（见上方 caution）
- **`data_volume`**：默认 `/data`，如果根分区小必须挪到大容量盘挂载点（如 `/mnt/storage/harbor`）
- **`https.certificate` / `https.private_key`**：指向 `/opt/harbor/crt/harbor.crt` 和 `/opt/harbor/crt/harbor.key`
- **`http.port` / `https.port`**：如果宿主机 80/443 被系统 Nginx / Apache 占用，改成 31080 / 31443（或任意非占用端口），再配合下文 Nginx 反向代理做对外映射
- **`external_url`**：用非标端口 / Nginx 反代时必配，否则登录认证会走错端口（详见下方 note）
::

::alert{type="question" title="external_url 详解"}

external_url 是 Harbor 配置文件中的参数，用于定义外部客户端访问该服务的基准 URL。其技术逻辑如下：

优先级：启用该参数后，配置中的 hostname 将失效。  
令牌生成：Harbor 的认证服务（Token Service）会根据此参数生成 OAuth 令牌挑战（Challenge）中的 realm 地址。  
重定向逻辑：决定 Harbor 在返回 HTTP 重定向或 API 响应时，所携带的协议、域名及端口号。

端口同步：在通过 Nginx 映射非标准端口（如 31001）时，该参数确保后端返回的认证地址与外部监听端口一致，防止客户端因默认访问 443 端口导致连接超时。

配置生效：修改此参数后，必须执行 ./prepare 脚本，以重新生成各个微服务组件内部的配置文件。

::

## 安装

```bash
./install.sh
```

修改配置后重新加载：

```bash
./prepare
docker compose down
docker compose up -d
```

### 验证部署成功

```bash
# 1. 查看所有 Harbor 容器状态（正常应该全部 Up 且 healthy）
docker compose ps

# 2. 检查端口监听
ss -lntp | grep -E ':(80|443)\b'

# 3. 浏览器访问 https://harbor.local（需先配好客户端 hosts，见下一节）
#    默认凭据：admin / Harbor12345（若未改）
```

如果 `docker compose ps` 看到某个容器在反复 `Restarting`，先 `docker compose logs <服务名>` 定位具体错误——绝大多数是端口冲突或 `harbor.yml` 语法问题。

## 使用

### 配置客户端 hosts

`harbor.local` 是内网自定义域名，没有公网 DNS 解析——**所有需要访问 Harbor 的客户端都要手动写 hosts 文件**。

**Linux / macOS**：

```bash
echo "192.168.2.11 harbor.local" | sudo tee -a /etc/hosts
```

**Windows**（管理员 PowerShell）：

```powershell
Add-Content -Path "$env:SystemRoot\System32\drivers\etc\hosts" -Value "192.168.2.11 harbor.local"
```

或者手动编辑 `C:\Windows\System32\drivers\etc\hosts`，末尾加一行 `192.168.2.11 harbor.local`。

配完后验证：

```bash
ping harbor.local
# 应当解析到 192.168.2.11
```

### 推送 / 拉取镜像

::alert{type="warning" title="如果您无法拉取"}
如果您的客户端无法拉取或上传，可以参考这篇文章配置：
::link-card
---
icon: https://picsum.photos/100/100
title: Docker 配置私服自签名证书信任
description: '在 Linux 和 Windows 客户端上配置 Docker 信任私有镜像仓库的自签名 SSL 证书，解决拉取推送时的证书验证失败问题'
link: "/2024/docker-private-cert"
---
::

::

```bash
# 登录（默认 admin / 你在 harbor.yml 设定的密码）
docker login harbor.local

# 打标签
docker tag myapp:latest harbor.local/myproject/myapp:v1.0.0

# 推送
docker push harbor.local/myproject/myapp:v1.0.0

# 拉取
docker pull harbor.local/myproject/myapp:v1.0.0
```

## Nginx 反向代理（使用非 80/443 端口时）

当宿主机的 80/443 已被其他服务占用，可以让 Harbor 监听非标端口（比如 31080/31443），再用外层 Nginx 做 TLS 终结和对外映射。

```conf
upstream harbor_backend {
    server 127.0.0.1:5443;   # ← 对应 harbor.yml 里的 https.port，按实际填写
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name harbor.local;

    # 复用第 3 节生成的自签名证书
    ssl_certificate     /opt/harbor/crt/harbor.crt;
    ssl_certificate_key /opt/harbor/crt/harbor.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

    client_max_body_size 0;   # 允许无限大镜像上传，必加

    location / {
        proxy_pass https://harbor_backend;

        # 关键：Harbor 后端也是 HTTPS（自签证书），Nginx 默认会尝试验证且必定失败，要关掉
        proxy_ssl_verify off;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_connect_timeout 90s;
        proxy_send_timeout    90s;
        proxy_read_timeout    90s;
    }
}

server {
    listen 80;
    server_name harbor.local;
    return 301 https://$host$request_uri;
}
```

::alert{type="question" title="关于双 TLS 架构"}

上面是 **Nginx HTTPS → Harbor HTTPS** 的双 TLS 结构（Nginx 和 Harbor 可以共用同一张自签证书，也可以各用各的）。**即便两边用同一张证书，`proxy_ssl_verify off;` 仍然要加**——Nginx 作为 TLS 客户端去连后端时，默认会走完整的 CA 链校验，自签证书没有"可信 CA"，所以一定失败。关掉校验后加密仍然在，只是不再做身份验证。

如果嫌双 TLS 麻烦，还有一种更常见的简化架构：**Harbor 跑 HTTP**（`harbor.yml` 里注释掉整个 `https:` 块、只留 `http.port`），**Nginx 做唯一的 TLS 终结**。宿主机本地 Docker 网络里的 HTTP 流量不出机器，风险可接受、配置更简单。

::

::alert

如果你的 harbor 是非标端口，请使用下面的 nginx 配置

```nginx
location / {
    proxy_pass https://harbor_backend; # 指向 Harbor 内部的 30443
    proxy_ssl_verify off;

    proxy_set_header Host $host:31001; # 显式告诉后端外部端口
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Port 31001; # 必须明确告诉是 31001

    # 下面两项对大镜像上传至关重要
    proxy_buffering off;
    proxy_request_buffering off;
}
```

::

## 使用 HTTP（不推荐生产环境）

::alert{type="error" title="注意！"}
不知道为什么，这个在新的docker版本无法使用，必须https
::

在 Docker 的 `daemon.json` 中添加：

```json
{
  "insecure-registries": ["harbor.local"]
}
```

```bash
systemctl restart docker
```

::alert{type="warning" title="HTTP 模式的真实风险"}

`insecure-registries` 模式下，Docker 和 Harbor 之间**所有流量都是明文**：

- 登录凭据（HTTP Basic Auth）直接在请求头里裸奔——被嗅探就是当场被盗号
- 镜像层数据也走明文，既能被拦截拷贝、也可能被篡改（例如注入恶意二进制）
- 任何链路上的中间人（交换机、路由器、代理、公共 Wi-Fi AP）都能看到并改写

**仅适用于完全隔离的实验网络**。只要有一点外部访问，或涉及生产凭据，都必须走 HTTPS。

::

## 故障排查

| 现象 | 可能原因 | 对策 |
|------|---------|------|
| `docker login` 报 `x509: certificate signed by unknown authority` | `certs.d` 目录名和登录时用的域名对不上 | 目录名必须和 `docker login` 时用的域名**完全一致**：登录 `harbor.local` 就放 `/etc/docker/certs.d/harbor.local/ca.crt` |
| `docker push` 报 `x509: cannot validate certificate for 192.168.x.x because it doesn't contain any IP SANs` | 证书没有 IP SAN | 在 `harbor_cert.cnf` 的 `[alt_names]` 段加 `IP.1 = 192.168.x.x`，重新签发 |
| `docker push` 大镜像报 `413 Request Entity Too Large` | Nginx `client_max_body_size` 限制 | 确认 Nginx 配置里有 `client_max_body_size 0;` |
| 登录报 `unauthorized: authentication required` | `external_url` 配置错，Harbor 返回的 token realm 对不上实际访问地址 | 核对 `external_url` 协议 / 域名 / 端口和浏览器地址栏一致，改完跑 `./prepare` |
| 浏览器访问白屏或 502 | Nginx upstream 端口不对 / 没关 `proxy_ssl_verify` | 确认 `harbor.yml` 的 `https.port` 和 Nginx `upstream` 端口一致；加 `proxy_ssl_verify off;` |
| `docker compose ps` 某容器反复 `Restarting` | 端口冲突 / `harbor.yml` 语法错 / 磁盘满 | `docker compose logs <服务名>` 定位具体报错 |
| hosts 配好了但 `ping harbor.local` 还不通 | 写错了行 / hosts 文件有 BOM / Windows 权限不够 | `cat /etc/hosts` 或 Windows 下用**以管理员身份**编辑；确认没有奇怪字符 |
| 推送镜像非常慢或中途断开 | Nginx 缓冲 / 超时不够 | 确认 `proxy_buffering off; proxy_request_buffering off;`；调大 `proxy_send_timeout` / `proxy_read_timeout` |

## 备份与升级

Harbor 的全部数据都在 `data_volume` 指定的目录下（默认 `/data`），包括 PostgreSQL 数据、镜像层存储、Redis、日志等。**升级前一定要备份**，出问题才有回滚余地。

### 备份

```bash
cd /path/to/harbor-installer

# 1. 停止 Harbor
docker compose down

# 2. 备份数据目录（data_volume 指定的路径）
sudo tar czf /backup/harbor-data-$(date +%F).tar.gz /data

# 3. 备份 harbor.yml（里面有一堆你调过的配置）
cp harbor.yml /backup/harbor.yml.$(date +%F)

# 4. 重启
docker compose up -d
```

建议把 `/backup` 目录定时同步到另一台机器或云存储，单点备份不算真正的备份。

### 升级

```bash
# 1. 先按上面"备份"节做完备份

# 2. 下载新版本的离线安装包、解压到新目录
tar xvf harbor-offline-installer-v2.x.x.tgz -C /opt/
cd /opt/harbor   # 新版本目录

# 3. 把旧 harbor.yml 拷过来（保留你的所有配置）
cp /backup/harbor.yml.<日期> ./harbor.yml

# 4. 停止旧版本
cd /path/to/old-harbor && docker compose down

# 5. 在新目录安装（会自动检测 data_volume 里已有数据并升级）
cd /opt/harbor
./install.sh
```

::alert{type="question" title="升级失败的回滚思路"}

如果新版本起不来或者数据有问题：

1. `docker compose down` 停掉新版本
2. 恢复 `data_volume` 目录：`sudo tar xzf /backup/harbor-data-<日期>.tar.gz -C /`
3. 回到旧版本的安装目录 `docker compose up -d`

所以**备份的 tar 包必须保留到新版本稳定运行一段时间之后再删**。
::