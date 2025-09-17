import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
//@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('super-admin')
  async getSuperAdminDashboard() {
    try {
      const [
        assets,
        assetsByStatus,
        tickets,
        users,
        usersActive,
        schools,
        disposalRequests
      ] = await Promise.all([
        // Assets total e valor
        this.prisma.asset.aggregate({
          _count: true,
          _sum: { currentValue: true },
        }),
        // Assets por status
        this.prisma.asset.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        // Tickets total
        this.prisma.ticket.count(),
        // Users total
        this.prisma.user.count(),
        // Users ativos últimos 30 dias
        this.prisma.user.count({
          where: {
            lastLogin: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        // Schools
        this.prisma.tenant.count({ where: { type: 'ESCOLA' } }),
        // Disposal requests pendentes
        this.prisma.assetDisposalRequest.count({
          where: { status: 'PENDENTE' }
        })
      ]);

      return {
        assets: {
          total: assets._count,
          totalValue: assets._sum.currentValue || 0,
          byStatus: assetsByStatus.map(item => ({
            status: item.status,
            count: item._count.status
          }))
        },
        tickets: { total: tickets },
        users: { 
          total: users,
          activeInLast30Days: usersActive
        },
        schools: { total: schools },
        disposalRequests: { pending: disposalRequests }
      };
    } catch (error) {
      console.error('Erro no dashboard super-admin:', error);
      return {
        assets: { total: 0, totalValue: 0, byStatus: [] },
        tickets: { total: 0 },
        users: { total: 0, activeInLast30Days: 0 },
        schools: { total: 0 },
        disposalRequests: { pending: 0 }
      };
    }
  }

  @Get('admin')
  async getAdminDashboard() {
    try {
      const [
        assets,
        assetsByStatus,
        assetsByCategory,
        schools,
        disposalRequests
      ] = await Promise.all([
        this.prisma.asset.aggregate({
          _count: true,
          _sum: { currentValue: true },
        }),
        this.prisma.asset.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        this.prisma.asset.groupBy({
          by: ['category'],
          _count: { category: true },
        }),
        this.prisma.tenant.count({ where: { type: 'ESCOLA' } }),
        this.prisma.assetDisposalRequest.count({
          where: { status: 'PENDENTE' }
        })
      ]);

      return {
        assets: {
          total: assets._count,
          totalValue: assets._sum.currentValue || 0,
          byStatus: assetsByStatus.map(item => ({
            status: item.status,
            count: item._count.status
          })),
          byCategory: assetsByCategory.map(item => ({
            category: item.category,
            count: item._count.category
          }))
        },
        schools: { total: schools },
        disposalRequests: { pending: disposalRequests }
      };
    } catch (error) {
      console.error('Erro no dashboard admin:', error);
      return {
        assets: { total: 0, totalValue: 0, byStatus: [], byCategory: [] },
        schools: { total: 0 },
        disposalRequests: { pending: 0 }
      };
    }
  }

  @Get('school/:schoolId')
  async getSchoolDashboard(@Param('schoolId') schoolId: string) {
    try {
      const [assets, assetsByStatus, tickets] = await Promise.all([
        this.prisma.asset.aggregate({
          where: { tenantId: schoolId },
          _count: true,
          _sum: { currentValue: true },
        }),
        this.prisma.asset.groupBy({
          where: { tenantId: schoolId },
          by: ['status'],
          _count: { status: true },
        }),
        this.prisma.ticket.count({
          where: { tenantId: schoolId }
        })
      ]);

      return {
        assets: {
          total: assets._count,
          totalValue: assets._sum.currentValue || 0,
          byStatus: assetsByStatus.map(item => ({
            status: item.status,
            count: item._count.status
          }))
        },
        tickets: { total: tickets }
      };
    } catch (error) {
      console.error('Erro no dashboard escola:', error);
      return {
        assets: { total: 0, totalValue: 0, byStatus: [] },
        tickets: { total: 0 }
      };
    }
  }
}