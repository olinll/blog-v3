<script setup lang="ts">
/**
 * EditorSettingsDialog —— 文章属性配置面板
 *
 * 编辑 frontmatter 中的元数据：标题、日期、分类、类型、标签等。
 * 点击"保存"后将修改写回编辑器源文本。
 */

const props = defineProps<{ open?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const store = useEditorStore()
const toast = useToast()
const codePaneRef = inject<{ value: { getValue?: () => string; setValue?: (v: string) => void } | null }>('editor-code-pane', { value: null })

const categories = ['未分类', '服务', '系统', '容器', '网络', '开发', '杂项', '虚拟化'] as const
const articleTypes = ['tech', 'story'] as const

interface FormData {
	title: string
	date: string
	updated: string
	category: string
	type: string
	slug: string
	tags: string
}

const defaultForm: FormData = {
	title: '', date: '', updated: '',
	category: '未分类', type: 'tech', slug: '', tags: '',
}

const form = ref<FormData>({ ...defaultForm })

/** 解析 frontmatter YAML 中的简单键值对（不依赖 yaml 包） */
function parseFm(fm: string): Record<string, string> {
	const result: Record<string, string> = {}
	const lines = fm.split('\n')
	for (const line of lines) {
		const m = line.match(/^(\w+):\s*(.*)$/)
		if (m) result[m[1]!] = (m[2] ?? '').replace(/^['"]|['"]$/g, '')
	}
	return result
}

/** 将键值对写回 frontmatter 字符串 */
function stringifyFm(data: Record<string, string | undefined>): string {
	const lines: string[] = []
	for (const [key, value] of Object.entries(data)) {
		if (value === undefined || value === '') continue
		if (/[#&*!|>'"@%`{}[\],?:]/.test(value))
			lines.push(`${key}: "${value}"`)
		else
			lines.push(`${key}: ${value}`)
	}
	return lines.join('\n')
}

// 打开对话框时，从当前源文本填充表单
watch(() => props.open, (open) => {
	if (!open) return
	const src = store.source
	const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
	const fm = m ? parseFm(m[1]!) : {}
	form.value = {
		...defaultForm,
		title: fm.title ?? '',
		date: fm.date || now(),
		updated: fm.updated || now(),
		category: fm.category || '未分类',
		type: fm.type || 'tech',
		slug: fm.slug ?? fm.permalink ?? fm.abbrlink ?? '',
		tags: fm.tags ? fm.tags.replace(/^\[|\]$/g, '').split(/,\s*/).join(', ') : '',
	}
})

const now = () => {
	const d = new Date()
	const p = (n: number) => String(n).padStart(2, "0")
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
function save() {
	const src = store.source
	const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
	const body = m ? src.slice(m[0].length) : src

	const fmData: Record<string, string | undefined> = {}
	if (form.value.title) fmData.title = form.value.title
	if (form.value.date) fmData.date = form.value.date
	if (form.value.updated) fmData.updated = form.value.updated
	if (form.value.category && form.value.category !== '未分类') fmData.category = form.value.category
	if (form.value.type && form.value.type !== 'tech') fmData.type = form.value.type
	if (form.value.slug) fmData.slug = form.value.slug
	if (form.value.tags.trim()) fmData.tags = form.value.tags.split(/[,，]\s*/).filter(Boolean).join(', ')

	const newFm = stringifyFm(fmData)
	const newSource = newFm ? `---\n${newFm}\n---\n\n${body}` : body

	const setter = codePaneRef?.value?.setValue
	if (setter) setter(newSource)
	store.source = newSource

	toast.success('已保存', '文章属性已更新')
	emit('close')
}

function fillNow(field: 'date' | 'updated') {
		form.value[field] = now()
	}

function close() {
	emit('close')
}
</script>

<template>
	<div v-if="open" class="bikariya-overlay" @click.self="close">
		<div class="settings-dialog">
			<header class="dialog-header">
				<Icon name="tabler:settings" />
				<h3>文章属性</h3>
				<span style="flex: 1" />
				<button type="button" class="close-btn" @click="close">
					<Icon name="tabler:x" />
				</button>
			</header>

			<div class="dialog-body">
				<div class="field">
					<label class="field-label">标题</label>
					<input v-model="form.title" type="text" class="field-input" placeholder="文章标题" />
				</div>

				<div class="field-row">
					<div class="field">
						<label class="field-label">分类</label>
						<select v-model="form.category" class="field-input">
							<option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
						</select>
					</div>
					<div class="field">
						<label class="field-label">类型</label>
						<select v-model="form.type" class="field-input">
							<option value="tech">技术</option>
							<option value="story">随笔</option>
						</select>
					</div>
				</div>

				<div class="field">
					<label class="field-label">
						创建日期
						<button type="button" class="fill-btn" @click="fillNow('date')">现在</button>
					</label>
					<input v-model="form.date" type="text" class="field-input" placeholder="2024-01-01 12:00:00" />
				</div>

				<div class="field">
					<label class="field-label">
						更新日期
						<button type="button" class="fill-btn" @click="fillNow('updated')">现在</button>
					</label>
					<input v-model="form.updated" type="text" class="field-input" placeholder="2024-01-01 12:00:00" />
				</div>

				<div class="field">
					<label class="field-label">自定义链接</label>
					<input v-model="form.slug" type="text" class="field-input" placeholder="可选，留空则自动生成" />
				</div>

				<div class="field">
					<label class="field-label">标签（逗号分隔）</label>
					<input v-model="form.tags" type="text" class="field-input" placeholder="例如: Nuxt, Vue, 教程" />
				</div>
			</div>

			<footer class="dialog-footer">
				<ZButton text="取消" @click="close" />
				<ZButton text="保存" primary @click="save" />
			</footer>
		</div>
	</div>
</template>

<style scoped>
.settings-dialog {
	background-color: var(--ld-bg-card);
	border-radius: 0.8em;
	min-width: 28em;
	max-width: 36em;
	box-shadow: var(--box-shadow-3);
	overflow: hidden;
}
.dialog-header {
	display: flex;
	align-items: center;
	gap: 0.5em;
	padding: 0.8em 1em;
	border-bottom: 1px solid var(--c-bg-soft);
}
.dialog-header h3 {
	margin: 0;
	font-size: 1em;
	font-weight: 500;
}
.dialog-header :deep(.iconify) {
	font-size: 1.3em;
	color: var(--c-primary);
}
.close-btn {
	background: none;
	border: none;
	color: var(--c-text-2);
	cursor: pointer;
	padding: 0.3em;
	border-radius: 0.3em;
}
.close-btn:hover {
	background-color: var(--c-bg-soft);
}
.dialog-body {
	padding: 1em;
	display: flex;
	flex-direction: column;
	gap: 0.8em;
}
.field {
	display: flex;
	flex-direction: column;
	gap: 0.3em;
}
.field-label {
	font-size: 0.85em;
	font-weight: 500;
	color: var(--c-text-2);
	display: flex;
	align-items: center;
	gap: 0.5em;
}
.field-input {
	padding: 0.5em 0.7em;
	border: 1px solid var(--c-bg-soft);
	border-radius: 0.4em;
	background-color: var(--c-bg-1);
	color: var(--c-text-1);
	font: inherit;
	font-size: 0.9em;
}
.field-input:focus {
	border-color: var(--c-primary);
	outline: none;
	box-shadow: 0 0 0 2px var(--c-primary-soft);
}
.field-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.8em;
}
.fill-btn {
	background: none;
	border: 1px solid var(--c-bg-soft);
	border-radius: 0.3em;
	padding: 0.1em 0.5em;
	font-size: 0.8em;
	color: var(--c-text-2);
	cursor: pointer;
}
.fill-btn:hover {
	background-color: var(--c-bg-soft);
	color: var(--c-primary);
}
.dialog-footer {
	display: flex;
	justify-content: flex-end;
	gap: 0.5em;
	padding: 0.8em 1em;
	border-top: 1px solid var(--c-bg-soft);
}
</style>
