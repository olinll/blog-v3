<script setup lang="ts">
const appConfig = useAppConfig()
const layoutStore = useLayoutStore()
layoutStore.setAside([])

const { data: postGuestbook } = await useAsyncData(
  'content:/guestbook',
  () => queryCollection('content').path('/guestbook').first(),
)

useSeoMeta({
  title: '留言板',
  description: `${appConfig.title}的留言板，欢迎留下你的足迹。`,
})
</script>

<template>
  <!-- 移动端顶部 -->
  <BlogHeader class="mobile-only" to="/" suffix="留言板" tag="h1" />

  <!-- 桌面端 Hero -->
  <header class="guestbook-hero mobile-hidden">
    <div class="hero-icon">
      <Icon name="tabler:messages" />
    </div>
    <h1 class="hero-title text-creative">留言板</h1>
    <p class="hero-desc">说点什么吧，任何话都可以 ✨</p>
  </header>

  <!-- 说明内容 -->
  <section class="guestbook-intro card" :style="{ '--delay': '0.1s' }">
    <ContentRenderer
      v-if="postGuestbook"
      :value="postGuestbook"
      class="intro-content"
    />
    <p v-else class="text-center" style="opacity: 0.5">
      可于 guestbook.md 配置留言板说明。
    </p>
  </section>

  <!-- 分割装饰 -->
  <div class="comment-divider" :style="{ '--delay': '0.2s' }">
    <span class="divider-line" />
    <Icon name="tabler:chevrons-down" class="divider-icon" />
    <span class="divider-line" />
  </div>

  <!-- 评论区 -->
  <section class="guestbook-comments card" :style="{ '--delay': '0.3s' }">
    <h2 class="comment-title">
      <Icon name="tabler:brand-hipchat" />
      <span>大家的足迹</span>
    </h2>
    <PostComment />
  </section>
</template>

<style lang="scss" scoped>
// ---------- Hero ----------
.guestbook-hero {
  text-align: center;
  padding: 3rem 1rem 2rem;
  animation: float-in 0.4s var(--delay, 0s) backwards;
}

.hero-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 1.2rem;
  background: linear-gradient(135deg, var(--c-accent), var(--c-primary-soft));
  color: #fff;
  font-size: 2.2rem;
  margin-bottom: 1rem;
  box-shadow: var(--box-shadow-2);
}

.hero-title {
  font-size: 2rem;
  margin: 0;
  color: var(--c-text);
}

.hero-desc {
  margin: 0.5rem 0 0;
  color: var(--c-text-2);
  font-size: 1.05rem;
}

// ---------- 说明卡片 ----------
.guestbook-intro {

  margin: 0 auto;
  padding: 1.5rem 2rem;
  animation: float-in 0.4s var(--delay, 0.1s) backwards;

  :deep(.intro-content) {
    line-height: 1.8;

    h2 {
      font-size: 1.3rem;
      margin: 0 0 0.5rem;

      &::before {
        content: '💬 ';
      }
    }

    p {
      margin: 0.5rem 0;
      color: var(--c-text-2);
    }
  }
}

// ---------- 分割线 ----------
.comment-divider {
  display: flex;
  align-items: center;
  gap: 1rem;

  margin: 2rem auto;
  animation: float-in 0.4s var(--delay, 0.2s) backwards;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--c-border),
    transparent
  );
}

.divider-icon {
  color: var(--c-text-3);
  font-size: 1.1rem;
  flex-shrink: 0;
}

// ---------- 评论区卡片 ----------
.guestbook-comments {

  margin: 0 auto 2rem;
  padding: 1.5rem 2rem;
  animation: float-in 0.4s var(--delay, 0.3s) backwards;
}

.comment-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
  margin: 0 0 1rem;
  color: var(--c-text);

  .icon {
    color: var(--c-accent);
  }
}
</style>
