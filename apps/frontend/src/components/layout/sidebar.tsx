// src/components/layout/sidebar.tsx - Barra Lateral com configurações específicas por perfil
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Home, Package, Building, Headphones, FileText,
  BarChart3, Users, Settings, LogOut, Menu, X,
  Shield, Briefcase, GraduationCap, HelpCircle,
  Database
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant?: {
    name: string;
  };
}

interface SidebarProps {
  className?: string;
}

// Função para obter menu baseado no role
const getMenuForRole = (role: string) => {
  const menuItems = [];

  // Dashboard (todos exceto SOLICITANTE)
  if (role !== 'SOLICITANTE') {
    menuItems.push({
      label: 'Dashboard',
      href: '/',
      icon: 'Home'
    });
  }

  // Gestão de Ativos (todos exceto SOLICITANTE)
  if (role !== 'SOLICITANTE') {
    menuItems.push({
      label: 'Gestão de Ativos',
      href: '/admin/ativos',
      icon: 'Package'
    });
  }

  // Gestão de Escolas (apenas SUPER_ADMIN e ADMIN)
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    menuItems.push({
      label: 'Gestão de Escolas',
      href: '/admin/escolas',
      icon: 'Building'
    });
  }

  // Chamados (todos)
  menuItems.push({
    label: 'Chamados',
    href: '/admin/chamados',
    icon: 'Headphones'
  });

  // Relatórios (todos exceto SOLICITANTE)
  if (role !== 'SOLICITANTE') {
    menuItems.push({
      label: 'Relatórios',
      href: '/admin/relatorios',
      icon: 'BarChart3'
    });
  }

  // Configurações (SUPER_ADMIN e ADMIN)
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    menuItems.push({
      label: 'Configurações',
      href: '/admin/configuracoes',
      icon: 'Settings'
    });
  }

  // Reset do Sistema (apenas SUPER_ADMIN) - ITEM SEPARADO E ESPECIAL
  if (role === 'SUPER_ADMIN') {
    menuItems.push({
      label: 'Reset Sistema',
      href: '/admin/configuracoes/reset',
      icon: 'Database',
      isDangerous: true,
      separator: true  // Adiciona separador antes deste item
    });
  }

  return menuItems;
};

const iconMap = {
  Home,
  Package,
  Building,
  Headphones,
  FileText,
  BarChart3,
  Users,
  Settings,
  Shield,
  Briefcase,
  GraduationCap,
  HelpCircle,
  Database
};

const roleLabels = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  GESTOR_ESCOLAR: 'Gestor Escolar',
  SOLICITANTE: 'Solicitante'
};

const roleIcons = {
  SUPER_ADMIN: Shield,
  ADMIN: Briefcase,
  GESTOR_ESCOLAR: GraduationCap,
  SOLICITANTE: HelpCircle
};

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Carregar dados do usuário
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      router.push('/login');
    }
  }, [router]);

  if (!user) {
    return <div className="w-64 bg-gray-50 animate-pulse" />;
  }

  const menuItems = getMenuForRole(user.role);
  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || HelpCircle;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Função para verificar se o path está ativo (suporta subpáginas)
  const isPathActive = (itemHref: string) => {
    // Para o reset, verificação exata
    if (itemHref === '/admin/configuracoes/reset') {
      return pathname === '/admin/configuracoes/reset';
    }
    // Para home, verificação exata
    if (itemHref === '/') {
      return pathname === '/';
    }
    // Para configurações gerais, não ativar se estiver no reset
    if (itemHref === '/admin/configuracoes') {
      return pathname.startsWith('/admin/configuracoes') && pathname !== '/admin/configuracoes/reset';
    }
    // Para outros paths, verifica se o pathname começa com o href do item
    return pathname.startsWith(itemHref);
  };

  const sidebarClasses = `
    ${className}
    bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
    ${isCollapsed ? 'w-16' : 'w-64'}
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    fixed lg:static top-0 left-0 h-full z-40 flex flex-col
  `;

  return (
    <>
      {/* Botão mobile para abrir sidebar */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="text-white" size={18} />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm">Patrimônio</h1>
                <p className="text-xs text-gray-500">Municipal</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {/* Botão collapse - apenas desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Menu size={16} className="text-gray-500" />
            </button>
            
            {/* Botão fechar mobile */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Perfil do usuário */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <RoleIcon size={20} className="text-gray-600" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {user.name}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  {roleLabels[user.role as keyof typeof roleLabels]}
                </p>
                {user.tenant && (
                  <p className="text-xs text-gray-500 truncate">
                    {user.tenant.name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || Package;
            const isActive = isPathActive(item.href);

            return (
              <div key={item.href}>
                {/* Adicionar separador se necessário */}
                {item.separator && index > 0 && (
                  <div className="my-4 border-t border-gray-200" />
                )}
                
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200
                    ${item.isDangerous 
                      ? isActive
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      : isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Footer com logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center space-x-3 px-3 py-2 rounded-lg
              text-red-600 hover:bg-red-50 transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Sair' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-medium text-sm">Sair</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}