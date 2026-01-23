import { LightdashMode } from '@lightdash/common';
import { Button, Menu } from '@mantine/core';
import { modals } from '@mantine/modals';
import {
    IconBook,
    IconHelp,
    IconMessageCircle2,
    IconMessages,
    IconSos,
    IconUsers,
} from '@tabler/icons-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useIntercom } from 'react-use-intercom';
import useHealth from '../../hooks/health/useHealth';
import SupportDrawerContent from '../../providers/SupportDrawer/SupportDrawerContent';
import LargeMenuItem from '../common/LargeMenuItem';
import MantineIcon from '../common/MantineIcon';

const HelpMenu: FC = () => {
    const health = useHealth();
    const isCloudCustomer = health.data?.mode === LightdashMode.CLOUD_BETA;
    const isDevelopment = health.data?.mode === LightdashMode.DEV;
    const { t } = useTranslation('common');

    const { show: showIntercom } = useIntercom();

    return (
        <Menu
            withArrow
            shadow="lg"
            position="bottom-end"
            arrowOffset={16}
            offset={-2}
        >
            <Menu.Target>
                <Button aria-label={t('help', 'Help')} variant="default" size="xs">
                    <MantineIcon icon={IconHelp} />
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                {isCloudCustomer && (
                    <LargeMenuItem
                        onClick={() => {
                            // @ts-ignore
                            if (window.Pylon) {
                                // @ts-ignore
                                window.Pylon('show');
                            } else {
                                showIntercom();
                            }
                        }}
                        title={t('contactSupport', 'Contact support')}
                        description={t(
                            'contactSupportDescription',
                            'Drop us a message and we’ll get back to you asap!',
                        )}
                        icon={IconMessages}
                    />
                )}

                <LargeMenuItem
                    component="a"
                    href="https://docs.lightdash.com/"
                    target="_blank"
                    title={t('viewDocs', 'View Docs')}
                    description={t(
                        'viewDocsDescription',
                        'Learn how to deploy, use, contribute to Lightdash.',
                    )}
                    icon={IconBook}
                />

                <LargeMenuItem
                    component="a"
                    href="https://join.slack.com/t/lightdash-community/shared_invite/zt-2wgtavou8-VRhwXI%7EQbjCAHQs0WBac3w"
                    target="_blank"
                    title={t('joinSlackCommunity', 'Join Slack community')}
                    description={t(
                        'joinSlackCommunityDescription',
                        'Get advice share best practices with other users.',
                    )}
                    icon={IconUsers}
                />

                <LargeMenuItem
                    component="a"
                    href="https://github.com/lightdash/lightdash/issues/new/choose"
                    target="_blank"
                    title={t('feedbackOnLightdash', 'Feedback on Lightdash')}
                    description={t(
                        'feedbackOnLightdashDescription',
                        'Submit a feature request or bug report to improve Lightdash.',
                    )}
                    icon={IconMessageCircle2}
                />
                {(isCloudCustomer || isDevelopment) && (
                    <LargeMenuItem
                        component="a"
                        onClick={() => {
                            modals.open({
                                id: 'support-drawer',
                                title: t(
                                    'shareWithSupport',
                                    'Share with Lightdash Support',
                                ),
                                size: 'lg',
                                children: <SupportDrawerContent />,
                                yOffset: 100,
                                zIndex: 1000,
                            });
                        }}
                        title={t(
                            'reportIssueToSupport',
                            'Report an issue to Lightdash Support',
                        )}
                        description={t(
                            'reportIssueToSupportDescription',
                            'Share a detailed issue report with Lightdash Support',
                        )}
                        icon={IconSos}
                    />
                )}
            </Menu.Dropdown>
        </Menu>
    );
};

export default HelpMenu;
