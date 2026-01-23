import { subject } from '@casl/ability';
import {
    assertUnreachable,
    ContentType,
    type SummaryContent,
} from '@lightdash/common';
import {
    Button,
    Group,
    Loader,
    Modal,
    MultiSelect,
    ScrollArea,
    Stack,
    Text,
    Title,
    type ModalProps,
    type ScrollAreaProps,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { IconFolder } from '@tabler/icons-react';
import uniqBy from 'lodash/uniqBy';
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FC,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useUpdateMultipleDashboard } from '../../../hooks/dashboard/useDashboards';
import { useInfiniteContent } from '../../../hooks/useContent';
import { useUpdateMultipleMutation } from '../../../hooks/useSavedQuery';
import { useSpace, useSpaceSummaries } from '../../../hooks/useSpaces';
import useApp from '../../../providers/App/useApp';
import MantineIcon from '../../common/MantineIcon';
import { AddToSpaceResources } from './types';

type SelectItemData = {
    value: string;
    label: string;
    disabled: boolean;
    title: string;
    spaceName: string | undefined;
};

const SelectItem = forwardRef<HTMLDivElement, SelectItemData>(
    (
        {
            label,
            value,
            spaceName,
            ...others
        }: React.ComponentPropsWithoutRef<'div'> & SelectItemData,
        ref,
    ) => (
        <Stack ref={ref} {...others} spacing="two">
            <Text fz="sm" fw={500}>
                {label}
            </Text>
            <Group spacing="xs">
                <MantineIcon size="sm" icon={IconFolder} />
                <Text fz="xs" opacity={0.65}>
                    {spaceName}
                </Text>
            </Group>
        </Stack>
    ),
);

type AddItemForm = {
    items: string[];
};

type Props = Pick<ModalProps, 'onClose'> & {
    resourceType: AddToSpaceResources;
};

const AddResourceToSpaceModal: FC<Props> = ({ resourceType, onClose }) => {
    const { t } = useTranslation('explore');
    const { projectUuid, spaceUuid } = useParams<{
        projectUuid: string;
        spaceUuid: string;
    }>();
    const { user } = useApp();
    const { data: space } = useSpace(projectUuid, spaceUuid);
    const { data: spaces } = useSpaceSummaries(projectUuid);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
    const selectScrollRef = useRef<HTMLDivElement>(null);
    const {
        data: contentPages,
        isInitialLoading,
        isFetching,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteContent(
        {
            projectUuids: [projectUuid!],
            contentTypes:
                resourceType === AddToSpaceResources.CHART
                    ? [ContentType.CHART]
                    : [ContentType.DASHBOARD],
            page: 1,
            pageSize: 25,
            search: debouncedSearchQuery,
        },
        { keepPreviousData: true },
    );
    useEffect(() => {
        selectScrollRef.current?.scrollTo({
            top: selectScrollRef.current?.scrollHeight,
        });
    }, [contentPages]);
    // Aggregates all fetched charts/dashboards across pages and search queries into a unified list.
    // This ensures that previously fetched charts/dashboards are preserved even when the search query changes.
    // Uses 'uuid' to remove duplicates and maintain a consistent set of unique charts/dashboards.
    const [allItems, setAllItems] = useState<SummaryContent[]>([]);
    useEffect(() => {
        const allPages = contentPages?.pages.map((p) => p.data).flat() ?? [];
        const itemsWithUpdatePermission = allPages.filter((summary) => {
            const summarySpace = spaces?.find(
                ({ uuid }) => uuid === summary.space.uuid,
            );
            return user.data?.ability.can(
                'update',
                subject(
                    resourceType === AddToSpaceResources.CHART
                        ? 'SavedChart'
                        : 'Dashboard',
                    {
                        ...summarySpace,
                        access: summarySpace?.userAccess
                            ? [summarySpace?.userAccess]
                            : [],
                    },
                ),
            );
        });

        setAllItems((previousState) =>
            uniqBy([...previousState, ...itemsWithUpdatePermission], 'uuid'),
        );
    }, [contentPages?.pages, user.data, spaces, resourceType]);

    const { mutate: chartMutation } = useUpdateMultipleMutation(projectUuid!);
    const { mutate: dashboardMutation } = useUpdateMultipleDashboard(
        projectUuid!,
    );

    const resourceTypeLabel = useMemo(() => {
        switch (resourceType) {
            case AddToSpaceResources.DASHBOARD:
                return t('spaceBrowser.resourceType.dashboard', 'Dashboard');
            case AddToSpaceResources.CHART:
                return t('spaceBrowser.resourceType.chart', 'Chart');
            default:
                return assertUnreachable(
                    resourceType,
                    'Unexpected resource type when getting label',
                );
        }
    }, [resourceType, t]);

    const resourceTypeLabelPlural = useMemo(() => {
        switch (resourceType) {
            case AddToSpaceResources.DASHBOARD:
                return t(
                    'spaceBrowser.resourceType.dashboardPlural',
                    'Dashboards',
                );
            case AddToSpaceResources.CHART:
                return t('spaceBrowser.resourceType.chartPlural', 'Charts');
            default:
                return assertUnreachable(
                    resourceType,
                    'Unexpected resource type when getting label',
                );
        }
    }, [resourceType, t]);

    const form = useForm<AddItemForm>();
    const { reset } = form;

    const closeModal = useCallback(() => {
        reset();
        if (onClose) onClose();
    }, [reset, onClose]);

    const selectItems: SelectItemData[] = useMemo(() => {
        return allItems.map<SelectItemData>(
            ({
                uuid: itemUuid,
                name,
                space: { uuid: itemSpaceUuid, name: itemSpaceName },
            }) => {
                const disabled = spaceUuid === itemSpaceUuid;
                return {
                    value: itemUuid,
                    label: name,
                    disabled,
                    title: disabled
                        ? t(
                              'spaceBrowser.addResource.alreadyInSpace',
                              '{{resourceType}} already added on this space {{spaceName}}',
                              {
                                  resourceType: resourceTypeLabel,
                                  spaceName: itemSpaceName,
                              },
                          )
                        : '',
                    spaceName: itemSpaceName,
                };
            },
        );
    }, [spaceUuid, allItems, resourceTypeLabel, t]);

    const handleSubmit = form.onSubmit(({ items }) => {
        if (!spaceUuid) return;
        switch (resourceType) {
            case AddToSpaceResources.CHART:
                if (items) {
                    const selectedCharts = items.map((item) => {
                        const chart = allItems.find(
                            (savedChart) => savedChart.uuid === item,
                        );
                        return {
                            uuid: item,
                            name: chart?.name || '',
                            spaceUuid,
                        };
                    });

                    chartMutation(selectedCharts);
                }
                break;
            case AddToSpaceResources.DASHBOARD:
                if (items) {
                    const selectedDashboards = items.map((item) => {
                        const dashboard = allItems.find(
                            ({ uuid }) => uuid === item,
                        );
                        return {
                            uuid: item,
                            name: dashboard?.name || '',
                            spaceUuid,
                        };
                    });

                    dashboardMutation(selectedDashboards);
                }
                break;
        }

        closeModal();
    });

    return (
        <Modal
            opened
            onClose={closeModal}
            title={
                <Title order={4}>
                    {t(
                        'spaceBrowser.addResource.title',
                        'Add {{resourceType}} to space',
                        { resourceType: resourceTypeLabel },
                    )}
                </Title>
            }
        >
            <form name="add_items_to_space" onSubmit={handleSubmit}>
                <Stack spacing="xs" pt="sm">
                    <Text>
                        {t(
                            'spaceBrowser.addResource.description',
                            'Select the {{resourceTypePlural}} that you would like to move into ',
                            { resourceTypePlural: resourceTypeLabelPlural },
                        )}
                        <Text span fw={500}>
                            {space?.name}
                        </Text>
                        {t('spaceBrowser.addResource.descriptionSuffix', ':')}
                    </Text>

                    <MultiSelect
                        withinPortal
                        searchable
                        required
                        data={selectItems}
                        itemComponent={SelectItem}
                        disabled={isInitialLoading}
                        placeholder={t(
                            'spaceBrowser.addResource.searchPlaceholder',
                            'Search for a {{resourceType}}',
                            { resourceType: resourceTypeLabel },
                        )}
                        nothingFound={t(
                            'spaceBrowser.addResource.nothingFound',
                            'No {{resourceTypePlural}} found',
                            { resourceTypePlural: resourceTypeLabelPlural },
                        )}
                        clearable
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        maxDropdownHeight={300}
                        rightSection={
                            isFetching && <Loader size="xs" color="gray" />
                        }
                        dropdownComponent={({
                            children,
                            ...rest
                        }: ScrollAreaProps) => (
                            <ScrollArea {...rest} viewportRef={selectScrollRef}>
                                <>
                                    {children}
                                    {hasNextPage && (
                                        <Button
                                            size="xs"
                                            variant="white"
                                            onClick={async () => {
                                                await fetchNextPage();
                                            }}
                                            disabled={isFetching}
                                        >
                                            <Text>
                                                {t(
                                                    'spaceBrowser.addResource.loadMore',
                                                    'Load more',
                                                )}
                                            </Text>
                                        </Button>
                                    )}
                                </>
                            </ScrollArea>
                        )}
                        {...form.getInputProps('items')}
                    />
                </Stack>

                <Group position="right" mt="sm">
                    <Button variant="outline" onClick={closeModal}>
                        {t('spaceBrowser.addResource.cancel', 'Cancel')}
                    </Button>
                    <Button disabled={isInitialLoading} type="submit">
                        {t(
                            'spaceBrowser.addResource.move',
                            'Move {{resourceTypePlural}}',
                            { resourceTypePlural: resourceTypeLabelPlural },
                        )}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
};

export default AddResourceToSpaceModal;
