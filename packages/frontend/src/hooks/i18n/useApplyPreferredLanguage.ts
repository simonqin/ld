import { useEffect, useRef } from 'react';
import { useUserUpdateMutation } from '../user/useUserUpdateMutation';
import i18n from '../../i18n';
import { normalizeLanguage } from '../../i18n/languages';

export const useApplyPreferredLanguage = (
    preferredLanguage?: string,
    isAuthenticated?: boolean,
) => {
    const { mutate } = useUserUpdateMutation();
    const attemptedPersistRef = useRef(false);

    useEffect(() => {
        const normalized = normalizeLanguage(preferredLanguage);
        if (normalized && i18n.language !== normalized) {
            void i18n.changeLanguage(normalized);
            return;
        }

        if (!normalized && isAuthenticated && !attemptedPersistRef.current) {
            attemptedPersistRef.current = true;
            const current = normalizeLanguage(i18n.language) ?? 'zh-CN';
            mutate({ preferredLanguage: current });
        }
    }, [preferredLanguage, isAuthenticated, mutate]);
};
