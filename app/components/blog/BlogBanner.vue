<script setup lang="ts">
const appConfig = useAppConfig()

// 全部手动控制，不用 useLocalStorage，避免 SSR/hydration 的坑
const dismissed = ref(false)
const leaving = ref(false)

// SSR 时渲染，让入场动画有机会挂载
// 如果已关闭过，hydration 后在 onMounted 里通过 leaved 关闭

onMounted(() => {
  if (localStorage.getItem('blog-banner-dismissed')) {
    dismissed.value = true
    return
  }
})

function dismiss() {
  leaving.value = true
  setTimeout(() => {
    dismissed.value = true
    localStorage.setItem('blog-banner-dismissed', '1')
  }, 250)
}
</script>

<template>
  <article v-if="!dismissed" class="blog-toast" :class="{ 'toast-out': leaving }">
    <NuxtImg
      class="toast-logo"
      :src="appConfig.author.avatar"
      alt=""
      densities="1x"
    />
    <div class="toast-body">
      <p class="toast-title">我们从 Firefly 迁移到新博客啦！</p>
      <p class="toast-desc">新博客，新起点～</p>
    </div>
    <button class="toast-close" aria-label="关闭" @click="dismiss">
      <Icon name="tabler:x" />
    </button>
  </article>
</template>

<style lang="scss">
@keyframes toast-pop-in {
  0% {
    opacity: 0;
    transform: translateX(100%);
  }
  60% {
    opacity: 1;
    transform: translateX(-6%);
  }
  75% {
    transform: translateX(3%);
  }
  90% {
    transform: translateX(-1%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-pop-out {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(1em);
  }
}
</style>

<style lang="scss" scoped>
.blog-toast {
  position: fixed;
  top: min(2rem, 5%);
  inset-inline-end: min(1rem, 5%);
  z-index: calc(var(--z-index-popover, 100) + 1);
  display: flex;
  align-items: flex-start;
  gap: 0.75em;
  max-width: 360px;
  padding: 1em 1.1em;
  border-radius: 0.8em;
  background-color: var(--ld-bg-card);
  box-shadow: var(--box-shadow-3);
  animation: toast-pop-in 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

  @media (max-width: 400px) {
    max-width: calc(100vw - 2rem);
  }
}

.toast-out {
  animation: toast-pop-out 0.22s ease-in forwards !important;
}

.toast-logo {
  flex-shrink: 0;
  width: 2.4em;
  height: 2.4em;
  border-radius: 0.6em;
}

.toast-body {
  flex: 1;
  min-width: 0;
  line-height: 1.45;
}

.toast-title {
  font-weight: 600;
  color: var(--c-text);
  margin: 0;
}

.toast-desc {
  font-size: 0.85em;
  color: var(--c-text-2);
  margin: 0.15em 0 0;
}

.toast-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6em;
  height: 1.6em;
  border-radius: 4px;
  color: var(--c-text-3);
  opacity: 0.6;
  transition: opacity 0.2s, background-color 0.2s;

  &:hover {
    opacity: 1;
    background: var(--c-bg-2);
  }
}
</style>
