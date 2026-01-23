# UI i18n Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 Lightdash 前端启用 i18n（默认 zh-CN，可切换 en），并将用户语言偏好保存在后端。

**Architecture:** 前端使用 react-i18next 本地资源文件；AppProvider 在 user 加载后应用 preferredLanguage；UserMenu 提供语言切换并通过 /user/me 持久化；后端新增 users.preferred_language 列并在 UserModel/类型中透出。

**Tech Stack:** React, react-i18next/i18next, Mantine, React Query, Node/Knex, Jest/Vitest

---

### Task 1: 后端类型映射支持 preferredLanguage

**Files:**
- Create: `packages/backend/src/models/UserModel.test.ts`
- Modify: `packages/backend/src/models/UserModel.ts`
- Modify: `packages/backend/src/database/entities/users.ts`
- Modify: `packages/common/src/types/user.ts`
- Modify: `packages/common/src/types/api.ts`

**Step 1: 写一个会失败的测试**

```ts
// packages/backend/src/models/UserModel.test.ts
import { describe, expect, it } from 'vitest';
import { mapDbUserDetailsToLightdashUser } from './UserModel';

describe('UserModel mapDbUserDetailsToLightdashUser', () => {
    it('should map preferred_language to preferredLanguage', () => {
        const user = mapDbUserDetailsToLightdashUser(
            {
                user_id: 1,
                user_uuid: 'user-uuid',
                first_name: 'Ada',
                last_name: 'Lovelace',
                created_at: new Date('2024-01-01T00:00:00.000Z'),
                is_tracking_anonymized: false,
                is_marketing_opted_in: false,
                email: 'ada@example.com',
                organization_uuid: undefined,
                organization_name: undefined,
                organization_created_at: undefined,
                organization_id: 1,
                is_setup_complete: true,
                role: undefined,
                role_uuid: undefined,
                is_active: true,
                updated_at: new Date('2024-01-01T00:00:00.000Z'),
                preferred_language: 'en',
            },
            true,
        );

        expect(user.preferredLanguage).toBe('en');
    });
});
```

**Step 2: 运行测试并确认失败**

Run: `pnpm -F backend test -- UserModel.test.ts`
Expected: FAIL，`preferredLanguage` 为 `undefined`

**Step 3: 写最小实现**

```ts
// packages/backend/src/database/entities/users.ts
export type DbUser = {
    // ...
    preferred_language: string | null;
};

export type DbUserUpdate = Partial<
    Pick<
        DbUser,
        // ...
        'preferred_language'
    >
>;
```

```ts
// packages/backend/src/models/UserModel.ts
export type DbUserDetails = {
    // ...
    preferred_language: string | null;
};

export const mapDbUserDetailsToLightdashUser = (
    user: DbUserDetails,
    hasAuthentication: boolean,
): LightdashUser => ({
    // ...
    preferredLanguage: user.preferred_language ?? undefined,
});
```

```ts
// packages/common/src/types/user.ts
export interface LightdashUser {
    // ...
    preferredLanguage?: string;
}

export interface LightdashSessionUser extends AccountUser {
    // ...
    preferredLanguage?: string;
}
```

```ts
// packages/common/src/types/api.ts
export type UpdateUserArgs = {
    // ...
    preferredLanguage?: string;
};
```

**Step 4: 运行测试并确认通过**

Run: `pnpm -F backend test -- UserModel.test.ts`
Expected: PASS

**Step 5: 提交**

```bash
git add packages/backend/src/models/UserModel.test.ts \
  packages/backend/src/models/UserModel.ts \
  packages/backend/src/database/entities/users.ts \
  packages/common/src/types/user.ts \
  packages/common/src/types/api.ts

git commit -m "feat: add preferredLanguage to user types"
```

---

### Task 2: 保存 preferredLanguage 到数据库

**Files:**
- Create: `packages/backend/src/database/migrations/20260123170000_add_user_preferred_language.ts`
- Modify: `packages/backend/src/models/UserModel.ts`
- Modify: `packages/backend/src/services/UserService.ts`
- Modify: `packages/backend/src/services/UserService.test.ts`

**Step 1: 写一个会失败的测试**

```ts
// packages/backend/src/services/UserService.test.ts
it('should pass preferredLanguage to userModel.updateUser', async () => {
    const updateUser = jest.fn(async () => sessionUser);
    (userModel as any).updateUser = updateUser;

    await userService.updateUser(sessionUser, {
        preferredLanguage: 'zh-CN',
    });

    expect(updateUser).toHaveBeenCalledWith(
        sessionUser.userUuid,
        sessionUser.email,
        expect.objectContaining({
            preferredLanguage: 'zh-CN',
        }),
    );
});
```

**Step 2: 运行测试并确认失败**

Run: `pnpm -F backend test -- UserService.test.ts`
Expected: FAIL（updateUser 未包含 preferredLanguage）

**Step 3: 写最小实现**

```ts
// packages/backend/src/services/UserService.ts
const updatedUser = await this.userModel.updateUser(
    user.userUuid,
    user.email,
    {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        isMarketingOptedIn: data.isMarketingOptedIn,
        isTrackingAnonymized: data.isTrackingAnonymized,
        preferredLanguage: data.preferredLanguage,
    },
);
```

```ts
// packages/backend/src/models/UserModel.ts
async updateUser(
    userUuid: string,
    currentEmail: string | undefined,
    {
        firstName,
        lastName,
        email,
        isMarketingOptedIn,
        isTrackingAnonymized,
        isSetupComplete,
        isActive,
        preferredLanguage,
    }: Partial<UpdateUserArgs>,
): Promise<LightdashUser> {
    await this.database.transaction(async (trx) => {
        const [user] = await trx(UserTableName)
            .where('user_uuid', userUuid)
            .update<DbUserUpdate>({
                // ...
                preferred_language: preferredLanguage,
                updated_at: new Date(),
            })
            .returning('*');
        // ...
    });
    return this.getUserDetailsByUuid(userUuid);
}
```

```ts
// packages/backend/src/database/migrations/20260123170000_add_user_preferred_language.ts
import { Knex } from 'knex';

const TABLE = 'users';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.table(TABLE, (table) => {
        table.string('preferred_language').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.table(TABLE, (table) => {
        table.dropColumn('preferred_language');
    });
}
```

**Step 4: 运行测试并确认通过**

Run: `pnpm -F backend test -- UserService.test.ts`
Expected: PASS

**Step 5: 提交**

```bash
git add packages/backend/src/services/UserService.ts \
  packages/backend/src/services/UserService.test.ts \
  packages/backend/src/models/UserModel.ts \
  packages/backend/src/database/migrations/20260123170000_add_user_preferred_language.ts

git commit -m "feat: persist preferred language"
```

---

### Task 3: 前端 i18n 初始化与偏好应用

**Files:**
- Create: `packages/frontend/src/i18n/index.ts`
- Create: `packages/frontend/src/i18n/languages.ts`
- Create: `packages/frontend/src/i18n/resources.ts`
- Modify: `packages/frontend/src/index.tsx`
- Modify: `packages/frontend/src/providers/App/AppProvider.tsx`
- Create: `packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.ts`
- Create: `packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.test.tsx`
- Modify: `packages/frontend/package.json`

**Step 1: 写一个会失败的测试**

```ts
// packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.test.tsx
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useApplyPreferredLanguage } from './useApplyPreferredLanguage';

const changeLanguage = vi.fn();

vi.mock('src/i18n', () => ({
    default: { changeLanguage, language: 'zh-CN' },
}));

describe('useApplyPreferredLanguage', () => {
    it('should call changeLanguage when preferredLanguage is provided', () => {
        renderHook(() => useApplyPreferredLanguage('en'));
        expect(changeLanguage).toHaveBeenCalledWith('en');
    });
});
```

**Step 2: 运行测试并确认失败**

Run: `pnpm -F frontend test -- useApplyPreferredLanguage.test.tsx`
Expected: FAIL（hook 不存在）

**Step 3: 写最小实现**

```ts
// packages/frontend/src/i18n/languages.ts
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const normalizeLanguage = (input?: string | null) => {
    if (!input) return undefined;
    if (input.startsWith('zh')) return 'zh-CN';
    if (input.startsWith('en')) return 'en';
    return undefined;
};
```

```ts
// packages/frontend/src/i18n/resources.ts
import zhCommon from './locales/zh-CN/common.json';
import enCommon from './locales/en/common.json';
import zhAuth from './locales/zh-CN/auth.json';
import enAuth from './locales/en/auth.json';

export const resources = {
    'zh-CN': { common: zhCommon, auth: zhAuth },
    en: { common: enCommon, auth: enAuth },
};
```

```ts
// packages/frontend/src/i18n/index.ts
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';
import { SUPPORTED_LANGUAGES } from './languages';

i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        supportedLngs: SUPPORTED_LANGUAGES,
        fallbackLng: 'zh-CN',
        ns: ['common', 'auth'],
        defaultNS: 'common',
        interpolation: { escapeValue: false },
        detection: { order: ['navigator'] },
    });

export default i18next;
```

```ts
// packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.ts
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
```

```tsx
// packages/frontend/src/providers/App/AppProvider.tsx
import { useApplyPreferredLanguage } from '../../hooks/i18n/useApplyPreferredLanguage';

const AppProvider: FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const health = useHealth();
    const user = useUser(!!health?.data?.isAuthenticated);

    useApplyPreferredLanguage(user.data?.preferredLanguage);
    // ...
};
```

```tsx
// packages/frontend/src/index.tsx
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

root.render(
    <StrictMode>
        <I18nextProvider i18n={i18n}>
            <App />
        </I18nextProvider>
    </StrictMode>,
);
```

```json
// packages/frontend/package.json (dependencies)
"i18next": "^24.2.2",
"i18next-browser-languagedetector": "^8.0.3",
"react-i18next": "^15.4.1",
```

**Step 4: 运行测试并确认通过**

Run: `pnpm -F frontend test -- useApplyPreferredLanguage.test.tsx`
Expected: PASS

**Step 5: 提交**

```bash
git add packages/frontend/src/i18n \
  packages/frontend/src/index.tsx \
  packages/frontend/src/providers/App/AppProvider.tsx \
  packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.ts \
  packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.test.tsx \
  packages/frontend/package.json

git commit -m "feat: bootstrap frontend i18n"
```

---

### Task 4: 用户菜单语言切换

**Files:**
- Create: `packages/frontend/src/components/NavBar/LanguageSwitcher.tsx`
- Modify: `packages/frontend/src/components/NavBar/UserMenu.tsx`
- Create: `packages/frontend/src/components/NavBar/LanguageSwitcher.test.tsx`

**Step 1: 写一个会失败的测试**

```ts
// packages/frontend/src/components/NavBar/LanguageSwitcher.test.tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../testing/testUtils';
import LanguageSwitcher from './LanguageSwitcher';

const changeLanguage = vi.fn();
const mutate = vi.fn();

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_k: string, defaultValue?: string) => defaultValue ?? _k,
        i18n: { language: 'zh-CN', changeLanguage },
    }),
}));

vi.mock('src/hooks/user/useUserUpdateMutation', () => ({
    useUserUpdateMutation: () => ({ mutate }),
}));

describe('LanguageSwitcher', () => {
    it('should update language and persist preference', async () => {
        renderWithProviders(<LanguageSwitcher />);
        const englishItem = await screen.findByRole('menuitem', {
            name: 'English',
        });
        await userEvent.click(englishItem);
        expect(changeLanguage).toHaveBeenCalledWith('en');
        expect(mutate).toHaveBeenCalledWith({ preferredLanguage: 'en' });
    });
});
```

**Step 2: 运行测试并确认失败**

Run: `pnpm -F frontend test -- LanguageSwitcher.test.tsx`
Expected: FAIL（组件不存在）

**Step 3: 写最小实现**

```tsx
// packages/frontend/src/components/NavBar/LanguageSwitcher.tsx
import { Menu } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserUpdateMutation } from '../../hooks/user/useUserUpdateMutation';
import MantineIcon from '../common/MantineIcon';

const LanguageSwitcher: FC = () => {
    const { t, i18n } = useTranslation();
    const { mutate } = useUserUpdateMutation();

    const handleChange = (language: 'zh-CN' | 'en') => {
        void i18n.changeLanguage(language);
        mutate({ preferredLanguage: language });
    };

    return (
        <>
            <Menu.Divider />
            <Menu.Label>{t('common.language', 'Language')}</Menu.Label>
            <Menu.Item
                onClick={() => handleChange('zh-CN')}
                icon={
                    i18n.language === 'zh-CN' ? (
                        <MantineIcon icon={IconCheck} />
                    ) : undefined
                }
            >
                {t('common.languageZh', '简体中文')}
            </Menu.Item>
            <Menu.Item
                onClick={() => handleChange('en')}
                icon={
                    i18n.language === 'en' ? (
                        <MantineIcon icon={IconCheck} />
                    ) : undefined
                }
            >
                {t('common.languageEn', 'English')}
            </Menu.Item>
        </>
    );
};

export default LanguageSwitcher;
```

```tsx
// packages/frontend/src/components/NavBar/UserMenu.tsx
import LanguageSwitcher from './LanguageSwitcher';

// ...inside Menu.Dropdown
<LanguageSwitcher />
```

**Step 4: 运行测试并确认通过**

Run: `pnpm -F frontend test -- LanguageSwitcher.test.tsx`
Expected: PASS

**Step 5: 提交**

```bash
git add packages/frontend/src/components/NavBar/LanguageSwitcher.tsx \
  packages/frontend/src/components/NavBar/LanguageSwitcher.test.tsx \
  packages/frontend/src/components/NavBar/UserMenu.tsx

git commit -m "feat: add language switcher"
```

---

### Task 5: 核心路径文案接入 i18n（登录/导航/设置）

**Files:**
- Modify: `packages/frontend/src/features/users/components/LoginLanding.tsx`
- Modify: `packages/frontend/src/pages/Login.tsx`
- Modify: `packages/frontend/src/components/NavBar/MainNavBarContent.tsx`
- Modify: `packages/frontend/src/components/NavBar/ExploreMenu.tsx`
- Modify: `packages/frontend/src/components/NavBar/BrowseMenu.tsx`
- Modify: `packages/frontend/src/components/NavBar/SettingsMenu.tsx`
- Modify: `packages/frontend/src/components/NavBar/HelpMenu.tsx`
- Modify: `packages/frontend/src/components/NavBar/UserMenu.tsx`
- Modify: `packages/frontend/src/pages/Settings.tsx`
- Modify: `packages/frontend/src/components/UserSettings/*`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/common.json`
- Modify: `packages/frontend/src/i18n/locales/en/common.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/auth.json`
- Modify: `packages/frontend/src/i18n/locales/en/auth.json`

**Step 1: 写最小改动（数据文件，无单测）**

> 说明：此任务主要是文案替换与翻译 JSON 更新，按“内容配置”处理；若需要单测，请先确认。

**Step 2: 替换示例（登录页）**

```tsx
// packages/frontend/src/features/users/components/LoginLanding.tsx
import { useTranslation } from 'react-i18next';

const Login: FC<{}> = () => {
    const { t } = useTranslation(['auth', 'common']);
    // ...
    useEffect(() => {
        if (flashMessages.data?.error) {
            showToastError({
                title: t('auth.loginFailed', 'Failed to authenticate'),
                subtitle: flashMessages.data.error.join('\n'),
            });
        }
    }, [flashMessages.data, showToastError, t]);

    // ...
    return (
        // ...
        <Title order={3} ta="center" mb="md">
            {t('auth.signIn', 'Sign in')}
        </Title>
        // ...
        <TextInput
            label={t('auth.emailLabel', 'Email address')}
            placeholder={t('auth.emailPlaceholder', 'Your email address')}
            // ...
        />
        // ...
        <PasswordInput
            label={t('auth.passwordLabel', 'Password')}
            placeholder={t('auth.passwordPlaceholder', 'Your password')}
        />
        <Anchor href="/recover-password" mx="auto">
            {t('auth.forgotPassword', 'Forgot your password?')}
        </Anchor>
        <Button ...>
            {t('auth.signIn', 'Sign in')}
        </Button>
        <Button ...>
            {t('auth.continue', 'Continue')}
        </Button>
        <Text mx="auto" mt="md">
            {t('auth.noAccount', "Don't have an account?")}{' '}
            <Anchor href="/register">{t('auth.signUp', 'Sign up')}</Anchor>
        </Text>
    );
};
```

```tsx
// packages/frontend/src/pages/Login.tsx
import { useTranslation } from 'react-i18next';

const Login: FC<{ minimal?: boolean }> = ({ minimal = false }) => {
    const { t } = useTranslation('auth');

    return minimal ? (
        // ...
    ) : (
        <Page title={t('auth.loginTitle', 'Login')} withCenteredContent withNavbar={false}>
            {/* ... */}
        </Page>
    );
};
```

**Step 3: 替换示例（UserMenu）**

```tsx
// packages/frontend/src/components/NavBar/UserMenu.tsx
import { useTranslation } from 'react-i18next';

const UserMenu: FC = () => {
    const { t } = useTranslation('common');
    // ...
    <Menu.Item ...>
        {t('common.userSettings', 'User settings')}
    </Menu.Item>
    <Menu.Item ...>
        {t('common.inviteUser', 'Invite user')}
    </Menu.Item>
    <Menu.Item ...>
        {t('common.logout', 'Logout')}
    </Menu.Item>
};
```

**Step 4: 更新翻译 JSON（示例）**

```json
// packages/frontend/src/i18n/locales/en/common.json
{
    "language": "Language",
    "languageZh": "简体中文",
    "languageEn": "English",
    "userSettings": "User settings",
    "inviteUser": "Invite user",
    "logout": "Logout",
    "home": "Home",
    "new": "New"
}
```

```json
// packages/frontend/src/i18n/locales/zh-CN/common.json
{
    "language": "语言",
    "languageZh": "简体中文",
    "languageEn": "English",
    "userSettings": "用户设置",
    "inviteUser": "邀请用户",
    "logout": "退出登录",
    "home": "主页",
    "new": "新建"
}
```

```json
// packages/frontend/src/i18n/locales/en/auth.json
{
    "loginTitle": "Login",
    "signIn": "Sign in",
    "emailLabel": "Email address",
    "emailPlaceholder": "Your email address",
    "passwordLabel": "Password",
    "passwordPlaceholder": "Your password",
    "forgotPassword": "Forgot your password?",
    "continue": "Continue",
    "noAccount": "Don't have an account?",
    "signUp": "Sign up",
    "loginFailed": "Failed to authenticate"
}
```

```json
// packages/frontend/src/i18n/locales/zh-CN/auth.json
{
    "loginTitle": "登录",
    "signIn": "登录",
    "emailLabel": "邮箱地址",
    "emailPlaceholder": "你的邮箱地址",
    "passwordLabel": "密码",
    "passwordPlaceholder": "你的密码",
    "forgotPassword": "忘记密码？",
    "continue": "继续",
    "noAccount": "还没有账号？",
    "signUp": "注册",
    "loginFailed": "认证失败"
}
```

**Step 5: 提交**

```bash
git add packages/frontend/src/features/users/components/LoginLanding.tsx \
  packages/frontend/src/pages/Login.tsx \
  packages/frontend/src/components/NavBar/*.tsx \
  packages/frontend/src/pages/Settings.tsx \
  packages/frontend/src/components/UserSettings \
  packages/frontend/src/i18n/locales

git commit -m "feat: translate core UI"
```

---

### Task 6: 更新前端用户 mock（测试数据）

**Files:**
- Modify: `packages/frontend/src/testing/__mocks__/api/userResponse.mock.ts`

**Step 1: 写最小改动**

```ts
// packages/frontend/src/testing/__mocks__/api/userResponse.mock.ts
return {
    // ...
    preferredLanguage: 'zh-CN',
};
```

**Step 2: 提交**

```bash
git add packages/frontend/src/testing/__mocks__/api/userResponse.mock.ts

git commit -m "test: add preferredLanguage to user mock"
```

---

## 备注 / 需要确认

- 依赖安装在本机 Node 25 环境下因原生模块（canvas/lz4）失败，需要确认是否切换 Node 版本或跳过本地安装。
- 迁移与翻译 JSON 为配置/内容变更，默认不写单测；如需严格 TDD 覆盖，请确认再补。
