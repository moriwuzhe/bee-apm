# LtMonitor UI（重写版）

独立的新前端工程，和 `lt-ui-old/lt-monitor-ui-web` 并行存在，用于逐步替换旧版 Vue2 + Webpack3 UI。

## 技术栈

- Vue 3 + TypeScript
- Vite（为兼容 Node 20.12.x，固定在 Vite 5.x）
- Element Plus
- Pinia + Vue Router

## 本地开发

在仓库根目录执行：

```bash
cd lt-ui/lt-monitor-ui-web
pnpm config set store-dir ../../.pnpm-store
pnpm install
pnpm dev
```

访问：

- http://localhost:8000/#/login

## API 对接

默认代理 `/api/*` 到 `http://localhost:8001`（旧版 UI Server）。

如需改为其它后端（例如本机端口不同），启动时设置：

```bash
VITE_API_TARGET=http://localhost:8001 pnpm dev
```
