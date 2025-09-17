import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

interface CreateUserDto {
  name: string;
  email: string;
  password?: string; // Opcional - será gerada automaticamente se não fornecida
  role: 'SUPER_ADMIN' | 'ADMIN' | 'GESTOR_ESCOLAR' | 'SOLICITANTE';
  tenantId?: string; // Opcional para SUPER_ADMIN
  isActive?: boolean;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'GESTOR_ESCOLAR' | 'SOLICITANTE';
  tenantId?: string;
  isActive?: boolean;
}

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  // Listar usuários com filtros e permissões por perfil
  @Get()
  async getUsers(
    @Query('tenantId') tenantId?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string
  ) {
    try {
      const where: any = {};

      // Filtros
      if (tenantId) where.tenantId = tenantId;
      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true
            }
          },
          _count: {
            select: {
              createdTickets: true,
              assignedTickets: true,
              disposalRequests: true,
              reviewedDisposals: true,
              notifications: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ]
      });

      return {
        message: 'Usuários carregados com sucesso!',
        count: users.length,
        users: users
      };
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw new HttpException('Erro ao carregar usuários', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar usuários por escola (para GESTOR_ESCOLAR)
  @Get('by-school/:tenantId')
  async getUsersBySchool(@Param('tenantId') tenantId: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: { 
          tenantId,
          isActive: true 
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastLogin: true,
          createdAt: true,
          _count: {
            select: {
              createdTickets: true,
              disposalRequests: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ]
      });

      return {
        message: 'Usuários da escola carregados com sucesso!',
        count: users.length,
        users: users
      };
    } catch (error) {
      console.error('Erro ao buscar usuários da escola:', error);
      throw new HttpException('Erro ao carregar usuários da escola', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar usuário específico por ID
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    try {
      console.log(`Buscando usuário: ${id}`);

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
              director: true,
              phone: true,
              email: true
            }
          },
          createdTickets: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          assignedTickets: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          disposalRequests: {
            select: {
              id: true,
              status: true,
              reason: true,
              createdAt: true,
              asset: {
                select: {
                  code: true,
                  name: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          reviewedDisposals: {
            select: {
              id: true,
              status: true,
              reviewedAt: true,
              asset: {
                select: {
                  code: true,
                  name: true
                }
              }
            },
            orderBy: { reviewedAt: 'desc' },
            take: 5
          },
          notifications: {
            where: { isRead: false },
            select: {
              id: true,
              type: true,
              title: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!user) {
        throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Criar novo usuário
  @Post()
  async createUser(@Body() data: CreateUserDto) {
    try {
      console.log('Criando novo usuário:', { ...data, password: '[HIDDEN]' });

      // Validações básicas
      if (!data.email || !data.name || !data.role) {
        return {
          message: 'Email, nome e papel são obrigatórios!',
          error: true
        };
      }

      // SUPER_ADMIN pode não ter tenantId, outros roles precisam
      if (data.role !== 'SUPER_ADMIN' && !data.tenantId) {
        return {
          message: 'Escola é obrigatória para este perfil!',
          error: true,
          field: 'tenantId'
        };
      }

      // SUPER_ADMIN não pode ter tenantId
      if (data.role === 'SUPER_ADMIN' && data.tenantId) {
        return {
          message: 'Super Administrador não deve estar vinculado a uma escola específica!',
          error: true,
          field: 'tenantId'
        };
      }

      // Verifica se o email já existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return {
          message: 'E-mail já cadastrado!',
          error: true,
          field: 'email'
        };
      }

      // Verificar se tenant existe (se necessário)
      if (data.tenantId) {
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
      }

      // Gerar senha padrão se não fornecida
      let password = data.password || 'PatrimonioMunicipal@2024';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          tenantId: data.tenantId || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true
            }
          },
        },
      });

      // Log de auditoria
      await this.prisma.auditLog.create({
        data: {
          userId: user.id, // TODO: Usar ID do usuário que está criando
          action: 'CREATE_USER',
          resourceType: 'USER',
          resourceId: user.id,
          newValues: JSON.stringify({
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
          }),
        }
      });

      console.log(`Usuário criado com sucesso: ${user.email}`);
      return {
        message: 'Usuário criado com sucesso!',
        user: {
          ...user,
          password: undefined // Não retornar senha
        },
        temporaryPassword: !data.password ? password : undefined
      };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return {
        message: 'Erro ao criar usuário!',
        error: true
      };
    }
  }

  // Atualizar usuário
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() data: UpdateUserDto & { updatedBy?: string }) {
    try {
      console.log(`Atualizando usuário ${id}:`, { ...data, password: data.password ? '[HIDDEN]' : undefined });

      // Verificar se usuário existe
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return {
          message: 'Usuário não encontrado!',
          error: true
        };
      }

      // Se está mudando o email, verifica se já existe
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: data.email }
        });

        if (emailExists) {
          return {
            message: 'E-mail já cadastrado!',
            error: true,
            field: 'email'
          };
        }
      }

      // Validações de role e tenantId
      if (data.role) {
        if (data.role === 'SUPER_ADMIN' && data.tenantId) {
          return {
            message: 'Super Administrador não deve estar vinculado a uma escola!',
            error: true,
            field: 'tenantId'
          };
        }

        if (data.role !== 'SUPER_ADMIN' && !data.tenantId && !existingUser.tenantId) {
          return {
            message: 'Escola é obrigatória para este perfil!',
            error: true,
            field: 'tenantId'
          };
        }
      }

      // Verificar se tenant existe (se mudando)
      if (data.tenantId && data.tenantId !== existingUser.tenantId) {
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
      }

      // Preparar dados para atualização
      const updateData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId,
        isActive: data.isActive,
      };

      // Hash da senha se fornecida
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true
            }
          },
        },
      });

      // Log de auditoria
      if (data.updatedBy) {
        await this.prisma.auditLog.create({
          data: {
            userId: data.updatedBy,
            action: 'UPDATE_USER',
            resourceType: 'USER',
            resourceId: user.id,
            oldValues: JSON.stringify({
              name: existingUser.name,
              email: existingUser.email,
              role: existingUser.role,
              isActive: existingUser.isActive
            }),
            newValues: JSON.stringify({
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive
            }),
          }
        });
      }

      console.log(`Usuário atualizado com sucesso: ${user.email}`);
      return {
        message: 'Usuário atualizado com sucesso!',
        user: {
          ...user,
          password: undefined // Não retornar senha
        }
      };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return {
        message: 'Erro ao atualizar usuário!',
        error: true
      };
    }
  }

  // Desativar usuário (soft delete)
  @Put(':id/deactivate')
  async deactivateUser(@Param('id') id: string, @Body() data: { deactivatedBy?: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return {
          message: 'Usuário não encontrado!',
          error: true
        };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      // Log de auditoria
      if (data.deactivatedBy) {
        await this.prisma.auditLog.create({
          data: {
            userId: data.deactivatedBy,
            action: 'DEACTIVATE_USER',
            resourceType: 'USER',
            resourceId: id,
            oldValues: JSON.stringify({ isActive: true }),
            newValues: JSON.stringify({ isActive: false }),
          }
        });
      }

      return {
        message: 'Usuário desativado com sucesso!',
        user: updatedUser
      };
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      return {
        message: 'Erro ao desativar usuário!',
        error: true
      };
    }
  }

  // Excluir usuário (apenas se não tiver registros vinculados)
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Body() data: { deletedBy?: string }) {
    try {
      console.log(`Excluindo usuário: ${id}`);

      // Verificar se usuário existe e tem registros vinculados
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              createdTickets: true,
              assignedTickets: true,
              disposalRequests: true,
              reviewedDisposals: true,
              notifications: true,
              auditLogs: true
            }
          }
        }
      });

      if (!user) {
        return {
          message: 'Usuário não encontrado!',
          error: true
        };
      }

      // Verificar se tem registros vinculados
      const hasLinkedRecords = Object.values(user._count).some(count => count > 0);

      if (hasLinkedRecords) {
        return {
          message: 'Não é possível excluir! Usuário possui registros vinculados. Use a desativação.',
          error: true,
          details: {
            ticketsCriados: user._count.createdTickets,
            ticketsAtribuidos: user._count.assignedTickets,
            solicitacoesBaixa: user._count.disposalRequests,
            aprovacoesBaixa: user._count.reviewedDisposals,
            notificacoes: user._count.notifications,
            logsAuditoria: user._count.auditLogs
          }
        };
      }

      // Log de auditoria antes de excluir
      if (data.deletedBy) {
        await this.prisma.auditLog.create({
          data: {
            userId: data.deletedBy,
            action: 'DELETE_USER',
            resourceType: 'USER',
            resourceId: id,
            oldValues: JSON.stringify({
              name: user.name,
              email: user.email,
              role: user.role
            }),
          }
        });
      }

      await this.prisma.user.delete({
        where: { id }
      });

      console.log(`Usuário excluído com sucesso: ${user.email}`);
      return {
        message: 'Usuário excluído com sucesso!',
      };
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return {
        message: 'Erro ao excluir usuário!',
        error: true
      };
    }
  }

  // Redefinir senha
  @Put(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body() data: { newPassword?: string; resetBy?: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true }
      });

      if (!user) {
        return {
          message: 'Usuário não encontrado!',
          error: true
        };
      }

      // Gerar nova senha se não fornecida
      const newPassword = data.newPassword || `Patrimonio@${Math.floor(Math.random() * 10000)}`;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });

      // Log de auditoria
      if (data.resetBy) {
        await this.prisma.auditLog.create({
          data: {
            userId: data.resetBy,
            action: 'RESET_PASSWORD',
            resourceType: 'USER',
            resourceId: id,
            newValues: JSON.stringify({ passwordReset: true }),
          }
        });
      }

      return {
        message: 'Senha redefinida com sucesso!',
        temporaryPassword: newPassword,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return {
        message: 'Erro ao redefinir senha!',
        error: true
      };
    }
  }

  // Estatísticas dos usuários
  @Get('stats/overview')
  async getUsersStats(@Query('tenantId') tenantId?: string) {
    try {
      const where = tenantId ? { tenantId } : {};

      const [total, active, byRole, recentLogins] = await Promise.all([
        this.prisma.user.count({ where }),
        this.prisma.user.count({ 
          where: { ...where, isActive: true } 
        }),
        this.prisma.user.groupBy({
          by: ['role'],
          where,
          _count: { role: true }
        }),
        this.prisma.user.count({
          where: {
            ...where,
            lastLogin: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
            }
          }
        })
      ]);

      return {
        message: 'Estatísticas carregadas!',
        stats: {
          total,
          active,
          inactive: total - active,
          recentLogins,
          byRole: byRole.map(item => ({
            role: item.role,
            count: item._count.role
          }))
        }
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de usuários:', error);
      throw new HttpException('Erro ao carregar estatísticas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Listar roles disponíveis (atualizado)
  @Get('roles/available')
  async getAvailableRoles() {
    return {
      message: 'Roles disponíveis carregados!',
      roles: [
        {
          value: 'SOLICITANTE',
          label: 'Solicitante',
          description: 'Pode criar e acompanhar seus próprios chamados',
          color: 'bg-gray-100 text-gray-700',
          permissions: ['VIEW_OWN_TICKETS', 'CREATE_TICKETS']
        },
        {
          value: 'GESTOR_ESCOLAR',
          label: 'Gestor Escolar',
          description: 'Acesso aos ativos e chamados da sua escola',
          color: 'bg-green-100 text-green-700',
          permissions: ['MANAGE_SCHOOL_ASSETS', 'VIEW_SCHOOL_TICKETS', 'REQUEST_DISPOSAL']
        },
        {
          value: 'ADMIN',
          label: 'Administrador',
          description: 'Gestão completa de ativos e chamados',
          color: 'bg-blue-100 text-blue-700',
          permissions: ['MANAGE_ASSETS', 'MANAGE_TICKETS', 'APPROVE_DISPOSALS', 'VIEW_REPORTS']
        },
        {
          value: 'SUPER_ADMIN',
          label: 'Super Administrador',
          description: 'Acesso total ao sistema incluindo configurações',
          color: 'bg-red-100 text-red-700',
          permissions: ['ALL_PERMISSIONS']
        }
      ]
    };
  }

  // Verificar disponibilidade de email
  @Get('check-email/:email')
  async checkEmailAvailability(@Param('email') email: string) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true }
      });

      return {
        available: !existingUser,
        message: existingUser 
          ? `Email já está em uso por ${existingUser.name}` 
          : 'Email disponível'
      };
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return {
        available: false,
        message: 'Erro ao verificar disponibilidade'
      };
    }
  }

  // Endpoint para criar dados de teste (atualizado)
  @Post('seed')
  async createTestData() {
    try {
      // Verifica se já existe usuário Super Admin
      const superAdminExists = await this.prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      });

      if (superAdminExists) {
        return {
          message: 'Dados de teste já existem!',
          superAdmin: superAdminExists.name,
        };
      }

      // Criar secretaria
      const secretaria = await this.prisma.tenant.create({
        data: {
          name: 'Secretaria Municipal de Educação',
          type: 'SECRETARIA',
          code: 'SME001',
          address: 'Rua da Prefeitura, 123',
          phone: '(11) 3333-3333',
          email: 'sme@prefeitura.gov.br',
        },
      });

      // Criar escola
      const escola = await this.prisma.tenant.create({
        data: {
          name: 'EMEF Prof. João Silva',
          type: 'ESCOLA',
          code: 'ESC001',
          parentId: secretaria.id,
          address: 'Rua das Flores, 123',
          phone: '(11) 99999-9999',
          email: 'escola@teste.com',
          director: 'Maria Diretora',
        },
      });

      // Criar usuários de teste
      const hashedPassword = await bcrypt.hash('123456', 10);

      const usuarios = await this.prisma.user.createMany({
        data: [
          {
            name: 'Super Administrador',
            email: 'superadmin@prefeitura.gov.br',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            tenantId: null,
          },
          {
            name: 'Administrador Geral',
            email: 'admin@prefeitura.gov.br',
            password: hashedPassword,
            role: 'ADMIN',
            tenantId: secretaria.id,
          },
          {
            name: 'Maria Diretora',
            email: 'diretora@escola.com',
            password: hashedPassword,
            role: 'GESTOR_ESCOLAR',
            tenantId: escola.id,
          },
          {
            name: 'João Professor',
            email: 'professor@escola.com',
            password: hashedPassword,
            role: 'SOLICITANTE',
            tenantId: escola.id,
          },
        ],
      });

      return {
        message: 'Dados de teste criados!',
        secretaria,
        escola,
        usuariosCriados: usuarios.count,
        credentials: {
          superAdmin: 'superadmin@prefeitura.gov.br / 123456',
          admin: 'admin@prefeitura.gov.br / 123456',
          gestor: 'diretora@escola.com / 123456',
          solicitante: 'professor@escola.com / 123456'
        }
      };
    } catch (error) {
      console.error('Erro ao criar dados de teste:', error);
      return {
        message: 'Erro ao criar dados de teste!',
        error: true
      };
    }
  }
}