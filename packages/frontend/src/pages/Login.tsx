import { Group, Stack } from '@mantine/core';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import Page from '../components/common/Page/Page';
import AuthLanguageSwitcher from '../features/users/components/AuthLanguageSwitcher';
import LoginLanding from '../features/users/components/LoginLanding';

const Login: FC<{ minimal?: boolean }> = ({ minimal = false }) => {
    const { t } = useTranslation('auth');

    return minimal ? (
        <Stack m="xl">
            <Group position="right">
                <AuthLanguageSwitcher />
            </Group>
            <LoginLanding />
        </Stack>
    ) : (
        <Page title={t('loginTitle', 'Login')} withCenteredContent withNavbar={false}>
            <Stack w={400} mt="4xl">
                <Group position="right">
                    <AuthLanguageSwitcher />
                </Group>
                <LoginLanding />
            </Stack>
        </Page>
    );
};

export default Login;
