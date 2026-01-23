import { subject } from '@casl/ability';
import { ActionIcon, Box, Menu } from '@mantine/core';
import {
    IconEdit,
    IconFolderSymlink,
    IconPin,
    IconPinned,
    IconTrash,
} from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import useApp from '../../../providers/App/useApp';
import MantineIcon from '../../common/MantineIcon';

interface Props {
    isPinned: boolean;
    onRename: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
    onTransferToSpace: () => void;
}

export const SpaceBrowserMenu: React.FC<React.PropsWithChildren<Props>> = ({
    isPinned,
    onRename,
    onDelete,
    onTogglePin,
    onTransferToSpace,
    children,
}) => {
    const { t } = useTranslation('explore');
    const { user } = useApp();
    const organizationUuid = user.data?.organizationUuid;
    const { projectUuid } = useParams<{ projectUuid: string }>();

    return (
        <Menu
            withinPortal
            position="bottom-end"
            withArrow
            arrowPosition="center"
            shadow="md"
            closeOnItemClick
            closeOnClickOutside
        >
            <Menu.Target>
                <Box>
                    <ActionIcon>{children}</ActionIcon>
                </Box>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item
                    component="button"
                    role="menuitem"
                    icon={<MantineIcon icon={IconEdit} />}
                    onClick={onRename}
                >
                    {t('spaceBrowser.menu.rename', 'Rename')}
                </Menu.Item>

                {user.data?.ability.can(
                    'manage',
                    subject('PinnedItems', {
                        organizationUuid,
                        projectUuid,
                    }),
                ) && (
                    <Menu.Item
                        component="button"
                        role="menuitem"
                        icon={
                            isPinned ? (
                                <MantineIcon icon={IconPinned} />
                            ) : (
                                <MantineIcon icon={IconPin} />
                            )
                        }
                        onClick={onTogglePin}
                    >
                        {isPinned
                            ? t(
                                  'spaceBrowser.menu.unpin',
                                  'Unpin from homepage',
                              )
                            : t('spaceBrowser.menu.pin', 'Pin to homepage')}
                    </Menu.Item>
                )}

                <Menu.Divider />

                <Menu.Item
                    component="button"
                    role="menuitem"
                    icon={<IconFolderSymlink size={18} />}
                    onClick={() => {
                        onTransferToSpace();
                    }}
                >
                    {t('spaceBrowser.menu.move', 'Move')}
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                    component="button"
                    role="menuitem"
                    color="red"
                    icon={<MantineIcon icon={IconTrash} />}
                    onClick={onDelete}
                >
                    {t('spaceBrowser.menu.deleteSpace', 'Delete space')}
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};
