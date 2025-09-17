// apps/frontend/src/utils/permissions.ts

export interface UserPermissions {
  canAccessDashboard: boolean;
  canAccessAssets: boolean;
  canAccessUsers: boolean;
  canAccessSettings: boolean;
  canAccessTickets: boolean;
  canAccessAllSchools: boolean;
}

export const getPermissionsByRole = (role: string): UserPermissions => {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        canAccessDashboard: true,
        canAccessAssets: true,
        canAccessUsers: true,
        canAccessSettings: true,
        canAccessTickets: true,
        canAccessAllSchools: true,
      };

    case 'ADMIN':
      return {
        canAccessDashboard: true,
        canAccessAssets: true,
        canAccessUsers: false,
        canAccessSettings: false,
        canAccessTickets: true,
        canAccessAllSchools: true,
      };

    case 'GESTOR_ESCOLAR':
      return {
        canAccessDashboard: true,
        canAccessAssets: true,
        canAccessUsers: false,
        canAccessSettings: false,
        canAccessTickets: true,
        canAccessAllSchools: false,
      };

    case 'SOLICITANTE':
      return {
        canAccessDashboard: false,
        canAccessAssets: false,
        canAccessUsers: false,
        canAccessSettings: false,
        canAccessTickets: true,
        canAccessAllSchools: false,
      };

    default:
      return {
        canAccessDashboard: false,
        canAccessAssets: false,
        canAccessUsers: false,
        canAccessSettings: false,
        canAccessTickets: false,
        canAccessAllSchools: false,
      };
  }
};

export const getMenuItemsByRole = (role: string) => {
  const permissions = getPermissionsByRole(role);
  const menuItems = [];

  if (permissions.canAccessDashboard) {
    menuItems.push({
      label: 'Dashboard',
      href: '/',
      icon: 'Home'
    });
  }

  if (permissions.canAccessAssets) {
    menuItems.push({
      label: 'Gestão de Ativos',
      href: '/admin/ativos',
      icon: 'Package'
    });
  }

  if (permissions.canAccessAllSchools) {
    menuItems.push({
      label: 'Gestão de Escolas',
      href: '/admin/escolas',
      icon: 'Building'
    });
  }

  if (permissions.canAccessTickets) {
    menuItems.push({
      label: 'Chamados',
      href: '/chamados',
      icon: 'Headphones'
    });
  }

  if (permissions.canAccessUsers) {
    menuItems.push({
      label: 'Usuários',
      href: '/admin/usuarios',
      icon: 'Users'
    });
  }

  if (permissions.canAccessSettings) {
    menuItems.push({
      label: 'Configurações',
      href: '/configuracoes',
      icon: 'Settings'
    });
  }

  return menuItems;
};