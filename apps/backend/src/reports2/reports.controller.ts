import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  // Relatório de inventário por escola
  @Get('inventory/:tenantId')
  async getInventoryReport(@Param('tenantId') tenantId: string) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return {
          message: 'Escola não encontrada!',
          error: true
        };
      }

      const assets = await this.prisma.asset.findMany({
        where: { tenantId },
        orderBy: [
          { category: 'asc' },
          { code: 'asc' }
        ]
      });

      // Agrupamento por categoria
      const assetsByCategory = assets.reduce((acc, asset) => {
        if (!acc[asset.category]) {
          acc[asset.category] = [];
        }
        acc[asset.category].push(asset);
        return acc;
      }, {} as Record<string, typeof assets>);

      // Estatísticas
      const stats = {
        totalAtivos: assets.length,
        valorTotal: assets.reduce((sum, asset) => sum + (Number(asset.purchaseValue) || 0), 0),
        porStatus: {
          ativos: assets.filter(a => a.status === 'ATIVO').length,
          manutencao: assets.filter(a => a.status === 'MANUTENCAO').length,
          inativos: assets.filter(a => a.status === 'INATIVO').length,
          baixados: assets.filter(a => a.status === 'BAIXADO').length,
        },
        porCategoria: Object.keys(assetsByCategory).map(category => ({
          categoria: category,
          quantidade: assetsByCategory[category].length,
          valor: assetsByCategory[category].reduce((sum, asset) => sum + (Number(asset.purchaseValue) || 0), 0)
        }))
      };

      return {
        message: 'Relatório de inventário gerado com sucesso!',
        escola: {
          id: tenant.id,
          nome: tenant.name,
          codigo: tenant.code,
          endereco: tenant.address,
          telefone: tenant.phone,
          email: tenant.email
        },
        stats,
        assetsByCategory,
        assets,
        geradoEm: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return {
        message: 'Erro ao gerar relatório de inventário!',
        error: true
      };
    }
  }

  // Relatório consolidado de todas as escolas
  @Get('consolidated')
  async getConsolidatedReport() {
    try {
      const tenants = await this.prisma.tenant.findMany({
        include: {
          _count: {
            select: {
              assets: true,
              users: true
            }
          },
          assets: {
            select: {
              purchaseValue: true,
              status: true,
              category: true
            }
          }
        }
      });

      const consolidatedData = tenants.map(tenant => {
        const valorTotal = tenant.assets.reduce((sum, asset) => sum + (Number(asset.purchaseValue) || 0), 0);
        
        return {
          escola: {
            id: tenant.id,
            nome: tenant.name,
            codigo: tenant.code,
          },
          totalAtivos: tenant._count.assets,
          totalUsuarios: tenant._count.users,
          valorTotal,
          porStatus: {
            ativos: tenant.assets.filter(a => a.status === 'ATIVO').length,
            manutencao: tenant.assets.filter(a => a.status === 'MANUTENCAO').length,
            inativos: tenant.assets.filter(a => a.status === 'INATIVO').length,
            baixados: tenant.assets.filter(a => a.status === 'BAIXADO').length,
          }
        };
      });

      const totaisGerais = {
        totalEscolas: tenants.length,
        totalAtivos: consolidatedData.reduce((sum, escola) => sum + escola.totalAtivos, 0),
        totalUsuarios: consolidatedData.reduce((sum, escola) => sum + escola.totalUsuarios, 0),
        valorTotal: consolidatedData.reduce((sum, escola) => sum + escola.valorTotal, 0),
      };

      return {
        message: 'Relatório consolidado gerado com sucesso!',
        totaisGerais,
        escolas: consolidatedData,
        geradoEm: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error);
      return {
        message: 'Erro ao gerar relatório consolidado!',
        error: true
      };
    }
  }

  // Relatório de ativos por categoria
  @Get('category/:category')
  async getCategoryReport(@Param('category') category: string) {
    try {
      const assets = await this.prisma.asset.findMany({
        where: { category },
        include: {
          tenant: {
            select: {
              name: true,
              code: true
            }
          }
        },
        orderBy: [
          { tenant: { name: 'asc' } },
          { code: 'asc' }
        ]
      });

      const stats = {
        totalAtivos: assets.length,
        valorTotal: assets.reduce((sum, asset) => sum + (Number(asset.purchaseValue) || 0), 0),
        porEscola: assets.reduce((acc, asset) => {
          const escolaId = asset.tenant.name;
          if (!acc[escolaId]) {
            acc[escolaId] = { quantidade: 0, valor: 0 };
          }
          acc[escolaId].quantidade++;
          acc[escolaId].valor += Number(asset.purchaseValue) || 0;
          return acc;
        }, {} as Record<string, { quantidade: number; valor: number }>),
        porStatus: {
          ativos: assets.filter(a => a.status === 'ATIVO').length,
          manutencao: assets.filter(a => a.status === 'MANUTENCAO').length,
          inativos: assets.filter(a => a.status === 'INATIVO').length,
          baixados: assets.filter(a => a.status === 'BAIXADO').length,
        }
      };

      return {
        message: `Relatório da categoria ${category} gerado com sucesso!`,
        categoria: category,
        stats,
        assets,
        geradoEm: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao gerar relatório por categoria:', error);
      return {
        message: 'Erro ao gerar relatório por categoria!',
        error: true
      };
    }
  }

  // Lista de escolas para seleção
  @Get('schools')
  async getSchools() {
    try {
      const schools = await this.prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: {
              assets: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return {
        message: 'Lista de escolas carregada!',
        schools
      };

    } catch (error) {
      console.error('Erro ao buscar escolas:', error);
      return {
        message: 'Erro ao buscar escolas!',
        error: true
      };
    }
  }
}