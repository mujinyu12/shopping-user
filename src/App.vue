<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <!-- 全局 AI 客服：左下角，所有页面都在 -->
  <AiChat />
</template>

<script setup lang="ts">
import AiChat from '@/components/AiChat.vue'
</script>