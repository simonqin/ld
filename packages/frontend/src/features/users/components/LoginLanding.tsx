import { useCallback, useEffect, useState, type FC } from 'react';

import {
    isOpenIdIdentityIssuerType,
    LightdashMode,
    LocalIssuerTypes,
    SEED_ORG_1_ADMIN_EMAIL,
    SEED_ORG_1_ADMIN_PASSWORD,
    type OpenIdIdentityIssuerType,
} from '@lightdash/common';

import {
    ActionIcon,
    Anchor,
    Box,
    Button,
    Card,
    Divider,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useTimeout } from '@mantine/hooks';
import { IconX } from '@tabler/icons-react';
import { Navigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import MantineIcon from '../../../components/common/MantineIcon';
import { ThirdPartySignInButton } from '../../../components/common/ThirdPartySignInButton';
import LightdashLogo from '../../../components/LightdashLogo/LightdashLogo';
import PageSpinner from '../../../components/PageSpinner';
import useToaster from '../../../hooks/toaster/useToaster';
import { emailSchema } from '../../../utils/validation';
import { useFlashMessages } from '../../../hooks/useFlashMessages';
import useApp from '../../../providers/App/useApp';
import useTracking from '../../../providers/Tracking/useTracking';
import {
    useFetchLoginOptions,
    useLoginWithEmailMutation,
    type LoginParams,
} from '../hooks/useLogin';

const Login: FC<{}> = () => {
    const { health } = useApp();
    const { identify } = useTracking();
    const location = useLocation();
    const { t } = useTranslation('auth');
    const { t: tValidation } = useTranslation('validation');

    const { showToastError, showToastApiError } = useToaster();
    const flashMessages = useFlashMessages();
    useEffect(() => {
        if (flashMessages.data?.error) {
            showToastError({
                title: t('loginFailed', 'Failed to authenticate'),
                subtitle: flashMessages.data.error.join('\n'),
            });
        }
    }, [flashMessages.data, showToastError, t]);
    const queryParams = new URLSearchParams(location.search);
    const redirectParam = queryParams.get('redirect');

    const [preCheckEmail, setPreCheckEmail] = useState<string>();
    const [isLoginOptionsLoadingDebounced, setIsLoginOptionsLoadingDebounced] =
        useState(false);

    const redirectUrl = location.state?.from
        ? `${location.state.from.pathname}${location.state.from.search}`
        : redirectParam
        ? redirectParam
        : '/';

    const form = useForm<LoginParams>({
        initialValues: {
            email: '',
            password: '',
        },
        validate: zodResolver(
            z.object({
                email: emailSchema(tValidation),
            }),
        ),
    });

    const {
        data: loginOptions,
        isInitialLoading: isInitialLoadingLoginOptions,
        isFetching: loginOptionsFetching,
        isSuccess: loginOptionsSuccess,
    } = useFetchLoginOptions({
        email: preCheckEmail,
        useQueryOptions: {
            keepPreviousData: true,
        },
    });

    // Disable fetch once it has succeeded
    useEffect(() => {
        if (loginOptions && loginOptionsSuccess) {
            if (loginOptions.forceRedirect && loginOptions.redirectUri) {
                window.location.href = loginOptions.redirectUri;
            }
        }
    }, [loginOptionsSuccess, loginOptions]);

    const ssoOptions = loginOptions
        ? (loginOptions.showOptions.filter(
              isOpenIdIdentityIssuerType,
          ) as OpenIdIdentityIssuerType[])
        : [];

    // Delayed loading state - only show loading if request takes longer than 400ms
    const { start: startDelayedState, clear: clearDelayedState } = useTimeout(
        () => setIsLoginOptionsLoadingDebounced(true),
        400,
    );

    useEffect(() => {
        if (loginOptionsFetching) {
            // Start timer to show loading/disabled after 400ms
            startDelayedState();
        } else {
            // Request completed, hide loading/disabled immediately and clear timer
            setIsLoginOptionsLoadingDebounced(false);
            clearDelayedState();
        }
    }, [loginOptionsFetching, startDelayedState, clearDelayedState]);

    const { mutate, isLoading, isSuccess, isIdle } = useLoginWithEmailMutation({
        onSuccess: (data) => {
            identify({ id: data.userUuid });
            window.location.href = redirectUrl;
        },
        onError: ({ error }) => {
            showToastApiError({
                title: t('loginFailedSubmit', 'Failed to login'),
                apiError: error,
            });
        },
    });

    // Skip login for demo app
    const isDemo = health.data?.mode === LightdashMode.DEMO;
    useEffect(() => {
        if (isDemo && isIdle) {
            mutate({
                email: SEED_ORG_1_ADMIN_EMAIL.email,
                password: SEED_ORG_1_ADMIN_PASSWORD.password,
            });
        }
    }, [isDemo, mutate, isIdle]);

    const isEmailLoginAvailable =
        loginOptions?.showOptions &&
        loginOptions?.showOptions.includes(LocalIssuerTypes.EMAIL);

    const formStage =
        preCheckEmail &&
        loginOptions &&
        loginOptionsSuccess &&
        !loginOptionsFetching
            ? 'login'
            : 'precheck';

    const handleFormSubmit = useCallback(() => {
        if (formStage === 'precheck' && form.values.email !== '') {
            setPreCheckEmail(form.values.email);
        } else if (
            formStage === 'login' &&
            isEmailLoginAvailable &&
            form.values.email !== '' &&
            form.values.password !== ''
        ) {
            mutate(form.values);
        }
    }, [form.values, formStage, isEmailLoginAvailable, mutate]);

    const isFormLoading =
        isLoginOptionsLoadingDebounced ||
        (loginOptionsSuccess && loginOptions.forceRedirect === true) ||
        isLoading ||
        isSuccess;

    if (health.isInitialLoading || isDemo || isInitialLoadingLoginOptions) {
        return <PageSpinner />;
    }
    if (health.status === 'success' && health.data?.requiresOrgRegistration) {
        return (
            <Navigate
                to={{
                    pathname: '/register',
                }}
                state={{ from: location.state?.from }}
            />
        );
    }
    if (health.status === 'success' && health.data?.isAuthenticated) {
        return <Navigate to={redirectUrl} />;
    }

    return (
        <>
            <Box mx="auto" my="lg">
                <LightdashLogo />
            </Box>
            <Card p="xl" radius="xs" withBorder shadow="xs">
                <Title order={3} ta="center" mb="md">
                    {t('signIn', 'Sign in')}
                </Title>
                <form
                    name="login"
                    onSubmit={form.onSubmit(() => handleFormSubmit())}
                >
                    <Stack spacing="lg">
                        <TextInput
                            label={t('emailLabel', 'Email address')}
                            name="email"
                            placeholder={t(
                                'emailPlaceholder',
                                'Your email address',
                            )}
                            required
                            {...form.getInputProps('email')}
                            disabled={isFormLoading}
                            rightSection={
                                preCheckEmail ? (
                                    <ActionIcon
                                        onClick={() => {
                                            setPreCheckEmail(undefined);
                                            form.setValues({
                                                email: '',
                                                password: '',
                                            });
                                        }}
                                    >
                                        <MantineIcon icon={IconX} />
                                    </ActionIcon>
                                ) : null
                            }
                        />
                        {isEmailLoginAvailable && formStage === 'login' && (
                            <>
                                <PasswordInput
                                    label={t('passwordLabel', 'Password')}
                                    name="password"
                                    placeholder={t(
                                        'passwordPlaceholder',
                                        'Your password',
                                    )}
                                    required
                                    autoFocus
                                    {...form.getInputProps('password')}
                                    disabled={isFormLoading}
                                />
                                <Anchor href="/recover-password" mx="auto">
                                    {t(
                                        'forgotPassword',
                                        'Forgot your password?',
                                    )}
                                </Anchor>
                                <Button
                                    type="submit"
                                    loading={isFormLoading}
                                    disabled={isFormLoading}
                                    data-cy="signin-button"
                                >
                                    {t('signIn', 'Sign in')}
                                </Button>
                            </>
                        )}
                        {formStage === 'precheck' && (
                            <Button
                                type="submit"
                                loading={isFormLoading}
                                disabled={isFormLoading}
                                data-cy="signin-button"
                            >
                                {t('continue', 'Continue')}
                            </Button>
                        )}
                        {ssoOptions.length > 0 && (
                            <>
                                {(isEmailLoginAvailable ||
                                    formStage === 'precheck') && (
                                    <Divider
                                        my="sm"
                                        labelPosition="center"
                                        label={
                                            <Text
                                                color="ldGray.5"
                                                size="sm"
                                                fw={500}
                                            >
                                                {t('or', 'OR')}
                                            </Text>
                                        }
                                    />
                                )}
                                <Stack>
                                    {ssoOptions.map((providerName) => (
                                        <ThirdPartySignInButton
                                            key={providerName}
                                            providerName={providerName}
                                            redirect={redirectUrl}
                                            disabled={isFormLoading}
                                        />
                                    ))}
                                </Stack>
                            </>
                        )}
                        <Text mx="auto" mt="md">
                            {t('noAccount', "Don't have an account?")}{' '}
                            <Anchor href="/register">
                                {t('signUp', 'Sign up')}
                            </Anchor>
                        </Text>
                    </Stack>
                </form>
            </Card>
        </>
    );
};

export default Login;
