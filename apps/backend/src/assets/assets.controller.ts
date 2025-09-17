import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Controller('assets')
export class AssetsController {
  constructor(private prisma: PrismaService) {}

  // Listar todos os ativos (para SUPER_ADMIN e ADMIN)
  @Get()
  async getAssets(@Query('tenantId') tenantId?: string, @Query('status') status?: string) {
    try {
      const whereCondition: any = {};
      
      // Filtro por escola (para gestores escolares)
      if (tenantId) {
        whereCondition.tenantId = tenantId;
      }

      // Filtro por status
      if (status) {
        whereCondition.status = status;
      }

      const assets = await this.prisma.asset.findMany({
        where: whereCondition,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
          disposalRequests: {
            where: {
              status: {
                in: ['PENDENTE', 'EM_ANALISE']
              }
            },
            select: {
              id: true,
              status: true,
              reason: true,
              createdAt: true,
            }
          },
          _count: {
            select: {
              tickets: true,
              disposalRequests: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'Ativos carregados com sucesso!',
        count: assets.length,
        assets: assets
      };
    } catch (error) {
      console.error('Erro ao buscar ativos:', error);
      throw new HttpException('Erro ao carregar ativos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar ativos por escola (para GESTOR_ESCOLAR)
  @Get('by-school/:tenantId')
  async getAssetsBySchool(@Param('tenantId') tenantId: string) {
    try {
      const assets = await this.prisma.asset.findMany({
        where: { 
          tenantId,
          disposalStatus: 'ATIVO' // Só mostra ativos não baixados
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          tickets: {
            where: {
              status: {
                in: ['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO']
              }
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true,
            }
          },
          disposalRequests: {
            where: {
              status: {
                in: ['PENDENTE', 'EM_ANALISE', 'APROVADA']
              }
            },
            select: {
              id: true,
              status: true,
              reason: true,
              createdAt: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'Ativos da escola carregados com sucesso!',
        count: assets.length,
        assets: assets
      };
    } catch (error) {
      console.error('Erro ao buscar ativos da escola:', error);
      throw new HttpException('Erro ao carregar ativos da escola', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar ativo por ID
  @Get(':id')
  async getAsset(@Param('id') id: string) {
    try {
      console.log(`Buscando ativo com ID: ${id}`);

      const asset = await this.prisma.asset.findUnique({
        where: { id },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
              phone: true,
              email: true,
              address: true,
              director: true,
            },
          },
          tickets: {
            where: {
              status: {
                in: ['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO', 'RESOLVIDO']
              }
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          assetEvents: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
          disposalRequests: {
            orderBy: { createdAt: 'desc' },
            include: {
              requestedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                }
              },
              reviewedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                }
              }
            }
          }
        },
      });

      if (!asset) {
        console.log(`Ativo não encontrado: ${id}`);
        throw new HttpException('Ativo não encontrado', HttpStatus.NOT_FOUND);
      }

      console.log(`Ativo encontrado: ${asset.name}`);
      return asset;
    } catch (error) {
      console.error('Erro ao buscar ativo:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Criar novo ativo
  @Post()
  async createAsset(@Body() data: CreateAssetDto) {
    try {
      // Verifica se o código já existe
      const existingAsset = await this.prisma.asset.findUnique({
        where: { code: data.code }
      });

      if (existingAsset) {
        return {
          message: 'Código do ativo já existe!',
          error: true,
          field: 'code'
        };
      }

      // Verifica se a escola existe
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: data.tenantId }
      });

      if (!tenant) {
        return {
          message: 'Escola não encontrada!',
          error: true,
          field: 'tenantId'
        };
      }

      const asset = await this.prisma.asset.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          category: data.category,
          brand: data.brand,
          model: data.model,
          serialNumber: data.serialNumber,
          purchaseValue: data.purchaseValue,
          status: data.status,
          condition: data.condition,          // NOVO CAMPO
          imageUrl: data.imageUrl,            // NOVO CAMPO
          location: data.location,
          responsible: data.responsible,
          tenantId: data.tenantId,
          disposalStatus: 'ATIVO',
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Registra evento de criação
      await this.prisma.assetEvent.create({
        data: {
          assetId: asset.id,
          eventType: 'CREATED',
          description: `Ativo ${asset.name} foi cadastrado no sistema`,
          newValue: JSON.stringify({
            status: asset.status,
            condition: asset.condition,
            category: asset.category,
            tenant: tenant.name
          }),
          userId: 'system', // TODO: usar ID do usuário logado
        },
      });

      return {
        message: 'Ativo criado com sucesso!',
        asset: asset
      };
    } catch (error) {
      console.error('Erro ao criar ativo:', error);
      return {
        message: 'Erro ao criar ativo!',
        error: true
      };
    }
  }

  // Atualizar ativo
  @Put(':id')
  async updateAsset(@Param('id') id: string, @Body() data: UpdateAssetDto) {
    try {
      // Se está mudando o código, verifica se já existe
      if (data.code) {
        const existingAsset = await this.prisma.asset.findFirst({
          where: { 
            code: data.code,
            NOT: { id: id }
          }
        });

        if (existingAsset) {
          return {
            message: 'Código do ativo já existe!',
            error: true,
            field: 'code'
          };
        }
      }

      // Busca o ativo atual para comparação
      const currentAsset = await this.prisma.asset.findUnique({
        where: { id }
      });

      if (!currentAsset) {
        return {
          message: 'Ativo não encontrado!',
          error: true
        };
      }

      const asset = await this.prisma.asset.update({
        where: { id },
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          category: data.category,
          brand: data.brand,
          model: data.model,
          serialNumber: data.serialNumber,
          purchaseValue: data.purchaseValue,
          status: data.status,
          condition: data.condition,          // NOVO CAMPO
          imageUrl: data.imageUrl,            // NOVO CAMPO
          location: data.location,
          responsible: data.responsible,
          tenantId: data.tenantId,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Registra evento de edição
      await this.prisma.assetEvent.create({
        data: {
          assetId: asset.id,
          eventType: 'UPDATED',
          description: `Ativo ${asset.name} foi editado`,
          oldValue: JSON.stringify({
            status: currentAsset.status,
            condition: currentAsset.condition,
            location: currentAsset.location,
            responsible: currentAsset.responsible
          }),
          newValue: JSON.stringify({
            status: asset.status,
            condition: asset.condition,
            location: asset.location,
            responsible: asset.responsible
          }),
          userId: 'system', // TODO: usar ID do usuário logado
        },
      });

      return {
        message: 'Ativo atualizado com sucesso!',
        asset: asset
      };
    } catch (error) {
      console.error('Erro ao atualizar ativo:', error);
      return {
        message: 'Erro ao atualizar ativo!',
        error: true
      };
    }
  }

  // Transferir ativo para outra escola
  @Put(':id/transfer')
  async transferAsset(@Param('id') id: string, @Body() data: { tenantId: string; reason?: string }) {
    try {
      const asset = await this.prisma.asset.findUnique({
        where: { id },
        include: { tenant: true }
      });

      if (!asset) {
        return {
          message: 'Ativo não encontrado!',
          error: true
        };
      }

      const newTenant = await this.prisma.tenant.findUnique({
        where: { id: data.tenantId }
      });

      if (!newTenant) {
        return {
          message: 'Escola de destino não encontrada!',
          error: true
        };
      }

      const updatedAsset = await this.prisma.asset.update({
        where: { id },
        data: {
          tenantId: data.tenantId,
          location: '', // Reset localização na transferência
          responsible: '', // Reset responsável na transferência
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Registra evento de transferência
      await this.prisma.assetEvent.create({
        data: {
          assetId: asset.id,
          eventType: 'MOVED',
          description: `Ativo transferido de ${asset.tenant.name} para ${newTenant.name}`,
          oldValue: JSON.stringify({
            tenant: asset.tenant.name,
            tenantCode: asset.tenant.code
          }),
          newValue: JSON.stringify({
            tenant: newTenant.name,
            tenantCode: newTenant.code,
            reason: data.reason || 'Não informado'
          }),
          userId: 'system', // TODO: usar ID do usuário logado
        },
      });

      return {
        message: 'Ativo transferido com sucesso!',
        asset: updatedAsset
      };
    } catch (error) {
      console.error('Erro ao transferir ativo:', error);
      return {
        message: 'Erro ao transferir ativo!',
        error: true
      };
    }
  }

  // Excluir ativo (apenas SUPER_ADMIN)
  @Delete(':id')
  async deleteAsset(@Param('id') id: string) {
    try {
      // Verifica se tem chamados ou solicitações de baixa vinculadas
      const asset = await this.prisma.asset.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              tickets: true,
              disposalRequests: true,
            },
          },
        },
      });

      if (!asset) {
        return {
          message: 'Ativo não encontrado!',
          error: true
        };
      }

      if (asset._count.tickets > 0 || asset._count.disposalRequests > 0) {
        return {
          message: 'Não é possível excluir! Ativo possui registros vinculados.',
          error: true,
          details: {
            chamados: asset._count.tickets,
            solicitacoesBaixa: asset._count.disposalRequests,
          }
        };
      }

      await this.prisma.asset.delete({
        where: { id }
      });

      return {
        message: 'Ativo excluído com sucesso!',
      };
    } catch (error) {
      console.error('Erro ao excluir ativo:', error);
      return {
        message: 'Erro ao excluir ativo!',
        error: true
      };
    }
  }

  // Estatísticas dos ativos (Dashboard)
  @Get('stats/dashboard')
  async getStats(@Query('tenantId') tenantId?: string) {
    try {
      const whereCondition: any = {};
      
      // Filtro por escola (para gestores escolares)
      if (tenantId) {
        whereCondition.tenantId = tenantId;
      }

      const total = await this.prisma.asset.count({
        where: whereCondition
      });
      
      const porStatus = await this.prisma.asset.groupBy({
        by: ['status'],
        where: whereCondition,
        _count: {
          status: true,
        },
      });

      const porDisposalStatus = await this.prisma.asset.groupBy({
        by: ['disposalStatus'],
        where: whereCondition,
        _count: {
          disposalStatus: true,
        },
      });

      const porCategoria = await this.prisma.asset.groupBy({
        by: ['category'],
        where: whereCondition,
        _count: {
          category: true,
        },
      });

      // Estatísticas por condição do bem
      const porCondicao = await this.prisma.asset.groupBy({
        by: ['condition'],
        where: {
          ...whereCondition,
          condition: {
            not: null
          }
        },
        _count: {
          condition: true,
        },
      });

      const valorTotal = await this.prisma.asset.aggregate({
        where: whereCondition,
        _sum: {
          purchaseValue: true,
        },
      });

      // Estatísticas específicas de baixa
      const solicitacoesBaixaPendentes = await this.prisma.assetDisposalRequest.count({
        where: {
          status: {
            in: ['PENDENTE', 'EM_ANALISE']
          },
          ...(tenantId && { tenantId })
        }
      });

      const ativosBaixados = await this.prisma.asset.count({
        where: {
          ...whereCondition,
          disposalStatus: 'BAIXADO'
        }
      });

      return {
        message: 'Estatísticas carregadas!',
        stats: {
          total,
          porStatus,
          porDisposalStatus,
          porCategoria,
          // porCondicao,                    // COMENTADO TEMPORARIAMENTE
          valorTotal: {
            compra: valorTotal._sum.purchaseValue || 0,
          },
          baixa: {
            solicitacoesPendentes: solicitacoesBaixaPendentes,
            ativosBaixados: ativosBaixados
          }
        }
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new HttpException('Erro ao carregar estatísticas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar ativos próximos ao vencimento da garantia
  @Get('warranty/expiring')
  async getAssetsWithExpiringWarranty(@Query('days') days: string = '30') {
    try {
      const daysAhead = parseInt(days);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const assets = await this.prisma.asset.findMany({
        where: {
          warrantyUntil: {
            lte: futureDate,
            gte: new Date()
          },
          status: 'ATIVO'
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          warrantyUntil: 'asc'
        }
      });

      return {
        message: 'Ativos com garantia próxima ao vencimento',
        count: assets.length,
        assets: assets
      };
    } catch (error) {
      console.error('Erro ao buscar ativos com garantia vencendo:', error);
      throw new HttpException('Erro ao buscar ativos com garantia vencendo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}