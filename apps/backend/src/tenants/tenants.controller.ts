import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateTenantDto {
  name: string;
  type: 'SECRETARIA' | 'REGIONAL' | 'ESCOLA';
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  parentId?: string;
}

@Controller('tenants')
export class TenantsController {
  constructor(private prisma: PrismaService) {}

  // Listar todas as escolas com estatísticas
  @Get()
  async getTenants() {
    const tenants = await this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            assets: true,
            tickets: true,
          },
        },
        parent: true,
        children: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: '🏫 Escolas carregadas com sucesso!',
      count: tenants.length,
      tenants: tenants
    };
  }

  // Buscar escola específica
  @Get(':id')
  async getTenant(@Param('id') id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            assets: true,
            tickets: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assets: {
          take: 10, // Últimos 10 ativos
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            status: true,
          },
        },
        parent: true,
        children: true,
      },
    });

    if (!tenant) {
      return {
        message: '❌ Escola não encontrada!',
        error: true
      };
    }

    return {
      message: '✅ Escola encontrada!',
      tenant: tenant
    };
  }

  // Criar nova escola
  @Post()
  async createTenant(@Body() data: CreateTenantDto) {
    try {
      // Verifica se o código já existe
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { code: data.code }
      });

      if (existingTenant) {
        return {
          message: '❌ Código da escola já existe!',
          error: true,
          field: 'code'
        };
      }

      const tenant = await this.prisma.tenant.create({
        data: {
          name: data.name,
          type: data.type,
          code: data.code,
          address: data.address,
          phone: data.phone,
          email: data.email,
          parentId: data.parentId,
        },
        include: {
          _count: {
            select: {
              users: true,
              assets: true,
              tickets: true,
            },
          },
        },
      });

      return {
        message: '🏫 Escola criada com sucesso!',
        tenant: tenant
      };
    } catch (error) {
      console.error('Erro ao criar escola:', error);
      return {
        message: '❌ Erro ao criar escola!',
        error: true
      };
    }
  }

  // Atualizar escola
  @Put(':id')
  async updateTenant(@Param('id') id: string, @Body() data: Partial<CreateTenantDto>) {
    try {
      // Se está mudando o código, verifica se já existe
      if (data.code) {
        const existingTenant = await this.prisma.tenant.findFirst({
          where: { 
            code: data.code,
            NOT: { id: id }
          }
        });

        if (existingTenant) {
          return {
            message: '❌ Código da escola já existe!',
            error: true,
            field: 'code'
          };
        }
      }

      const tenant = await this.prisma.tenant.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          code: data.code,
          address: data.address,
          phone: data.phone,
          email: data.email,
          parentId: data.parentId,
        },
        include: {
          _count: {
            select: {
              users: true,
              assets: true,
              tickets: true,
            },
          },
        },
      });

      return {
        message: '✅ Escola atualizada com sucesso!',
        tenant: tenant
      };
    } catch (error) {
      console.error('Erro ao atualizar escola:', error);
      return {
        message: '❌ Erro ao atualizar escola!',
        error: true
      };
    }
  }

  // Excluir escola
  @Delete(':id')
  async deleteTenant(@Param('id') id: string) {
    try {
      // Verifica se tem usuários ou ativos vinculados
      const tenant = await this.prisma.tenant.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              assets: true,
              tickets: true,
            },
          },
        },
      });

      if (!tenant) {
        return {
          message: '❌ Escola não encontrada!',
          error: true
        };
      }

      if (tenant._count.users > 0 || tenant._count.assets > 0 || tenant._count.tickets > 0) {
        return {
          message: '❌ Não é possível excluir! Escola possui usuários, ativos ou chamados vinculados.',
          error: true,
          details: {
            usuarios: tenant._count.users,
            ativos: tenant._count.assets,
            chamados: tenant._count.tickets,
          }
        };
      }

      await this.prisma.tenant.delete({
        where: { id }
      });

      return {
        message: '🗑️ Escola excluída com sucesso!',
      };
    } catch (error) {
      console.error('Erro ao excluir escola:', error);
      return {
        message: '❌ Erro ao excluir escola!',
        error: true
      };
    }
  }

  // Estatísticas das escolas
  @Get('stats/overview')
  async getTenantsStats() {
    const total = await this.prisma.tenant.count();
    
    const porTipo = await this.prisma.tenant.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
    });

    const totalUsuarios = await this.prisma.user.count();
    const totalAtivos = await this.prisma.asset.count();

    return {
      message: '📊 Estatísticas das escolas carregadas!',
      stats: {
        totalEscolas: total,
        porTipo,
        totalUsuarios,
        totalAtivos,
      }
    };
  }
}