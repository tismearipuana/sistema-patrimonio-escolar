// Arquivo: apps/backend/src/system/system.controller.ts

import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

interface ResetDatabaseDto {
  password: string;
  confirmReset: boolean;
}

@Controller('system')
export class SystemController {
  constructor(private prisma: PrismaService) {}

  // Endpoint para resetar o banco de dados
  @Post('reset-database')
  async resetDatabase(@Body() data: ResetDatabaseDto) {
    // SENHA DE SEGURANÇA - ALTERE PARA SUA PRÓPRIA SENHA!
    const RESET_PASSWORD = 'RESET@2024#MUNICIPAL';
    
    // Verificar se está em produção
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException(
        'Esta operação não é permitida em produção!',
        HttpStatus.FORBIDDEN
      );
    }

    // Verificar senha
    if (data.password !== RESET_PASSWORD) {
      throw new HttpException(
        'Senha incorreta! Operação negada.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verificar confirmação
    if (!data.confirmReset) {
      throw new HttpException(
        'É necessário confirmar a operação de reset!',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      console.log('🗑️  Iniciando reset do banco de dados via API...\n');

      // 1. LIMPAR TODAS AS TABELAS
      await this.clearDatabase();

      // 2. CRIAR ESTRUTURA BÁSICA
      const { secretaria, escola } = await this.createBasicStructure();

      // 3. CRIAR USUÁRIOS PADRÃO
      await this.createDefaultUsers(secretaria.id, escola.id);

      // 4. CRIAR CONFIGURAÇÕES INICIAIS
      await this.createDefaultConfigs();

      return {
        success: true,
        message: 'Banco de dados resetado com sucesso!',
        data: {
          usuarios: [
            { email: 'super@admin.com', senha: '123456', perfil: 'SUPER_ADMIN' },
            { email: 'admin@admin.com', senha: '123456', perfil: 'ADMIN' },
            { email: 'gestor@admin.com', senha: '123456', perfil: 'GESTOR_ESCOLAR' },
            { email: 'usuario@admin.com', senha: '123456', perfil: 'SOLICITANTE' }
          ],
          estrutura: {
            secretaria: 'Secretaria Municipal de Educação (SME001)',
            escola: 'Escola Municipal Modelo (ESC001)',
            configuracoes: 'Configurações básicas criadas'
          }
        }
      };
    } catch (error) {
      console.error('❌ Erro ao resetar banco de dados:', error);
      throw new HttpException(
        'Erro ao resetar banco de dados',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint para verificar status do sistema
  @Post('check-reset-permission')
  async checkResetPermission(@Body() data: { password: string }) {
    const RESET_PASSWORD = 'RESET@2024#MUNICIPAL';
    
    if (process.env.NODE_ENV === 'production') {
      return {
        allowed: false,
        message: 'Reset não permitido em produção'
      };
    }

    return {
      allowed: data.password === RESET_PASSWORD,
      message: data.password === RESET_PASSWORD 
        ? 'Senha correta. Reset autorizado.' 
        : 'Senha incorreta!'
    };
  }

  // Métodos privados auxiliares
  private async clearDatabase() {
    // Limpar na ordem correta devido às foreign keys
    await this.prisma.auditLog.deleteMany({});
    await this.prisma.notification.deleteMany({});
    
    // Limpar tabelas de tickets - sem TicketHistory, TicketComment, TicketAttachment (não existem no schema)
    await this.prisma.ticket.deleteMany({});
    await this.prisma.assetDisposalRequest.deleteMany({});
    await this.prisma.assetEvent.deleteMany({});
    await this.prisma.asset.deleteMany({});
    await this.prisma.user.deleteMany({});
    await this.prisma.tenant.deleteMany({});
    await this.prisma.systemConfig.deleteMany({});
    
    console.log('✅ Banco de dados limpo');
  }

  private async createBasicStructure() {
    // Criar Secretaria
    const secretaria = await this.prisma.tenant.create({
      data: {
        name: 'Secretaria Municipal de Educação',
        type: 'SECRETARIA',
        code: 'SME001',
        address: 'Rua Central, 100 - Centro',
        phone: '(11) 3000-0000',
        email: 'secretaria@educacao.gov.br',
        isActive: true
      }
    });

    // Criar Escola
    const escola = await this.prisma.tenant.create({
      data: {
        name: 'Escola Municipal Modelo',
        type: 'ESCOLA',
        code: 'ESC001',
        parentId: secretaria.id,
        address: 'Rua das Flores, 200 - Jardim',
        phone: '(11) 3000-0001',
        email: 'escola.modelo@educacao.gov.br',
        director: 'Maria Silva',
        isActive: true
      }
    });

    console.log('✅ Estrutura básica criada');
    return { secretaria, escola };
  }

  private async createDefaultUsers(secretariaId: string, escolaId: string) {
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Super Admin
    await this.prisma.user.create({
      data: {
        email: 'super@admin.com',
        name: 'Super Administrador',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        tenantId: null,
        isActive: true,
        canAcceptTickets: false
      }
    });

    // Admin
    await this.prisma.user.create({
      data: {
        email: 'admin@admin.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: secretariaId,
        isActive: true,
        canAcceptTickets: true
      }
    });

    // Gestor Escolar
    await this.prisma.user.create({
      data: {
        email: 'gestor@admin.com',
        name: 'Gestor Escolar',
        password: hashedPassword,
        role: 'GESTOR_ESCOLAR',
        tenantId: escolaId,
        isActive: true,
        canAcceptTickets: false
      }
    });

    // Solicitante
    await this.prisma.user.create({
      data: {
        email: 'usuario@admin.com',
        name: 'Usuário Solicitante',
        password: hashedPassword,
        role: 'SOLICITANTE',
        tenantId: escolaId,
        isActive: true,
        canAcceptTickets: false
      }
    });

    console.log('✅ Usuários padrão criados');
  }

  private async createDefaultConfigs() {
    await this.prisma.systemConfig.createMany({
      data: [
        {
          key: 'institution',
          category: 'GENERAL',
          value: JSON.stringify({
            name: 'Prefeitura Municipal',
            cnpj: '00.000.000/0001-00',
            address: 'Rua Central, 100',
            phone: '(11) 3000-0000',
            email: 'contato@prefeitura.gov.br'
          })
        },
        {
          key: 'patrimony',
          category: 'PATRIMONY',
          value: JSON.stringify({
            prefixCode: 'PAT',
            autoGenerate: true,
            requirePhoto: false,
            requireInvoice: false
          })
        },
        {
          key: 'qrcode',
          category: 'QRCODE',
          value: JSON.stringify({
            showLogo: true,
            showInstitutionName: true,
            showAssetCode: true,
            size: 200
          })
        },
        {
          key: 'categories',
          category: 'PATRIMONY',
          value: JSON.stringify([
            { name: 'Informática', code: 'INFO', description: 'Equipamentos de informática' },
            { name: 'Mobiliário', code: 'MOB', description: 'Móveis e utensílios' },
            { name: 'Eletrônicos', code: 'ELET', description: 'Equipamentos eletrônicos' },
            { name: 'Material Didático', code: 'DID', description: 'Materiais pedagógicos' }
          ])
        }
      ]
    });
    
    console.log('✅ Configurações padrão criadas');
  }

  // Endpoint adicional para obter estatísticas do banco
  @Get('database-stats')
  async getDatabaseStats() {
    const [users, tenants, assets, tickets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.tenant.count(),
      this.prisma.asset.count(),
      this.prisma.ticket.count()
    ]);

    // Buscar categorias das configurações
    let categoriesCount = 0;
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key: 'categories' }
      });
      if (config && config.value) {
        const categories = JSON.parse(config.value as string);
        categoriesCount = Array.isArray(categories) ? categories.length : 0;
      }
    } catch (e) {
      console.log('Não foi possível contar categorias');
    }

    return {
      stats: {
        usuarios: users,
        escolas: tenants,
        ativos: assets,
        chamados: tickets,
        categorias: categoriesCount
      },
      ambiente: process.env.NODE_ENV || 'development',
      resetPermitido: process.env.NODE_ENV !== 'production'
    };
  }
}