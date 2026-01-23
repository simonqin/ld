import { DbtProjectType, snakeCaseName } from '@lightdash/common';
import {
    Button,
    Group,
    Modal,
    Stack,
    Text,
    TextInput,
    Tooltip,
    type ModalProps,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconInfoCircle, IconTableAlias } from '@tabler/icons-react';
import { useCallback, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import MantineIcon from '../../../components/common/MantineIcon';
import { useGitIntegration } from '../../../hooks/gitIntegration/useGitIntegration';
import useHealth from '../../../hooks/health/useHealth';
import { useProject } from '../../../hooks/useProject';
import { useAppSelector } from '../../sqlRunner/store/hooks';
import { useCreateVirtualView } from '../hooks/useVirtualView';

const validationSchema = z.object({
    name: z.string().min(1),
});

type FormValues = z.infer<typeof validationSchema>;

type Props = ModalProps;

export const CreateVirtualViewModal: FC<Props> = ({ opened, onClose }) => {
    const { t } = useTranslation('explore');
    const health = useHealth();
    const projectUuid = useAppSelector((state) => state.sqlRunner.projectUuid);
    const sql = useAppSelector((state) => state.sqlRunner.sql);
    const columns = useAppSelector((state) => state.sqlRunner.sqlColumns);

    const name = useAppSelector((state) => state.sqlRunner.name);

    const {
        mutateAsync: createVirtualView,
        isLoading: isLoadingVirtual,
        error,
    } = useCreateVirtualView({
        projectUuid,
    });
    const form = useForm<FormValues>({
        initialValues: {
            name: name || '',
        },
        validate: zodResolver(validationSchema),
    });

    const { data: project } = useProject(projectUuid);
    const { data: gitIntegration, isError } = useGitIntegration();

    const canWriteToDbtProject = !!(
        health.data?.hasGithub &&
        gitIntegration?.enabled === true &&
        !isError &&
        project?.dbtConnection.type === DbtProjectType.GITHUB
    );
    const tooltipSuggestion = canWriteToDbtProject
        ? t(
              'virtualView.create.tooltipSuggestion',
              ' If you’re expecting to reuse this query regularly, we suggest writing it back to dbt.',
          )
        : '';
    const tooltipLabel = t(
        'virtualView.create.tooltip',
        'Create a virtual view so others can reuse this query in Lightdash. The query won’t be saved to or managed in your dbt project.{{suggestion}}',
        { suggestion: tooltipSuggestion },
    );

    const handleSubmit = useCallback(
        async (data: { name: string }) => {
            if (!columns) {
                return;
            }

            await createVirtualView({
                name: snakeCaseName(data.name),
                sql,
                columns,
                projectUuid,
            });

            onClose();
        },
        [columns, onClose, projectUuid, sql, createVirtualView],
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            keepMounted={false}
            title={
                <Group spacing="xs">
                    <MantineIcon
                        icon={IconTableAlias}
                        size="lg"
                        color="ldGray.7"
                    />
                    <Text fw={500}>
                        {t('virtualView.create.title', 'Create virtual view')}
                    </Text>
                    <Tooltip
                        variant="xs"
                        withinPortal
                        multiline
                        maw={300}
                        label={tooltipLabel}
                    >
                        <MantineIcon
                            color="ldGray.7"
                            icon={IconInfoCircle}
                            size={16}
                        />
                    </Tooltip>
                </Group>
            }
            styles={(theme) => ({
                header: { borderBottom: `1px solid ${theme.colors.ldGray[4]}` },
                body: { padding: 0 },
            })}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack p="md">
                    <TextInput
                        radius="md"
                        label={t('virtualView.create.nameLabel', 'Name')}
                        required
                        {...form.getInputProps('name')}
                        error={!!error?.error}
                    />
                </Stack>

                <Group position="right" w="100%" p="md">
                    <Button
                        color="ldGray.7"
                        onClick={onClose}
                        variant="outline"
                        disabled={isLoadingVirtual}
                        size="xs"
                    >
                        {t('virtualView.cancel', 'Cancel')}
                    </Button>

                    <Button
                        type="submit"
                        disabled={!form.values.name || !sql}
                        loading={isLoadingVirtual}
                        size="xs"
                    >
                        {t('virtualView.create.submit', 'Create')}
                    </Button>
                </Group>
            </form>
        </Modal>
    );
};
