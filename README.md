# Social Post Extractor (Twitter first)

一个可扩展的浏览器扩展：在 Twitter (X) 上给喜欢的帖子加一个按钮，点击即可提取文案并保存/复制。未来可扩展到其他平台（如 Reddit、Weibo、LinkedIn 等）。

## 初始功能
- 自动在可见推文区域右上角（或操作栏）注入“复制文案”按钮
- 点击后提取：id、作者、时间、纯文本内容（去除多余 UI）、可能的引用/转推文本
- 自动复制到剪贴板，并保存到本地 `chrome.storage.local`
- Popup 中查看已保存的帖子列表，支持复制/删除/导出 JSON

## 技术栈
- Manifest V3
- TypeScript + esbuild 打包
- 模块化平台抽象，便于扩展新站点

## 目录结构
```
src/
  core/          // 通用类型、注册中心、工具
  platforms/     // 各平台实现（twitter.ts ...）
  content/       // 内容脚本（注入、监听 DOM）
  background/    // service worker（消息路由、存储）
  popup/         // 弹窗页面
scripts/         // 构建脚本
public/          // manifest.json / 图标 等静态资源
```

## 后续扩展想法
- 右键菜单提取当前选中文本
- 批量导出 Markdown/CSV
- OpenAI 总结/分类（需用户自配 API Key）
- 登录同步 (chrome.storage.sync)

## 开发
安装依赖：
```
npm install
```
构建：
```
npm run build
```
开发 watch：
```
npm run dev
```

然后在浏览器开发者模式中加载 `dist/` 目录。

## 许可
MIT
