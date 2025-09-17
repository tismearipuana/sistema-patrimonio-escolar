// prisma/seed.ts
import { PrismaClient, UserRole, TenantType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  //await prisma.user.deleteMany();
  //await prisma.tenant.deleteMany();

  console.log('🗑️  Dados existentes removidos');

  // Criar escolas (tenants)
  const escolas = await prisma.tenant.createMany({
    data: [
      {
        id: 'escola001',
        name: 'Escola Municipal João Silva',
        type: TenantType.ESCOLA,
        code: 'EM001',
        address: 'Rua das Flores, 123 - Centro',
        phone: '(11) 3456-7890',
        email: 'contato@escolajoaosilva.edu.br',
        director: 'Maria dos Santos',
        isActive: true
      },
      {
        id: 'escola002',
        name: 'Escola Municipal Ana Costa',
        type: TenantType.ESCOLA,
        code: 'EM002',
        address: 'Av. Principal, 456 - Jardim Europa',
        phone: '(11) 3456-7891',
        email: 'diretoria@escolaanacosta.edu.br',
        director: 'Carlos Alberto Lima',
        isActive: true
      },
      {
        id: 'escola003',
        name: 'Escola Municipal Pedro Santos',
        type: TenantType.ESCOLA,
        code: 'EM003',
        address: 'Rua da Educação, 789 - Vila Nova',
        phone: '(11) 3456-7892',
        email: 'secretaria@escolapedro.edu.br',
        director: 'Ana Paula Rodrigues',
        isActive: true
      },
      {
        id: 'escola004',
        name: 'Escola Municipal Rosa Parks',
        type: TenantType.ESCOLA,
        code: 'EM004',
        address: 'Praça da Liberdade, 321 - Centro',
        phone: '(11) 3456-7893',
        email: 'contato@escolarosaparks.edu.br',
        director: 'José Fernando Silva',
        isActive: true
      },
      {
        id: 'escola005',
        name: 'Escola Municipal Einstein',
        type: TenantType.ESCOLA,
        code: 'EM005',
        address: 'Rua da Ciência, 654 - Tecnópolis',
        phone: '(11) 3456-7894',
        email: 'diretoria@escolaeinstein.edu.br',
        director: 'Patricia Moreira',
        isActive: true
      }
    ]
  });

  console.log('🏫 Escolas criadas com sucesso');

  // Hash da senha padrão
  const defaultPassword = await bcrypt.hash('123456', 10);

  // Criar usuários
  const usuarios = [
    // SUPER_ADMIN
    {
      name: 'Administrador do Sistema',
      email: 'admin@sistema.gov.br',
      password: defaultPassword,
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
      isActive: true
    },
    
    // ADMIN
    {
      name: 'Coordenador de TI',
      email: 'coordenador@educacao.gov.br',
      password: defaultPassword,
      role: UserRole.ADMIN,
      tenantId: null,
      isActive: true
    },
    
    // GESTORES ESCOLARES (um para cada escola)
    {
      name: 'Maria dos Santos',
      email: 'diretor@escolajoaosilva.edu.br',
      password: defaultPassword,
      role: UserRole.GESTOR_ESCOLAR,
      tenantId: 'escola001',
      isActive: true
    },
    {
      name: 'Carlos Alberto Lima',
      email: 'diretor@escolaanacosta.edu.br',
      password: defaultPassword,
      role: UserRole.GESTOR_ESCOLAR,
      tenantId: 'escola002',
      isActive: true
    },
    {
      name: 'Ana Paula Rodrigues',
      email: 'diretor@escolapedro.edu.br',
      password: defaultPassword,
      role: UserRole.GESTOR_ESCOLAR,
      tenantId: 'escola003',
      isActive: true
    },
    {
      name: 'José Fernando Silva',
      email: 'diretor@escolarosaparks.edu.br',
      password: defaultPassword,
      role: UserRole.GESTOR_ESCOLAR,
      tenantId: 'escola004',
      isActive: true
    },
    {
      name: 'Patricia Moreira',
      email: 'diretor@escolaeinstein.edu.br',
      password: defaultPassword,
      role: UserRole.GESTOR_ESCOLAR,
      tenantId: 'escola005',
      isActive: true
    },
    
    // SOLICITANTES (professores/funcionários)
    {
      name: 'João Professor',
      email: 'joao.professor@escolajoaosilva.edu.br',
      password: defaultPassword,
      role: UserRole.SOLICITANTE,
      tenantId: 'escola001',
      isActive: true
    },
    {
      name: 'Sandra Secretária',
      email: 'sandra.secretaria@escolaanacosta.edu.br',
      password: defaultPassword,
      role: UserRole.SOLICITANTE,
      tenantId: 'escola002',
      isActive: true
    },
    {
      name: 'Roberto Coordenador',
      email: 'roberto.coord@escolapedro.edu.br',
      password: defaultPassword,
      role: UserRole.SOLICITANTE,
      tenantId: 'escola003',
      isActive: true
    },
    {
      name: 'Lúcia Bibliotecária',
      email: 'lucia.biblioteca@escolarosaparks.edu.br',
      password: defaultPassword,
      role: UserRole.SOLICITANTE,
      tenantId: 'escola004',
      isActive: true
    },
    {
      name: 'Marcos Técnico',
      email: 'marcos.tecnico@escolaeinstein.edu.br',
      password: defaultPassword,
      role: UserRole.SOLICITANTE,
      tenantId: 'escola005',
      isActive: true
    }
  ];

  for (const usuario of usuarios) {
    await prisma.user.create({
      data: usuario
    });
  }

  console.log('👥 Usuários criados com sucesso');

  // Criar algumas configurações do sistema
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'institution',
        category: 'GENERAL',
        value: {
          name: 'Secretaria Municipal de Educação',
          address: 'Rua da Prefeitura, 100 - Centro',
          phone: '(11) 3333-4444',
          email: 'educacao@prefeitura.gov.br',
          logo: ''
        }
      },
      {
        key: 'patrimony',
        category: 'PATRIMONY',
        value: {
          codePrefix: 'PAT',
          autoGenerate: true,
          requirePhoto: false,
          requireLocation: true
        }
      },
      {
        key: 'qrcode',
        category: 'QRCODE',
        value: {
          size: 200,
          includeLogo: true,
          format: 'PNG'
        }
      }
    ]
  });

  console.log('⚙️  Configurações do sistema criadas');

  console.log('\n✅ Seed concluído com sucesso!');
  console.log('\n📋 Usuários criados:');
  console.log('-----------------------------------');
  console.log('🔴 SUPER_ADMIN:');
  console.log('   Email: admin@sistema.gov.br');
  console.log('   Senha: 123456');
  console.log('');
  console.log('🟡 ADMIN:');
  console.log('   Email: coordenador@educacao.gov.br');
  console.log('   Senha: 123456');
  console.log('');
  console.log('🟢 GESTORES ESCOLARES:');
  console.log('   Email: diretor@escolajoaosilva.edu.br - Senha: 123456');
  console.log('   Email: diretor@escolaanacosta.edu.br - Senha: 123456');
  console.log('   Email: diretor@escolapedro.edu.br - Senha: 123456');
  console.log('   Email: diretor@escolarosaparks.edu.br - Senha: 123456');
  console.log('   Email: diretor@escolaeinstein.edu.br - Senha: 123456');
  console.log('');
  console.log('🔵 SOLICITANTES:');
  console.log('   Email: joao.professor@escolajoaosilva.edu.br - Senha: 123456');
  console.log('   Email: sandra.secretaria@escolaanacosta.edu.br - Senha: 123456');
  console.log('   Email: roberto.coord@escolapedro.edu.br - Senha: 123456');
  console.log('   Email: lucia.biblioteca@escolarosaparks.edu.br - Senha: 123456');
  console.log('   Email: marcos.tecnico@escolaeinstein.edu.br - Senha: 123456');
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });