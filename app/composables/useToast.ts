/**
 * 全局 Toast composable
 *
 * 包装 vue-sonner 的 toast 函数，提供语义化的简短调用：
 *   const toast = useToast()
 *   toast.success('已保存')
 *   toast.error('解析失败：' + msg)
 *
 * vue-sonner 在 app.vue 通过 <Toaster /> 挂载（仅客户端），见 app.vue。
 */
import { toast as sonnerToast } from 'vue-sonner'

export function useToast() {
	return {
		success: (message: string, description?: string) =>
			sonnerToast.success(message, description ? { description } : undefined),
		error: (message: string, description?: string) =>
			sonnerToast.error(message, description ? { description } : undefined),
		info: (message: string, description?: string) =>
			sonnerToast.info(message, description ? { description } : undefined),
		warning: (message: string, description?: string) =>
			sonnerToast.warning(message, description ? { description } : undefined),
		/** 通用调用，传入完整 ExternalToast 选项 */
		raw: sonnerToast,
	}
}