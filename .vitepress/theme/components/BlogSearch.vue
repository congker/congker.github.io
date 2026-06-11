<script setup lang="ts">
import localSearchIndex from '@localSearchIndex'
import MiniSearch, { type SearchResult } from 'minisearch'
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useData, useRouter } from 'vitepress'

interface SearchDoc {
  title: string
  titles: string[]
  text?: string
}

const { localeIndex } = useData()
const router = useRouter()
const opened = ref(false)
const loading = ref(false)
const loadError = ref(false)
const query = ref('')
const inputRef = ref<HTMLInputElement>()
const searchIndex = shallowRef<MiniSearch<SearchDoc>>()
let previousBodyOverflow = ''

const results = computed(() => {
  const value = query.value.trim()

  if (!value || !searchIndex.value) return []

  return searchIndex.value
    .search(value, {
      fuzzy: 0.2,
      prefix: true,
      boost: { title: 4, text: 2, titles: 1 }
    })
    .slice(0, 16) as Array<SearchResult & SearchDoc>
})

async function loadIndex() {
  if (searchIndex.value || loading.value) return

  loading.value = true
  loadError.value = false

  try {
    const mod = await localSearchIndex[localeIndex.value]?.()
    const data = mod?.default

    searchIndex.value = MiniSearch.loadJSON<SearchDoc>(data, {
      fields: ['title', 'titles', 'text'],
      storeFields: ['title', 'titles']
    })
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function openSearch() {
  if (!opened.value) {
    opened.value = true
  }

  await loadIndex()
  await nextTick()
  inputRef.value?.focus()
}

function closeSearch() {
  opened.value = false
}

function go(id: string) {
  router.go(id)
  closeSearch()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeSearch()
  }
}

watch(opened, (value) => {
  if (typeof document === 'undefined') return

  if (value) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeydown)
  } else {
    document.body.style.overflow = previousBodyOverflow
    window.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = previousBodyOverflow
  }

  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="blog-search">
    <button
      class="blog-search-button"
      type="button"
      aria-label="搜索"
      @click="openSearch"
      @touchend.prevent="openSearch"
    >
      <span class="vpi-search blog-search-icon" aria-hidden="true" />
      <span class="blog-search-text">Search</span>
      <span class="blog-search-key">Ctrl K</span>
    </button>

    <Teleport to="body">
      <div v-if="opened" class="blog-search-modal" role="dialog" aria-modal="true">
        <button class="blog-search-backdrop" type="button" aria-label="关闭搜索" @click="closeSearch" />

        <div class="blog-search-panel">
          <div class="blog-search-input-row">
            <span class="vpi-search blog-search-icon" aria-hidden="true" />
            <input
              ref="inputRef"
              v-model="query"
              class="blog-search-input"
              type="search"
              placeholder="搜索文章"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
            />
            <button class="blog-search-close" type="button" aria-label="关闭搜索" @click="closeSearch">×</button>
          </div>

          <div class="blog-search-body">
            <p v-if="loading" class="blog-search-state">正在加载搜索索引...</p>
            <p v-else-if="loadError" class="blog-search-state">搜索加载失败，请刷新页面后重试。</p>
            <p v-else-if="query && !results.length" class="blog-search-state">没有找到相关文章。</p>
            <p v-else-if="!query" class="blog-search-state">输入关键词搜索文章。</p>

            <a
              v-for="item in results"
              :key="item.id"
              class="blog-search-result"
              :href="item.id"
              @click.prevent="go(item.id)"
            >
              <span class="blog-search-result-title">{{ item.title }}</span>
              <span v-if="item.titles?.length" class="blog-search-result-path">
                {{ item.titles.join(' / ') }}
              </span>
            </a>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
