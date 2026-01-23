import { Menu } from '@mantine/core';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../testing/testUtils';
import LanguageSwitcher from './LanguageSwitcher';

const changeLanguage = vi.hoisted(() => vi.fn());
const mutate = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_key: string, defaultValue?: string) => defaultValue ?? _key,
        i18n: { language: 'zh-CN', changeLanguage },
    }),
}));

vi.mock('../../hooks/user/useUserUpdateMutation', () => ({
    useUserUpdateMutation: () => ({ mutate }),
}));

describe('LanguageSwitcher', () => {
    it('should update language and persist preference', async () => {
        renderWithProviders(
            <Menu opened withinPortal={false}>
                <Menu.Dropdown>
                    <LanguageSwitcher />
                </Menu.Dropdown>
            </Menu>,
        );

        const englishItem = await screen.findByRole('menuitem', {
            name: 'English',
        });
        await userEvent.click(englishItem);

        expect(changeLanguage).toHaveBeenCalledWith('en');
        expect(mutate).toHaveBeenCalledWith({ preferredLanguage: 'en' });
    });
});
