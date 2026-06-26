declare global {
	interface Window {
		twikoo?: {
			init: (options: {
				envId: string
				el: string
				region?: string
				path?: string
				lang?: string
			}) => void
			getCommentsCount: (options: {
				envId: string
				urls: string[]
				includeReply: boolean
			}) => Promise<Array<{ url: string, count: number }>>
			version: string
		}
	}
}
