# Docker 部署 Sun-Panel 导航面板

> 使用 Docker Compose 部署 Sun-Panel 导航面板，适合作为 NAS、服务器首页或浏览器起始页，支持简易 Docker 管理。

Sun-Panel 是一个 NAS、服务器导航面板、简易 Docker 管理器，可作为 Homepage 或浏览器首页使用。

- 首页：[sun-panel.top](https://doc.sun-panel.top/zh_cn/)
- GitHub：[hslr-s/sun-panel](https://github.com/hslr-s/sun-panel)
- 默认账号：`admin@sun.cc` / `12345678`

## 部署

<alert type="warning">

挂载 `docker.sock` 赋予容器对宿主机 Docker 的完全控制权（等同 root 权限），仅在可信环境中使用。

</alert>

```yaml [docker-compose.yml]
services:
  panel:
    image: 'hslr/sun-panel:latest'
    hostname: panel
    container_name: panel
    ports:
      - '3002:3002'
    volumes:
      - './conf:/app/conf'
      - '/var/run/docker.sock:/var/run/docker.sock'
    restart: always
    networks:
      - app-net

networks:
  app-net:
    external: true
```

## 美化 CSS

### 毛玻璃效果

```css
.item-list {
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  background: rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px;
  color: white;
  margin: auto;
}
```

### 图标悬停摇晃动画

```css
.icon-info-box .rounded-2xl:hover {
  background: rgba(42, 42, 42, 0.7) !important;
  animation: info-shake-bounce .5s alternate !important;
}

.icon-small-box .rounded-2xl:hover {
  background: rgba(42, 42, 42, 0.7) !important;
  animation: small-shake-bounce .5s alternate !important;
}

@keyframes info-shake-bounce {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(10deg); }
  50% { transform: rotate(-10deg); }
  75% { transform: rotate(2.5deg); }
  85% { transform: rotate(-2.5deg); }
}

@keyframes small-shake-bounce {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(15deg); }
  50% { transform: rotate(-15deg); }
  75% { transform: rotate(5deg); }
  85% { transform: rotate(5deg); }
}
```
