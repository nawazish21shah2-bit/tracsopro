import { NavigationProp, ParamListBase } from '@react-navigation/native';

export type TabResetConfig = {
  tabName: string;
  rootScreen: string;
};

export type SupportHubMode = 'mine' | 'inbox' | 'platform';
export type SupportHubVariant = 'admin' | 'superAdmin' | 'client' | 'guard';

type NestedNavTarget = {
  screen: string;
  params?: Record<string, unknown>;
};

function defaultSupportMode(variant: SupportHubVariant): SupportHubMode {
  if (variant === 'superAdmin') return 'platform';
  if (variant === 'admin') return 'inbox';
  return 'mine';
}

function getSettingsSupportHubTarget(
  tabsScreen: string,
  settingsRoot: string,
  variant: SupportHubVariant,
  mode: SupportHubMode,
): NestedNavTarget {
  return {
    screen: tabsScreen,
    params: {
      screen: 'Settings',
      params: {
        screen: 'SupportHubScreen',
        params: { variant, mode },
      },
    },
  };
}

function getSettingsSupportTicketTarget(
  tabsScreen: string,
  variant: SupportHubVariant,
  ticketId: string,
  mode?: SupportHubMode,
): NestedNavTarget {
  const resolvedMode = mode ?? defaultSupportMode(variant);
  return {
    screen: tabsScreen,
    params: {
      screen: 'Settings',
      params: {
        screen: 'SupportTicketDetailScreen',
        params: { ticketId, variant, mode: resolvedMode },
      },
    },
  };
}

/** When a tab with a nested stack is pressed again, return to its root screen. */
export function createTabResetListener({ tabName, rootScreen }: TabResetConfig) {
  return ({ navigation }: { navigation: NavigationProp<ParamListBase> }) => ({
    tabPress: () => {
      const state = navigation.getState();
      const tabRoute = state.routes.find((route) => route.name === tabName);
      const nestedIndex = tabRoute?.state?.index ?? 0;

      if (nestedIndex > 0) {
        navigation.navigate(tabName as never, { screen: rootScreen } as never);
      }
    },
  });
}

export function navigateToAdminSettingsTab(navigation: NavigationProp<ParamListBase>): void {
  navigation.navigate(
    'AdminTabs' as never,
    {
      screen: 'Settings',
      params: { screen: 'AdminSettings' },
    } as never,
  );
}

export function navigateToSupportHub(
  navigation: NavigationProp<ParamListBase>,
  variant: SupportHubVariant,
  mode?: SupportHubMode,
): void {
  const resolvedMode = mode ?? defaultSupportMode(variant);
  let target: NestedNavTarget;

  switch (variant) {
    case 'admin':
      target = getSettingsSupportHubTarget('AdminTabs', 'AdminSettings', 'admin', resolvedMode);
      break;
    case 'superAdmin':
      target = getSettingsSupportHubTarget('SuperAdminTabs', 'SystemSettings', 'superAdmin', resolvedMode);
      break;
    case 'client':
      target = getSettingsSupportHubTarget('ClientTabs', 'ClientSettingsHome', 'client', resolvedMode);
      break;
    case 'guard':
      target = getSettingsSupportHubTarget('GuardTabs', 'GuardSettings', 'guard', resolvedMode);
      break;
    default:
      return;
  }

  navigation.navigate(target.screen as never, target.params as never);
}

export function navigateToSupportTicket(
  navigation: NavigationProp<ParamListBase>,
  ticketId: string,
  variant: SupportHubVariant,
  mode?: SupportHubMode,
): void {
  let target: NestedNavTarget;

  switch (variant) {
    case 'admin':
      target = getSettingsSupportTicketTarget('AdminTabs', 'admin', ticketId, mode);
      break;
    case 'superAdmin':
      target = getSettingsSupportTicketTarget('SuperAdminTabs', 'superAdmin', ticketId, mode);
      break;
    case 'client':
      target = getSettingsSupportTicketTarget('ClientTabs', 'client', ticketId, mode);
      break;
    case 'guard':
      target = getSettingsSupportTicketTarget('GuardTabs', 'guard', ticketId, mode);
      break;
    default:
      return;
  }

  navigation.navigate(target.screen as never, target.params as never);
}

export function roleToSupportVariant(role: string | undefined): SupportHubVariant | null {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'SUPER_ADMIN':
      return 'superAdmin';
    case 'CLIENT':
      return 'client';
    case 'GUARD':
      return 'guard';
    default:
      return null;
  }
}

export function navigateToSupportHubForRole(
  navigation: NavigationProp<ParamListBase>,
  role: string | undefined,
): void {
  const variant = roleToSupportVariant(role);
  if (!variant) return;
  navigateToSupportHub(navigation, variant);
}

export function navigateToSupportTicketForRole(
  navigation: NavigationProp<ParamListBase>,
  ticketId: string,
  role: string | undefined,
): void {
  const variant = roleToSupportVariant(role);
  if (!variant) return;
  navigateToSupportTicket(navigation, ticketId, variant);
}

export function navigateToAdminSupportHub(
  navigation: NavigationProp<ParamListBase>,
  mode: 'inbox' | 'platform' = 'inbox',
): void {
  navigateToSupportHub(navigation, 'admin', mode);
}

export function navigateToClientSettingsTab(navigation: NavigationProp<ParamListBase>): void {
  navigation.navigate(
    'ClientTabs' as never,
    {
      screen: 'Settings',
      params: { screen: 'ClientSettingsHome' },
    } as never,
  );
}

export function navigateToGuardSettingsTab(navigation: NavigationProp<ParamListBase>): void {
  navigation.navigate(
    'GuardTabs' as never,
    {
      screen: 'Settings',
      params: { screen: 'GuardSettings' },
    } as never,
  );
}

export function navigateToSuperAdminSettingsTab(navigation: NavigationProp<ParamListBase>): void {
  navigation.navigate(
    'SuperAdminTabs' as never,
    {
      screen: 'Settings',
      params: { screen: 'SystemSettings' },
    } as never,
  );
}
