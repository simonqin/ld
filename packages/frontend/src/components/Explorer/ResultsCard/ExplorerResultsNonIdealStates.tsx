import { type ApiErrorDetail } from '@lightdash/common';
import { Anchor, createStyles, keyframes, Loader, Text } from '@mantine/core';
import { IconTableOff } from '@tabler/icons-react';
import { Fragment, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { LD_FIELD_COLORS } from '../../../mantineTheme';
import { TrackSection } from '../../../providers/Tracking/TrackingProvider';
import NoTableIcon from '../../../svgs/emptystate-no-table.svg?react';
import { SectionName } from '../../../types/Events';
import { EmptyState } from '../../common/EmptyState';
import MantineIcon from '../../common/MantineIcon';
import DocumentationHelpButton from '../../DocumentationHelpButton';
import { RefreshButton } from '../../RefreshButton';

const animationKeyframes = keyframes`
    0% {
        opacity: 0;
    }
    5% {
        opacity: 0;
        transform: translateY(-10px);
    }
    10% {
        opacity: 1;
        transform: translateY(0px);
    }
    25% {
        opacity: 1;
        transform: translateY(0px);
    }
    30% {
        opacity: 0;
        transform: translateY(10px);
    }
    80% {
        opacity: 0;
    }
    100% {
        opacity: 0;
    }
`;

const useAnimatedTextStyles = createStyles((theme) => ({
    root: {
        position: 'relative',
        height: theme.spacing.lg,
        textAlign: 'center',
        width: '100%',

        '& > span': {
            animation: `${animationKeyframes} 16s linear infinite 0s`,
            opacity: 0,
            overflow: 'hidden',
            position: 'absolute',
            width: '100%',
            left: 0,
        },

        '& span:nth-of-type(2)': {
            animationDelay: '4s',
        },

        '& span:nth-of-type(3)': {
            animationDelay: '8s',
        },

        '& span:nth-of-type(4)': {
            animationDelay: '12s',
        },
    },
}));

const ExploreDocumentationUrl =
    'https://docs.lightdash.com/get-started/exploring-data/using-explores/';

export const EmptyStateNoColumns = () => {
    const { t } = useTranslation('explore');
    const { classes } = useAnimatedTextStyles();

    return (
        <EmptyState
            title={
                <>
                    {t(
                        'results.emptyStates.noColumns.title',
                        'Pick a metric & select its dimensions',
                    )}{' '}
                    <DocumentationHelpButton
                        href={ExploreDocumentationUrl}
                        pos="relative"
                        top={2}
                        iconProps={{ size: 'lg' }}
                    />
                </>
            }
            description={
                <>
                    {t(
                        'results.emptyStates.noColumns.descriptionPrefix',
                        'What’s your data question? Select the ',
                    )}
                    <Text span color={LD_FIELD_COLORS.metric.color}>
                        {t(
                            'results.emptyStates.noColumns.descriptionMetric',
                            'metric',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.descriptionMiddle',
                        ' you want to calculate and the ',
                    )}
                    <Text span color={LD_FIELD_COLORS.dimension.color}>
                        {t(
                            'results.emptyStates.noColumns.descriptionDimensions',
                            'dimension(s)',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.descriptionSuffix',
                        ' you want to split it by.',
                    )}
                </>
            }
        >
            <Text className={classes.root} color="dimmed">
                <Text span>
                    {t(
                        'results.emptyStates.noColumns.examples.first.prefix',
                        'eg. How many ',
                    )}
                    <Text span color={LD_FIELD_COLORS.metric.color}>
                        {t(
                            'results.emptyStates.noColumns.examples.first.metric',
                            'total signups',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.examples.first.middle',
                        ' per ',
                    )}
                    <Text span color={LD_FIELD_COLORS.dimension.color}>
                        {t(
                            'results.emptyStates.noColumns.examples.first.dimension',
                            'day',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.examples.first.suffix',
                        '?',
                    )}
                </Text>

                <Text span>
                    {t(
                        'results.emptyStates.noColumns.examples.second.prefix',
                        'eg. What is the ',
                    )}
                    <Text span color={LD_FIELD_COLORS.metric.color}>
                        {t(
                            'results.emptyStates.noColumns.examples.second.metric',
                            'total order count',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.examples.second.middle',
                        ' by ',
                    )}
                    <Text span color={LD_FIELD_COLORS.dimension.color}>
                        {t(
                            'results.emptyStates.noColumns.examples.second.dimension',
                            'location',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.examples.second.suffix',
                        '?',
                    )}
                </Text>

                <Text span>
                    {t(
                        'results.emptyStates.noColumns.examples.third.prefix',
                        'eg. How many ',
                    )}
                    <Text span color={LD_FIELD_COLORS.metric.color}>
                        {t(
                            'results.emptyStates.noColumns.examples.third.metric',
                            'new followers',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.examples.third.middle',
                        ' every ',
                    )}
                    <Text span color={LD_FIELD_COLORS.dimension.color}>
                        {t(
                            'results.emptyStates.noColumns.examples.third.dimension',
                            'week',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.examples.third.suffix',
                        '?',
                    )}
                </Text>

                <Text span>
                    {t(
                        'results.emptyStates.noColumns.examples.fourth.prefix',
                        'eg. What is the ',
                    )}
                    <Text span color={LD_FIELD_COLORS.metric.color}>
                        {t(
                            'results.emptyStates.noColumns.examples.fourth.metric',
                            'total order count',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.examples.fourth.middle',
                        ' split by ',
                    )}
                    <Text span color={LD_FIELD_COLORS.dimension.color}>
                        {t(
                            'results.emptyStates.noColumns.examples.fourth.dimension',
                            'status',
                        )}
                    </Text>
                    {t(
                        'results.emptyStates.noColumns.examples.fourth.suffix',
                        '?',
                    )}
                </Text>
            </Text>
        </EmptyState>
    );
};

export const EmptyStateNoTableData: FC<{ description: React.ReactNode }> = ({
    description,
}) => (
    <TrackSection name={SectionName.EMPTY_RESULTS_TABLE}>
        <EmptyState
            maw={500}
            description={
                <>
                    {description}{' '}
                    <DocumentationHelpButton
                        href={ExploreDocumentationUrl}
                        pos="relative"
                        top={2}
                    />
                </>
            }
        >
            <RefreshButton size={'xs'} />
        </EmptyState>
    </TrackSection>
);

export const NoTableSelected = () => {
    const { t } = useTranslation('explore');
    return (
        <EmptyState
            maw={500}
            icon={<NoTableIcon />}
            title={t(
                'results.emptyStates.noTableSelected.title',
                'Select a table',
            )}
            description={
                <>
                    {t(
                        'results.emptyStates.noTableSelected.description',
                        'To run a query, first select the table that you would like to explore.',
                    )}{' '}
                    <DocumentationHelpButton
                        href={ExploreDocumentationUrl}
                        pos="relative"
                        top={2}
                    />
                </>
            }
        />
    );
};

export const EmptyStateExploreLoading = () => {
    const { t } = useTranslation('explore');
    return (
        <EmptyState
            title={t('results.emptyStates.loadingTables', 'Loading tables...')}
        >
            <Loader color="gray" />
        </EmptyState>
    );
};

export const ExploreIdleState = () => {
    const { t } = useTranslation('explore');
    return (
        <EmptyState
            title={t(
                'results.emptyStates.idle',
                'Run query to see your results',
            )}
        />
    );
};

export const ExploreEmptyQueryState = () => {
    const { t } = useTranslation('explore');
    return (
        <EmptyState
            title={t(
                'results.emptyStates.noResults.title',
                'Query returned no results',
            )}
            description={t(
                'results.emptyStates.noResults.description',
                'This query ran successfully but returned no results',
            )}
        />
    );
};

export const ExploreLoadingState = () => {
    const { t } = useTranslation('explore');
    return (
        <EmptyState
            title={t('results.emptyStates.loadingResults', 'Loading results')}
        >
            <Loader color="gray" data-testid="results-table-loading" />
        </EmptyState>
    );
};

export const ExploreErrorState = ({
    errorDetail,
}: {
    errorDetail?: ApiErrorDetail | null;
}) => {
    const { t } = useTranslation('explore');
    return (
        <EmptyState
            icon={<MantineIcon icon={IconTableOff} />}
            title={t(
                'results.emptyStates.errorLoading.title',
                'Error loading results',
            )}
            description={
                <Fragment>
                    <Text style={{ whiteSpace: 'pre-wrap' }}>
                        {errorDetail?.message ||
                            t(
                                'results.emptyStates.errorLoading.fallback',
                                'There was an error loading the results',
                            )}
                    </Text>
                    {errorDetail?.data.documentationUrl && (
                        <Fragment>
                            <br />
                            <Anchor
                                href={errorDetail.data.documentationUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {t(
                                    'results.emptyStates.errorLoading.docsLink',
                                    'Learn how to resolve this in our documentation →',
                                )}
                            </Anchor>
                        </Fragment>
                    )}
                </Fragment>
            }
        />
    );
};

export const MissingRequiredParameters = ({
    missingRequiredParameters,
}: {
    missingRequiredParameters: string[];
}) => {
    const { t } = useTranslation('explore');
    return (
        <EmptyState
            title={t(
                'results.emptyStates.missingRequiredParameters.title',
                'Missing required parameters',
            )}
            description={
                <>
                    {t(
                        'results.emptyStates.missingRequiredParameters.description',
                        'This query requires additional parameters to run.',
                    )}
                    <Text>
                        {t(
                            'results.emptyStates.missingRequiredParameters.listLabel',
                            'Please provide the following {{label}}',
                            {
                                label:
                                    missingRequiredParameters.length === 1
                                        ? t(
                                              'results.emptyStates.missingRequiredParameters.parameter',
                                              'parameter:',
                                          )
                                        : t(
                                              'results.emptyStates.missingRequiredParameters.parameters',
                                              'parameters:',
                                          ),
                            },
                        )}
                    </Text>
                    <br />
                    <Text span fw={500} size="sm">
                        {missingRequiredParameters.join(', ')}
                    </Text>
                </>
            }
        />
    );
};
