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
