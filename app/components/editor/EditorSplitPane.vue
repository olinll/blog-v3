<script setup lang="ts">
/**
 * EditorSplitPane —— 可拖动分栏（CSS Grid + pointer events）
 *
 * 用 grid-template-columns: var(--split-left) 4px 1fr 控制左右宽度。
 * 中间 4px 条捕获 pointer 事件，更新 --split-left。
 * 宽度持久化到 localStorage：editor:layout:split:v1
 *
 * 关键设计：
 * - leftWidth 是 percentage (0-100)，不是 px；窗口缩放时比例不变
 * - 最小宽度 20%（过窄显示不出代码）
 * - useEventListener 自动清理 window 级 pointer 监听
 * - rAF 节流避免拖动时设置 CSS 变量太频繁
 */

const LAYOUT_KEY = 'editor:layout:split:v1'
const MIN_PERCENT = 20
const MAX_PERCENT = 80

const props = defineProps<{
	defaultLeftPercent?: number
	minPercent?: number
	maxPercent?: number
}>()

const slots = defineSlots<{
	default: () => unknown
}>()

const leftPercent = ref(props.defaultLeftPercent ?? 50)
const isResizing = ref(false)
const containerRef = useTemplateRef('containerRef')

// 限制范围
function clamp(v: number) {
	return Math.max(props.minPercent ?? MIN_PERCENT, Math.min(props.maxPercent ?? MAX_PERCENT, v))
}

// 恢复持久化宽度
onMounted(() => {
	if (typeof window === 'undefined') return
	const raw = window.localStorage.getItem(LAYOUT_KEY)
	if (raw) {
		const n = Number.parseFloat(raw)
		if (Number.isFinite(n)) leftPercent.value = clamp(n)
	}
})

// 拖动状态
let startX = 0
let startPercent = 0
let containerWidth = 0

function onPointerDown(e: PointerEvent) {
	if (!containerRef.value) return
	isResizing.value = true
	startX = e.clientX
	startPercent = leftPercent.value
	containerWidth = containerRef.value.getBoundingClientRect().width
	;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
	e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
	if (!isResizing.value) return
	const dx = e.clientX - startX
	const deltaPercent = (dx / containerWidth) * 100
	leftPercent.value = clamp(startPercent + deltaPercent)
}

function onPointerUp() {
	if (!isResizing.value) return
	isResizing.value = false
	if (typeof window !== 'undefined') {
		window.localStorage.setItem(LAYOUT_KEY, String(leftPercent.value))
	}
}

// 注册到 window，确保鼠标离开 resizer 也能继续
useEventListener('pointermove', onPointerMove)
useEventListener('pointerup', onPointerUp)
useEventListener('pointercancel', onPointerUp)

const splitStyle = computed(() => ({
	'--split-left': `${leftPercent.value}%`,
}))

// 暴露给父组件：手动重置
defineExpose({
	reset() {
		leftPercent.value = props.defaultLeftPercent ?? 50
		if (typeof window !== 'undefined') {
			window.localStorage.removeItem(LAYOUT_KEY)
		}
	},
})
</script>

<template>
	<div ref="containerRef" class="editor-split" :style="splitStyle">
		<div class="editor-pane">
			<slot name="left" />
		</div>
		<div
			class="editor-resizer"
			:data-resizing="isResizing"
			role="separator"
			aria-orientation="vertical"
			aria-label="拖动调整分栏宽度"
			@pointerdown="onPointerDown"
		/>
		<div class="editor-pane">
			<slot name="right" />
		</div>
	</div>
</template>

<style scoped>
.editor-split {
	flex: 1;
	min-height: 0;
	display: grid;
	grid-template-columns: var(--split-left, 50%) 4px 1fr;
	isolation: isolate;
}
.editor-pane {
	min-width: 0;
	min-height: 0;
	overflow: auto;
}
.editor-resizer {
	cursor: col-resize;
	background-color: var(--c-bg-soft);
	position: relative;
	z-index: 1;
	user-select: none;
	touch-action: none;
}
.editor-resizer::before {
	content: "";
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 2px;
	height: 24px;
	border-radius: 1px;
	background-color: var(--c-text-3);
	opacity: 0.3;
}
.editor-resizer:hover,
.editor-resizer[data-resizing="true"] {
	background-color: var(--c-primary-soft);
}
.editor-resizer:hover::before,
.editor-resizer[data-resizing="true"]::before {
	opacity: 0.8;
}
</style>