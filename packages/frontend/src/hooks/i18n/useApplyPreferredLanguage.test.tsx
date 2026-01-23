import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useApplyPreferredLanguage } from './useApplyPreferredLanguage';

const changeLanguage = vi.hoisted(() => vi.fn());

vi.mock('../../i18n', () => ({
    default: {
        changeLanguage,
        language: 'zh-CN',
    },
}));

describe('useApplyPreferredLanguage', () => {
    it('should call changeLanguage when preferredLanguage is provided', () => {
        renderHook(() => useApplyPreferredLanguage('en'));
        expect(changeLanguage).toHaveBeenCalledWith('en');
    });
});
