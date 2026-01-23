import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { normalizeLanguage, SUPPORTED_LANGUAGES } from './languages';
import { resources } from './resources';

i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        supportedLngs: SUPPORTED_LANGUAGES,
        fallbackLng: 'zh-CN',
        ns: ['common', 'auth'],
        defaultNS: 'common',
        interpolation: { escapeValue: false },
        detection: {
            order: ['navigator'],
            convertDetectedLanguage: (language) =>
                normalizeLanguage(language) ?? language,
        },
    });

export default i18next;
