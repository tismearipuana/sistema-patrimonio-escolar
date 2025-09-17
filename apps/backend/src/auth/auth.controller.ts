import { Controller, Post, Get, Body, UseGuards, Request, HttpException, HttpStatus, Ip, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordDto {
  email: string;
  resetToken?: string;
  newPassword?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

  // Login do usuário
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    try {
      console.log(`Tentativa de login: ${loginDto.email} from ${ip}`);

      // Validações básicas
      if (!loginDto.email || !loginDto.password) {
        return {
          message: 'Email e senha são obrigatórios',
          error: true,
        };
      }

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            }
          }
        }
      });

      if (!user) {
        await this.logLoginAttempt(loginDto.email, false, 'USER_NOT_FOUND', ip, userAgent);
        
        return {
          message: 'Credenciais inválidas',
          error: true,
        };
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        await this.logLoginAttempt(user.id, false, 'USER_INACTIVE', ip, userAgent);
        
        return {
          message: 'Usuário desativado. Entre em contato com o administrador.',
          error: true,
        };
      }

      // CORREÇÃO: Verificar senha (tanto hash quanto texto puro)
      let passwordValid = false;
      
      if (user.password) {
        // Se a senha começa com $2b$, é um hash bcrypt
        if (user.password.startsWith('$2b$')) {
          passwordValid = await bcrypt.compare(loginDto.password, user.password);
        } else {
          // Se não é hash, compara diretamente (texto puro)
          passwordValid = loginDto.password === user.password;
        }
      } else {
        // Se não tem senha, usar senha padrão
        passwordValid = loginDto.password === '123456';
      }
      
      if (!passwordValid) {
        await this.logLoginAttempt(user.id, false, 'INVALID_PASSWORD', ip, userAgent);
        
        return {
          message: 'Credenciais inválidas',
          error: true,
        };
      }

      // Gerar tokens
      const tokens = await this.authService.login(user);

      // Atualizar último login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Log login bem-sucedido
      await this.logLoginAttempt(user.id, true, 'SUCCESS', ip, userAgent);

      console.log(`Login bem-sucedido: ${user.email} (${user.role})`);

      return {
        message: 'Login realizado com sucesso!',
        ...tokens,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenant: user.tenant,
          lastLogin: user.lastLogin,
        },
      };

    } catch (error) {
      console.error('Erro durante login:', error);
      return {
        message: 'Erro interno do servidor',
        error: true,
      };
    }
  }

  // Debug login (temporário)
  @Post('debug-login')
  async debugLogin(@Body() loginDto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email }
    });

    if (!user) {
      return { error: 'Usuário não encontrado' };
    }

    return {
      userFound: true,
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordSample: user.password ? user.password.substring(0, 10) + '...' : 'null',
      inputPassword: loginDto.password,
      isActive: user.isActive,
      passwordStartsWith: user.password ? user.password.substring(0, 4) : 'null'
    };
  }

  // Reset de senhas para desenvolvimento
  @Post('reset-passwords')
  async resetPasswords() {
    try {
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const result = await this.prisma.user.updateMany({
        data: {
          password: hashedPassword
        }
      });

      return {
        message: 'Senhas resetadas com sucesso',
        updatedUsers: result.count,
        newPassword: defaultPassword,
        info: 'Todos os usuários agora têm a senha: 123456'
      };
    } catch (error) {
      console.error('Erro ao resetar senhas:', error);
      return {
        message: 'Erro ao resetar senhas',
        error: true,
      };
    }
  }

  // Criar dados de teste para desenvolvimento
  @Post('setup')
  async setup() {
    try {
      // Verificar se já existem usuários
      const existingUsers = await this.prisma.user.count();
      
      if (existingUsers > 0) {
        return {
          message: 'Usuários já foram criados',
          existingCount: existingUsers,
        };
      }

      const result = await this.authService.createDefaultUsers();
      
      return {
        message: 'Usuários padrão criados para demonstração',
        users: result.users || [],
        credentials: result.credentials || []
      };

    } catch (error) {
      console.error('Erro ao criar usuários de teste:', error);
      return {
        message: 'Erro ao criar usuários de teste',
        error: true,
      };
    }
  }

  // Verificar se usuário está autenticado
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  async verify(@Request() req) {
    return {
      message: 'Token válido',
      authenticated: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }

  // Perfil do usuário autenticado
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            }
          }
        }
      });

      if (!user) {
        throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
      }

      return {
        message: 'Perfil carregado!',
        user,
      };

    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Logout
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    try {
      // Log de auditoria
      await this.prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'LOGOUT',
          resourceType: 'USER',
          resourceId: req.user.userId,
          ipAddress: ip,
          userAgent: userAgent,
        }
      });

      return {
        message: 'Logout realizado com sucesso!',
      };

    } catch (error) {
      console.error('Erro durante logout:', error);
      return {
        message: 'Logout realizado com sucesso!',
      };
    }
  }

  // Método privado para log de tentativas de login
  private async logLoginAttempt(
    userIdOrEmail: string, 
    success: boolean, 
    reason: string, 
    ip: string, 
    userAgent: string
  ) {
    try {
      let userId = userIdOrEmail;
      if (userIdOrEmail.includes('@')) {
        const user = await this.prisma.user.findUnique({
          where: { email: userIdOrEmail },
          select: { id: true }
        });
        userId = user?.id || 'unknown';
      }

      if (userId !== 'unknown' && userId !== 'system') {
        await this.prisma.auditLog.create({
          data: {
            userId: userId,
            action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            resourceType: 'USER',
            resourceId: userId,
            oldValues: success ? undefined : JSON.stringify({ reason }),
            ipAddress: ip,
            userAgent: userAgent,
          }
        });
      }
    } catch (error) {
      console.error('Erro ao registrar tentativa de login:', error);
    }
  }
  @Post('clean-and-setup')
async cleanAndSetup() {
  try {
    console.log('🧹 Iniciando limpeza e recriação dos usuários...');

    // 1. Limpar dados existentes (manter estrutura do banco)
    await this.prisma.auditLog.deleteMany({});
    await this.prisma.notification.deleteMany({});
    await this.prisma.ticket.deleteMany({});
    await this.prisma.assetDisposalRequest.deleteMany({});
    await this.prisma.assetEvent.deleteMany({});
    await this.prisma.asset.deleteMany({});
    await this.prisma.user.deleteMany({});
    await this.prisma.tenant.deleteMany({});
    
    console.log('✅ Dados limpos com sucesso');

    // 2. Criar escola de exemplo
    const escola = await this.prisma.tenant.create({
      data: {
        name: 'Escola Municipal João Paulo II',
        type: 'ESCOLA',
        code: 'EMJ001',
        address: 'Rua das Flores, 123 - Centro',
        phone: '(11) 3333-4444',
        email: 'contato@emjoaopauloii.edu.br',
        director: 'Maria Silva Santos',
      }
    });

    console.log('✅ Escola criada:', escola.name);

    // 3. Hash da senha padrão
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 4. Criar usuários com os novos perfis
    const users = await Promise.all([
      // SUPER_ADMIN - Acesso total
      this.prisma.user.create({
        data: {
          email: 'super@admin.com',
          name: 'Super Administrador',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          tenantId: null, // Não vinculado a escola específica
        }
      }),

      // ADMIN - Gestão operacional
      this.prisma.user.create({
        data: {
          email: 'admin@sistema.com',
          name: 'Administrador do Sistema',
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: null, // Não vinculado a escola específica
        }
      }),

      // GESTOR_ESCOLAR - Limitado à sua escola
      this.prisma.user.create({
        data: {
          email: 'diretor@escola.com',
          name: 'João Carlos Silva',
          password: hashedPassword,
          role: 'GESTOR_ESCOLAR',
          tenantId: escola.id, // Vinculado à escola
        }
      }),

      // SOLICITANTE - Apenas chamados
      this.prisma.user.create({
        data: {
          email: 'professor@escola.com',
          name: 'Ana Paula Costa',
          password: hashedPassword,
          role: 'SOLICITANTE',
          tenantId: escola.id, // Vinculado à escola
        }
      }),
    ]);

    console.log('✅ Usuários criados com sucesso');

    // 5. Criar algumas configurações iniciais do sistema
    await this.prisma.systemConfig.createMany({
      data: [
        {
          key: 'institution',
          category: 'GENERAL',
          value: {
            name: 'Prefeitura Municipal',
            city: 'São Paulo',
            state: 'SP',
            logo: null,
            website: 'https://prefeitura.sp.gov.br'
          }
        },
        {
          key: 'patrimony',
          category: 'PATRIMONY',
          value: {
            prefix: 'PAT',
            startNumber: 1000,
            categories: [
              'Computadores',
              'Impressoras', 
              'Projetores',
              'Tablets',
              'Roteadores',
              'Smartphones'
            ],
            statuses: [
              'Funcionando',
              'Com Defeito',
              'Em Manutenção',
              'Baixado'
            ]
          }
        },
        {
          key: 'qrcode',
          category: 'QRCODE',
          value: {
            baseUrl: 'https://patrimonio.prefeitura.sp.gov.br',
            showLogo: true,
            logoSize: 80,
            errorCorrection: 'M'
          }
        }
      ]
    });

    console.log('✅ Configurações iniciais criadas');

    // 6. Retornar informações dos usuários criados
    return {
      message: '🎉 Sistema limpo e reconfigurado com sucesso!',
      escola: {
        id: escola.id,
        name: escola.name,
        code: escola.code
      },
      usuarios: users.map(user => ({
        email: user.email,
        nome: user.name,
        perfil: user.role,
        escola: user.tenantId ? escola.name : 'Todas as escolas',
        senha: defaultPassword
      })),
      proximosPassos: [
        '1. Faça login com qualquer usuário usando senha: 123456',
        '2. Teste as permissões de cada perfil',
        '3. Configure o sistema nas Configurações (apenas Super Admin)',
        '4. Cadastre ativos e teste o fluxo completo'
      ]
    };

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    return {
      message: 'Erro ao limpar e recriar dados',
      error: error.message
    };
  }
}
}