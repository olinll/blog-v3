# Docker 部署 Uptime Kuma 监控服务

> 使用 Docker Compose 部署 Uptime Kuma 开源监控工具，支持 HTTP、Ping、TCP 等多种监控方式，故障时及时通知。

Uptime Kuma 是一款开源的自托管监控工具，可实时监测网站或服务状态，支持 HTTP、Ping、TCP 等多种监控方式，故障时发送通知。

GitHub：[louislam/uptime-kuma](https://github.com/louislam/uptime-kuma)

## 部署

```yaml [docker-compose.yml]
services:
  uptime-kuma:
    image: louislam/uptime-kuma:2
    container_name: uptime-kuma
    volumes:
      - ./data:/app/data
    ports:
      - 3001:3001
    restart: always
    networks:
      - app-net

networks:
  app-net:
    external: true
```

## 美化

自用css样式：

```css
/* 字体：有网络时用 Orbitron/Rajdhani；不可用时回退到系统字体 */
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@500;600;700&display=swap");

:root {
  --bs-white: rgba(255, 255, 255, 0.92);
  --bs-dark: rgba(255, 255, 255, 0.96);
  --bs-green: oklch(0.8 0.12 150);
  --bs-danger: oklch(0.7 0.16 25);
  --bs-body-bg: #050611;
  --bs-blue: oklch(0.72 0.15 260);

  --wr-font-main:
    "Rajdhani",
    "Segoe UI",
    "Microsoft YaHei",
    sans-serif;

  --wr-font-title:
    "Orbitron",
    "Rajdhani",
    "Bahnschrift",
    "Agency FB",
    "DIN Condensed",
    "Segoe UI",
    "Microsoft YaHei",
    sans-serif;

  --wr-glass-bg: rgba(18, 20, 38, 0.46);
  --wr-glass-bg-light: rgba(255, 255, 255, 0.075);
  --wr-glass-hover: rgba(255, 255, 255, 0.14);
  --wr-glass-border: 1px solid rgba(255, 255, 255, 0.11);
  --wr-shadow-main: 0 18px 55px rgba(0, 0, 0, 0.34);
  --wr-shadow-small: 0 8px 26px rgba(0, 0, 0, 0.24);
  --wr-inner-glow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* 暗色模式保持同一套高级深色效果 */
.dark {
  --bs-white: rgba(255, 255, 255, 0.92);
  --bs-dark: rgba(255, 255, 255, 0.96);
  --bs-green: oklch(0.82 0.13 150);
  --bs-danger: oklch(0.72 0.17 25);
  --bs-body-bg: #050611;
  --bs-blue: oklch(0.76 0.15 260);

  --wr-glass-bg: rgba(18, 20, 38, 0.46);
  --wr-glass-bg-light: rgba(255, 255, 255, 0.075);
  --wr-glass-hover: rgba(255, 255, 255, 0.14);
  --wr-glass-border: 1px solid rgba(255, 255, 255, 0.11);
  --wr-shadow-main: 0 18px 55px rgba(0, 0, 0, 0.34);
  --wr-shadow-small: 0 8px 26px rgba(0, 0, 0, 0.24);
  --wr-inner-glow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* ========================================================
   1. 背景与基础字体
======================================================== */

body {
  background: var(--bs-body-bg) !important;
  color: var(--bs-dark) !important;
  font-family: var(--wr-font-main) !important;
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

/* 雾化夜景背景 */
body::before {
  content: "";
  position: fixed;
  inset: -5%;
  background-image: url("https://winered-0v0.com/night.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(13px) brightness(0.38) saturate(0.92);
  transform: scale(1.03);
  z-index: -100;
}

/* 深色渐变遮罩 */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at top center, rgba(120, 130, 255, 0.18), transparent 28%),
    radial-gradient(circle at 20% 35%, rgba(60, 120, 255, 0.10), transparent 25%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.42));
  pointer-events: none;
  z-index: -99;
}

/* 顶部留白 */
.container {
  margin-top: 6rem !important;
}

/* ========================================================
   2. LOGO 与标题样式
   保留原 title-flex 结构，只强化视觉
======================================================== */

.title-flex {
  font-family: var(--wr-font-title) !important;
  font-weight: 900 !important;
  justify-content: center;
  align-items: center;
  gap: 22px !important;

  font-size: 3.6rem !important;
  letter-spacing: 0.1em !important;
  line-height: 1.05 !important;
  text-transform: uppercase !important;

  color: var(--bs-dark) !important;
  -webkit-text-fill-color: var(--bs-dark) !important;
  text-shadow:
    0 0 14px rgba(255, 255, 255, 0.18),
    0 8px 24px rgba(0, 0, 0, 0.72) !important;
}

/* 标题里的 Logo 放大 */
.title-flex img,
.logo,
img.logo {
  width: 96px !important;
  height: 96px !important;
  max-width: 96px !important;
  max-height: 96px !important;
  object-fit: contain !important;

  filter:
    drop-shadow(0 0 12px rgba(255, 255, 255, 0.24))
    drop-shadow(0 10px 22px rgba(0, 0, 0, 0.55)) !important;
}

/* ========================================================
   3. 按钮样式
======================================================== */

.btn-info,
.btn-primary,
.btn-default {
  color: var(--bs-dark) !important;
  background: rgba(255, 255, 255, 0.075) !important;
  box-shadow: var(--wr-shadow-small), var(--wr-inner-glow) !important;
  border: var(--wr-glass-border) !important;

  backdrop-filter: blur(14px) saturate(140%) !important;
  -webkit-backdrop-filter: blur(14px) saturate(140%) !important;

  border-radius: 10px !important;
  transition:
    background 0.22s ease,
    transform 0.22s ease,
    box-shadow 0.22s ease !important;
}

.btn-info:hover,
.btn-primary:hover,
.btn-default:hover {
  color: var(--bs-dark) !important;
  background: rgba(255, 255, 255, 0.14) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32), var(--wr-inner-glow) !important;
  transform: translateY(-1px);
}

/* ========================================================
   4. 服务组标题
======================================================== */

.group-title {
  font-family: var(--wr-font-title) !important;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  opacity: 1;
  color: var(--bs-dark) !important;

  -webkit-mask: none !important;
  mask: none !important;
  text-stroke: 0 !important;
  -webkit-text-stroke: 0 !important;
  -webkit-text-fill-color: var(--bs-dark) !important;

  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.12),
    0 4px 14px rgba(0, 0, 0, 0.62);
}

/* ========================================================
   5. 服务项目列表布局
   保留你原版布局：双列 / 手机单列
======================================================== */

.monitor-list .monitor-list {
  min-height: 45px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.monitor-list .item .info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* 服务项状态点 */
.info1::before,
.info1::after {
  content: "";
  display: inline-block;
  width: 10px;
  height: 10px;
  background-color: var(--bs-green);
  margin: 0.5rem 0;
  border-radius: 50%;
  box-shadow: 0 0 10px color-mix(in oklch, var(--bs-green), transparent 40%);
  animation: breath 1.5s ease-in-out infinite;
}

.info1::after {
  animation-delay: 0.75s;
}

/* ========================================================
   6. 大卡片与服务项玻璃质感
======================================================== */

.shadow-box {
  margin-top: 0 !important;
  background: var(--wr-glass-bg) !important;
  border: var(--wr-glass-border) !important;
  box-shadow: var(--wr-shadow-main), var(--wr-inner-glow) !important;

  backdrop-filter: blur(22px) saturate(155%) !important;
  -webkit-backdrop-filter: blur(22px) saturate(155%) !important;

  border-radius: 16px !important;
}

/* 分组 hover 时标题轻微提亮 */
div[data-v-f71ca08e].mb-5:hover .group-title {
  -webkit-text-fill-color: var(--bs-dark);
  color: var(--bs-dark) !important;
}

/* 服务项卡片 */
.monitor-list .item {
  background: var(--wr-glass-bg-light) !important;
  border: var(--wr-glass-border) !important;
  border-radius: 13px !important;
  box-shadow: var(--wr-shadow-small), var(--wr-inner-glow) !important;

  backdrop-filter: blur(12px) saturate(140%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(140%) !important;

  transition:
    background 0.22s ease,
    transform 0.22s ease,
    box-shadow 0.22s ease !important;
}

.monitor-list .item:hover {
  background: var(--wr-glass-hover) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32), var(--wr-inner-glow) !important;
  transform: translateY(-1px);
}

.dark .monitor-list .item:hover {
  background: var(--wr-glass-hover) !important;
}

/* ========================================================
   7. 服务项目文字
======================================================== */

.item-name {
  font-family: var(--wr-font-main) !important;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--bs-dark) !important;
}

a {
  text-decoration: none !important;
  color: var(--bs-dark) !important;
}

a.item-name:hover {
  color: var(--bs-blue) !important;
}

/* 错误状态服务名 */
.info .bg-danger + .item-name {
  color: var(--bs-danger) !important;
}

/* ========================================================
   8. 全局状态横幅
======================================================== */

.overall-status {
  background: var(--wr-glass-bg) !important;
  border: var(--wr-glass-border) !important;
  box-shadow: var(--wr-shadow-main), var(--wr-inner-glow) !important;

  backdrop-filter: blur(22px) saturate(155%) !important;
  -webkit-backdrop-filter: blur(22px) saturate(155%) !important;

  border-radius: 16px !important;

  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  text-align: center !important;

  font-family: var(--wr-font-title) !important;
  font-weight: 800 !important;
  letter-spacing: 0.06em !important;
}

.overall-status .ok {
  color: var(--bs-green) !important;
}

/* ========================================================
   9. Uptime 小竖条
======================================================== */

.hp-bar-big .beat[data-v-636dc6a9],
.ping-bar.bg-primary,
.ping-bar.bg-success {
  background-color: var(--bs-green) !important;
  box-shadow: 0 0 8px color-mix(in oklch, var(--bs-green), transparent 40%);
}

.ping-bar.bg-danger {
  background-color: var(--bs-danger) !important;
  box-shadow: 0 0 8px color-mix(in oklch, var(--bs-danger), transparent 35%);
}

.ping-bar {
  border-radius: 4px !important;
}

/* ========================================================
   9.1 绿色状态竖条：从右到左颜色传递
   不改变高度，不做波浪，只做亮度流动
======================================================== */

.hp-bar-big .beat[data-v-636dc6a9],
.ping-bar.bg-primary,
.ping-bar.bg-success {
  animation: wr-green-flow 2.8s ease-in-out infinite;
}

/* 右侧先亮，往左依次延迟 */
.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(1),
.ping-bar.bg-primary:nth-last-child(1),
.ping-bar.bg-success:nth-last-child(1) {
  animation-delay: 0s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(2),
.ping-bar.bg-primary:nth-last-child(2),
.ping-bar.bg-success:nth-last-child(2) {
  animation-delay: 0.05s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(3),
.ping-bar.bg-primary:nth-last-child(3),
.ping-bar.bg-success:nth-last-child(3) {
  animation-delay: 0.10s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(4),
.ping-bar.bg-primary:nth-last-child(4),
.ping-bar.bg-success:nth-last-child(4) {
  animation-delay: 0.15s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(5),
.ping-bar.bg-primary:nth-last-child(5),
.ping-bar.bg-success:nth-last-child(5) {
  animation-delay: 0.20s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(6),
.ping-bar.bg-primary:nth-last-child(6),
.ping-bar.bg-success:nth-last-child(6) {
  animation-delay: 0.25s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(7),
.ping-bar.bg-primary:nth-last-child(7),
.ping-bar.bg-success:nth-last-child(7) {
  animation-delay: 0.30s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(8),
.ping-bar.bg-primary:nth-last-child(8),
.ping-bar.bg-success:nth-last-child(8) {
  animation-delay: 0.35s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(9),
.ping-bar.bg-primary:nth-last-child(9),
.ping-bar.bg-success:nth-last-child(9) {
  animation-delay: 0.40s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(10),
.ping-bar.bg-primary:nth-last-child(10),
.ping-bar.bg-success:nth-last-child(10) {
  animation-delay: 0.45s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(11),
.ping-bar.bg-primary:nth-last-child(11),
.ping-bar.bg-success:nth-last-child(11) {
  animation-delay: 0.50s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(12),
.ping-bar.bg-primary:nth-last-child(12),
.ping-bar.bg-success:nth-last-child(12) {
  animation-delay: 0.55s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(13),
.ping-bar.bg-primary:nth-last-child(13),
.ping-bar.bg-success:nth-last-child(13) {
  animation-delay: 0.60s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(14),
.ping-bar.bg-primary:nth-last-child(14),
.ping-bar.bg-success:nth-last-child(14) {
  animation-delay: 0.65s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(15),
.ping-bar.bg-primary:nth-last-child(15),
.ping-bar.bg-success:nth-last-child(15) {
  animation-delay: 0.70s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(16),
.ping-bar.bg-primary:nth-last-child(16),
.ping-bar.bg-success:nth-last-child(16) {
  animation-delay: 0.75s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(17),
.ping-bar.bg-primary:nth-last-child(17),
.ping-bar.bg-success:nth-last-child(17) {
  animation-delay: 0.80s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(18),
.ping-bar.bg-primary:nth-last-child(18),
.ping-bar.bg-success:nth-last-child(18) {
  animation-delay: 0.85s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(19),
.ping-bar.bg-primary:nth-last-child(19),
.ping-bar.bg-success:nth-last-child(19) {
  animation-delay: 0.90s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(20),
.ping-bar.bg-primary:nth-last-child(20),
.ping-bar.bg-success:nth-last-child(20) {
  animation-delay: 0.95s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(21),
.ping-bar.bg-primary:nth-last-child(21),
.ping-bar.bg-success:nth-last-child(21) {
  animation-delay: 1.00s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(22),
.ping-bar.bg-primary:nth-last-child(22),
.ping-bar.bg-success:nth-last-child(22) {
  animation-delay: 1.05s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(23),
.ping-bar.bg-primary:nth-last-child(23),
.ping-bar.bg-success:nth-last-child(23) {
  animation-delay: 1.10s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(24),
.ping-bar.bg-primary:nth-last-child(24),
.ping-bar.bg-success:nth-last-child(24) {
  animation-delay: 1.15s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(25),
.ping-bar.bg-primary:nth-last-child(25),
.ping-bar.bg-success:nth-last-child(25) {
  animation-delay: 1.20s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(26),
.ping-bar.bg-primary:nth-last-child(26),
.ping-bar.bg-success:nth-last-child(26) {
  animation-delay: 1.25s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(27),
.ping-bar.bg-primary:nth-last-child(27),
.ping-bar.bg-success:nth-last-child(27) {
  animation-delay: 1.30s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(28),
.ping-bar.bg-primary:nth-last-child(28),
.ping-bar.bg-success:nth-last-child(28) {
  animation-delay: 1.35s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(29),
.ping-bar.bg-primary:nth-last-child(29),
.ping-bar.bg-success:nth-last-child(29) {
  animation-delay: 1.40s;
}

.hp-bar-big .beat[data-v-636dc6a9]:nth-last-child(30),
.ping-bar.bg-primary:nth-last-child(30),
.ping-bar.bg-success:nth-last-child(30) {
  animation-delay: 1.45s;
}

@keyframes wr-green-flow {
  0%,
  100% {
    background-color: var(--bs-green) !important;
    filter: brightness(0.92);
    box-shadow: 0 0 5px color-mix(in oklch, var(--bs-green), transparent 62%);
  }

  38% {
    background-color: oklch(0.84 0.12 150) !important;
    filter: brightness(1.12);
    box-shadow:
      0 0 7px color-mix(in oklch, var(--bs-green), transparent 48%),
      0 0 14px color-mix(in oklch, var(--bs-green), transparent 68%);
  }

  70% {
    background-color: var(--bs-green) !important;
    filter: brightness(0.98);
    box-shadow: 0 0 6px color-mix(in oklch, var(--bs-green), transparent 56%);
  }
}
/* ========================================================
   10. 状态百分比改为呼吸状态
======================================================== */

.info .badge.rounded-pill.bg-primary {
  --bg: var(--bs-green);
}

.info .badge.rounded-pill.bg-danger {
  --bg: var(--bs-danger);
}

.info .badge.rounded-pill {
  position: relative;
  display: flex;
  min-width: auto;
  width: 1rem;
  margin-left: 0.1rem;
  font-size: 0;
  justify-content: center;
  align-items: center;
  background-color: transparent !important;
}

.info .badge.rounded-pill::before {
  position: absolute;
  content: "";
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: var(--bg);
  animation: breath 1.1s ease-in-out infinite;
}

.info .badge.rounded-pill::after {
  content: "";
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background-color: var(--bg);
}

@keyframes breath {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.2;
  }

  50% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* ========================================================
   11. 保留原公共布局优化
======================================================== */

/* 隐藏更新时间 */
.refresh-info.mb-2 {
  display: none;
}

/* 原版布局比例：不改 */
.col-md-4 {
  width: 50%;
}

.col-md-8 {
  max-width: 50%;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
}

.mb-5 {
  margin-bottom: 2rem !important;
}

/* 行内左右分布：保留 */
.item .row {
  justify-content: space-between;
}

/* 底部样式 */
footer[data-v-b8247e57] {
  margin: 1.5rem 0 !important;
}

footer p {
  margin: 0 !important;
  color: rgba(255, 255, 255, 0.58) !important;
}

/* ========================================================
   12. 手机适配：保留原版逻辑
======================================================== */

@media screen and (max-width: 768px) {
  .container {
    margin-top: 3.5rem !important;
  }

  .title-flex {
    font-size: 2.2rem !important;
    letter-spacing: 0.06em !important;
    gap: 14px !important;
  }

  .title-flex img,
  .logo,
  img.logo {
    width: 68px !important;
    height: 68px !important;
    max-width: 68px !important;
    max-height: 68px !important;
  }

  .monitor-list .monitor-list {
    grid-template-columns: repeat(1, 1fr);
  }

  .group-title {
    font-size: 2rem;
  }

  .col-md-4 {
    width: 100%;
  }

  .col-md-8 {
    max-width: 100%;
  }
}
```
