# 江北黑衣

基于 VitePress 搭建的个人博客，内容按分类存放在 `content` 目录下。站点支持本地搜索、文章侧边栏、文章目录、明暗主题切换，以及桌面端左侧导航栏收起。

## 技术栈

- VitePress 1.x
- Vue 3
- Node.js / npm

## 目录结构

```text
.
├── .vitepress/
│   ├── config.ts                 # VitePress 配置，自动生成侧边栏和 txt 转 md
│   └── theme/
│       ├── components/
│       │   ├── ArticleList.vue    # 文章列表页组件
│       │   ├── BlogHome.vue       # 首页分类卡片组件
│       │   └── Layout.vue         # 自定义布局，支持侧边栏收起
│       ├── index.ts               # 主题入口
│       └── style.css              # 全局样式覆盖
├── content/
│   ├── 大模型/
│   ├── 社区/
│   └── 运维/
├── articles.md                   # 文章列表页
├── index.md                      # 首页
├── package.json
└── start.bat                     # Windows 一键启动脚本
```

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:5174/
```

Windows 下也可以直接运行：

```bat
start.bat
```

## 构建与预览

构建静态站点：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

构建产物输出到：

```text
.vitepress/dist
```

## 内容维护

文章按分类放在 `content/<分类名>/` 下，文件名会作为文章标题和访问路径。

示例：

```text
content/运维/docker基础教程.md
```

生成的访问路径：

```text
/content/运维/docker基础教程
```

新增 Markdown 文章后，首页分类卡片和文章页侧边栏会自动更新。

## TXT 支持

项目支持把 `.txt` 文本转换为同名 Markdown 页面。转换逻辑在 `.vitepress/config.ts` 中：

```text
content/社区/Harness工程指南.txt
```

会自动生成：

```text
content/社区/Harness工程指南.md
```

生成的 Markdown 文件以标记开头：

```html
<!-- generated from txt by .vitepress/config.ts -->
```

如果同名 `.md` 已存在且不是自动生成文件，系统不会覆盖它。

## 当前内容

- 大模型
  - chatgpt历史演进
  - claude异军突起
- 社区
  - Harness工程指南
- 运维
  - debian12性能优化
  - docker基础教程
  - k8s深入浅出

## GitHub Pages

远程仓库：

```text
git@github.com:congker/congker.github.io.git
```

项目已绑定 `origin`，主分支为 `main`。

常用发布流程：

```bash
npm run build
git add .
git commit -m "Update blog"
git push origin main
```
