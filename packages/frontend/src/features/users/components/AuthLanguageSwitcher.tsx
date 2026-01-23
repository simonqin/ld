import { Button, Menu } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import MantineIcon from '../../../components/common/MantineIcon';

const AuthLanguageSwitcher: FC = () => {
    const { t } = useTranslation('common');

    const handleChange = (language: 'zh-CN' | 'en') => {
        void i18n.changeLanguage(language);
    };

    return (
        <Menu position="bottom-end">
            <Menu.Target>
                <Button variant="subtle" size="xs">
                    {t('language', 'Language')}
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
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
            </Menu.Dropdown>
        </Menu>
    );
};

export default AuthLanguageSwitcher;
