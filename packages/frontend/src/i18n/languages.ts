export const SUPPORTED_LANGUAGES = ['zh-CN', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const normalizeLanguage = (input?: string | null) => {
    if (!input) return undefined;
    if (input.startsWith('zh')) return 'zh-CN';
    if (input.startsWith('en')) return 'en';
    return undefined;
};
