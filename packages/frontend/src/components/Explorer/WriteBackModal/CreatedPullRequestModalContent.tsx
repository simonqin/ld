import { Anchor, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { IconGitBranch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import MantineIcon from '../../common/MantineIcon';

export const CreatedPullRequestModalContent = ({
    onClose,
    data,
}: {
    onClose: () => void;
    data: { prUrl: string };
}) => {
    const { t } = useTranslation('explore');
    return (
        <Modal
            size="xl"
            onClick={(e) => e.stopPropagation()}
            opened={true}
            onClose={onClose}
            title={
                <Group spacing="xs">
                    <MantineIcon
                        icon={IconGitBranch}
                        size="lg"
                        color="ldGray.7"
                    />
                    <Text fw={500}>
                        {t('writeBack.title', 'Write back to dbt')}
                    </Text>
                </Group>
            }
            styles={(theme) => ({
                header: { borderBottom: `1px solid ${theme.colors.ldGray[4]}` },
                body: { padding: 0 },
            })}
        >
            <Stack p="md">
                <Text>
                    {t('writeBack.prCreated.prefix', 'Your pull request ')}
                    <Anchor href={data.prUrl} target="_blank" span fw={700}>
                        #{data.prUrl.split('/').pop()}
                    </Anchor>
                    {t(
                        'writeBack.prCreated.suffix',
                        ' was successfully created on git.',
                    )}
                    <Text pt="md">
                        {t(
                            'writeBack.prCreated.hint',
                            'Once it is merged, refresh your dbt connection to see your updated metrics and dimensions.',
                        )}
                    </Text>
                </Text>
            </Stack>
            <Group position="right" w="100%" p="md">
                <Button
                    color="ldGray.7"
                    onClick={onClose}
                    variant="outline"
                    size="xs"
                >
                    {t('writeBack.close', 'Close')}
                </Button>
            </Group>
        </Modal>
    );
};
