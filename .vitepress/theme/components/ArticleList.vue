<script setup lang="ts">
type Article = {
  title: string
  link: string
}

type Category = {
  name: string
  articles: Article[]
}

const modules = import.meta.glob('/content/**/*.md')

const categories = Object.keys(modules)
  .map((filePath) => {
    const match = filePath.match(/^\/content\/([^/]+)\/([^/]+)\.md$/)
    if (!match) return null

    const [, category, article] = match
    if (category.startsWith('[')) return null

    return {
      category: decodeURIComponent(category),
      article: decodeURIComponent(article),
      link: encodeURI(filePath.replace(/\.md$/, ''))
    }
  })
  .filter((item): item is { category: string; article: string; link: string } => Boolean(item))
  .reduce<Category[]>((result, item) => {
    let category = result.find((entry) => entry.name === item.category)
    if (!category) {
      category = { name: item.category, articles: [] }
      result.push(category)
    }

    category.articles.push({
      title: item.article,
      link: item.link
    })

    return result
  }, [])
  .map((category) => ({
    ...category,
    articles: category.articles.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))

const articleCount = categories.reduce((sum, category) => sum + category.articles.length, 0)
</script>

<template>
  <main class="blog-home article-list-page">
    <section class="blog-hero">
      <p class="blog-kicker">Articles</p>
      <h1>文章列表</h1>
      <p class="blog-summary">
        共 {{ categories.length }} 个分类，{{ articleCount }} 篇文章。
      </p>
    </section>

    <section class="blog-content" aria-label="文章列表">
      <div v-if="categories.length" class="category-grid">
        <section v-for="category in categories" :key="category.name" class="category-card">
          <div class="category-header">
            <h2>{{ category.name }}</h2>
            <span>{{ category.articles.length }} 篇</span>
          </div>
          <ul>
            <li v-for="article in category.articles" :key="article.link">
              <a :href="article.link">{{ article.title }}</a>
            </li>
          </ul>
        </section>
      </div>

      <p v-else class="empty-state">
        content 目录下还没有可展示的 Markdown 或 TXT 文章。
      </p>
    </section>
  </main>
</template>
