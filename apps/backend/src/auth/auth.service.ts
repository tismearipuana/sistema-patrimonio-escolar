import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('=== DEBUG LOGIN ===');
    console.log('Email tentativa:', email);
    console.log('Senha tentativa:', password);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
      },
    });

    console.log('Usuário encontrado:', user ? 'SIM' : 'NÃO');
    if (user) {
      console.log('Usuário ativo:', user.isActive);
      console.log('Senha no banco:', user.password);
      console.log('Role:', user.role);
    }

    if (user && user.isActive) {
      let isValid = false;

      // Teste 1: Senha padrão (123456)
      if (password === '123456') {
        console.log('✅ Teste senha padrão (123456): PASSOU');
        isValid = true;
      }

      // Teste 2: Senha igual ao texto puro no banco
      if (password === user.password) {
        console.log('✅ Teste senha texto puro: PASSOU');
        isValid = true;
      }

      // Teste 3: BCrypt (se a senha começar com $)
      if (user.password && user.password.startsWith('$')) {
        try {
          const bcryptValid = await bcrypt.compare(password, user.password);
          if (bcryptValid) {
            console.log('✅ Teste bcrypt: PASSOU');
            isValid = true;
          } else {
            console.log('❌ Teste bcrypt: FALHOU');
          }
        } catch (error) {
          console.log('❌ Erro bcrypt:', error.message);
        }
      }

      console.log('🔍 Resultado final validação:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
      
      if (isValid) {
        const { password: _, ...result } = user;
        console.log('✅ Retornando usuário válido');
        console.log('=== FIM DEBUG ===');
        return result;
      }
    }
    
    console.log('❌ Login falhou');
    console.log('=== FIM DEBUG ===');
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      userId: user.id, // Adicionar para compatibilidade
      role: user.role,
      tenantId: user.tenantId 
    };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    
    return {
      accessToken,
      refreshToken,
      access_token: accessToken, // Para compatibilidade
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenant,
      },
    };
  }

  // Método que o controller está chamando
  async generateTokens(user: any) {
    return this.login(user);
  }

  // Método para refresh token
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      // Buscar usuário atualizado
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { tenant: true }
      });

      if (!user || !user.isActive) {
        throw new Error('Usuário inválido');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Método para obter permissões por role
  getUserPermissions(role: string): string[] {
    const rolePermissions = {
      'SUPER_ADMIN': [
        'ALL_PERMISSIONS'
      ],
      'ADMIN': [
        'MANAGE_ASSETS',
        'MANAGE_TICKETS', 
        'APPROVE_DISPOSALS',
        'VIEW_REPORTS',
        'MANAGE_USERS'
      ],
      'GESTOR_ESCOLAR': [
        'MANAGE_SCHOOL_ASSETS',
        'VIEW_SCHOOL_TICKETS',
        'REQUEST_DISPOSAL',
        'VIEW_SCHOOL_REPORTS'
      ],
      'SOLICITANTE': [
        'VIEW_OWN_TICKETS',
        'CREATE_TICKETS'
      ]
    };
    
    return rolePermissions[role] || [];
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
            code: true,
            type: true,
          },
        },
      },
    });

    return user;
  }

  // Criar usuários padrão para demonstração
  async createDefaultUsers() {
    try {
      // Verificar se já existem usuários
      const existingUsers = await this.prisma.user.count();
      
      if (existingUsers > 0) {
        return {
          message: 'Usuários já existem',
          users: [],
          credentials: []
        };
      }

      // Criar secretaria primeiro
      const secretaria = await this.prisma.tenant.upsert({
        where: { code: 'SME001' },
        update: {},
        create: {
          name: 'Secretaria Municipal de Educação',
          type: 'SECRETARIA',
          code: 'SME001',
          address: 'Rua da Prefeitura, 123',
          phone: '(11) 3333-3333',
          email: 'sme@prefeitura.gov.br',
        }
      });

      // Criar escola de teste
      const escola = await this.prisma.tenant.upsert({
        where: { code: 'ESC001' },
        update: {},
        create: {
          name: 'EMEF Prof. João Silva',
          type: 'ESCOLA',
          code: 'ESC001',
          parentId: secretaria.id,
          address: 'Rua das Flores, 123',
          phone: '(11) 99999-9999',
          email: 'escola@teste.com',
          director: 'Maria Diretora',
        }
      });

      // Hash da senha padrão
      const hashedPassword = await bcrypt.hash('123456', 10);

      // Criar usuários
      const users = await this.prisma.user.createMany({
        data: [
          {
            name: 'Super Administrador',
            email: 'admin@sistema.gov.br',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            tenantId: null, // Super admin não tem tenant
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
        message: 'Usuários criados com sucesso',
        users: users.count,
        credentials: [
          { email: 'admin@sistema.gov.br', password: '123456', role: 'Super Administrador' },
          { email: 'admin@prefeitura.gov.br', password: '123456', role: 'Administrador' },
          { email: 'diretora@escola.com', password: '123456', role: 'Gestor Escolar' },
          { email: 'professor@escola.com', password: '123456', role: 'Solicitante' },
        ]
      };

    } catch (error) {
      console.error('Erro ao criar usuários padrão:', error);
      throw new Error('Erro ao criar usuários padrão');
    }
  }
}