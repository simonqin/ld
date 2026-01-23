import zhCommon from './locales/zh-CN/common.json';
import enCommon from './locales/en/common.json';
import zhAuth from './locales/zh-CN/auth.json';
import enAuth from './locales/en/auth.json';
import zhExplore from './locales/zh-CN/explore.json';
import enExplore from './locales/en/explore.json';
import zhSettings from './locales/zh-CN/settings.json';
import enSettings from './locales/en/settings.json';
import zhValidation from './locales/zh-CN/validation.json';
import enValidation from './locales/en/validation.json';
import zhToast from './locales/zh-CN/toast.json';
import enToast from './locales/en/toast.json';

export const resources = {
    'zh-CN': {
        common: zhCommon,
        auth: zhAuth,
        explore: zhExplore,
        settings: zhSettings,
        validation: zhValidation,
        toast: zhToast,
    },
    en: {
        common: enCommon,
        auth: enAuth,
        explore: enExplore,
        settings: enSettings,
        validation: enValidation,
        toast: enToast,
    },
} as const;
