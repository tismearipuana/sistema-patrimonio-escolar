import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface DashboardData {
  totalAssets: number;
  totalValue: number;
  activeAssets: number;
  maintenanceAssets: number;
  assetsByCategory: { name: string; value: number; percentage: number }[];
  assetsByStatus: { name: string; value: number; color: string }[];
  assetsByCondition: { name: string; value: number; color: string }[];
  assetsBySchool: { name: string; total: number; value: number }[];
  recentAcquisitions: any[];
  monthlyTrend: { month: string; acquisitions: number; maintenance: number }[];
}

export interface ReportsFilters {
  period?: string;
  schoolId?: string;
  category?: string;
  userRole?: string;
  userTenantId?: string;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(filters: ReportsFilters): Promise<DashboardData> {
    // Filtros base para as consultas
    const whereClause = this.buildWhereClause(filters);
    const dateFilter = this.buildDateFilter(filters.period);

    // Consultas paralelas para melhor performance
    const [
      totalAssetsData,
      assetsByCategory,
      assetsByStatus,
      assetsByCondition,
      assetsBySchool,
      recentAcquisitions,
      monthlyTrend
    ] = await Promise.all([
      this.getTotalAssetsData(whereClause),
      this.getAssetsByCategory(whereClause),
      this.getAssetsByStatus(whereClause),
      this.getAssetsByCondition(whereClause),
      this.getAssetsBySchool(whereClause, filters),
      this.getRecentAcquisitions(whereClause, dateFilter),
      this.getMonthlyTrend(whereClause)
    ]);

    return {
      totalAssets: totalAssetsData.totalAssets,
      totalValue: this.toNumber(totalAssetsData.totalValue),
      activeAssets: totalAssetsData.activeAssets,
      maintenanceAssets: totalAssetsData.maintenanceAssets,
      assetsByCategory,
      assetsByStatus,
      assetsByCondition,
      assetsBySchool,
      recentAcquisitions,
      monthlyTrend
    };
  }

  private buildWhereClause(filters: ReportsFilters) {
    const where: any = {};

    // Se for GESTOR_ESCOLAR, filtrar apenas pela escola dele
    if (filters.userRole === 'GESTOR_ESCOLAR' && filters.userTenantId) {
      where.tenantId = filters.userTenantId;
    } else if (filters.schoolId && filters.schoolId !== 'all') {
      where.tenantId = filters.schoolId;
    }

    // Filtro por categoria
    if (filters.category && filters.category !== 'all') {
      where.category = filters.category;
    }

    return where;
  }

  private buildDateFilter(period?: string) {
    if (!period || period === 'all') return {};

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return {};
    }

    return {
      createdAt: {
        gte: startDate
      }
    };
  }

  private async getTotalAssetsData(whereClause: any) {
    const [allAssets, totalValue] = await Promise.all([
      this.prisma.asset.findMany({
        where: whereClause,
        select: {
          status: true,
          purchaseValue: true
        }
      }),
      this.prisma.asset.aggregate({
        where: whereClause,
        _sum: {
          purchaseValue: true
        }
      })
    ]);

    const totalAssets = allAssets.length;
    const activeAssets = allAssets.filter(asset => asset.status === 'ATIVO').length;
    const maintenanceAssets = allAssets.filter(asset => asset.status === 'MANUTENCAO').length;

    return {
      totalAssets,
      totalValue: this.toNumber(totalValue._sum.purchaseValue || 0),
      activeAssets,
      maintenanceAssets
    };
  }

  private async getAssetsByCategory(whereClause: any) {
    const categories = await this.prisma.asset.groupBy({
      by: ['category'],
      where: whereClause,
      _count: {
        category: true
      }
    });

    const total = categories.reduce((sum, cat) => sum + cat._count.category, 0);

    return categories.map(cat => ({
      name: this.formatCategoryName(cat.category),
      value: cat._count.category,
      percentage: total > 0 ? Number(((cat._count.category / total) * 100).toFixed(1)) : 0
    }));
  }

  private async getAssetsByStatus(whereClause: any) {
    const statuses = await this.prisma.asset.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        status: true
      }
    });

    const statusColors = {
      ATIVO: '#10B981',
      INATIVO: '#6B7280',
      MANUTENCAO: '#F59E0B',
      BAIXADO: '#EF4444'
    };

    return statuses.map(status => ({
      name: this.formatStatusName(status.status),
      value: status._count.status,
      color: statusColors[status.status] || '#6B7280'
    }));
  }

  private async getAssetsByCondition(whereClause: any) {
    const conditions = await this.prisma.asset.groupBy({
      by: ['condition'],
      where: whereClause,
      _count: {
        condition: true
      }
    });

    const conditionColors = {
      OTIMO: '#10B981',
      BOM: '#3B82F6',
      REGULAR: '#F59E0B',
      RUIM: '#EF4444'
    };

    return conditions
      .filter(cond => cond.condition !== null)
      .map(cond => {
        const conditionName = cond.condition as string;
        return {
          name: this.formatConditionName(conditionName),
          value: cond._count.condition,
          color: conditionColors[conditionName as keyof typeof conditionColors] || '#6B7280'
        };
      });
  }

  private async getAssetsBySchool(whereClause: any, filters: ReportsFilters) {
    // Se for GESTOR_ESCOLAR, não mostrar dados de outras escolas
    if (filters.userRole === 'GESTOR_ESCOLAR') {
      return [];
    }

    const schools = await this.prisma.asset.groupBy({
      by: ['tenantId'],
      where: whereClause,
      _count: {
        tenantId: true
      },
      _sum: {
        purchaseValue: true
      }
    });

    // Buscar nomes das escolas
    const schoolsWithNames = await Promise.all(
      schools.map(async (school) => {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: school.tenantId },
          select: { name: true }
        });

        return {
          name: tenant?.name || 'Escola não encontrada',
          total: school._count.tenantId,
          value: this.toNumber(school._sum.purchaseValue || 0)
        };
      })
    );

    return schoolsWithNames;
  }

  private async getRecentAcquisitions(whereClause: any, dateFilter: any) {
    const acquisitions = await this.prisma.asset.findMany({
      where: {
        ...whereClause,
        ...dateFilter
      },
      include: {
        tenant: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return acquisitions.map(asset => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      condition: asset.condition,
      purchaseValue: this.toNumber(asset.purchaseValue || 0),
      tenant: {
        id: asset.tenantId,
        name: asset.tenant.name
      },
      createdAt: asset.createdAt.toISOString()
    }));
  }

  private async getMonthlyTrend(whereClause: any): Promise<{ month: string; acquisitions: number; maintenance: number }[]> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const acquisitions = await this.prisma.asset.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Agrupar por mês
    const monthlyData: Record<string, { month: string; acquisitions: number; maintenance: number }> = {};
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]}`;
      monthlyData[monthKey] = {
        month: monthKey,
        acquisitions: 0,
        maintenance: 0
      };
    }

    // Contar aquisições e manutenções por mês
    acquisitions.forEach(asset => {
      const month = months[asset.createdAt.getMonth()];
      if (monthlyData[month]) {
        monthlyData[month].acquisitions++;
        if (asset.status === 'MANUTENCAO') {
          monthlyData[month].maintenance++;
        }
      }
    });

    return Object.values(monthlyData);
  }

  // Função auxiliar para converter Decimal para number
  private toNumber(value: number | Decimal | null): number {
    if (value === null) return 0;
    if (typeof value === 'number') return value;
    return Number(value.toString());
  }

  private formatCategoryName(category: string): string {
    const categoryNames = {
      COMPUTADOR: 'Computadores',
      NOTEBOOK: 'Notebooks',
      IMPRESSORA: 'Impressoras',
      TABLET: 'Tablets',
      ROTEADOR: 'Roteadores',
      PROJETOR: 'Projetores',
      OUTROS: 'Outros'
    };
    return categoryNames[category] || category;
  }

  private formatStatusName(status: string): string {
    const statusNames = {
      ATIVO: 'Ativo',
      INATIVO: 'Inativo',
      MANUTENCAO: 'Manutenção',
      BAIXADO: 'Baixado'
    };
    return statusNames[status] || status;
  }

  private formatConditionName(condition: string): string {
    const conditionNames = {
      OTIMO: 'Ótimo',
      BOM: 'Bom',
      REGULAR: 'Regular',
      RUIM: 'Ruim'
    };
    return conditionNames[condition] || condition;
  }
}