import { Controller, Get, Post, Put, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CreateTicketDto {
  title: string;
  description: string;
  category: string;
  priority?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  assetId?: string;
  createdById?: string; // Opcional para usuários anônimos via QR Code
  tenantId?: string; // Opcional - será inferido do ativo ou usuário
  attachments?: string[]; // URLs de anexos
}

interface UpdateTicketDto {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  status?: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO';
  resolution?: string;
  assignedToId?: string;
  attachments?: string[];
}

interface AcceptTicketDto {
  acceptedById: string; // ID do técnico que está aceitando
}

interface CompleteTicketDto {
  resolution: string; // Relatório obrigatório
  resolvedById: string; // ID do técnico que resolveu
}

@Controller('tickets')
export class TicketsController {
  constructor(private prisma: PrismaService) {}

  // Listar todos os chamados (com filtros por perfil)
  @Get()
  async getTickets(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('userRole') userRole?: string,
    @Query('userId') userId?: string
  ) {
    try {
      const where: any = {};

      // Filtros de acesso baseados no perfil
      if (userRole === 'SOLICITANTE') {
        // Solicitantes veem apenas seus próprios chamados
        where.createdById = userId;
      } else if (userRole === 'GESTOR_ESCOLAR' && tenantId) {
        // Gestores veem apenas chamados da sua escola
        where.tenantId = tenantId;
      }
      // SUPER_ADMIN e ADMIN veem todos (sem filtro adicional)

      // Aplicar outros filtros
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assignedToId) where.assignedToId = assignedToId;

      const tickets = await this.prisma.ticket.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              location: true,
              status: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              canAcceptTickets: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
      });

      return {
        message: 'Chamados carregados com sucesso!',
        count: tickets.length,
        tickets: tickets
      };
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      throw new HttpException('Erro ao carregar chamados', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar chamados da escola (para GESTOR_ESCOLAR)
  @Get('by-school/:tenantId')
  async getTicketsBySchool(@Param('tenantId') tenantId: string) {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: { tenantId },
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              location: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
      });

      return {
        message: 'Chamados da escola carregados com sucesso!',
        count: tickets.length,
        tickets: tickets
      };
    } catch (error) {
      console.error('Erro ao buscar chamados da escola:', error);
      throw new HttpException('Erro ao carregar chamados da escola', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar chamados do usuário (para SOLICITANTE)
  @Get('my-tickets/:userId')
  async getMyTickets(@Param('userId') userId: string) {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: { createdById: userId },
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              location: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'Meus chamados carregados com sucesso!',
        count: tickets.length,
        tickets: tickets
      };
    } catch (error) {
      console.error('Erro ao buscar meus chamados:', error);
      throw new HttpException('Erro ao carregar meus chamados', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar chamado específico
  @Get(':id')
  async getTicket(@Param('id') id: string) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id },
        include: {
          asset: {
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  phone: true,
                  email: true,
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              canAcceptTickets: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
              phone: true,
              email: true,
              director: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new HttpException('Chamado não encontrado', HttpStatus.NOT_FOUND);
      }

      return ticket;
    } catch (error) {
      console.error('Erro ao buscar chamado:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Criar novo chamado
  @Post()
  async createTicket(@Body() data: CreateTicketDto) {
    try {
      console.log('Criando novo ticket:', data);

      // Validações básicas
      if (!data.title?.trim() || !data.description?.trim()) {
        return {
          message: 'Título e descrição são obrigatórios!',
          error: true
        };
      }

      // Determinar tenantId se não fornecido
      let tenantId = data.tenantId;
      if (!tenantId && data.assetId) {
        const asset = await this.prisma.asset.findUnique({
          where: { id: data.assetId },
          select: { tenantId: true }
        });
        if (asset) {
          tenantId = asset.tenantId;
        }
      }

      if (!tenantId) {
        return {
          message: 'Não foi possível determinar a escola do chamado!',
          error: true
        };
      }

      // Se não há createdById, criar usuário anônimo para QR code
      let createdById = data.createdById;
      if (!createdById) {
        console.log('Criando/buscando usuário anônimo para QR code');
        
        let anonUser = await this.prisma.user.findFirst({
          where: {
            email: 'anonimo@qrcode.local',
            tenantId: tenantId
          }
        });

        if (!anonUser) {
          anonUser = await this.prisma.user.create({
            data: {
              email: 'anonimo@qrcode.local',
              name: 'Usuário Anônimo (QR Code)',
              role: 'SOLICITANTE',
              tenantId: tenantId
            }
          });
          console.log('Usuário anônimo criado:', anonUser.id);
        }

        createdById = anonUser.id;
      }

      const ticket = await this.prisma.ticket.create({
        data: {
          title: data.title.trim(),
          description: data.description.trim(),
          category: data.category || 'OUTROS',
          priority: data.priority || 'MEDIA',
          status: 'ABERTO',
          assetId: data.assetId || null,
          createdById,
          tenantId,
          attachments: data.attachments ? JSON.stringify(data.attachments) : Prisma.JsonNull,
        },
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              location: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Registrar evento no ativo se associado
      if (ticket.assetId) {
        await this.prisma.assetEvent.create({
          data: {
            assetId: ticket.assetId,
            eventType: 'CREATED',
            description: `Chamado criado: ${ticket.title}`,
            newValue: JSON.stringify({
              ticketId: ticket.id,
              title: ticket.title,
              category: ticket.category,
              priority: ticket.priority
            }),
            userId: createdById
          }
        });
      }

      // Notificar técnicos disponíveis
      await this.notifyAvailableTechnicians(ticket.id, tenantId);

      console.log(`Ticket criado com sucesso: ${ticket.id}`);
      return {
        message: 'Chamado criado com sucesso!',
        ticket: ticket
      };
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      return {
        message: 'Erro ao criar chamado!',
        error: true
      };
    }
  }

  // Técnico aceita o chamado (atribuição automática) - NOVO ENDPOINT
  @Put(':id/accept')
  async acceptTicket(@Param('id') id: string, @Body() data: AcceptTicketDto) {
    try {
      console.log(`Técnico ${data.acceptedById} aceitando chamado ${id}`);

      // Verificar se o chamado existe e está aberto
      const ticket = await this.prisma.ticket.findUnique({
        where: { id },
        include: {
          assignedTo: true,
          createdBy: { select: { name: true, email: true } }
        }
      });

      if (!ticket) {
        return {
          message: 'Chamado não encontrado!',
          error: true
        };
      }

      if (ticket.status !== 'ABERTO') {
        return {
          message: 'Chamado não está disponível para aceite!',
          error: true,
          currentStatus: ticket.status,
          assignedTo: ticket.assignedTo?.name
        };
      }

      // Verificar se o usuário pode aceitar chamados
      const technician = await this.prisma.user.findUnique({
        where: { id: data.acceptedById },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          canAcceptTickets: true
        }
      });

      if (!technician) {
        return {
          message: 'Técnico não encontrado!',
          error: true
        };
      }

      if (!technician.canAcceptTickets) {
        return {
          message: 'Usuário não tem permissão para aceitar chamados!',
          error: true
        };
      }

      // Aceitar o chamado (atribuição automática)
      const updatedTicket = await this.prisma.ticket.update({
        where: { id },
        data: {
          status: 'EM_ANDAMENTO',
          assignedToId: data.acceptedById,
          acceptedAt: new Date()
        },
        include: {
          assignedTo: {
            select: {
              name: true,
              email: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          asset: {
            select: {
              code: true,
              name: true
            }
          }
        }
      });

      // Notificar o criador do chamado
      await this.notifyTicketAssigned(updatedTicket);

      console.log(`Chamado ${id} aceito por ${technician.name}`);
      return {
        message: 'Chamado aceito com sucesso!',
        ticket: updatedTicket,
        assignedTo: technician.name
      };
    } catch (error) {
      console.error('Erro ao aceitar chamado:', error);
      return {
        message: 'Erro ao aceitar chamado!',
        error: true
      };
    }
  }

  // Finalizar chamado com relatório - NOVO ENDPOINT
  @Put(':id/complete')
  async completeTicket(@Param('id') id: string, @Body() data: CompleteTicketDto) {
    try {
      console.log(`Finalizando chamado ${id}`);

      // Validações
      if (!data.resolution || data.resolution.trim().length < 10) {
        return {
          message: 'Relatório de resolução é obrigatório (mínimo 10 caracteres)!',
          error: true
        };
      }

      // Verificar se o chamado existe e está em andamento
      const ticket = await this.prisma.ticket.findUnique({
        where: { id },
        include: {
          assignedTo: true,
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      if (!ticket) {
        return {
          message: 'Chamado não encontrado!',
          error: true
        };
      }

      if (ticket.status !== 'EM_ANDAMENTO') {
        return {
          message: 'Apenas chamados em andamento podem ser finalizados!',
          error: true,
          currentStatus: ticket.status
        };
      }

      if (ticket.assignedToId !== data.resolvedById) {
        return {
          message: 'Apenas o técnico responsável pode finalizar o chamado!',
          error: true
        };
      }

      // Finalizar o chamado
      const completedTicket = await this.prisma.ticket.update({
        where: { id },
        data: {
          status: 'RESOLVIDO',
          resolution: data.resolution,
          resolvedAt: new Date()
        },
        include: {
          assignedTo: {
            select: {
              name: true,
              email: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          asset: {
            select: {
              code: true,
              name: true
            }
          }
        }
      });

      // Notificar o criador sobre a resolução
      await this.notifyTicketResolved(completedTicket);

      console.log(`Chamado ${id} finalizado com sucesso`);
      return {
        message: 'Chamado finalizado com sucesso!',
        ticket: completedTicket
      };
    } catch (error) {
      console.error('Erro ao finalizar chamado:', error);
      return {
        message: 'Erro ao finalizar chamado!',
        error: true
      };
    }
  }

  // Atribuir chamado a um técnico (método legado - mantido para compatibilidade)
  @Put(':id/assign')
  async assignTicket(@Param('id') id: string, @Body() data: { assignedToId: string; userId?: string }) {
    try {
      const currentTicket = await this.prisma.ticket.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, name: true } },
          tenant: { select: { name: true } }
        }
      });

      if (!currentTicket) {
        return {
          message: 'Chamado não encontrado!',
          error: true
        };
      }

      // Verificar se o usuário pode aceitar chamados
      const technician = await this.prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { canAcceptTickets: true, name: true }
      });

      if (!technician?.canAcceptTickets) {
        return {
          message: 'Usuário não tem permissão para aceitar chamados!',
          error: true
        };
      }

      const ticket = await this.prisma.ticket.update({
        where: { id },
        data: {
          assignedToId: data.assignedToId,
          status: 'EM_ANDAMENTO',
          acceptedAt: new Date()
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      // Criar notificação para o técnico atribuído
      await this.prisma.notification.create({
        data: {
          userId: data.assignedToId,
          type: 'TICKET_ASSIGNED',
          title: 'Chamado Atribuído',
          message: `Você foi atribuído ao chamado: ${ticket.title}`,
          relatedId: ticket.id,
          relatedType: 'TICKET',
        }
      });

      // Criar notificação para o solicitante
      if (currentTicket.createdBy.id) {
        await this.prisma.notification.create({
          data: {
            userId: currentTicket.createdBy.id,
            type: 'TICKET_ASSIGNED',
            title: 'Chamado Atribuído',
            message: `Seu chamado foi atribuído a ${ticket.assignedTo?.name}`,
            relatedId: ticket.id,
            relatedType: 'TICKET',
          }
        });
      }

      return {
        message: 'Chamado atribuído com sucesso!',
        ticket: ticket
      };
    } catch (error) {
      console.error('Erro ao atribuir chamado:', error);
      return {
        message: 'Erro ao atribuir chamado!',
        error: true
      };
    }
  }

  // Atualizar status do chamado
  @Put(':id/status')
  async updateTicketStatus(@Param('id') id: string, @Body() data: { 
    status: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO';
    resolution?: string;
    userId?: string;
  }) {
    try {
      const currentTicket = await this.prisma.ticket.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        }
      });

      if (!currentTicket) {
        return {
          message: 'Chamado não encontrado!',
          error: true
        };
      }

      const updateData: any = {
        status: data.status,
      };

      if (data.resolution) {
        updateData.resolution = data.resolution;
      }

      if (data.status === 'RESOLVIDO') {
        updateData.resolvedAt = new Date();
      }

      if (data.status === 'FECHADO') {
        updateData.closedAt = new Date();
        if (!currentTicket.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
      }

      const ticket = await this.prisma.ticket.update({
        where: { id },
        data: updateData,
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
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
      });

      // Registrar evento no ativo se associado
      if (ticket.assetId) {
        await this.prisma.assetEvent.create({
          data: {
            assetId: ticket.assetId,
            eventType: 'STATUS_CHANGED',
            description: `Status do chamado alterado para: ${data.status}`,
            oldValue: currentTicket.status,
            newValue: data.status,
            userId: data.userId || 'system'
          }
        });
      }

      // Criar notificação para o solicitante se status mudou para resolvido
      if (data.status === 'RESOLVIDO' && currentTicket.createdBy.id) {
        await this.prisma.notification.create({
          data: {
            userId: currentTicket.createdBy.id,
            type: 'TICKET_RESOLVED',
            title: 'Chamado Resolvido',
            message: `Seu chamado foi resolvido: ${ticket.title}`,
            relatedId: ticket.id,
            relatedType: 'TICKET',
          }
        });
      }

      return {
        message: 'Status do chamado atualizado com sucesso!',
        ticket: ticket
      };
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return {
        message: 'Erro ao atualizar status do chamado!',
        error: true
      };
    }
  }

  // Atualizar chamado completo
  @Put(':id')
  async updateTicket(@Param('id') id: string, @Body() data: UpdateTicketDto & { userId?: string }) {
    try {
      console.log(`Atualizando ticket ${id}:`, data);

      const currentTicket = await this.prisma.ticket.findUnique({
        where: { id }
      });

      if (!currentTicket) {
        return {
          message: 'Ticket não encontrado!',
          error: true
        };
      }

      const updateData: any = { ...data };
      delete updateData.userId; // Remove userId dos dados de update
      
      // Se mudando para resolvido, definir data de resolução
      if (data.status === 'RESOLVIDO' && currentTicket.status !== 'RESOLVIDO') {
        updateData.resolvedAt = new Date();
      }

      // Se mudando para fechado, definir data de fechamento
      if (data.status === 'FECHADO' && currentTicket.status !== 'FECHADO') {
        updateData.closedAt = new Date();
        if (!currentTicket.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
      }

      // Converter attachments para JSON se necessário
      if (data.attachments) {
        updateData.attachments = JSON.stringify(data.attachments);
      }

      const ticket = await this.prisma.ticket.update({
        where: { id },
        data: updateData,
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              category: true,
              location: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          }
        }
      });

      return {
        message: 'Ticket atualizado com sucesso!',
        ticket: ticket
      };
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      return {
        message: 'Erro ao atualizar ticket!',
        error: true
      };
    }
  }

  // Estatísticas dos chamados (com filtro por escola para gestores)
  @Get('stats/dashboard')
  async getTicketsStats(
    @Query('tenantId') tenantId?: string,
    @Query('assignedToId') assignedToId?: string
  ) {
    try {
      const where: any = {};
      
      if (tenantId) where.tenantId = tenantId;
      if (assignedToId) where.assignedToId = assignedToId;

      const [
        total,
        byStatus,
        byPriority,
        averageResolutionTime,
        openTickets,
        myTickets
      ] = await Promise.all([
        this.prisma.ticket.count({ where }),
        this.prisma.ticket.groupBy({
          by: ['status'],
          where,
          _count: { status: true }
        }),
        this.prisma.ticket.groupBy({
          by: ['priority'],
          where,
          _count: { priority: true }
        }),
        this.calculateAverageResolutionTime(where),
        this.prisma.ticket.count({
          where: { ...where, status: 'ABERTO' }
        }),
        assignedToId ? this.prisma.ticket.count({
          where: { assignedToId, status: { in: ['EM_ANDAMENTO', 'AGUARDANDO'] } }
        }) : 0
      ]);

      return {
        message: 'Estatísticas carregadas!',
        stats: {
          total,
          openTickets,
          myActiveTickets: myTickets,
          averageResolutionTime,
          byStatus: byStatus.map(item => ({
            status: item.status,
            count: item._count.status
          })),
          byPriority: byPriority.map(item => ({
            priority: item.priority,
            count: item._count.priority
          }))
        }
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de chamados:', error);
      throw new HttpException('Erro ao carregar estatísticas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Listar técnicos disponíveis para atribuição - ATUALIZADO
  @Get('technicians/available')
  async getAvailableTechnicians() {
    try {
      const technicians = await this.prisma.user.findMany({
        where: {
          canAcceptTickets: true, // NOVO: usar canAcceptTickets ao invés de role
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          canAcceptTickets: true,
          tenant: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        message: 'Técnicos disponíveis carregados!',
        technicians: technicians
      };
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
      throw new HttpException('Erro ao carregar técnicos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar tickets por ativo
  @Get('by-asset/:assetId')
  async getTicketsByAsset(@Param('assetId') assetId: string) {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: { assetId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' }
      });

      return { 
        message: 'Tickets do ativo carregados!',
        count: tickets.length,
        tickets 
      };
    } catch (error) {
      console.error('Erro ao buscar tickets do ativo:', error);
      return {
        message: 'Erro ao buscar tickets!',
        error: true,
        tickets: []
      };
    }
  }

  // Buscar tickets por categoria (para relatórios)
  @Get('by-category/:category')
  async getTicketsByCategory(@Param('category') category: string, @Query('tenantId') tenantId?: string) {
    try {
      const whereCondition: any = { category };
      
      if (tenantId) {
        whereCondition.tenantId = tenantId;
      }

      const tickets = await this.prisma.ticket.findMany({
        where: whereCondition,
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        message: `Tickets da categoria ${category} carregados!`,
        count: tickets.length,
        tickets
      };
    } catch (error) {
      console.error('Erro ao buscar tickets por categoria:', error);
      throw new HttpException('Erro ao buscar tickets por categoria', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Métodos auxiliares privados
  private async notifyAvailableTechnicians(ticketId: string, tenantId: string) {
    try {
      // Buscar técnicos que podem aceitar chamados
      const technicians = await this.prisma.user.findMany({
        where: {
          canAcceptTickets: true,
          isActive: true
        },
        select: { id: true, name: true, email: true }
      });

      // Criar notificações para todos os técnicos
      for (const technician of technicians) {
        await this.prisma.notification.create({
          data: {
            userId: technician.id,
            type: 'TICKET_ASSIGNED',
            title: 'Novo Chamado Disponível',
            message: `Novo chamado disponível para aceite`,
            relatedId: ticketId,
            relatedType: 'TICKET',
          }
        });
      }

      console.log(`Notificando ${technicians.length} técnicos sobre novo chamado ${ticketId}`);
      
      return technicians;
    } catch (error) {
      console.error('Erro ao notificar técnicos:', error);
    }
  }

  private async notifyTicketAssigned(ticket: any) {
    try {
      if (ticket.createdBy.id) {
        await this.prisma.notification.create({
          data: {
            userId: ticket.createdBy.id,
            type: 'TICKET_ASSIGNED',
            title: 'Chamado Atribuído',
            message: `Seu chamado foi aceito por ${ticket.assignedTo.name}`,
            relatedId: ticket.id,
            relatedType: 'TICKET',
          }
        });
      }
      console.log(`Chamado ${ticket.id} atribuído para ${ticket.assignedTo.name}`);
    } catch (error) {
      console.error('Erro ao notificar atribuição:', error);
    }
  }

  private async notifyTicketResolved(ticket: any) {
    try {
      if (ticket.createdBy.id) {
        await this.prisma.notification.create({
          data: {
            userId: ticket.createdBy.id,
            type: 'TICKET_RESOLVED',
            title: 'Chamado Resolvido',
            message: `Seu chamado foi resolvido por ${ticket.assignedTo.name}`,
            relatedId: ticket.id,
            relatedType: 'TICKET',
          }
        });
      }
      console.log(`Chamado ${ticket.id} resolvido por ${ticket.assignedTo.name}`);
    } catch (error) {
      console.error('Erro ao notificar resolução:', error);
    }
  }

  private async calculateAverageResolutionTime(where: any) {
    try {
      const resolvedTickets = await this.prisma.ticket.findMany({
        where: {
          ...where,
          status: 'RESOLVIDO',
          resolvedAt: { not: null },
          acceptedAt: { not: null }
        },
        select: {
          acceptedAt: true,
          resolvedAt: true
        }
      });

      if (resolvedTickets.length === 0) return 0;

      const totalMinutes = resolvedTickets.reduce((acc, ticket) => {
        const acceptedAt = new Date(ticket.acceptedAt!);
        const resolvedAt = new Date(ticket.resolvedAt!);
        const diffMinutes = (resolvedAt.getTime() - acceptedAt.getTime()) / (1000 * 60);
        return acc + diffMinutes;
      }, 0);

      return Math.round(totalMinutes / resolvedTickets.length);
    } catch (error) {
      console.error('Erro ao calcular tempo médio:', error);
      return 0;
    }
  }
}