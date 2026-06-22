<script setup lang="ts">
/**
 * EditorInsertMenu —— MDC 模板插入菜单
 *
 * 通过 ZDropdown 提供分类模板，点击插入到 CodeMirror 当前光标。
 * cursorOffset 为负数表示光标落在插入文本内部（相对于末尾的偏移）。
 */

const codePaneRef = inject<{ value: { insert: (text: string, cursorOffset?: number) => void } | null }>('editor-code-pane', { value: null })

interface Template {
	label: string
	icon: string
	insert: string
	cursorOffset: number
}

interface Category {
	label: string
	items: Template[]
}

const categories: Category[] = [
	{
		label: '提醒 Alert',
		items: [
			{
				label: '提醒',
				icon: 'tabler:note',
				insert: '::alert{type="tip" title="提醒"}\n内容\n::\n',
				cursorOffset: -4,
			},
			{
				label: '信息',
				icon: 'tabler:info-circle',
				insert: '::alert{type="info" title="信息"}\n内容\n::\n',
				cursorOffset: -4,
			},
			{
				label: '问题',
				icon: 'tabler:help-circle',
				insert: '::alert{type="question" title="问题"}\n内容\n::\n',
				cursorOffset: -4,
			},
			{
				label: '警告',
				icon: 'tabler:alert-triangle',
				insert: '::alert{type="warning" title="警告"}\n内容\n::\n',
				cursorOffset: -4,
			},
			{
				label: '错误',
				icon: 'tabler:circle-x',
				insert: '::alert{type="error" title="错误"}\n内容\n::\n',
				cursorOffset: -4,
			},
		],
	},
	{
		label: '容器',
		items: [
			{
				label: '折叠',
				icon: 'tabler:chevrons-down',
				insert: '::folding{title="折叠标题"}\n折叠内容\n::\n',
				cursorOffset: -13,
			},
			{
				label: '标签页',
				icon: 'tabler:layout-grid',
				insert: '::tab{:tabs=\'["标签一","标签二"]\'}\n#tab1\n内容一\n#tab2\n内容二\n::\n',
				cursorOffset: -24,
			},
			{
				label: '引用',
				icon: 'tabler:message-2',
				insert: '::quote{icon="tabler:message-2"}\n引用内容\n::\n',
				cursorOffset: -4,
			},
			{
				label: '诗词',
				icon: 'tabler:feather',
				insert: '::poetry{title="标题" author="作者"}\n诗词正文\n::\n',
				cursorOffset: -4,
			},
		],
	},
	{
		label: '媒体',
		items: [
			{
				label: '图片',
				icon: 'tabler:photo',
				insert: '::pic\n---\nsrc: https://example.com/image.png\ncaption: 图片说明\n---\n::\n',
				cursorOffset: -54,
			},
			{
				label: 'B站视频',
				icon: 'simple-icons:bilibili',
				insert: '::video-embed\n---\ntype: bilibili\nid: BVxxxxxxxxxx\n---\n::\n',
				cursorOffset: -32,
			},
			{
				label: 'YouTube',
				icon: 'simple-icons:youtube',
				insert: '::video-embed\n---\ntype: youtube\nid: dQw4w9WgXcQ\n---\n::\n',
				cursorOffset: -32,
			},
			{
				label: '抖音',
				icon: 'simple-icons:tiktok',
				insert: '::video-embed\n---\ntype: douyin\nid: 视频ID\n---\n::\n',
				cursorOffset: -32,
			},
			{
				label: '链接卡片',
				icon: 'tabler:link',
				insert: '::link-card\n---\ntitle: 标题\ndescription: 描述\nlink: https://example.com\n---\n::\n',
				cursorOffset: -64,
			},
			{
				label: '链接横幅',
				icon: 'tabler:ad-2',
				insert: '::link-banner\n---\ntitle: 标题\nurl: https://example.com\n---\n::\n',
				cursorOffset: -54,
			},
			{
				label: '乐谱 ABC',
				icon: 'tabler:music',
				insert: '```music-abc\nX:1\nT:曲名\nL:1/8\nQ:1/4=100\nM:4/4\nK:C\n| C D E F | G A B c |\n```\n',
				cursorOffset: -5,
			},
		],
	},
	{
		label: '代码与公式',
		items: [
			{
				label: '代码块(可复制)',
				icon: 'tabler:clipboard',
				insert: '::copy\n```ts\nconst greeting = "你好，世界！"\n```\n::\n',
				cursorOffset: -7,
			},
			{
				label: '代码块(带文件名)',
				icon: 'tabler:file-code',
				insert: '```ts [filename.ts]{wrap icon="tabler:file"}\n// 文件名: filename.ts\nconst greeting = "你好，世界！"\n```\n',
				cursorOffset: -5,
			},
			{
				label: '代码块(高亮行)',
				icon: 'tabler:highlight',
				insert: '```ts {1,3-4}\n// 第1行高亮\n// 第2行\n// 第3行高亮\n// 第4行高亮\n```\n',
				cursorOffset: -3,
			},
			{
				label: '代码块(可折叠)',
				icon: 'tabler:fold',
				insert: '```ts {expand}\n// 较长的代码块，超出行数自动折叠\nfunction demo() {\n  const a = 1\n  const b = 2\n  return a + b\n}\n```\n',
				cursorOffset: -3,
			},
			{
				label: '可编辑代码',
				icon: 'tabler:edit-code',
				insert: ':copy[请输入代码]{lang="ts" prompt=">"}',
				cursorOffset: -25,
			},
			{
				label: '行内代码',
				icon: 'tabler:code',
				insert: '`行内代码`',
				cursorOffset: 0,
			},
			{
				label: '块级公式',
				icon: 'tabler:math',
				insert: '$$\n\\text{公式} = \\sum_{i=1}^{n} x_i\n$$\n',
				cursorOffset: -16,
			},
			{
				label: '行内公式',
				icon: 'tabler:math-symbols',
				insert: '$\\text{E} = mc^2$',
				cursorOffset: 0,
			},
			{
				label: '矩阵',
				icon: 'tabler:matrix',
				insert: '$$\n\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}\n$$\n',
				cursorOffset: -1,
			},
		],
	},
	{
		label: '行内',
		items: [
			{
				label: '徽标',
				icon: 'tabler:badge',
				insert: ':badge[文本]{square icon="tabler:star"}',
				cursorOffset: -27,
			},
			{
				label: '按键提示',
				icon: 'tabler:keyboard',
				insert: ':key[操作]{cmd shift code="KeyC"}',
				cursorOffset: -21,
			},
			{
				label: '气泡提示',
				icon: 'tabler:info-small',
				insert: ':tip[提示文本]{icon="tabler:info-circle" tip="悬浮提示内容"}',
				cursorOffset: -25,
			},
			{
				label: '可复制',
				icon: 'tabler:copy',
				insert: ':tip[点击复制]{copy icon="tabler:copy" tip="复制下方内容"}',
				cursorOffset: -25,
			},
			{
				label: '模糊文字',
				icon: 'tabler:eye-off',
				insert: ':blur[剧透内容]',
				cursorOffset: -1,
			},
			{
				label: '表情时钟',
				icon: 'tabler:clock',
				insert: ':emoji-clock{datetime="2024-01-01T12:00"}',
				cursorOffset: -2,
			},
		],
	},
	{
		label: '布局',
		items: [
			{
				label: '卡片列表',
				icon: 'tabler:cards',
				insert: '::card-list\n  ::link-card\n  ---\n  title: 卡片一\n  link: https://example.com\n  ---\n  ::\n  ::link-card\n  ---\n  title: 卡片二\n  link: https://example.com\n  ---\n  ::\n::\n',
				cursorOffset: -78,
			},
			{
				label: '聊天',
				icon: 'tabler:message-chatbot',
				insert: '::chat\n{昵称}\n消息内容\n\n{.自己}\n这是自己的消息\n\n{:系统提示}\n::\n',
				cursorOffset: -6,
			},
			{
				label: '时间线',
				icon: 'tabler:timeline',
				insert: '::timeline\n- 2024-01-01 事件一\n- 2024-06-01 事件二\n- 2025-01-01 事件三\n::\n',
				cursorOffset: -5,
			},
		],
	},
]

function pick(t: Template) {
	codePaneRef.value?.insert(t.insert, t.cursorOffset)
}
</script>

<template>
	<ZDropdown placement="bottom-start">
		<ZButton icon="tabler:plus" text="插入模板" />
		<template #content="{ hide }">
			<div class="insert-menu">
				<template v-for="cat in categories" :key="cat.label">
					<div class="insert-cat-label">{{ cat.label }}</div>
					<button
						v-for="t in cat.items"
						:key="t.label"
						type="button"
						class="insert-item"
						@click="() => { pick(t); hide() }"
					>
						<Icon :name="t.icon" />
						<span>{{ t.label }}</span>
					</button>
				</template>
			</div>
		</template>
	</ZDropdown>
</template>

<style scoped>
.insert-menu {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	justify-content: stretch;
	gap: 0.2em 0.6em;
	width: 100%;
	min-width: 22em;
	max-width: calc(100vw - 2em);
	max-height: 60vh;
	overflow-y: auto;
	padding: 0.4em 0.6em;
	background-color: var(--ld-bg-card);
	border-radius: 0.5em;
	box-shadow: var(--box-shadow-1);
	box-sizing: border-box;
}
.insert-cat-label {
	grid-column: 1 / -1;
	font-size: 0.75em;
	font-weight: 600;
	color: var(--c-text-3);
	text-transform: uppercase;
	letter-spacing: 0.05em;
	padding: 0.6em 0.5em 0.2em;
	border-bottom: 1px solid var(--c-bg-soft);
	margin-bottom: 0.15em;
}
.insert-cat-label:first-child {
	padding-top: 0.2em;
}
.insert-item {
	display: flex;
	align-items: center;
	gap: 0.4em;
	padding: 0.35em 0.5em;
	border: none;
	background: transparent;
	color: var(--c-text-1);
	font: inherit;
	font-size: 0.9em;
	cursor: pointer;
	border-radius: 0.3em;
	text-align: start;
	white-space: nowrap;
}
.insert-item:hover {
	background-color: var(--c-bg-soft);
	color: var(--c-primary);
}
.insert-item :deep(.iconify) {
	color: var(--c-primary);
	font-size: 1em;
	flex-shrink: 0;
}
</style>
