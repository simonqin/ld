import { useEffect } from 'react';
import i18n from '../../i18n';
import { normalizeLanguage } from '../../i18n/languages';

export const useApplyPreferredLanguage = (preferredLanguage?: string) => {
    useEffect(() => {
        const normalized = normalizeLanguage(preferredLanguage);
        if (normalized && i18n.language !== normalized) {
            void i18n.changeLanguage(normalized);
        }
    }, [preferredLanguage]);
};
