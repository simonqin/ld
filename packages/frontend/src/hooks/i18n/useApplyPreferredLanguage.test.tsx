import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useApplyPreferredLanguage } from './useApplyPreferredLanguage';

const changeLanguage = vi.hoisted(() => vi.fn());
const mutate = vi.hoisted(() => vi.fn());

vi.mock('../../i18n', () => ({
    default: {
        changeLanguage,
        language: 'zh-CN',
    },
}));

vi.mock('../user/useUserUpdateMutation', () => ({
    useUserUpdateMutation: () => ({ mutate }),
}));

describe('useApplyPreferredLanguage', () => {
    it('should call changeLanguage when preferredLanguage is provided', () => {
        renderHook(() => useApplyPreferredLanguage('en'));
        expect(changeLanguage).toHaveBeenCalledWith('en');
    });

    it('persists language when missing and authenticated', () => {
        renderHook(() => useApplyPreferredLanguage(undefined, true));
        expect(mutate).toHaveBeenCalledWith({ preferredLanguage: 'zh-CN' });
    });
});
