---
title: TrueNAS 全方位监控实战：Prometheus + Grafana 方案
description: 通过 Graphite 协议采集 TrueNAS SCALE / Core 指标，经 graphite-prometheus 转换后交由 Prometheus 存储、Grafana 可视化，搭建一套独立于 TrueNAS 自带报告的长期监控。
date: 2026-03-08
updated: 2026-03-08
image: # 封面图推荐 2:1，不含与标题重复的文字
categories: [虚拟化]
tags: [TrueNAS, TrueNAS SCALE, Prometheus, Grafana, Graphite, Docker Compose, HomeLab, ZFS]
---

::alert{type="info" icon="tabler:robot" title="AI 迁移提示"}
本文由 AI 协助从旧站迁移，尚未完成逐篇人工审校；内容如有疏漏，将在复核后修订。
::

TrueNAS 自带的 Reporting 模块能看当前状态，但**历史数据保留有限、无法配置告警**，遇到磁盘温度异常、ZFS 池容量缓慢增长、网络流量突增这类场景就不够用了。本文搭建一套独立的 Prometheus + Grafana 监控，对 TrueNAS 做长期采集与可视化。

## 1. 架构概览

整条数据链路：

```
TrueNAS ──(Graphite 协议 @ 9109)──▶ graphite-prometheus ──(/metrics @ 9108)──▶ Prometheus ──(查询)──▶ Grafana
```

- **TrueNAS**：原生支持以 Graphite 协议向外推送系统指标（CPU、磁盘、ZFS、网络等）。
- **graphite-prometheus**：由 [Supporterino/truenas-graphite-to-prometheus](https://github.com/Supporterino/truenas-graphite-to-prometheus) 提供，把 Graphite 推送协议转换为 Prometheus 可抓取的 `/metrics` 端点。
- **Prometheus**：时序数据库，按间隔主动抓取转换器暴露的指标。
- **Grafana**：从 Prometheus 查询数据并可视化。

::alert{type="info" title="为什么需要一个\"转换器\""}

TrueNAS 只会 Graphite（推送模型），Prometheus 只认 HTTP pull（拉取模型）。两者协议和方向都不兼容，必须在中间夹一层 graphite-prometheus 做翻译。

::

## 2. 前置条件

在 TrueNAS Web UI 中启用 Graphite 上报：

**System Settings → Reporting → Exporters**（或旧版 **Reporting → Settings**）

- **Type**：`Graphite`
- **Destination**：`<监控主机 IP>:9109`
- **Separate Instances**：建议开启，便于多主机时按实例区分

开启后 TrueNAS 会以约 10 秒一次的频率向目标地址推送指标。

## 3. 编写 docker-compose.yaml

::alert{type="info"}

Docker Compose 安装与使用参见：[Docker Compose 安装配置](/posts/docker-compose-setup///)

::

在准备部署的宿主机上创建一个空目录，新建 `docker-compose.yaml`：

```yaml
services:
  # 时序数据库：存储监控指标
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=365d'
    ports:
      - "9090:9090"
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 5s
      retries: 3

  # 可视化面板：看硬盘和 ZFS 状态
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=Aa123456
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  # TrueNAS Graphite → Prometheus 转换服务
  graphite-prometheus:
    image: ghcr.io/supporterino/truenas-graphite-to-prometheus:latest
    container_name: graphite-prometheus
    restart: unless-stopped
    ports:
      - "9109:9109/tcp"   # Graphite 接收端（TrueNAS 推送，TCP）
      - "9109:9109/udp"   # Graphite 接收端（TrueNAS 推送，UDP）
      - "9108:9108/tcp"   # Prometheus 抓取端
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:9108/metrics"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  prometheus-data:
  grafana-data:
```

::alert{type="tip" title="关于镜像加速"}

上面使用的都是官方镜像地址（`prom/...`、`grafana/...`、`ghcr.io/...`）。在国内网络环境下如果拉取缓慢或失败，可使用你自己的镜像加速服务，把域名前缀加在 image 前即可，例如：`your-accel.example.com/prom/prometheus:latest`。**请不要直接使用别人的私有加速域名**，可能随时失效或泄露他人 token。

::

## 4. 编写 prometheus.yml

在同一目录下创建 `prometheus.yml`：

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'truenas'
    scrape_interval: 10s
    static_configs:
      - targets: ['10.0.0.16:9108']
    relabel_configs:
      - target_label: instance
        replacement: 'truenas'
```

::alert{type="info" title="请替换为你的实际 IP"}

把 `10.0.0.16` 替换为**运行 graphite-prometheus 容器的宿主机 IP**。如果 Prometheus 与 graphite-prometheus 在同一个 compose 网络里，也可以直接用 `graphite-prometheus:9108` 服务名互访。

::

## 5. 配置项说明

下面逐项解释上述配置背后的考量，遇到问题或要做调整时可以对照。

### 5.1 `storage.tsdb.retention.time=365d`

Prometheus 默认只保留 15 天数据。这里保留 **365 天（一整年）**，方便做磁盘温度、SMART、ZFS 容量等长周期趋势分析。一年的数据大约占用 10–30 GB（视指标数量和抓取频率），需要为 `prometheus-data` 卷预留足够磁盘空间。如果磁盘紧张可以酌情缩短到 90d / 180d。

### 5.2 `scrape_interval: 10s`

Prometheus 全局 `scrape_interval` 用官方推荐的 15s，但对 TrueNAS 这个 job **单独覆盖为 10s**，对齐 TrueNAS Graphite 上报频率——更高的频率（比如 1s）会产生大量重复值、白白撑大 TSDB；更低则会漏点。

### 5.3 镜像均固定为 `:latest`

所有镜像都显式写了 `:latest`，不省略 tag。省略 tag 虽然默认也是 `latest`，但显式写出更清晰，避免与工具链（如 Watchtower、Renovate）交互时产生歧义。**生产环境**建议进一步固定到具体版本号（如 `prom/prometheus:v2.54.0`），防止上游突然大版本升级带来破坏性变更。

### 5.4 端口协议（9109 / 9108）

graphite-prometheus 的 9109 是 Graphite 协议接收端，Graphite 协议**同时支持 TCP 明文和 UDP 明文**。Docker Compose 的 `"9109:9109"` 默认只映射 TCP——如果 TrueNAS 配的是 UDP 推送，会出现"TrueNAS 发得出去但转换器收不到"的隐蔽问题。**这里同时显式映射 `/tcp` 和 `/udp`，一次避免两种场景的坑**。9108 是 Prometheus 抓取端，只走 HTTP/TCP。

### 5.5 Grafana 默认密码 `Aa123456`

这个密码**仅为演示方便**，强度非常弱。部署完成后请**立即登录 Grafana 改成复杂密码**（推荐 16 位以上、包含大小写字母 + 数字 + 符号）。更规范的做法是把密码放在 `.env` 文件并用 `${GF_SECURITY_ADMIN_PASSWORD}` 从 compose 读取，避免明文写入版本库。

### 5.6 Healthcheck

三个服务都加了 healthcheck，每 30 秒探测一次：

- **prometheus**：`/-/healthy` 端点
- **grafana**：`/api/health` 端点
- **graphite-prometheus**：`/metrics` 端点（能返回即视为存活）

配合 `restart: unless-stopped`，容器进程挂掉或卡死时能被自动重启。可以用 `docker compose ps` 查看每个服务的健康状态。

## 6. 启动与验证

### 6.1 启动容器

```bash
docker compose up -d
docker compose ps
```

三个容器的 `STATUS` 列应当显示为 `running (healthy)`。

### 6.2 端口与访问地址

| 端口 | 服务 | 用途 |
|------|------|------|
| 3000 | Grafana | 可视化 Web UI（默认用户 `admin`） |
| 9090 | Prometheus | Prometheus Web UI（查询 + 查看 target 状态） |
| 9108 | graphite-prometheus | `/metrics` 端点，Prometheus 从这里抓 |
| 9109 | graphite-prometheus | Graphite 协议接收端，TrueNAS 推到这里 |

### 6.3 确认数据链路通了

1. 浏览器打开 `http://<服务器 IP>:9090/targets`，`truenas` job 的 state 应当为 **UP**。
2. 打开 `http://<服务器 IP>:9090/graph`，在查询框搜 `truenas_`，能看到一堆以 `truenas_` 开头的指标，说明转换器在正常工作。
3. 如果 target 一直 `DOWN`：先看 graphite-prometheus 的日志 `docker logs graphite-prometheus`，通常是 TrueNAS 没推数据、或目标 IP/端口写错。

## 7. 导入推荐的 Grafana 仪表板

项目作者提供了一份现成的 TrueNAS SCALE 仪表板：

👉 **[truenas_scale.json](https://github.com/Supporterino/truenas-graphite-to-prometheus/blob/main/dashboards/truenas_scale.json)**

导入步骤：

1. 登录 Grafana (`http://<服务器 IP>:3000`)。**首次使用需要添加 Prometheus 数据源**：
   - 侧栏 → **Connections → Data sources → Add data source → Prometheus**
   - **URL**：填 `http://prometheus:9090`（同 compose 网络内访问）或 `http://<服务器 IP>:9090`
   - 拉到底点 **Save & test**，显示 `Successfully queried` 即可
2. 侧栏 → **Dashboards → New → Import**
3. 选择 **Upload JSON file**，上传下载好的 `truenas_scale.json`
4. 在导入界面的数据源下拉里选刚才创建的 Prometheus，点 **Import**

导入后即可看到 TrueNAS 的 CPU、内存、ZFS 池、磁盘温度、网络流量等面板。后续可在此基础上按需调整 Panel，或在 Prometheus / Grafana 里按指标配置告警规则。

::alert{type="info" title="作者注"}

本文在 TrueNAS SCALE 24.x 上验证过；Core 版本的 Graphite 上报路径略有差异，但配置项名称一致，按 Web UI 提示操作即可。

::
