import { subject } from '@casl/ability';
import { CommercialFeatureFlags, FeatureFlags } from '@lightdash/common';
import { Box, ScrollArea, Stack, Text, Title } from '@mantine/core';
import {
    IconBrain,
    IconBrowser,
    IconBuildingSkyscraper,
    IconCalendarStats,
    IconChecklist,
    IconDatabase,
    IconDatabaseCog,
    IconDatabaseExport,
    IconHistory,
    IconIdBadge2,
    IconKey,
    IconLock,
    IconPalette,
    IconPlug,
    IconRefresh,
    IconReportAnalytics,
    IconTableOptions,
    IconTopologyRing2,
    IconUserCircle,
    IconUserCode,
    IconUserPlus,
    IconUserShield,
    IconUsers,
    IconVariable,
} from '@tabler/icons-react';
import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Navigate,
    matchPath,
    useLocation,
    useRoutes,
    type RouteObject,
} from 'react-router';
import PageSpinner from '../components/PageSpinner';
import AccessTokensPanel from '../components/UserSettings/AccessTokensPanel';
import AllowedDomainsPanel from '../components/UserSettings/AllowedDomainsPanel';
import AppearanceSettingsPanel from '../components/UserSettings/AppearanceSettingsPanel';
import DefaultProjectPanel from '../components/UserSettings/DefaultProjectPanel';
import { DeleteOrganizationPanel } from '../components/UserSettings/DeleteOrganizationPanel';
import GithubSettingsPanel from '../components/UserSettings/GithubSettingsPanel';
import GitlabSettingsPanel from '../components/UserSettings/GitlabSettingsPanel';
import { MyWarehouseConnectionsPanel } from '../components/UserSettings/MyWarehouseConnectionsPanel';
import OrganizationPanel from '../components/UserSettings/OrganizationPanel';
import { OrganizationWarehouseCredentialsPanel } from '../components/UserSettings/OrganizationWarehouseCredentialsPanel';
import PasswordPanel from '../components/UserSettings/PasswordPanel';
import ProfilePanel from '../components/UserSettings/ProfilePanel';
import ProjectManagementPanel from '../components/UserSettings/ProjectManagementPanel';
import SlackSettingsPanel from '../components/UserSettings/SlackSettingsPanel';
import SocialLoginsPanel from '../components/UserSettings/SocialLoginsPanel';
import UserAttributesPanel from '../components/UserSettings/UserAttributesPanel';
import UsersAndGroupsPanel from '../components/UserSettings/UsersAndGroupsPanel';
import ErrorState from '../components/common/ErrorState';
import MantineIcon from '../components/common/MantineIcon';
import Page from '../components/common/Page/Page';
import PageBreadcrumbs from '../components/common/PageBreadcrumbs';
import RouterNavLink from '../components/common/RouterNavLink';
import { SettingsGridCard } from '../components/common/Settings/SettingsCard';
import { useAiOrganizationSettings } from '../ee/features/aiCopilot/hooks/useAiOrganizationSettings';
import ScimAccessTokensPanel from '../ee/features/scim/components/ScimAccessTokensPanel';
import { ServiceAccountsPage } from '../ee/features/serviceAccounts';
import { CustomRoleCreate } from '../ee/pages/customRoles/CustomRoleCreate';
import { CustomRoleEdit } from '../ee/pages/customRoles/CustomRoleEdit';
import { CustomRoles } from '../ee/pages/customRoles/CustomRoles';
import { useOrganization } from '../hooks/organization/useOrganization';
import { useActiveProjectUuid } from '../hooks/useActiveProject';
import {
    useFeatureFlag,
    useFeatureFlagEnabled,
} from '../hooks/useFeatureFlagEnabled';
import { useProject } from '../hooks/useProject';
import { Can } from '../providers/Ability';
import useApp from '../providers/App/useApp';
import { TrackPage } from '../providers/Tracking/TrackingProvider';
import useTracking from '../providers/Tracking/useTracking';
import { EventName, PageName } from '../types/Events';
import ProjectSettings from './ProjectSettings';

const Settings: FC = () => {
    const { data: embeddingEnabled } = useFeatureFlag(
        CommercialFeatureFlags.Embedding,
    );

    const { data: isScimTokenManagementEnabled } = useFeatureFlag(
        CommercialFeatureFlags.Scim,
    );

    const aiOrganizationSettingsQuery = useAiOrganizationSettings();
    const isAiCopilotEnabledOrTrial =
        (aiOrganizationSettingsQuery.isSuccess &&
            aiOrganizationSettingsQuery.data?.isCopilotEnabled) ||
        aiOrganizationSettingsQuery.data?.isTrial;

    const isServiceAccountFeatureFlagEnabled = useFeatureFlagEnabled(
        CommercialFeatureFlags.ServiceAccounts,
    );

    const {
        health: {
            data: health,
            isInitialLoading: isHealthLoading,
            error: healthError,
        },
        user: { data: user, isInitialLoading: isUserLoading, error: userError },
    } = useApp();

    const { t } = useTranslation('settings');

    const isCustomRolesEnabled = health?.isCustomRolesEnabled;

    const userGroupsFeatureFlagQuery = useFeatureFlag(
        FeatureFlags.UserGroupsEnabled,
    );

    const { track } = useTracking();
    const {
        data: organization,
        isInitialLoading: isOrganizationLoading,
        error: organizationError,
    } = useOrganization();
    const { activeProjectUuid, isLoading: isActiveProjectUuidLoading } =
        useActiveProjectUuid();
    const {
        data: project,
        isInitialLoading: isProjectLoading,
        error: projectError,
    } = useProject(activeProjectUuid);

    const allowPasswordAuthentication =
        !health?.auth.disablePasswordAuthentication;

    const hasSocialLogin =
        health?.auth.google.enabled ||
        health?.auth.okta.enabled ||
        health?.auth.oneLogin.enabled ||
        health?.auth.azuread.enabled ||
        health?.auth.oidc.enabled;

    if (userGroupsFeatureFlagQuery.isError) {
        console.error(userGroupsFeatureFlagQuery.error);
        throw new Error('Error fetching user groups feature flag');
    }

    const isGroupManagementEnabled =
        userGroupsFeatureFlagQuery.isSuccess &&
        userGroupsFeatureFlagQuery.data.enabled;

    // This allows us to enable service accounts in the UI for on-premise installations
    const isServiceAccountsEnabled =
        health?.isServiceAccountEnabled || isServiceAccountFeatureFlagEnabled;

    const isWarehouseCredentialsFeatureFlagEnabled = useFeatureFlagEnabled(
        CommercialFeatureFlags.OrganizationWarehouseCredentials,
    );

    // This allows us to enable organization warehouse credentials in the UI for on-premise installations
    const isWarehouseCredentialsEnabled =
        (health?.isOrganizationWarehouseCredentialsEnabled ?? false) ||
        isWarehouseCredentialsFeatureFlagEnabled;

    const passwordNavLabel = hasSocialLogin
        ? t('sidebar.passwordAndSocialLogins', 'Password & Social Logins')
        : t('sidebar.password', 'Password');
    const generalTitle = t('sidebar.general', 'General');
    const profileNavLabel = t('sidebar.profile', 'Profile');
    const warehouseNavLabel = t(
        'sidebar.warehouseConnections',
        'My warehouse connections',
    );
    const personalAccessTokensLabel = t(
        'sidebar.personalAccessTokens',
        'Personal access tokens',
    );
    const customRolesLabel = t('sidebar.customRoles', 'Custom roles');
    const usersAndGroupsLabel = t('sidebar.usersAndGroups', 'Users & groups');
    const userManagementLabel = t('sidebar.userManagement', 'User management');
    const userGroupAttributesLabel = t(
        'sidebar.userGroupAttributes',
        'User & group attributes',
    );
    const userAttributesLabel = t('sidebar.userAttributes', 'User attributes');
    const appearanceLabel = t('sidebar.appearance', 'Appearance');
    const integrationsLabel = t('sidebar.integrations', 'Integrations');
    const warehouseCredentialsLabel = t(
        'sidebar.warehouseCredentials',
        'Warehouse credentials',
    );
    const allProjectsLabel = t('sidebar.allProjects', 'All projects');
    const scimLabel = t('sidebar.scimAccessTokens', 'SCIM Access Tokens');
    const serviceAccountsLabel = t(
        'sidebar.serviceAccounts',
        'Service Accounts',
    );
    const aiAgentsLabel = t('sidebar.aiAgents', 'AI Agents');
    const connectionSettingsLabel = t(
        'sidebar.connectionSettings',
        'Connection settings',
    );
    const metricFlowLabel = t('sidebar.metricFlow', 'MetricFlow');
    const tablesConfigurationLabel = t(
        'sidebar.tablesConfiguration',
        'Tables configuration',
    );
    const changesetsLabel = t('sidebar.changesets', 'Changesets');
    const compilationHistoryLabel = t(
        'sidebar.compilationHistory',
        'Compilation history',
    );
    const parametersLabel = t('sidebar.parameters', 'Parameters');
    const projectAccessLabel = t('sidebar.projectAccess', 'Project access');
    const usageAnalyticsLabel = t('sidebar.usageAnalytics', 'Usage analytics');
    const syncsScheduledDeliveriesLabel = t(
        'sidebar.syncsScheduledDeliveries',
        'Syncs & Scheduled deliveries',
    );
    const embedConfigurationLabel = t(
        'sidebar.embedConfiguration',
        'Embed configuration',
    );
    const validatorLabel = t('sidebar.validator', 'Validator');
    const dataOpsLabel = t('sidebar.dataOps', 'Data ops');
    const noIntegrationsText = t(
        'sidebar.noIntegrations',
        'No integrations available',
    );
    const allowedDomainsTitle = t(
        'sidebar.allowedEmailDomains',
        'Allowed email domains',
    );
    const allowedDomainsDescription = t(
        'sidebar.allowedEmailDomainsDescription',
        'Anyone with email addresses at these domains can automatically join the organization.',
    );
    const defaultProjectTitle = t('sidebar.defaultProject', 'Default Project');
    const defaultProjectDescription = t(
        'sidebar.defaultProjectDescription',
        'This is the project users will see when they log in for the first time or from a new device. If a user does not have access, they will see their next accessible project.',
    );
    const dangerZoneTitle = t('sidebar.dangerZone', 'Danger zone');
    const dangerZoneDescription = t(
        'sidebar.dangerZoneDescription',
        'This action deletes the whole workspace and all its content, including users. This action is not reversible.',
    );
    const yourSettingsTitle = t('sidebar.yourSettings', 'Your settings');
    const organizationSettingsTitle = t(
        'sidebar.organizationSettings',
        'Organization settings',
    );

    const routes = useMemo<RouteObject[]>(() => {
        const allowedRoutes: RouteObject[] = [
            {
                index: true,
                element: <Navigate to="profile" replace />,
            },
            {
                path: 'appearance',
                element: <AppearanceSettingsPanel />,
            },
            {
                path: 'profile',
                element: (
                    <SettingsGridCard>
                        <Title order={4}>
                            {t('routes.profileTitle', 'Profile settings')}
                        </Title>
                        <ProfilePanel />
                    </SettingsGridCard>
                ),
            },
            {
                path: '*',
                element: <Navigate to="profile" />,
            },
        ];

        if (allowPasswordAuthentication) {
            allowedRoutes.push({
                path: 'password',
                element: (
                    <Stack spacing="xl">
                        <SettingsGridCard>
                            <Title order={4}>
                                {t('routes.passwordTitle', 'Password settings')}
                            </Title>
                            <PasswordPanel />
                        </SettingsGridCard>

                        {hasSocialLogin && (
                            <SettingsGridCard>
                                <Title order={4}>
                                    {t(
                                        'routes.socialLoginsTitle',
                                        'Social logins',
                                    )}
                                </Title>
                                <SocialLoginsPanel />
                            </SettingsGridCard>
                        )}
                    </Stack>
                ),
            });
        }
        allowedRoutes.push({
            path: 'myWarehouseConnections',
            element: (
                <Stack spacing="xl">
                    <MyWarehouseConnectionsPanel />
                </Stack>
            ),
        });
        if (user?.ability.can('manage', 'PersonalAccessToken')) {
            allowedRoutes.push({
                path: 'organization',
                element: (
                    <Stack spacing="xl">
                        <SettingsGridCard>
                            <Title order={4}>{generalTitle}</Title>
                            <OrganizationPanel />
                        </SettingsGridCard>

                        <SettingsGridCard>
                            <div>
                                <Title order={4}>{allowedDomainsTitle}</Title>
                                <Text c="ldGray.6" fz="xs">
                                    {allowedDomainsDescription}
                                </Text>
                            </div>
                            <AllowedDomainsPanel />
                        </SettingsGridCard>

                        <SettingsGridCard>
                            <div>
                                <Title order={4}>{defaultProjectTitle}</Title>
                                <Text c="ldGray.6" fz="xs">
                                    {defaultProjectDescription}
                                </Text>
                            </div>
                            <DefaultProjectPanel />
                        </SettingsGridCard>

                        {user.ability?.can('delete', 'Organization') && (
                            <SettingsGridCard>
                                <div>
                                    <Title order={4}>{dangerZoneTitle}</Title>
                                    <Text c="ldGray.6" fz="xs">
                                        {dangerZoneDescription}
                                    </Text>
                                </div>
                                <DeleteOrganizationPanel />
                            </SettingsGridCard>
                        )}
                    </Stack>
                ),
            });
        }
        if (
            user?.ability.can(
                'manage',
                subject('OrganizationMemberProfile', {
                    organizationUuid: organization?.organizationUuid,
                }),
            )
        ) {
            allowedRoutes.push({
                path: 'userManagement',
                element: <UsersAndGroupsPanel />,
            });
        }

        if (
            user?.ability.can(
                'manage',
                subject('Organization', {
                    organizationUuid: organization?.organizationUuid,
                }),
            )
        ) {
            allowedRoutes.push({
                path: 'userAttributes',
                element: <UserAttributesPanel />,
            });
        }
        if (
            user?.ability.can(
                'manage',
                subject('OrganizationWarehouseCredentials', {
                    organizationUuid: organization?.organizationUuid,
                }),
            )
        ) {
            allowedRoutes.push({
                path: 'warehouseCredentials',
                element: <OrganizationWarehouseCredentialsPanel />,
            });
        }
        if (
            organization &&
            !organization.needsProject &&
            user?.ability.can('view', 'Project')
        ) {
            allowedRoutes.push({
                path: 'projectManagement',
                element: <ProjectManagementPanel />,
            });
        }

        if (
            project &&
            organization &&
            !organization.needsProject &&
            user?.ability.can(
                'update',
                subject('Project', {
                    organizationUuid: organization.organizationUuid,
                    projectUuid: project.projectUuid,
                }),
            )
        ) {
            allowedRoutes.push({
                path: 'projectManagement/:projectUuid/*',
                element: (
                    <TrackPage name={PageName.PROJECT_SETTINGS}>
                        <ProjectSettings />
                    </TrackPage>
                ),
            });
        }
        if (user?.ability.can('manage', 'PersonalAccessToken')) {
            allowedRoutes.push({
                path: 'personalAccessTokens',
                element: <AccessTokensPanel />,
            });
        }

        if (user?.ability.can('manage', 'Organization')) {
            allowedRoutes.push({
                path: 'integrations',
                element: (
                    <Stack>
                        <Title order={4}>{integrationsLabel}</Title>
                        {!health?.hasSlack &&
                            !health?.hasGithub &&
                            !health?.hasGitlab &&
                            noIntegrationsText}
                        {health?.hasSlack && <SlackSettingsPanel />}
                        {health?.hasGithub && <GithubSettingsPanel />}
                        {health?.hasGitlab && <GitlabSettingsPanel />}
                    </Stack>
                ),
            });
        }

        // Commercial route
        if (
            user?.ability.can('manage', 'Organization') &&
            isScimTokenManagementEnabled?.enabled
        ) {
            allowedRoutes.push({
                path: 'scimAccessTokens',
                element: <ScimAccessTokensPanel />,
            });
        }

        if (
            user?.ability.can('manage', 'Organization') &&
            isServiceAccountsEnabled
        ) {
            allowedRoutes.push({
                path: 'serviceAccounts',
                element: <ServiceAccountsPage />,
            });
        }

        if (
            user?.ability.can('manage', 'Organization') &&
            isCustomRolesEnabled
        ) {
            allowedRoutes.push({
                path: 'customRoles',
                element: <CustomRoles />,
            });
            allowedRoutes.push({
                path: 'customRoles/create',
                element: <CustomRoleCreate />,
            });
            allowedRoutes.push({
                path: 'customRoles/:roleId',
                element: <CustomRoleEdit />,
            });
        }

        return allowedRoutes;
    }, [
        isServiceAccountsEnabled,
        isScimTokenManagementEnabled?.enabled,
        allowPasswordAuthentication,
        hasSocialLogin,
        user,
        organization,
        project,
        health,
        isCustomRolesEnabled,
        generalTitle,
        allowedDomainsTitle,
        allowedDomainsDescription,
        defaultProjectTitle,
        defaultProjectDescription,
        dangerZoneTitle,
        dangerZoneDescription,
        integrationsLabel,
        noIntegrationsText,
        t,
    ]);
    const routeElements = useRoutes(routes);

    const location = useLocation();
    const isFixedContent = useMemo(() => {
        return (
            !matchPath(
                {
                    path: '/generalSettings/projectManagement/:projectUuid/changesets',
                },
                location.pathname,
            ) &&
            !matchPath(
                {
                    path: '/generalSettings/projectManagement/:projectUuid/scheduledDeliveries',
                },
                location.pathname,
            ) &&
            !matchPath(
                {
                    path: '/generalSettings/projectManagement/:projectUuid/compilationHistory',
                },
                location.pathname,
            )
        );
    }, [location.pathname]);

    if (
        isHealthLoading ||
        isUserLoading ||
        isOrganizationLoading ||
        isActiveProjectUuidLoading ||
        isProjectLoading
    ) {
        return <PageSpinner />;
    }

    if (userError || healthError || organizationError || projectError) {
        return (
            <ErrorState
                error={
                    userError?.error ||
                    healthError?.error ||
                    organizationError?.error ||
                    projectError?.error
                }
            />
        );
    }

    if (!health || !user || !organization) return <PageSpinner />;

    const pageTitle = t('page.title', 'Settings');
    const breadcrumbTitle = t('breadcrumbs.settings', 'Settings');

    return (
        <Page
            withFullHeight
            withSidebarFooter
            withFixedContent={isFixedContent}
            withPaddedContent
            title={pageTitle}
            sidebar={
                <Stack sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <PageBreadcrumbs
                        items={[{ title: breadcrumbTitle, active: true }]}
                    />
                    <ScrollArea
                        variant="primary"
                        offsetScrollbars
                        scrollbarSize={8}
                    >
                        <Stack spacing="lg">
                            <Box>
                                <Title order={6} fw={600} mb="xs">
                                    {yourSettingsTitle}
                                </Title>

                                <RouterNavLink
                                    exact
                                    to="/generalSettings"
                                    label={profileNavLabel}
                                    icon={<MantineIcon icon={IconUserCircle} />}
                                />

                                {allowPasswordAuthentication && (
                                    <RouterNavLink
                                        label={passwordNavLabel}
                                        exact
                                        to="/generalSettings/password"
                                        icon={<MantineIcon icon={IconLock} />}
                                    />
                                )}

                                <RouterNavLink
                                    label={warehouseNavLabel}
                                    exact
                                    to="/generalSettings/myWarehouseConnections"
                                    icon={
                                        <MantineIcon icon={IconDatabaseCog} />
                                    }
                                />
                                {user.ability.can(
                                    'manage',
                                    'PersonalAccessToken',
                                ) && (
                                    <RouterNavLink
                                        label={personalAccessTokensLabel}
                                        exact
                                        to="/generalSettings/personalAccessTokens"
                                        icon={<MantineIcon icon={IconKey} />}
                                    />
                                )}
                            </Box>

                            <Box>
                                <Title order={6} fw={600} mb="xs">
                                    {organizationSettingsTitle}
                                </Title>

                                {user.ability.can('manage', 'Organization') && (
                                    <RouterNavLink
                                        label={generalTitle}
                                        to="/generalSettings/organization"
                                        exact
                                        icon={
                                            <MantineIcon
                                                icon={IconBuildingSkyscraper}
                                            />
                                        }
                                    />
                                )}
                                {isCustomRolesEnabled && (
                                    <Can I="manage" a="Organization">
                                        <RouterNavLink
                                            label={customRolesLabel}
                                            to="/generalSettings/customRoles"
                                            exact
                                            icon={
                                                <MantineIcon
                                                    icon={IconIdBadge2}
                                                />
                                            }
                                        />
                                    </Can>
                                )}

                                {user.ability.can(
                                    'update',
                                    'OrganizationMemberProfile',
                                ) && (
                                    <RouterNavLink
                                        label={
                                            isGroupManagementEnabled
                                                ? usersAndGroupsLabel
                                                : userManagementLabel
                                        }
                                        to="/generalSettings/userManagement"
                                        exact
                                        icon={
                                            <MantineIcon icon={IconUserPlus} />
                                        }
                                    />
                                )}
                                {user.ability.can(
                                    'manage',
                                    subject('Organization', {
                                        organizationUuid:
                                            organization.organizationUuid,
                                    }),
                                ) && (
                                    <RouterNavLink
                                        label={
                                            isGroupManagementEnabled
                                                ? userGroupAttributesLabel
                                                : userAttributesLabel
                                        }
                                        to="/generalSettings/userAttributes"
                                        exact
                                        icon={
                                            <MantineIcon
                                                icon={IconUserShield}
                                            />
                                        }
                                    />
                                )}

                                {user.ability.can('update', 'Organization') && (
                                    <RouterNavLink
                                        label={appearanceLabel}
                                        exact
                                        to="/generalSettings/appearance"
                                        icon={
                                            <MantineIcon icon={IconPalette} />
                                        }
                                    />
                                )}

                                {user.ability.can('manage', 'Organization') && (
                                    <RouterNavLink
                                        label={integrationsLabel}
                                        exact
                                        to="/generalSettings/integrations"
                                        icon={<MantineIcon icon={IconPlug} />}
                                    />
                                )}

                                {user.ability.can(
                                    'manage',
                                    subject(
                                        'OrganizationWarehouseCredentials',
                                        {
                                            organizationUuid:
                                                organization?.organizationUuid,
                                        },
                                    ),
                                ) &&
                                    isWarehouseCredentialsEnabled && (
                                        <RouterNavLink
                                            label={warehouseCredentialsLabel}
                                            exact
                                            to="/generalSettings/warehouseCredentials"
                                            icon={
                                                <MantineIcon
                                                    icon={IconDatabaseCog}
                                                />
                                            }
                                        />
                                    )}

                                {organization &&
                                    !organization.needsProject &&
                                    user.ability.can('view', 'Project') && (
                                        <RouterNavLink
                                            label={allProjectsLabel}
                                            to="/generalSettings/projectManagement"
                                            exact
                                            icon={
                                                <MantineIcon
                                                    icon={IconDatabase}
                                                />
                                            }
                                        />
                                    )}

                                {user.ability.can('manage', 'Organization') &&
                                    isScimTokenManagementEnabled?.enabled && (
                                        <RouterNavLink
                                            label={scimLabel}
                                            exact
                                            to="/generalSettings/scimAccessTokens"
                                            icon={
                                                <MantineIcon icon={IconKey} />
                                            }
                                        />
                                    )}
                                {user.ability.can('manage', 'Organization') &&
                                    isServiceAccountsEnabled && (
                                        <RouterNavLink
                                            label={serviceAccountsLabel}
                                            exact
                                            to="/generalSettings/serviceAccounts"
                                            icon={
                                                <MantineIcon
                                                    icon={IconUserCode}
                                                />
                                            }
                                        />
                                    )}
                                {isAiCopilotEnabledOrTrial &&
                                    user.ability.can(
                                        'manage',
                                        subject('AiAgent', {
                                            organizationUuid:
                                                organization.organizationUuid,
                                        }),
                                    ) && (
                                        <RouterNavLink
                                            label={aiAgentsLabel}
                                            exact
                                            to="/ai-agents/admin"
                                            icon={
                                                <MantineIcon icon={IconBrain} />
                                            }
                                        />
                                    )}
                            </Box>

                            {organization &&
                            !organization.needsProject &&
                            project &&
                            user.ability.can(
                                'update',
                                subject('Project', {
                                    organizationUuid:
                                        organization.organizationUuid,
                                    projectUuid: project.projectUuid,
                                }),
                            ) ? (
                                <Box>
                                    <Title order={6} fw={600} mb="xs">
                                        {t(
                                            'sidebar.currentProject',
                                            'Current project ({{projectName}})',
                                            {
                                                projectName:
                                                    project?.name ?? '',
                                            },
                                        )}
                                    </Title>

                                    <RouterNavLink
                                        label={connectionSettingsLabel}
                                        exact
                                        to={`/generalSettings/projectManagement/${project.projectUuid}/settings`}
                                        icon={
                                            <MantineIcon
                                                icon={IconDatabaseCog}
                                            />
                                        }
                                    />

                                    <RouterNavLink
                                        label={metricFlowLabel}
                                        exact
                                        to={`/generalSettings/projectManagement/${project.projectUuid}/metricflow`}
                                        icon={
                                            <MantineIcon
                                                icon={IconTopologyRing2}
                                            />
                                        }
                                    />

                                    <RouterNavLink
                                        label={tablesConfigurationLabel}
                                        exact
                                        to={`/generalSettings/projectManagement/${project.projectUuid}/tablesConfiguration`}
                                        icon={
                                            <MantineIcon
                                                icon={IconTableOptions}
                                            />
                                        }
                                    />

                                    <RouterNavLink
                                        label={changesetsLabel}
                                        exact
                                        to={`/generalSettings/projectManagement/${project.projectUuid}/changesets`}
                                        icon={
                                            <MantineIcon icon={IconHistory} />
                                        }
                                    />

                                    <RouterNavLink
                                        label={compilationHistoryLabel}
                                        exact
                                        to={`/generalSettings/projectManagement/${project.projectUuid}/compilationHistory`}
                                        icon={
                                            <MantineIcon icon={IconRefresh} />
                                        }
                                    />

                                    <RouterNavLink
                                        label={parametersLabel}
                                        exact
                                        to={`/generalSettings/projectManagement/${project.projectUuid}/parameters`}
                                        icon={
                                            <MantineIcon icon={IconVariable} />
                                        }
                                    />

                                    <Can
                                        I="manage"
                                        this={subject('Project', {
                                            organizationUuid:
                                                organization.organizationUuid,
                                            projectUuid: project.projectUuid,
                                        })}
                                    >
                                        <RouterNavLink
                                            label={projectAccessLabel}
                                            exact
                                            to={`/generalSettings/projectManagement/${project.projectUuid}/projectAccess`}
                                            icon={
                                                <MantineIcon icon={IconUsers} />
                                            }
                                        />
                                    </Can>

                                    {user.ability.can(
                                        'view',
                                        subject('Analytics', {
                                            organizationUuid:
                                                organization.organizationUuid,
                                            projectUuid: project.projectUuid,
                                        }),
                                    ) ? (
                                        <RouterNavLink
                                            label={usageAnalyticsLabel}
                                            exact
                                            to={`/generalSettings/projectManagement/${project.projectUuid}/usageAnalytics`}
                                            onClick={() => {
                                                track({
                                                    name: EventName.USAGE_ANALYTICS_CLICKED,
                                                });
                                            }}
                                            icon={
                                                <MantineIcon
                                                    icon={IconReportAnalytics}
                                                />
                                            }
                                        />
                                    ) : null}

                                    <RouterNavLink
                                        label={syncsScheduledDeliveriesLabel}
                                        exact
                                        to={`/generalSettings/projectManagement/${project.projectUuid}/scheduledDeliveries`}
                                        icon={
                                            <MantineIcon
                                                icon={IconCalendarStats}
                                            />
                                        }
                                    />

                                    {user.ability?.can(
                                        'update',
                                        subject('Project', {
                                            organizationUuid:
                                                project.organizationUuid,
                                            projectUuid: project.projectUuid,
                                        }),
                                    ) && embeddingEnabled?.enabled ? (
                                        <RouterNavLink
                                            label={embedConfigurationLabel}
                                            exact
                                            to={`/generalSettings/projectManagement/${project.projectUuid}/embed`}
                                            icon={
                                                <MantineIcon
                                                    icon={IconBrowser}
                                                />
                                            }
                                        />
                                    ) : null}

                                    {user.ability?.can(
                                        'manage',
                                        subject('Validation', {
                                            organizationUuid:
                                                project.organizationUuid,
                                            projectUuid: project.projectUuid,
                                        }),
                                    ) ? (
                                        <RouterNavLink
                                            label={validatorLabel}
                                            exact
                                            to={`/generalSettings/projectManagement/${project.projectUuid}/validator`}
                                            icon={
                                                <MantineIcon
                                                    icon={IconChecklist}
                                                />
                                            }
                                        />
                                    ) : null}

                                    {user.ability?.can(
                                        'promote',
                                        subject('SavedChart', {
                                            organizationUuid:
                                                project.organizationUuid,
                                            projectUuid: project.projectUuid,
                                        }),
                                    ) ? (
                                        <RouterNavLink
                                            label={dataOpsLabel}
                                            exact
                                            to={`/generalSettings/projectManagement/${project.projectUuid}/dataOps`}
                                            icon={
                                                <MantineIcon
                                                    icon={IconDatabaseExport}
                                                />
                                            }
                                        />
                                    ) : null}
                                </Box>
                            ) : null}
                        </Stack>
                    </ScrollArea>
                </Stack>
            }
        >
            {routeElements}
        </Page>
    );
};

export default Settings;
