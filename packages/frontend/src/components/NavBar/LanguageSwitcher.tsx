import { Menu } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserUpdateMutation } from '../../hooks/user/useUserUpdateMutation';
import MantineIcon from '../common/MantineIcon';

const LanguageSwitcher: FC = () => {
    const { t, i18n } = useTranslation('common');
    const { mutate } = useUserUpdateMutation();

    const handleChange = (language: 'zh-CN' | 'en') => {
        void i18n.changeLanguage(language);
        mutate({ preferredLanguage: language });
    };

    return (
        <>
            <Menu.Divider />
            <Menu.Label>{t('language', 'Language')}</Menu.Label>
            <Menu.Item
                onClick={() => handleChange('zh-CN')}
                icon={
                    i18n.language === 'zh-CN' ? (
                        <MantineIcon icon={IconCheck} />
                    ) : undefined
                }
            >
                {t('languageZh', '简体中文')}
            </Menu.Item>
            <Menu.Item
                onClick={() => handleChange('en')}
                icon={
                    i18n.language === 'en' ? (
                        <MantineIcon icon={IconCheck} />
                    ) : undefined
                }
            >
                {t('languageEn', 'English')}
            </Menu.Item>
        </>
    );
};

export default LanguageSwitcher;
