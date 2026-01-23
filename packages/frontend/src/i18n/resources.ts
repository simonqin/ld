import zhCommon from './locales/zh-CN/common.json';
import enCommon from './locales/en/common.json';
import zhAuth from './locales/zh-CN/auth.json';
import enAuth from './locales/en/auth.json';

export const resources = {
    'zh-CN': {
        common: zhCommon,
        auth: zhAuth,
    },
    en: {
        common: enCommon,
        auth: enAuth,
    },
} as const;
