import { FeatureFlags, getItemMap } from '@lightdash/common';
import { Box, Text } from '@mantine/core';
import { memo, useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import {
    explorerActions,
    selectAdditionalMetrics,
    selectChartConfig,
    selectColumnOrder,
    selectIsEditMode,
    selectPivotConfig,
    selectTableCalculations,
    selectTableName,
    useExplorerDispatch,
    useExplorerSelector,
} from '../../../features/explorer/store';
import { useColumns } from '../../../hooks/useColumns';
import { useExplore } from '../../../hooks/useExplore';
import { useExplorerQuery } from '../../../hooks/useExplorerQuery';
import { useFeatureFlag } from '../../../hooks/useFeatureFlagEnabled';
import type {
    useGetReadyQueryResults,
    useInfiniteQueryResults,
} from '../../../hooks/useQueryResults';
import { TrackSection } from '../../../providers/Tracking/TrackingProvider';
import { SectionName } from '../../../types/Events';
import Table from '../../common/Table';
import { JsonViewerModal } from '../../JsonViewerModal';
import CellContextMenu from './CellContextMenu';
import ColumnHeaderContextMenu from './ColumnHeaderContextMenu';
import {
    EmptyStateExploreLoading,
    EmptyStateNoColumns,
    EmptyStateNoTableData,
    MissingRequiredParameters,
    NoTableSelected,
} from './ExplorerResultsNonIdealStates';

const getQueryStatus = (
    query: ReturnType<typeof useGetReadyQueryResults>,
    queryResults: ReturnType<typeof useInfiniteQueryResults>,
): 'loading' | 'error' | 'idle' | 'success' => {
    const isCreatingQuery = query.isFetching;
    const isFetchingFirstPage = queryResults.isFetchingFirstPage;

    // Don't return queryResults.status because we changed from mutation to query so 'loading' has a different meaning
    if (queryResults.error || query.error) {
        return 'error';
    } else if (isCreatingQuery || isFetchingFirstPage) {
        return 'loading';
    } else if (!query.data) {
        return 'idle';
    } else if (query.status === 'success') {
        return 'success';
    } else {
        return 'error';
    }
};

export const ExplorerResults = memo(() => {
    const { t } = useTranslation('explore');
    const dispatch = useExplorerDispatch();
    const columns = useColumns();
    const isEditMode = useExplorerSelector(selectIsEditMode);
    const activeTableName = useExplorerSelector(selectTableName);
    const additionalMetrics = useExplorerSelector(selectAdditionalMetrics);
    const tableCalculations = useExplorerSelector(selectTableCalculations);

    // Get chart config for column properties
    const chartConfig = useExplorerSelector(selectChartConfig);
    const columnProperties =
        chartConfig.type === 'table' && chartConfig.config?.columns
            ? chartConfig.config.columns
            : undefined;

    // Get query state from new hook
    const {
        query,
        queryResults,
        unpivotedQuery,
        unpivotedQueryResults,
        unpivotedEnabled,
        missingRequiredParameters,
    } = useExplorerQuery();

    const { data: useSqlPivotResults } = useFeatureFlag(
        FeatureFlags.UseSqlPivotResults,
    );

    const dimensions = query.data?.metricQuery?.dimensions ?? [];
    const metrics = query.data?.metricQuery?.metrics ?? [];
    const explorerColumnOrder = useExplorerSelector(selectColumnOrder);

    const pivotConfig = useExplorerSelector(selectPivotConfig);
    const hasPivotConfig = !!pivotConfig;

    const resultsData = useMemo(() => {
        const isSqlPivotEnabled = !!useSqlPivotResults?.enabled;
        const hasUnpivotedQuery = !!unpivotedQuery?.data?.queryUuid;

        // Only use unpivoted data when SQL pivot is enabled
        const shouldUseUnpivotedData =
            isSqlPivotEnabled &&
            hasPivotConfig &&
            hasUnpivotedQuery &&
            unpivotedEnabled;

        if (shouldUseUnpivotedData) {
            return {
                rows: unpivotedQueryResults.rows,
                totalResults: unpivotedQueryResults.totalResults,
                isFetchingRows:
                    unpivotedQueryResults.isFetchingRows &&
                    !unpivotedQueryResults.error,
                fetchMoreRows: unpivotedQueryResults.fetchMoreRows,
                status: getQueryStatus(unpivotedQuery, unpivotedQueryResults),
                apiError: unpivotedQuery.error ?? unpivotedQueryResults.error,
            };
        }

        const finalStatus = getQueryStatus(query, queryResults);
        const result = {
            rows: queryResults.rows,
            totalResults: queryResults.totalResults,
            isFetchingRows: queryResults.isFetchingRows && !queryResults.error,
            fetchMoreRows: queryResults.fetchMoreRows,
            status: finalStatus,
            apiError: query.error ?? queryResults.error,
        };

        return result;
    }, [
        useSqlPivotResults?.enabled,
        unpivotedQuery,
        hasPivotConfig,
        unpivotedEnabled,
        query,
        queryResults,
        unpivotedQueryResults,
    ]);

    const {
        rows,
        totalResults: totalRows,
        isFetchingRows,
        fetchMoreRows,
        status,
        apiError,
    } = resultsData;

    const handleColumnOrderChange = useCallback(
        (order: string[]) => {
            dispatch(explorerActions.setColumnOrder(order));
        },
        [dispatch],
    );

    const { data: exploreData, isInitialLoading: isExploreLoading } =
        useExplore(activeTableName, {
            refetchOnMount: false,
        });
    const [isExpandModalOpened, setIsExpandModalOpened] = useState(false);
    const [expandData, setExpandData] = useState<{
        name: string;
        jsonObject: Record<string, unknown>;
    }>({
        name: 'unknown',
        jsonObject: {},
    });

    const handleCellExpand = (name: string, data: Record<string, unknown>) => {
        setExpandData({
            name: name,
            jsonObject: data,
        });
        setIsExpandModalOpened(true);
    };

    const itemsMap = useMemo(() => {
        if (exploreData) {
            return getItemMap(
                exploreData,
                additionalMetrics,
                tableCalculations,
            );
        }
        return undefined;
    }, [exploreData, additionalMetrics, tableCalculations]);

    const cellContextMenu = useCallback(
        (props: any) => (
            <CellContextMenu
                isEditMode={isEditMode}
                {...props}
                itemsMap={itemsMap}
                onExpand={handleCellExpand}
            />
        ),
        [isEditMode, itemsMap],
    );

    const IdleState: FC = useCallback(() => {
        const description =
            dimensions.length <= 0 ? (
                <>
                    {t(
                        'results.idle.selectDimensionsPrefix',
                        'Pick one or more ',
                    )}
                    <Text span color="blue.9">
                        {t('results.idle.dimensions', 'dimensions')}
                    </Text>
                    {t(
                        'results.idle.selectDimensionsSuffix',
                        ' to split your selected metric by.',
                    )}
                </>
            ) : metrics.length <= 0 ? (
                <>
                    {t('results.idle.selectMetricPrefix', 'Pick a ')}
                    <Text span color="yellow.9">
                        {t('results.idle.metric', 'metric')}
                    </Text>
                    {t(
                        'results.idle.selectMetricSuffix',
                        ' to make calculations across your selected dimensions.',
                    )}
                </>
            ) : (
                <>
                    {t(
                        'results.idle.runQuery',
                        'Run query to view your results and visualize them as a chart.',
                    )}
                </>
            );

        return <EmptyStateNoTableData description={description} />;
    }, [dimensions.length, metrics.length, t]);

    const pagination = useMemo(
        () => ({
            show: true,
            showResultsTotal: true,
        }),
        [],
    );
    const footer = useMemo(
        () => ({
            show: true,
        }),
        [],
    );

    if (!activeTableName) return <NoTableSelected />;

    if (columns.length === 0) return <EmptyStateNoColumns />;

    if (isExploreLoading) return <EmptyStateExploreLoading />;

    if (missingRequiredParameters && missingRequiredParameters.length > 0)
        return (
            <MissingRequiredParameters
                missingRequiredParameters={missingRequiredParameters}
            />
        );

    return (
        <TrackSection name={SectionName.RESULTS_TABLE}>
            <Box px="xs" py="lg" data-testid="results-table-container">
                <Table
                    status={status}
                    errorDetail={apiError?.error}
                    data={rows || []}
                    totalRowsCount={totalRows || 0}
                    isFetchingRows={isFetchingRows}
                    fetchMoreRows={fetchMoreRows}
                    columns={columns}
                    columnOrder={explorerColumnOrder}
                    onColumnOrderChange={handleColumnOrderChange}
                    cellContextMenu={cellContextMenu}
                    headerContextMenu={
                        isEditMode ? ColumnHeaderContextMenu : undefined
                    }
                    idleState={IdleState}
                    pagination={pagination}
                    footer={footer}
                    showSubtotals={false}
                    columnProperties={columnProperties}
                />
                <JsonViewerModal
                    heading={t(
                        'results.jsonViewerHeading',
                        'Field: {{name}}',
                        {
                            name:
                                expandData.name ||
                                t('results.unknownField', 'unknown'),
                        },
                    )}
                    jsonObject={expandData.jsonObject}
                    opened={isExpandModalOpened}
                    onClose={() => setIsExpandModalOpened(false)}
                />
            </Box>
        </TrackSection>
    );
});
