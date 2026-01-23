import { formatDistanceToNow, parseISO } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInterval } from 'react-use';
import { useFormatters } from './i18n/useFormatters';

export const useTimeAgo = (
    dateOrString: Date | string,
    interval: number = 10000,
) => {
    const { dateFnsLocale } = useFormatters();
    const parsed = useMemo(() => {
        return typeof dateOrString === 'string'
            ? parseISO(dateOrString)
            : dateOrString;
    }, [dateOrString]);

    const getTimeAgo = useCallback(() => {
        const timeAgo = formatDistanceToNow(parsed, {
            addSuffix: true,
            locale: dateFnsLocale,
        });

        return timeAgo;
    }, [parsed, dateFnsLocale]);

    const [timeAgo, setTimeAgo] = useState<string>(getTimeAgo());

    useInterval(() => {
        setTimeAgo(getTimeAgo());
    }, interval);

    useEffect(() => {
        setTimeAgo(getTimeAgo());
    }, [parsed, getTimeAgo]);

    return timeAgo;
};
