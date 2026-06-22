<script lang="tsx" setup>
const slots = defineSlots<{
	default: () => VNode[]
}>()

const chatRegex = /^\{(?<control>\.|:)?(?<caption>.*)\}$/

function getControlClass(control?: string) {
	if (control === '.')
		return 'chat-myself'
	if (control === ':')
		return 'chat-system'
	return ''
}

/** 暴力提取 VNode 树的全部文本（含换行），兼容 SSR 和客户端 */
function getVNodeText(node: any): string | null {
	if (!node || typeof node !== 'object') return null
	if (typeof node === 'string') return node

	const ch = node.children
	if (typeof ch === 'string') return ch

	// SSR slot fn
	if (typeof ch?.default === 'function') {
		try {
			const r = ch.default()
			if (Array.isArray(r)) return r.map(c => getVNodeText(c) ?? '').join('')
		} catch { /* ignore */ }
	}

	// 数组
	if (Array.isArray(ch))
		return ch.map(c => getVNodeText(c) ?? '').join('')

	// 组件实例（MDC 客户端）
	if (ch?._ctx) {
		const ss = ch._ctx.setupState ?? ch._ctx
		for (const key of ['text', 'content', 'value', 'code']) {
			if (typeof ss[key] === 'string') return ss[key]
		}
		if (typeof ss.$slots?.default === 'function') {
			try {
				const sd = ss.$slots.default()
				if (Array.isArray(sd)) return sd.map(c => getVNodeText(c) ?? '').join('')
			} catch { /* ignore */ }
		}
	}

	if (ch && typeof ch === 'object')
		return getVNodeText(ch)

	return null
}

function render() {
	const slotContent = slots.default()
	if (!slotContent)
		return <span>无会话内容</span>

	return slotContent.flatMap((node: VNode) => {
		const textContent = getVNodeText(node)
		if (typeof textContent !== 'string')
			return [<dd class="chat-body">{node}</dd>]

		// 按行拆分：第一行若是 {caption} 则作为发言者标识，余下为消息体
		const lines = textContent.trim().split('\n')
		const firstLine = lines[0]?.trim()
		const matchGroups = firstLine?.match(chatRegex)?.groups

		if (!matchGroups)
			return [<dd class="chat-body">{node}</dd>]

		const body = lines.slice(1).join('\n').trim()
		const result: any[] = [
			<dt class={`chat-caption ${getControlClass(matchGroups.control)}`}>{matchGroups.caption}</dt>,
		]
		if (body)
			result.push(<dd class="chat-body"><p>{body}</p></dd>)
		return result
	})
}
</script>

<template>
<dl class="chat">
	<render />
</dl>
</template>

<style lang="scss" scoped>
.chat {
	margin-inline: 2vw;
	font-size: 0.9em;
}

:deep() {
	> .chat-caption {
		opacity: 0.8;
		font-size: 0.9em;
	}

	> .chat-body {
		overflow: hidden;
		width: fit-content;
		max-width: 90%;
		margin-bottom: 1em;
		padding: 0 1em;
		border-radius: 1em;
		border-start-start-radius: 0.2em;
		background-color: var(--c-bg-2);
	}

	> .chat-system {
		margin-bottom: 1em;
		text-align: center;
	}

	> .chat-myself {
		text-align: end;

		& + .chat-body {
			margin-inline-start: auto;
			border-radius: 1em;
			border-start-end-radius: 0.2em;
			background-color: var(--c-primary-soft);
		}
	}
}
</style>
