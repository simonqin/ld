import { renderHook } from '@testing-library/react';
import { enUS, zhCN } from 'date-fns/locale';
import { describe, expect, it, vi } from 'vitest';
import { useFormatters } from './useFormatters';

const language = { current: 'en' };

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ i18n: { language: language.current } }),
}));

describe('useFormatters', () => {
    it('returns locale-specific formatters', () => {
        const { result, rerender } = renderHook(() => useFormatters());

        expect(result.current.dateFnsLocale).toBe(enUS);

        language.current = 'zh-CN';
        rerender();

        expect(result.current.dateFnsLocale).toBe(zhCN);
    });
});
