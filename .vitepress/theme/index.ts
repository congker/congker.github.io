import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ArticleList from './components/ArticleList.vue'
import BlogHome from './components/BlogHome.vue'
import Layout from './components/Layout.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('ArticleList', ArticleList)
    app.component('BlogHome', BlogHome)
  }
} satisfies Theme
