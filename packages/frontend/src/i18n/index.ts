import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { normalizeLanguage, SUPPORTED_LANGUAGES } from './languages';
import { resources } from './resources';

const getInitialLanguage = () => {
    if (typeof window === 'undefined') {
        return 'zh-CN';
    }

    try {
        const stored = normalizeLanguage(
            window.localStorage.getItem('i18nextLng'),
        );
        if (stored) return stored;
    } catch (e) {
        // Ignore storage access issues (e.g. blocked storage)
    }

    return normalizeLanguage(window.navigator.language) ?? 'zh-CN';
};

i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: getInitialLanguage(),
        resources,
        supportedLngs: SUPPORTED_LANGUAGES,
        fallbackLng: false,
        ns: ['common', 'auth', 'explore', 'settings', 'validation', 'toast'],
        defaultNS: 'common',
        interpolation: { escapeValue: false },
        returnNull: false,
        returnEmptyString: false,
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            convertDetectedLanguage: (language) =>
                normalizeLanguage(language) ?? language,
        },
    });

export default i18next;
