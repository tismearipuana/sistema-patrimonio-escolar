import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateTicketData {
  title: string;
  description: string;
  category: string;
  priority?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  assetId?: string;
  createdById?: string;
  tenantId?: string;
  attachments?: string[];
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  status?: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO';
  resolution?: string;
  assignedToId?: string;
  attachments?: string[];
}

export interface TicketFilters {
  tenantId?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  createdById?: string;
  userRole?: string;
  userId?: string;
  assetId?: string;
  category?: string;
}

export interface TicketStats {
  total: number;
  openTickets: number;
  myActiveTickets: number;
  averageResolutionTime: number;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  // Listar tickets com filtros baseados no perfil
  async findMany(filters: TicketFilters) {
    const where = this.buildWhereClause(filters);

    return this.prisma.ticket.findMany({
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
  }

  // Buscar ticket por ID
  async findById(id: string) {
    return this.prisma.ticket.findUnique({
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
  }

  // Criar novo ticket
  async create(data: CreateTicketData) {
    // Validações básicas
    if (!data.title?.trim() || !data.description?.trim()) {
      throw new Error('Título e descrição são obrigatórios');
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
      throw new Error('Não foi possível determinar a escola do chamado');
    }

    // Se não há createdById, criar usuário anônimo para QR code
    let createdById = data.createdById;
    if (!createdById) {
      createdById = await this.getOrCreateAnonymousUser(tenantId);
    }

    // Criar o ticket
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
      await this.createAssetEvent(ticket.assetId, 'CREATED', 
        `Chamado criado: ${ticket.title}`, createdById, {
          ticketId: ticket.id,
          title: ticket.title,
          category: ticket.category,
          priority: ticket.priority
        });
    }

    // Notificar técnicos disponíveis
    await this.notifyAvailableTechnicians(ticket.id);

    return ticket;
  }

  // Técnico aceita o chamado (atribuição automática)
  async acceptTicket(ticketId: string, technicianId: string) {
    // Verificar se o chamado existe e está disponível
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: { select: { name: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (!ticket) {
      throw new Error('Chamado não encontrado');
    }

    if (ticket.status !== 'ABERTO') {
      throw new Error(`Chamado não está disponível para aceite. Status atual: ${ticket.status}`);
    }

    // Verificar se o técnico pode aceitar chamados
    const technician = await this.validateTechnician(technicianId);

    // Aceitar o chamado
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'EM_ANDAMENTO',
        assignedToId: technicianId,
        acceptedAt: new Date()
      },
      include: {
        assignedTo: {
          select: { name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        asset: {
          select: { code: true, name: true }
        }
      }
    });

    // Notificar o criador do chamado
    await this.notifyTicketAssigned(updatedTicket);

    // Registrar evento no ativo se associado
    if (updatedTicket.assetId) {
      await this.createAssetEvent(updatedTicket.assetId, 'STATUS_CHANGED',
        `Chamado aceito por ${technician.name}`, technicianId, {
          status: 'EM_ANDAMENTO',
          assignedTo: technician.name
        });
    }

    return updatedTicket;
  }

  // Finalizar chamado com relatório
  async completeTicket(ticketId: string, technicianId: string, resolution: string) {
    // Validações
    if (!resolution || resolution.trim().length < 10) {
      throw new Error('Relatório de resolução é obrigatório (mínimo 10 caracteres)');
    }

    // Verificar se o chamado existe e está em andamento
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: { select: { name: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (!ticket) {
      throw new Error('Chamado não encontrado');
    }

    if (ticket.status !== 'EM_ANDAMENTO') {
      throw new Error('Apenas chamados em andamento podem ser finalizados');
    }

    if (ticket.assignedToId !== technicianId) {
      throw new Error('Apenas o técnico responsável pode finalizar o chamado');
    }

    // Finalizar o chamado
    const completedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVIDO',
        resolution: resolution.trim(),
        resolvedAt: new Date()
      },
      include: {
        assignedTo: {
          select: { name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        asset: {
          select: { code: true, name: true }
        }
      }
    });

    // Notificar o criador sobre a resolução
    await this.notifyTicketResolved(completedTicket);

    // Registrar evento no ativo se associado
    if (completedTicket.assetId) {
      await this.createAssetEvent(completedTicket.assetId, 'STATUS_CHANGED',
        `Chamado resolvido por ${ticket.assignedTo?.name}`, technicianId, {
          status: 'RESOLVIDO',
          resolution: resolution.substring(0, 100) + '...'
        });
    }

    return completedTicket;
  }

  // Atualizar ticket
  async update(id: string, data: UpdateTicketData, userId?: string) {
    const currentTicket = await this.prisma.ticket.findUnique({
      where: { id }
    });

    if (!currentTicket) {
      throw new Error('Ticket não encontrado');
    }

    const updateData: any = { ...data };
    
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

    return this.prisma.ticket.update({
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
  }

  // Buscar tickets por asset
  async findByAsset(assetId: string) {
    return this.prisma.ticket.findMany({
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
  }

  // Obter estatísticas dos tickets
  async getStats(filters: TicketFilters): Promise<TicketStats> {
    const where = this.buildWhereClause(filters);

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
      filters.assignedToId ? this.prisma.ticket.count({
        where: { 
          assignedToId: filters.assignedToId, 
          status: { in: ['EM_ANDAMENTO', 'AGUARDANDO'] } 
        }
      }) : 0
    ]);

    return {
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
    };
  }

  // Buscar técnicos disponíveis
  async getAvailableTechnicians() {
    return this.prisma.user.findMany({
      where: {
        canAcceptTickets: true,
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
  }

  // Métodos auxiliares privados
  private buildWhereClause(filters: TicketFilters) {
    const where: any = {};

    // Filtros de acesso baseados no perfil
    if (filters.userRole === 'SOLICITANTE') {
      where.createdById = filters.userId;
    } else if (filters.userRole === 'GESTOR_ESCOLAR' && filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    // Outros filtros
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.createdById && filters.userRole !== 'SOLICITANTE') {
      where.createdById = filters.createdById;
    }
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.category) where.category = filters.category;

    return where;
  }

  private async getOrCreateAnonymousUser(tenantId: string): Promise<string> {
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
    }

    return anonUser.id;
  }

  private async validateTechnician(technicianId: string) {
    const technician = await this.prisma.user.findUnique({
      where: { id: technicianId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canAcceptTickets: true,
        isActive: true
      }
    });

    if (!technician) {
      throw new Error('Técnico não encontrado');
    }

    if (!technician.isActive) {
      throw new Error('Técnico está inativo');
    }

    if (!technician.canAcceptTickets) {
      throw new Error('Usuário não tem permissão para aceitar chamados');
    }

    return technician;
  }

  private async createAssetEvent(assetId: string, eventType: string, description: string, 
                                 userId: string, data?: any) {
    try {
      await this.prisma.assetEvent.create({
        data: {
          assetId,
          eventType: eventType as any,
          description,
          newValue: data ? JSON.stringify(data) : null,
          userId
        }
      });
    } catch (error) {
      console.error('Erro ao criar evento do ativo:', error);
    }
  }

  private async notifyAvailableTechnicians(ticketId: string) {
    try {
      const technicians = await this.getAvailableTechnicians();

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

      console.log(`Notificados ${technicians.length} técnicos sobre novo chamado ${ticketId}`);
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
    } catch (error) {
      console.error('Erro ao notificar resolução:', error);
    }
  }

  private async calculateAverageResolutionTime(where: any): Promise<number> {
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