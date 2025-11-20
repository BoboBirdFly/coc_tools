# COC 创建角色工具（前端）

基于 React + TypeScript + Vite 的纯前端项目，角色数据与计算逻辑全部在浏览器执行，可直接部署在 GitHub Pages。

## 本地运行

```bash
cd frontend
pnpm install          # 第一次需要
pnpm dev              # 启动开发服务器，默认 http://localhost:5173
```

## 构建与离线预览

```bash
pnpm build            # 产出 dist/
pnpm preview          # 预览构建结果
```

`dist/` 可直接拷贝到任意静态环境或手机浏览器打开实现离线使用。

## GitHub Pages 自动部署

- Workflow：`.github/workflows/deploy.yml`。触发条件为推送到 `main` 或在 Actions 页面手动 “Run workflow”。
- 流程：Checkout → `pnpm install` → `pnpm build` → 上传 `frontend/dist` → `actions/deploy-pages`。
- 首次需在仓库 `Settings > Pages` 将 Source 设置为 “GitHub Actions”。  
- 部署完成后，可在 Actions 日志或 `Environments > github-pages` 页面获取访问地址（形如 `https://<username>.github.io/coc_tools/`）。
