<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import { computed, onMounted, ref, watch } from 'vue'

const DefaultLayout = DefaultTheme.Layout
const storageKey = 'blog-sidebar-collapsed'
const route = useRoute()
const mounted = ref(false)
const collapsed = ref(false)
const showToggle = computed(() => route.path.startsWith('/content/'))

function syncClass() {
  if (typeof document === 'undefined') return

  document.documentElement.classList.toggle(
    'sidebar-collapsed',
    showToggle.value && collapsed.value
  )
}

function toggleSidebar() {
  collapsed.value = !collapsed.value
  localStorage.setItem(storageKey, collapsed.value ? '1' : '0')
}

onMounted(() => {
  collapsed.value = localStorage.getItem(storageKey) === '1'
  mounted.value = true
  syncClass()
})

watch([collapsed, showToggle], syncClass)
</script>

<template>
  <DefaultLayout />
  <button
    v-if="mounted && showToggle"
    class="sidebar-collapse-toggle"
    type="button"
    :aria-pressed="collapsed"
    :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
    @click="toggleSidebar"
  >
    <span aria-hidden="true">{{ collapsed ? '›' : '‹' }}</span>
  </button>
</template>
