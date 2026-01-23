# Full UI i18n Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成 Explore + Settings 全量 i18n、默认中文、可切换、语言偏好持久化与环境变量清单文档。

**Architecture:** 基于现有 i18next 初始化扩展命名空间与检测策略；通过 `useFormatters` 统一基础本地化格式；在登录后写入用户语言偏好。Explore 与 Settings 所有 UI 文案改用 `useTranslation`。

**Tech Stack:** React + i18next + react-i18next + Vite + Mantine + Zod + dayjs + date-fns

---

### Task 1: i18n 配置与新命名空间

**Files:**
- Modify: `packages/frontend/src/i18n/index.ts`
- Modify: `packages/frontend/src/i18n/resources.ts`
- Create: `packages/frontend/src/i18n/locales/en/explore.json`
- Create: `packages/frontend/src/i18n/locales/zh-CN/explore.json`
- Create: `packages/frontend/src/i18n/locales/en/settings.json`
- Create: `packages/frontend/src/i18n/locales/zh-CN/settings.json`
- Create: `packages/frontend/src/i18n/locales/en/validation.json`
- Create: `packages/frontend/src/i18n/locales/zh-CN/validation.json`
- Create: `packages/frontend/src/i18n/locales/en/toast.json`
- Create: `packages/frontend/src/i18n/locales/zh-CN/toast.json`

**Step 1: 无测试（配置/内容变更）**

**Step 2: 修改 i18n 初始化**

```ts
// packages/frontend/src/i18n/index.ts
i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        supportedLngs: SUPPORTED_LANGUAGES,
        fallbackLng: false,
        ns: ['common', 'auth', 'explore', 'settings', 'validation', 'toast'],
        defaultNS: 'common',
        interpolation: { escapeValue: false },
        returnNull: false,
        returnEmptyString: false,
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            convertDetectedLanguage: (language) =>
                normalizeLanguage(language) ?? language,
        },
    });
```

**Step 3: 扩展 resources**

```ts
// packages/frontend/src/i18n/resources.ts
import zhExplore from './locales/zh-CN/explore.json';
import enExplore from './locales/en/explore.json';
import zhSettings from './locales/zh-CN/settings.json';
import enSettings from './locales/en/settings.json';
import zhValidation from './locales/zh-CN/validation.json';
import enValidation from './locales/en/validation.json';
import zhToast from './locales/zh-CN/toast.json';
import enToast from './locales/en/toast.json';

export const resources = {
    'zh-CN': {
        common: zhCommon,
        auth: zhAuth,
        explore: zhExplore,
        settings: zhSettings,
        validation: zhValidation,
        toast: zhToast,
    },
    en: {
        common: enCommon,
        auth: enAuth,
        explore: enExplore,
        settings: enSettings,
        validation: enValidation,
        toast: enToast,
    },
} as const;
```

**Step 4: 创建空 JSON（后续任务逐步填充）**

```json
// packages/frontend/src/i18n/locales/en/explore.json
{}
```

```json
// packages/frontend/src/i18n/locales/zh-CN/explore.json
{}
```

（settings/validation/toast 同理）

**Step 5: Commit**

```bash
git add packages/frontend/src/i18n/index.ts packages/frontend/src/i18n/resources.ts packages/frontend/src/i18n/locales
git commit -m "feat: add i18n namespaces"
```

---

### Task 2: 基础本地化格式化工具（数字/日期/相对时间）

**Files:**
- Create: `packages/frontend/src/hooks/i18n/useFormatters.ts`
- Modify: `packages/frontend/src/hooks/useTimeAgo.ts`
- Test: `packages/frontend/src/hooks/i18n/useFormatters.test.tsx`

**Step 1: 写失败用例**

```ts
// packages/frontend/src/hooks/i18n/useFormatters.test.tsx
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFormatters } from './useFormatters';

const language = { current: 'en' };
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ i18n: { language: language.current } }),
}));

describe('useFormatters', () => {
    it('uses locale-aware date formatting', () => {
        const { result, rerender } = renderHook(() => useFormatters());
        const date = new Date('2026-01-23T00:00:00Z');
        expect(result.current.formatDate(date)).toMatch(/Jan|2026/);

        language.current = 'zh-CN';
        rerender();
        expect(result.current.formatDate(date)).toMatch(/年/);
    });
});
```

**Step 2: 运行测试（应失败）**

```bash
pnpm -F frontend test -- src/hooks/i18n/useFormatters.test.tsx
```

**Step 3: 实现 useFormatters**

```ts
// packages/frontend/src/hooks/i18n/useFormatters.ts
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { enUS, zhCN } from 'date-fns/locale';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage, type SupportedLanguage } from '../../i18n/languages';

const getDateFnsLocale = (language: SupportedLanguage) =>
    language === 'zh-CN' ? zhCN : enUS;

export const useFormatters = () => {
    const { i18n } = useTranslation();
    const language = normalizeLanguage(i18n.language) ?? 'zh-CN';

    useEffect(() => {
        dayjs.locale(language === 'zh-CN' ? 'zh-cn' : 'en');
    }, [language]);

    const numberFormatter = useMemo(
        () => new Intl.NumberFormat(language),
        [language],
    );
    const dateFormatter = useMemo(
        () => new Intl.DateTimeFormat(language, { dateStyle: 'medium' }),
        [language],
    );
    const dateTimeFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(language, {
                dateStyle: 'medium',
                timeStyle: 'short',
            }),
        [language],
    );
    const relativeFormatter = useMemo(
        () => new Intl.RelativeTimeFormat(language, { numeric: 'auto' }),
        [language],
    );

    const formatRelativeTime = (date: Date) => {
        const diffMs = date.getTime() - Date.now();
        const diffSeconds = Math.round(diffMs / 1000);
        const abs = Math.abs(diffSeconds);
        if (abs < 60) return relativeFormatter.format(diffSeconds, 'second');
        const diffMinutes = Math.round(diffSeconds / 60);
        if (Math.abs(diffMinutes) < 60)
            return relativeFormatter.format(diffMinutes, 'minute');
        const diffHours = Math.round(diffMinutes / 60);
        if (Math.abs(diffHours) < 24)
            return relativeFormatter.format(diffHours, 'hour');
        const diffDays = Math.round(diffHours / 24);
        if (Math.abs(diffDays) < 7)
            return relativeFormatter.format(diffDays, 'day');
        const diffWeeks = Math.round(diffDays / 7);
        if (Math.abs(diffWeeks) < 4)
            return relativeFormatter.format(diffWeeks, 'week');
        const diffMonths = Math.round(diffDays / 30);
        if (Math.abs(diffMonths) < 12)
            return relativeFormatter.format(diffMonths, 'month');
        const diffYears = Math.round(diffDays / 365);
        return relativeFormatter.format(diffYears, 'year');
    };

    return {
        language,
        dateFnsLocale: getDateFnsLocale(language),
        formatNumber: (value: number) => numberFormatter.format(value),
        formatDate: (date: Date) => dateFormatter.format(date),
        formatDateTime: (date: Date) => dateTimeFormatter.format(date),
        formatRelativeTime,
    };
};
```

**Step 4: 更新 useTimeAgo 使用 locale**

```ts
// packages/frontend/src/hooks/useTimeAgo.ts
import { useFormatters } from './i18n/useFormatters';
// ...
const { dateFnsLocale } = useFormatters();
const timeAgo = formatDistanceToNow(parsed, {
    addSuffix: true,
    locale: dateFnsLocale,
});
```

**Step 5: 运行测试（应通过）**

```bash
pnpm -F frontend test -- src/hooks/i18n/useFormatters.test.tsx
```

**Step 6: Commit**

```bash
git add packages/frontend/src/hooks/i18n/useFormatters.ts packages/frontend/src/hooks/i18n/useFormatters.test.tsx packages/frontend/src/hooks/useTimeAgo.ts
git commit -m "feat: add locale formatters"
```

---

### Task 3: 登录后自动写入语言偏好

**Files:**
- Modify: `packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.ts`
- Modify: `packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.test.tsx`
- Modify: `packages/frontend/src/providers/App/AppProvider.tsx`

**Step 1: 写失败用例**

```ts
// packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.test.tsx
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useApplyPreferredLanguage } from './useApplyPreferredLanguage';

const changeLanguage = vi.hoisted(() => vi.fn());
const mutate = vi.hoisted(() => vi.fn());

vi.mock('../../i18n', () => ({
    default: { changeLanguage, language: 'zh-CN' },
}));
vi.mock('../user/useUserUpdateMutation', () => ({
    useUserUpdateMutation: () => ({ mutate }),
}));

describe('useApplyPreferredLanguage', () => {
    it('persists language when missing and authenticated', () => {
        renderHook(() => useApplyPreferredLanguage(undefined, true));
        expect(mutate).toHaveBeenCalledWith({ preferredLanguage: 'zh-CN' });
    });
});
```

**Step 2: 运行测试（应失败）**

```bash
pnpm -F frontend test -- src/hooks/i18n/useApplyPreferredLanguage.test.tsx
```

**Step 3: 实现逻辑**

```ts
// packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.ts
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
```

**Step 4: 更新 AppProvider 传参**

```ts
// packages/frontend/src/providers/App/AppProvider.tsx
useApplyPreferredLanguage(
    user.data?.preferredLanguage,
    health?.data?.isAuthenticated,
);
```

**Step 5: 运行测试（应通过）**

```bash
pnpm -F frontend test -- src/hooks/i18n/useApplyPreferredLanguage.test.tsx
```

**Step 6: Commit**

```bash
git add packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.ts packages/frontend/src/hooks/i18n/useApplyPreferredLanguage.test.tsx packages/frontend/src/providers/App/AppProvider.tsx
git commit -m "feat: persist preferred language on login"
```

---

### Task 4: 登录页语言切换入口

**Files:**
- Create: `packages/frontend/src/features/users/components/AuthLanguageSwitcher.tsx`
- Modify: `packages/frontend/src/pages/Login.tsx`

**Step 1: 无测试（轻量 UI 变更）**

**Step 2: 新增 AuthLanguageSwitcher**

```tsx
// packages/frontend/src/features/users/components/AuthLanguageSwitcher.tsx
import { Menu, Button } from '@mantine/core';
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
```

**Step 3: 在 Login 页面放置**

```tsx
// packages/frontend/src/pages/Login.tsx
import { Group, Stack } from '@mantine/core';
import AuthLanguageSwitcher from '../features/users/components/AuthLanguageSwitcher';

// ...
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
```

**Step 4: Commit**

```bash
git add packages/frontend/src/features/users/components/AuthLanguageSwitcher.tsx packages/frontend/src/pages/Login.tsx
git commit -m "feat: add auth language switcher"
```

---

### Task 5: 校验与提示的 i18n 基础

**Files:**
- Create: `packages/frontend/src/utils/validation.ts`
- Modify: `packages/frontend/src/features/users/components/LoginLanding.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/validation.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/validation.json`

**Step 1: 无测试（校验文案调整）**

**Step 2: 新建校验工具**

```ts
// packages/frontend/src/utils/validation.ts
import { validateEmail } from '@lightdash/common';
import { z } from 'zod';
import { type TFunction } from 'i18next';

export const requiredString = (t: TFunction) =>
    z.string().min(1, t('required', 'Required'));

export const emailSchema = (t: TFunction) =>
    z
        .string()
        .min(1, t('required', 'Required'))
        .refine((email) => validateEmail(email), {
            message: t('emailInvalid', 'Email address is not valid'),
        })
        .refine((email) => !/\\s/.test(email), {
            message: t(
                'emailWhitespace',
                'Email address must not contain whitespaces',
            ),
        });
```

**Step 3: 登录页使用校验工具**

```tsx
// packages/frontend/src/features/users/components/LoginLanding.tsx
import { emailSchema } from '../../utils/validation';
// ...
const { t } = useTranslation('auth');
const { t: tValidation } = useTranslation('validation');
// ...
const form = useForm<LoginParams>({
    initialValues: { email: '', password: '' },
    validate: zodResolver(
        z.object({
            email: emailSchema(tValidation),
        }),
    ),
});
```

**Step 4: validation 文案**

```json
// packages/frontend/src/i18n/locales/en/validation.json
{
    "required": "Required",
    "emailInvalid": "Email address is not valid",
    "emailWhitespace": "Email address must not contain whitespaces"
}
```

```json
// packages/frontend/src/i18n/locales/zh-CN/validation.json
{
    "required": "必填",
    "emailInvalid": "邮箱格式不正确",
    "emailWhitespace": "邮箱不能包含空格"
}
```

**Step 5: Commit**

```bash
git add packages/frontend/src/utils/validation.ts packages/frontend/src/features/users/components/LoginLanding.tsx packages/frontend/src/i18n/locales/*/validation.json
git commit -m "feat: add validation i18n helpers"
```

---

### Task 6: Explore 顶层页面与标题

**Files:**
- Modify: `packages/frontend/src/pages/Explorer.tsx`
- Modify: `packages/frontend/src/pages/SavedExplorer.tsx`
- Modify: `packages/frontend/src/pages/ChartHistory.tsx`
- Modify: `packages/frontend/src/pages/MinimalSavedExplorer.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/explore.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/explore.json`

**Step 1: 无测试（文案替换）**

**Step 2: 页面标题与空文案**

```tsx
// packages/frontend/src/pages/Explorer.tsx
const { t } = useTranslation('explore');
// ...
const pageTitle = isSemanticLayerExplore
    ? t('pageTitleSemantic', 'Explore')
    : data?.label || t('pageTitleTablesFallback', 'Tables');
```

**Step 3: 添加 key（示例）**

```json
// en/explore.json
{
    "pageTitleSemantic": "Explore",
    "pageTitleTablesFallback": "Tables"
}
```

```json
// zh-CN/explore.json
{
    "pageTitleSemantic": "探索",
    "pageTitleTablesFallback": "数据表"
}
```

**Step 4: Commit**

```bash
git add packages/frontend/src/pages/Explorer.tsx packages/frontend/src/pages/SavedExplorer.tsx packages/frontend/src/pages/ChartHistory.tsx packages/frontend/src/pages/MinimalSavedExplorer.tsx packages/frontend/src/i18n/locales/*/explore.json
git commit -m "feat: localize explore page titles"
```

---

### Task 7: Explore Header 与 Saved Header

**Files:**
- Modify: `packages/frontend/src/components/Explorer/ExplorerHeader/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExplorerHeader/QueryWarnings.tsx`
- Modify: `packages/frontend/src/components/Explorer/SavedChartsHeader/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/SavedChartsHeader/TitleBreadcrumbs.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/explore.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/explore.json`

**Step 1: 无测试（文案替换）**

**Step 2: 统一 useTranslation('explore') 并替换硬编码**

```tsx
const { t } = useTranslation('explore');
// 例：t('header.refresh', 'Refresh')
```

**Step 3: 补齐对应 key（示例）**

```json
// en/explore.json (append)
{
    "header": {
        "refresh": "Refresh",
        "runQuery": "Run query",
        "queryWarningTitle": "Query warning"
    }
}
```

```json
// zh-CN/explore.json (append)
{
    "header": {
        "refresh": "刷新",
        "runQuery": "运行查询",
        "queryWarningTitle": "查询警告"
    }
}
```

**Step 4: Commit**

```bash
git add packages/frontend/src/components/Explorer/ExplorerHeader/index.tsx packages/frontend/src/components/Explorer/ExplorerHeader/QueryWarnings.tsx packages/frontend/src/components/Explorer/SavedChartsHeader/index.tsx packages/frontend/src/components/Explorer/SavedChartsHeader/TitleBreadcrumbs.tsx packages/frontend/src/i18n/locales/*/explore.json
git commit -m "feat: localize explore headers"
```

---

### Task 8: Explore 侧边栏与字段树

**Files:**
- Modify: `packages/frontend/src/components/Explorer/ExploreSideBar/BasePanel.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExploreSideBar/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExploreSideBar/ExploreNavLink.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExploreTree/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExploreTree/LoadingSkeleton.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExploreTree/TableTree/Virtualization/VirtualEmptyState.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExploreTree/TableTree/Virtualization/VirtualMissingField.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExploreTree/TableTree/Virtualization/VirtualTableHeader.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExploreTree/TableTree/Tree/TreeSingleNodeActions.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/explore.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/explore.json`

**Step 1: 无测试（文案替换）**

**Step 2: 替换文本并补 key**

```tsx
const { t } = useTranslation('explore');
// 例：t('sidebar.searchPlaceholder', 'Search fields')
```

```json
// en/explore.json (append)
{
    "sidebar": {
        "searchPlaceholder": "Search fields",
        "dimensions": "Dimensions",
        "metrics": "Metrics",
        "emptyState": "No fields available"
    }
}
```

```json
// zh-CN/explore.json (append)
{
    "sidebar": {
        "searchPlaceholder": "搜索字段",
        "dimensions": "维度",
        "metrics": "指标",
        "emptyState": "暂无可用字段"
    }
}
```

**Step 3: Commit**

```bash
git add packages/frontend/src/components/Explorer/ExploreSideBar/BasePanel.tsx packages/frontend/src/components/Explorer/ExploreSideBar/index.tsx packages/frontend/src/components/Explorer/ExploreSideBar/ExploreNavLink.tsx packages/frontend/src/components/Explorer/ExploreTree/index.tsx packages/frontend/src/components/Explorer/ExploreTree/LoadingSkeleton.tsx packages/frontend/src/components/Explorer/ExploreTree/TableTree/Virtualization/VirtualEmptyState.tsx packages/frontend/src/components/Explorer/ExploreTree/TableTree/Virtualization/VirtualMissingField.tsx packages/frontend/src/components/Explorer/ExploreTree/TableTree/Virtualization/VirtualTableHeader.tsx packages/frontend/src/components/Explorer/ExploreTree/TableTree/Tree/TreeSingleNodeActions.tsx packages/frontend/src/i18n/locales/*/explore.json
git commit -m "feat: localize explore sidebar and tree"
```

---

### Task 9: Explore 过滤器与参数

**Files:**
- Modify: `packages/frontend/src/components/Explorer/FiltersCard/FiltersCard.tsx`
- Modify: `packages/frontend/src/components/Explorer/FiltersCard/useFieldsWithSuggestions.ts`
- Modify: `packages/frontend/src/components/Explorer/ParametersCard/ParametersCard.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/explore.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/explore.json`

**Step 1: 无测试（文案替换）**

**Step 2: 替换与补 key**

```tsx
const { t } = useTranslation('explore');
// 例：t('filters.addFilter', 'Add filter')
```

```json
// en/explore.json (append)
{
    "filters": {
        "addFilter": "Add filter",
        "noFilters": "No filters yet",
        "parameters": "Parameters"
    }
}
```

```json
// zh-CN/explore.json (append)
{
    "filters": {
        "addFilter": "添加过滤器",
        "noFilters": "暂无过滤器",
        "parameters": "参数"
    }
}
```

**Step 3: Commit**

```bash
git add packages/frontend/src/components/Explorer/FiltersCard/FiltersCard.tsx packages/frontend/src/components/Explorer/FiltersCard/useFieldsWithSuggestions.ts packages/frontend/src/components/Explorer/ParametersCard/ParametersCard.tsx packages/frontend/src/i18n/locales/*/explore.json
git commit -m "feat: localize explore filters"
```

---

### Task 10: Explore 结果与可视化区域

**Files:**
- Modify: `packages/frontend/src/components/Explorer/ResultsCard/ResultsCard.tsx`
- Modify: `packages/frontend/src/components/Explorer/ResultsCard/ExplorerResults.tsx`
- Modify: `packages/frontend/src/components/Explorer/ResultsCard/ExplorerResultsNonIdealStates.tsx`
- Modify: `packages/frontend/src/components/Explorer/ResultsCard/ColumnHeaderContextMenu.tsx`
- Modify: `packages/frontend/src/components/Explorer/ResultsCard/ColumnHeaderSortMenuOptions.tsx`
- Modify: `packages/frontend/src/components/Explorer/ResultsCard/QuickCalculations.tsx`
- Modify: `packages/frontend/src/components/Explorer/VisualizationCard/VisualizationCard.tsx`
- Modify: `packages/frontend/src/components/Explorer/VisualizationCard/VisualizationConfig.tsx`
- Modify: `packages/frontend/src/components/Explorer/VisualizationCard/VisualizationWarning.tsx`
- Modify: `packages/frontend/src/components/Explorer/VisualizationCard/SeriesContextMenu.tsx`
- Modify: `packages/frontend/src/components/Explorer/VisualizationCardOptions/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/FormatForm/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/FormatModal/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/SqlCard/SqlCard.tsx`
- Modify: `packages/frontend/src/components/Explorer/SqlCard/OpenInSqlRunnerButton.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/explore.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/explore.json`

**Step 1: 无测试（文案替换）**

**Step 2: 统一 useTranslation('explore')**

```tsx
const { t } = useTranslation('explore');
// 例：t('results.noResults', 'No results')
```

**Step 3: 补 key（示例）**

```json
// en/explore.json (append)
{
    "results": {
        "noResults": "No results",
        "runQueryToSeeResults": "Run a query to see results"
    },
    "visualization": {
        "config": "Visualization",
        "chartType": "Chart type"
    }
}
```

```json
// zh-CN/explore.json (append)
{
    "results": {
        "noResults": "暂无结果",
        "runQueryToSeeResults": "运行查询以查看结果"
    },
    "visualization": {
        "config": "可视化",
        "chartType": "图表类型"
    }
}
```

**Step 4: Commit**

```bash
git add packages/frontend/src/components/Explorer/ResultsCard/ResultsCard.tsx packages/frontend/src/components/Explorer/ResultsCard/ExplorerResults.tsx packages/frontend/src/components/Explorer/ResultsCard/ExplorerResultsNonIdealStates.tsx packages/frontend/src/components/Explorer/ResultsCard/ColumnHeaderContextMenu.tsx packages/frontend/src/components/Explorer/ResultsCard/ColumnHeaderSortMenuOptions.tsx packages/frontend/src/components/Explorer/ResultsCard/QuickCalculations.tsx packages/frontend/src/components/Explorer/VisualizationCard/VisualizationCard.tsx packages/frontend/src/components/Explorer/VisualizationCard/VisualizationConfig.tsx packages/frontend/src/components/Explorer/VisualizationCard/VisualizationWarning.tsx packages/frontend/src/components/Explorer/VisualizationCard/SeriesContextMenu.tsx packages/frontend/src/components/Explorer/VisualizationCardOptions/index.tsx packages/frontend/src/components/Explorer/FormatForm/index.tsx packages/frontend/src/components/Explorer/FormatModal/index.tsx packages/frontend/src/components/Explorer/SqlCard/SqlCard.tsx packages/frontend/src/components/Explorer/SqlCard/OpenInSqlRunnerButton.tsx packages/frontend/src/i18n/locales/*/explore.json
git commit -m "feat: localize explore results and visualization"
```

---

### Task 11: Explore 相关弹窗与保存流程

**Files:**
- Modify: `packages/frontend/src/components/Explorer/SaveChartButton/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/CustomMetricModal/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/CustomMetricModal/FilterForm.tsx`
- Modify: `packages/frontend/src/components/Explorer/CustomDimensionModal/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/CustomDimensionModal/CustomBinDimensionModal.tsx`
- Modify: `packages/frontend/src/components/Explorer/CustomDimensionModal/CustomSqlDimensionModal.tsx`
- Modify: `packages/frontend/src/components/Explorer/ExploreYamlModal/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/SpaceBrowser/AddResourceToSpaceModal.tsx`
- Modify: `packages/frontend/src/components/Explorer/SpaceBrowser/CreateResourceToSpace.tsx`
- Modify: `packages/frontend/src/components/Explorer/SpaceBrowser/SpaceBrowserMenu.tsx`
- Modify: `packages/frontend/src/components/Explorer/WriteBackModal/index.tsx`
- Modify: `packages/frontend/src/components/Explorer/WriteBackModal/CreatedPullRequestModalContent.tsx`
- Modify: `packages/frontend/src/features/virtualView/components/CreateVirtualViewModal.tsx`
- Modify: `packages/frontend/src/features/virtualView/components/EditVirtualViewModal.tsx`
- Modify: `packages/frontend/src/features/virtualView/components/DeleteVirtualViewModal.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/explore.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/explore.json`

**Step 1: 无测试（文案替换）**

**Step 2: 替换文本并补 key**

```tsx
const { t } = useTranslation('explore');
// 例：t('modals.saveChart.title', 'Save chart')
```

```json
// en/explore.json (append)
{
    "modals": {
        "saveChart": {
            "title": "Save chart",
            "confirm": "Save"
        },
        "customMetric": {
            "title": "Custom metric"
        }
    }
}
```

```json
// zh-CN/explore.json (append)
{
    "modals": {
        "saveChart": {
            "title": "保存图表",
            "confirm": "保存"
        },
        "customMetric": {
            "title": "自定义指标"
        }
    }
}
```

**Step 3: Commit**

```bash
git add packages/frontend/src/components/Explorer/SaveChartButton/index.tsx packages/frontend/src/components/Explorer/CustomMetricModal/index.tsx packages/frontend/src/components/Explorer/CustomMetricModal/FilterForm.tsx packages/frontend/src/components/Explorer/CustomDimensionModal/index.tsx packages/frontend/src/components/Explorer/CustomDimensionModal/CustomBinDimensionModal.tsx packages/frontend/src/components/Explorer/CustomDimensionModal/CustomSqlDimensionModal.tsx packages/frontend/src/components/Explorer/ExploreYamlModal/index.tsx packages/frontend/src/components/Explorer/SpaceBrowser/AddResourceToSpaceModal.tsx packages/frontend/src/components/Explorer/SpaceBrowser/CreateResourceToSpace.tsx packages/frontend/src/components/Explorer/SpaceBrowser/SpaceBrowserMenu.tsx packages/frontend/src/components/Explorer/WriteBackModal/index.tsx packages/frontend/src/components/Explorer/WriteBackModal/CreatedPullRequestModalContent.tsx packages/frontend/src/features/virtualView/components/CreateVirtualViewModal.tsx packages/frontend/src/features/virtualView/components/EditVirtualViewModal.tsx packages/frontend/src/features/virtualView/components/DeleteVirtualViewModal.tsx packages/frontend/src/i18n/locales/*/explore.json
git commit -m "feat: localize explore modals"
```

---

### Task 12: Settings 路由与通用卡片

**Files:**
- Modify: `packages/frontend/src/pages/Settings.tsx`
- Modify: `packages/frontend/src/components/common/Settings/SettingsCard.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/settings.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/settings.json`

**Step 1: 无测试（文案替换）**

**Step 2: 替换标题与路由标签**

```tsx
// packages/frontend/src/pages/Settings.tsx
const { t } = useTranslation('settings');
// 例：<Title order={4}>{t('profile.title', 'Profile settings')}</Title>
```

```json
// en/settings.json (append)
{
    "profile": { "title": "Profile settings" },
    "password": { "title": "Password settings" },
    "socialLogins": { "title": "Social logins" }
}
```

```json
// zh-CN/settings.json (append)
{
    "profile": { "title": "个人资料设置" },
    "password": { "title": "密码设置" },
    "socialLogins": { "title": "社交登录" }
}
```

**Step 3: Commit**

```bash
git add packages/frontend/src/pages/Settings.tsx packages/frontend/src/components/common/Settings/SettingsCard.tsx packages/frontend/src/i18n/locales/*/settings.json
git commit -m "feat: localize settings routes"
```

---

### Task 13: 用户资料 / 密码 / 外观 / 社交登录

**Files:**
- Modify: `packages/frontend/src/components/UserSettings/ProfilePanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/PasswordPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/AppearanceSettingsPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/SocialLoginsPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/DefaultProjectPanel/index.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/settings.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/settings.json`
- Modify: `packages/frontend/src/i18n/locales/en/validation.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/validation.json`

**Step 1: 无测试（文案与校验替换）**

**Step 2: 统一 useTranslation('settings') + validation**

```tsx
const { t } = useTranslation('settings');
const { t: tValidation } = useTranslation('validation');
// 例：label={t('profile.nameLabel', 'Name')}
```

**Step 3: 在 validation.json 中补必填/格式等文案**

**Step 4: Commit**

```bash
git add packages/frontend/src/components/UserSettings/ProfilePanel/index.tsx packages/frontend/src/components/UserSettings/PasswordPanel/index.tsx packages/frontend/src/components/UserSettings/AppearanceSettingsPanel/index.tsx packages/frontend/src/components/UserSettings/SocialLoginsPanel/index.tsx packages/frontend/src/components/UserSettings/DefaultProjectPanel/index.tsx packages/frontend/src/i18n/locales/*/settings.json packages/frontend/src/i18n/locales/*/validation.json
git commit -m "feat: localize profile and password settings"
```

---

### Task 14: 组织与成员管理

**Files:**
- Modify: `packages/frontend/src/components/UserSettings/OrganizationPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/UsersAndGroupsPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/AllowedDomainsPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/UserAttributesPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/DeleteOrganizationPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/ProjectManagementPanel/index.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/settings.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/settings.json`
- Modify: `packages/frontend/src/i18n/locales/en/toast.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/toast.json`

**Step 1: 无测试（文案替换）**

**Step 2: 替换 UI 文案并将 toast 文案迁移到 toast namespace**

```tsx
const { t } = useTranslation('settings');
const { t: tToast } = useTranslation('toast');
// 例：showToastSuccess({ title: tToast('saveSuccess', 'Saved') })
```

**Step 3: 补 key（示例）**

```json
// en/toast.json
{
    "saveSuccess": "Saved",
    "saveFailed": "Save failed"
}
```

```json
// zh-CN/toast.json
{
    "saveSuccess": "已保存",
    "saveFailed": "保存失败"
}
```

**Step 4: Commit**

```bash
git add packages/frontend/src/components/UserSettings/OrganizationPanel/index.tsx packages/frontend/src/components/UserSettings/UsersAndGroupsPanel/index.tsx packages/frontend/src/components/UserSettings/AllowedDomainsPanel/index.tsx packages/frontend/src/components/UserSettings/UserAttributesPanel/index.tsx packages/frontend/src/components/UserSettings/DeleteOrganizationPanel/index.tsx packages/frontend/src/components/UserSettings/ProjectManagementPanel/index.tsx packages/frontend/src/i18n/locales/*/settings.json packages/frontend/src/i18n/locales/*/toast.json
git commit -m "feat: localize organization and members settings"
```

---

### Task 15: 集成与仓库连接

**Files:**
- Modify: `packages/frontend/src/components/UserSettings/SlackSettingsPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/GithubSettingsPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/GitlabSettingsPanel/index.tsx`
- Modify: `packages/frontend/src/components/UserSettings/MyWarehouseConnectionsPanel/index.tsx`
- Modify: `packages/frontend/src/components/ProjectConnection/WarehouseSettingsForm.tsx`
- Modify: `packages/frontend/src/components/ProjectConnection/DbtSettingsForm.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/settings.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/settings.json`
- Modify: `packages/frontend/src/i18n/locales/en/validation.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/validation.json`

**Step 1: 无测试（文案替换）**

**Step 2: 表单 label/placeholder/help 文案全部使用 t('settings.*')**

**Step 3: Commit**

```bash
git add packages/frontend/src/components/UserSettings/SlackSettingsPanel/index.tsx packages/frontend/src/components/UserSettings/GithubSettingsPanel/index.tsx packages/frontend/src/components/UserSettings/GitlabSettingsPanel/index.tsx packages/frontend/src/components/UserSettings/MyWarehouseConnectionsPanel/index.tsx packages/frontend/src/components/ProjectConnection/WarehouseSettingsForm.tsx packages/frontend/src/components/ProjectConnection/DbtSettingsForm.tsx packages/frontend/src/i18n/locales/*/settings.json packages/frontend/src/i18n/locales/*/validation.json
git commit -m "feat: localize integrations and warehouse settings"
```

---

### Task 16: 项目设置与删除

**Files:**
- Modify: `packages/frontend/src/pages/ProjectSettings.tsx`
- Modify: `packages/frontend/src/pages/CreateProjectSettings.tsx`
- Modify: `packages/frontend/src/components/UserSettings/DeleteProjectPanel/index.tsx`
- Modify: `packages/frontend/src/components/ProjectSettings/ProjectMetricFlowSettings.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/settings.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/settings.json`

**Step 1: 无测试（文案替换）**

**Step 2: 使用 settings namespace**

**Step 3: Commit**

```bash
git add packages/frontend/src/pages/ProjectSettings.tsx packages/frontend/src/pages/CreateProjectSettings.tsx packages/frontend/src/components/UserSettings/DeleteProjectPanel/index.tsx packages/frontend/src/components/ProjectSettings/ProjectMetricFlowSettings.tsx packages/frontend/src/i18n/locales/*/settings.json
git commit -m "feat: localize project settings"
```

---

### Task 17: 调度与访问令牌/服务账号

**Files:**
- Modify: `packages/frontend/src/components/SettingsScheduler/SchedulerSettingsForm.tsx`
- Modify: `packages/frontend/src/components/UserSettings/AccessTokensPanel/index.tsx`
- Modify: `packages/frontend/src/ee/features/scim/components/ScimAccessTokensPanel.tsx`
- Modify: `packages/frontend/src/ee/features/serviceAccounts/index.tsx`
- Modify: `packages/frontend/src/ee/features/serviceAccounts/ServiceAccountsCreateModal.tsx`
- Modify: `packages/frontend/src/ee/pages/customRoles/CustomRoles.tsx`
- Modify: `packages/frontend/src/ee/pages/customRoles/CustomRoleCreate.tsx`
- Modify: `packages/frontend/src/ee/pages/customRoles/CustomRoleEdit.tsx`
- Modify: `packages/frontend/src/i18n/locales/en/settings.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/settings.json`

**Step 1: 无测试（文案替换）**

**Step 2: 替换文本与按钮文案**

**Step 3: Commit**

```bash
git add packages/frontend/src/components/SettingsScheduler/SchedulerSettingsForm.tsx packages/frontend/src/components/UserSettings/AccessTokensPanel/index.tsx packages/frontend/src/ee/features/scim/components/ScimAccessTokensPanel.tsx packages/frontend/src/ee/features/serviceAccounts/index.tsx packages/frontend/src/ee/features/serviceAccounts/ServiceAccountsCreateModal.tsx packages/frontend/src/ee/pages/customRoles/CustomRoles.tsx packages/frontend/src/ee/pages/customRoles/CustomRoleCreate.tsx packages/frontend/src/ee/pages/customRoles/CustomRoleEdit.tsx packages/frontend/src/i18n/locales/*/settings.json
git commit -m "feat: localize scheduler and access tokens"
```

---

### Task 18: Explore/Settings 日期与数字展示替换

**Files:**
- Modify: `packages/frontend/src/components/common/ResourceInfoPopup/ResourceInfoPopup.tsx`
- Modify: `packages/frontend/src/components/common/PageHeader/ViewInfo.tsx`
- Modify: `packages/frontend/src/components/common/ResourceView/ResourceLastEdited.tsx`
- Modify: `packages/frontend/src/components/common/Dashboard/DashboardHeaderV1.tsx`
- Modify: `packages/frontend/src/components/common/Dashboard/DashboardHeaderV2.tsx`

**Step 1: 无测试（格式化替换）**

**Step 2: 使用 useFormatters 替换 dayjs 直出**

```tsx
const { formatDateTime, formatRelativeTime } = useFormatters();
// 例：label={formatDateTime(new Date(updatedAt))}
```

**Step 3: Commit**

```bash
git add packages/frontend/src/components/common/ResourceInfoPopup/ResourceInfoPopup.tsx packages/frontend/src/components/common/PageHeader/ViewInfo.tsx packages/frontend/src/components/common/ResourceView/ResourceLastEdited.tsx packages/frontend/src/components/common/Dashboard/DashboardHeaderV1.tsx packages/frontend/src/components/common/Dashboard/DashboardHeaderV2.tsx
git commit -m "feat: localize date and time formatting"
```

---

### Task 19: 环境变量清单文档

**Files:**
- Create: `docs/ENVIRONMENT.md`

**Step 1: 无测试（文档新增）**

**Step 2: 文档结构（示例）**

```md
# Environment Variables

## Core
- LIGHTDASH_SECRET=...
- LIGHTDASH_INSTALL_ID=...

## Database
- PGHOST=...
- PGPORT=...
- PGUSER=...
- PGPASSWORD=...
- PGDATABASE=...
- PGCONNECTIONURI=...

## Auth & SSO
- AUTH_GOOGLE_ENABLED=...
- AUTH_OKTA_ENABLED=...
- ...
```

**Step 3: Commit**

```bash
git add docs/ENVIRONMENT.md
git commit -m "docs: add environment variables reference"
```

---

### Task 20: 全量检查与收尾

**Files:**
- Modify: `packages/frontend/src/i18n/locales/en/explore.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/explore.json`
- Modify: `packages/frontend/src/i18n/locales/en/settings.json`
- Modify: `packages/frontend/src/i18n/locales/zh-CN/settings.json`

**Step 1: 查漏补缺（无测试）**

运行以下命令定位剩余硬编码文案，并补齐到对应 namespace：

```bash
rg -n \"\\>[^<]*[A-Za-z]\" packages/frontend/src/components/Explorer packages/frontend/src/pages/Explorer.tsx
rg -n \"\\>[^<]*[A-Za-z]\" packages/frontend/src/components/UserSettings packages/frontend/src/pages/Settings.tsx
```

**Step 2: 完成后 Commit**

```bash
git add packages/frontend/src/i18n/locales/*/explore.json packages/frontend/src/i18n/locales/*/settings.json
git commit -m "chore: finalize explore and settings translations"
```

