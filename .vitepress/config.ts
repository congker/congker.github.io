import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitepress'

const contentDir = path.resolve(__dirname, '../content')
const generatedTxtMarker = '<!-- generated from txt by .vitepress/config.ts -->'

function toPosixPath(value: string) {
  return value.split(path.sep).join('/')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function generateMarkdownFromTxt() {
  if (!fs.existsSync(contentDir)) return

  fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((category) => {
      const categoryDir = path.join(contentDir, category.name)

      fs
        .readdirSync(categoryDir, { withFileTypes: true })
        .filter((article) => article.isFile() && article.name.endsWith('.txt'))
        .forEach((article) => {
          const title = article.name.replace(/\.txt$/, '')
          const sourcePath = path.join(categoryDir, article.name)
          const outputPath = path.join(categoryDir, `${title}.md`)
          const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf-8') : ''

          if (existing && !existing.startsWith(generatedTxtMarker)) return

          const text = fs.readFileSync(sourcePath, 'utf-8')
          const markdown = `${generatedTxtMarker}\n# ${title}\n\n<pre class="txt-article">${escapeHtml(text)}</pre>\n`
          fs.writeFileSync(outputPath, markdown)
        })
    })
}

function getCategories() {
  if (!fs.existsSync(contentDir)) return []

  return fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('['))
    .map((entry) => {
      const categoryDir = path.join(contentDir, entry.name)
      const items = fs
        .readdirSync(categoryDir, { withFileTypes: true })
        .filter((article) => article.isFile() && article.name.endsWith('.md'))
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
        .map((article) => {
          const title = article.name.replace(/\.md$/, '')
          return {
            text: title,
            link: `/content/${toPosixPath(entry.name)}/${toPosixPath(title)}`
          }
        })

      return {
        text: entry.name,
        collapsed: false,
        items
      }
    })
    .filter((category) => category.items.length > 0)
    .sort((a, b) => a.text.localeCompare(b.text, 'zh-Hans-CN'))
}

generateMarkdownFromTxt()

const sidebar = getCategories()

export default defineConfig({
  title: '江北黑衣',
  description: '江北黑衣的个人博客',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/content/大模型/chatgpt历史演进' }
    ],
    sidebar: {
      '/content/': sidebar
    },
    search: {
      provider: 'local'
    },
    outline: {
      label: '目录'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    lastUpdated: {
      text: '最后更新'
    }
  }
})
