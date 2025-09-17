import { Controller, Get, Put, Post, Body, Param, Query, HttpException, HttpStatus, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface UpdateConfigDto {
  config: any;
  updatedBy?: string;
}

@Controller('config')
export class ConfigController {
  constructor(
    private prisma: PrismaService,
  ) {}

  // ===== NOVO ENDPOINT: Buscar configurações gerais formatadas =====
  @Get('general')
  async getGeneralConfig() {
    try {
      // Buscar todas as configurações da categoria GENERAL
      const configs = await this.prisma.systemConfig.findMany({
        where: { 
          category: 'GENERAL' 
        }
      });

      // Formatar as configurações para o frontend
      const formattedConfig = {
        // Informações da Instituição
        institutionName: '',
        institutionType: 'Órgão Público Municipal',
        cnpj: '',
        stateRegistration: '',
        municipalRegistration: '',
        
        // Endereço
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: 'SP',
        zipCode: '',
        
        // Contatos
        mainPhone: '',
        secondaryPhone: '',
        whatsapp: '',
        email: '',
        supportEmail: '',
        website: '',
        
        // Redes Sociais
        facebook: '',
        instagram: '',
        twitter: '',
        
        // Sistema
        systemName: 'Sistema de Patrimônio Escolar',
        systemVersion: '2.0.0',
        maintenanceMode: false,
        maintenanceMessage: '',
        
        // Email
        emailHost: 'smtp.gmail.com',
        emailPort: '587',
        emailUser: '',
        emailPassword: '',
        emailSSL: true,
        
        // Notificações
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        enableWhatsAppNotifications: false,
        
        // Backup
        autoBackup: true,
        backupTime: '03:00',
        backupRetentionDays: 30,
        
        // Visual
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        logoUrl: '',
        faviconUrl: '',
        
        // Regional
        timezone: 'America/Sao_Paulo',
        dateFormat: 'DD/MM/YYYY',
        currency: 'BRL',
        language: 'pt-BR'
      };

      // Processar configurações do banco
      for (const config of configs) {
        try {
          const value = JSON.parse(String(config.value));
          
          // Mapear valores baseado na chave
          if (config.key === 'institution') {
            formattedConfig.institutionName = value.name || '';
            formattedConfig.institutionType = value.type || formattedConfig.institutionType;
            formattedConfig.cnpj = value.cnpj || '';
            formattedConfig.stateRegistration = value.stateRegistration || '';
            formattedConfig.municipalRegistration = value.municipalRegistration || '';
            formattedConfig.address = value.address || '';
            formattedConfig.number = value.number || '';
            formattedConfig.complement = value.complement || '';
            formattedConfig.neighborhood = value.neighborhood || '';
            formattedConfig.city = value.city || '';
            formattedConfig.state = value.state || 'SP';
            formattedConfig.zipCode = value.zipCode || '';
          }
          
          if (config.key === 'contact') {
            formattedConfig.mainPhone = value.mainPhone || '';
            formattedConfig.secondaryPhone = value.secondaryPhone || '';
            formattedConfig.whatsapp = value.whatsapp || '';
            formattedConfig.email = value.email || '';
            formattedConfig.supportEmail = value.supportEmail || '';
            formattedConfig.website = value.website || '';
            formattedConfig.facebook = value.facebook || '';
            formattedConfig.instagram = value.instagram || '';
            formattedConfig.twitter = value.twitter || '';
          }
          
          if (config.key === 'system') {
            formattedConfig.systemName = value.name || formattedConfig.systemName;
            formattedConfig.systemVersion = value.version || formattedConfig.systemVersion;
            formattedConfig.maintenanceMode = value.maintenanceMode || false;
            formattedConfig.maintenanceMessage = value.maintenanceMessage || '';
          }
          
          if (config.key === 'email') {
            formattedConfig.emailHost = value.host || formattedConfig.emailHost;
            formattedConfig.emailPort = value.port || formattedConfig.emailPort;
            formattedConfig.emailUser = value.user || '';
            formattedConfig.emailPassword = value.password ? '********' : '';
            formattedConfig.emailSSL = value.ssl !== undefined ? value.ssl : true;
          }
          
          if (config.key === 'visual') {
            formattedConfig.primaryColor = value.primaryColor || formattedConfig.primaryColor;
            formattedConfig.secondaryColor = value.secondaryColor || formattedConfig.secondaryColor;
            formattedConfig.logoUrl = value.logoUrl || '';
            formattedConfig.faviconUrl = value.faviconUrl || '';
          }
          
          if (config.key === 'regional') {
            formattedConfig.timezone = value.timezone || formattedConfig.timezone;
            formattedConfig.dateFormat = value.dateFormat || formattedConfig.dateFormat;
            formattedConfig.currency = value.currency || formattedConfig.currency;
            formattedConfig.language = value.language || formattedConfig.language;
          }
          
        } catch (e) {
          // Se não for JSON, usar o valor direto
          if (config.key in formattedConfig) {
            formattedConfig[config.key] = config.value;
          }
        }
      }

      return {
        success: true,
        data: formattedConfig
      };
    } catch (error) {
      console.error('Erro ao buscar configurações gerais:', error);
      throw new HttpException('Erro ao buscar configurações', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===== NOVO ENDPOINT: Atualizar configurações gerais =====
  @Put('general')
  async updateGeneralConfig(@Body() dto: any) {
    try {
      const configData = dto;
      const updates = [];

      // Preparar configurações para salvar
      const institution = {
        name: configData.institutionName,
        type: configData.institutionType,
        cnpj: configData.cnpj,
        stateRegistration: configData.stateRegistration,
        municipalRegistration: configData.municipalRegistration,
        address: configData.address,
        number: configData.number,
        complement: configData.complement,
        neighborhood: configData.neighborhood,
        city: configData.city,
        state: configData.state,
        zipCode: configData.zipCode
      };

      const contact = {
        mainPhone: configData.mainPhone,
        secondaryPhone: configData.secondaryPhone,
        whatsapp: configData.whatsapp,
        email: configData.email,
        supportEmail: configData.supportEmail,
        website: configData.website,
        facebook: configData.facebook,
        instagram: configData.instagram,
        twitter: configData.twitter
      };

      const system = {
        name: configData.systemName,
        version: configData.systemVersion,
        maintenanceMode: configData.maintenanceMode,
        maintenanceMessage: configData.maintenanceMessage
      };

      const email = {
        host: configData.emailHost,
        port: configData.emailPort,
        user: configData.emailUser,
        password: configData.emailPassword !== '********' ? configData.emailPassword : undefined,
        ssl: configData.emailSSL
      };

      const visual = {
        primaryColor: configData.primaryColor,
        secondaryColor: configData.secondaryColor,
        logoUrl: configData.logoUrl,
        faviconUrl: configData.faviconUrl
      };

      const regional = {
        timezone: configData.timezone,
        dateFormat: configData.dateFormat,
        currency: configData.currency,
        language: configData.language
      };

      // Salvar cada seção
      const sections = [
        { key: 'institution', value: institution },
        { key: 'contact', value: contact },
        { key: 'system', value: system },
        { key: 'email', value: email },
        { key: 'visual', value: visual },
        { key: 'regional', value: regional }
      ];

      for (const section of sections) {
        // Não atualizar senha se for mascarada
        if (section.key === 'email') {
  const emailValue = section.value as any;
  if (emailValue.password === undefined) {
    const existing = await this.prisma.systemConfig.findUnique({
      where: { key: 'email' }
    });
    if (existing) {
      try {
        const existingValue = JSON.parse(String(existing.value));
        emailValue.password = existingValue.password;
      } catch (e) {}
    }
  }
}

        await this.prisma.systemConfig.upsert({
          where: { key: section.key },
          update: {
            value: JSON.stringify(section.value),
            category: 'GENERAL',
            updatedAt: new Date()
          },
          create: {
            key: section.key,
            value: JSON.stringify(section.value),
            category: 'GENERAL'
          }
        });
      }

      return {
        success: true,
        message: 'Configurações atualizadas com sucesso'
      };
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw new HttpException('Erro ao atualizar configurações', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===== NOVO ENDPOINT: Upload de logo =====
  @Post('upload-logo')
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      destination: './uploads/logos',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `logo-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new Error('Apenas imagens são permitidas!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 2 * 1024 * 1024 // 2MB
    }
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('Arquivo não enviado', HttpStatus.BAD_REQUEST);
    }

    try {
      const logoUrl = `/uploads/logos/${file.filename}`;
      
      // Atualizar configuração visual com novo logo
      const existing = await this.prisma.systemConfig.findUnique({
        where: { key: 'visual' }
      });

      let visualConfig = {
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        logoUrl: logoUrl,
        faviconUrl: ''
      };

      if (existing) {
        try {
          visualConfig = { ...JSON.parse(String(existing.value)), logoUrl };
        } catch (e) {}
      }

      await this.prisma.systemConfig.upsert({
        where: { key: 'visual' },
        update: {
          value: JSON.stringify(visualConfig),
          updatedAt: new Date()
        },
        create: {
          key: 'visual',
          value: JSON.stringify(visualConfig),
          category: 'GENERAL'
        }
      });

      return {
        success: true,
        message: 'Logo enviado com sucesso',
        data: {
          url: logoUrl,
          filename: file.filename
        }
      };
    } catch (error) {
      throw new HttpException('Erro ao fazer upload do logo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ===== ENDPOINTS EXISTENTES MANTIDOS =====

  // Buscar todas as configurações
  @Get()
  async getConfig(@Query('category') category?: string) {
    console.log('GET /api/config chamado');
    try {
      const whereClause = category ? { category } : {};
      const configs = await this.prisma.systemConfig.findMany({
        where: whereClause,
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      });

      console.log('Configurações encontradas:', configs.length);
      
      if (category) {
        const config = configs.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        return { 
          category,
          config,
          count: configs.length
        };
      }

      const configByCategory = configs.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = {};
        }
        acc[item.category][item.key] = item.value;
        return acc;
      }, {});

      const flatConfig = configs.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});

      return { 
        config: flatConfig,
        configByCategory,
        totalConfigs: configs.length
      };
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      throw new HttpException('Erro ao carregar configurações', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Buscar configurações por categoria específica
  @Get('category/:category')
  async getConfigByCategory(@Param('category') category: string) {
    try {
      const configs = await this.prisma.systemConfig.findMany({
        where: { category },
        orderBy: { key: 'asc' }
      });

      const config = configs.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});

      return {
        message: `Configurações da categoria ${category} carregadas`,
        category,
        config,
        count: configs.length
      };
    } catch (error) {
      console.error(`Erro ao buscar configurações da categoria ${category}:`, error);
      throw new HttpException('Erro ao carregar configurações da categoria', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Listar categorias disponíveis
  @Get('categories')
  async getCategories() {
    try {
      const categories = await this.prisma.systemConfig.groupBy({
        by: ['category'],
        _count: {
          category: true
        }
      });

      const categoriesInfo = categories.map(cat => ({
        category: cat.category,
        count: cat._count.category,
        label: this.getCategoryLabel(cat.category),
        description: this.getCategoryDescription(cat.category)
      }));

      return {
        message: 'Categorias carregadas',
        categories: categoriesInfo
      };
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw new HttpException('Erro ao carregar categorias', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Atualizar configurações
  @Put()
  async updateConfig(@Body() data: UpdateConfigDto) {
    console.log('PUT /api/config chamado');
    console.log('Seções recebidas:', Object.keys(data.config || {}));
    
    try {
      if (!data.config) {
        return {
          message: 'Dados de configuração são obrigatórios',
          error: true
        };
      }

      const configData = data.config;
      const configSections = Object.keys(configData);
      const updatedConfigs: any[] = [];
      
      for (const section of configSections) {
        console.log(`Salvando seção: ${section}`);

        const category = this.getCategoryBySection(section);

        const currentConfig = await this.prisma.systemConfig.findUnique({
          where: { key: section }
        });

        const config = await this.prisma.systemConfig.upsert({
          where: { key: section },
          update: { 
            value: configData[section],
            category,
            updatedAt: new Date()
          },
          create: { 
            key: section, 
            value: configData[section],
            category
          }
        });

        updatedConfigs.push(config);

        if (data.updatedBy) {
          await this.prisma.auditLog.create({
            data: {
              userId: data.updatedBy,
              action: 'UPDATE_CONFIG',
              resourceType: 'SYSTEM_CONFIG',
              resourceId: config.id,
              oldValues: currentConfig ? JSON.stringify(currentConfig.value) : undefined,
              newValues: JSON.stringify(config.value),
            }
          });
        }
      }

      return { 
        message: 'Configurações salvas com sucesso',
        timestamp: new Date(),
        sectionsUpdated: configSections.length,
        sections: configSections
      };
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw new HttpException('Erro ao salvar configurações', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Atualizar configuração específica por categoria
  @Put('category/:category')
  async updateConfigByCategory(
    @Param('category') category: string, 
    @Body() data: { config: any; updatedBy?: string }
  ) {
    try {
      if (!data.config) {
        return {
          message: 'Dados de configuração são obrigatórios',
          error: true
        };
      }

      const configKeys = Object.keys(data.config);
      const updatedConfigs: any[] = [];

      for (const key of configKeys) {
        const fullKey = `${category}.${key}`;
        
        const currentConfig = await this.prisma.systemConfig.findUnique({
          where: { key: fullKey }
        });

        const config = await this.prisma.systemConfig.upsert({
          where: { key: fullKey },
          update: { 
            value: data.config[key],
            category,
            updatedAt: new Date()
          },
          create: { 
            key: fullKey, 
            value: data.config[key],
            category
          }
        });

        updatedConfigs.push(config);

        if (data.updatedBy) {
          await this.prisma.auditLog.create({
            data: {
              userId: data.updatedBy,
              action: 'UPDATE_CONFIG_CATEGORY',
              resourceType: 'SYSTEM_CONFIG',
              resourceId: config.id,
              oldValues: currentConfig ? JSON.stringify(currentConfig.value) : undefined,
              newValues: JSON.stringify(config.value),
            }
          });
        }
      }

      return {
        message: `Configurações da categoria ${category} atualizadas com sucesso`,
        category,
        keysUpdated: configKeys.length,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Erro ao atualizar categoria ${category}:`, error);
      throw new HttpException('Erro ao atualizar configurações da categoria', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Exportar configurações
  @Get('export')
  async exportConfig(@Query('category') category?: string) {
    try {
      const whereClause = category ? { category } : {};
      const configs = await this.prisma.systemConfig.findMany({
        where: whereClause,
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      });
      
      const configByCategory = configs.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = {};
        }
        acc[item.category][item.key] = {
          value: item.value,
          updatedAt: item.updatedAt
        };
        return acc;
      }, {});

      const flatConfig = configs.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});

      return {
        config: flatConfig,
        configByCategory,
        metadata: {
          exportedAt: new Date(),
          version: '2.0',
          totalConfigs: configs.length,
          categories: Object.keys(configByCategory),
          category: category || 'all'
        }
      };
    } catch (error) {
      console.error('Erro ao exportar configurações:', error);
      throw new HttpException('Erro ao exportar configurações', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Importar configurações
  @Post('import')
  async importConfig(@Body() data: { config: any; importedBy?: string; overwrite?: boolean }) {
    try {
      if (!data.config) {
        return {
          message: 'Dados de configuração são obrigatórios',
          error: true
        };
      }

      const configData = data.config;
      const configKeys = Object.keys(configData);
      const importedConfigs: any[] = [];
      const skippedConfigs: string[] = [];

      for (const key of configKeys) {
        const category = this.getCategoryBySection(key);

        if (!data.overwrite) {
          const existingConfig = await this.prisma.systemConfig.findUnique({
            where: { key }
          });

          if (existingConfig) {
            skippedConfigs.push(key);
            continue;
          }
        }

        const config = await this.prisma.systemConfig.upsert({
          where: { key },
          update: { 
            value: configData[key],
            category,
            updatedAt: new Date()
          },
          create: { 
            key, 
            value: configData[key],
            category
          }
        });

        importedConfigs.push(config);

        if (data.importedBy) {
          await this.prisma.auditLog.create({
            data: {
              userId: data.importedBy,
              action: 'IMPORT_CONFIG',
              resourceType: 'SYSTEM_CONFIG',
              resourceId: config.id,
              newValues: JSON.stringify(config.value),
            }
          });
        }
      }

      return {
        message: 'Configurações importadas com sucesso',
        imported: importedConfigs.length,
        skipped: skippedConfigs.length,
        skippedKeys: skippedConfigs,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      throw new HttpException('Erro ao importar configurações', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Resetar configurações para padrões
  @Post('reset')
  async resetConfig(@Body() data: { category?: string; resetBy?: string }) {
    try {
      const defaultConfigs = this.getDefaultConfigs();
      
      let configsToReset = defaultConfigs;
      if (data.category) {
        configsToReset = defaultConfigs.filter(config => config.category === data.category);
      }

      const resetConfigs: any[] = [];

      for (const defaultConfig of configsToReset) {
        const config = await this.prisma.systemConfig.upsert({
          where: { key: defaultConfig.key },
          update: { 
            value: defaultConfig.value,
            category: defaultConfig.category,
            updatedAt: new Date()
          },
          create: defaultConfig
        });

        resetConfigs.push(config);

        if (data.resetBy) {
          await this.prisma.auditLog.create({
            data: {
              userId: data.resetBy,
              action: 'RESET_CONFIG',
              resourceType: 'SYSTEM_CONFIG',
              resourceId: config.id,
              newValues: JSON.stringify(config.value),
            }
          });
        }
      }

      return {
        message: data.category 
          ? `Configurações da categoria ${data.category} resetadas` 
          : 'Todas as configurações resetadas para padrões',
        resetCount: resetConfigs.length,
        category: data.category || 'all',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao resetar configurações:', error);
      throw new HttpException('Erro ao resetar configurações', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Validar configurações
  @Post('validate')
  async validateConfig(@Body() configData: any) {
    try {
      const validationResult = this.validateConfigData(configData);
      
      return {
        message: 'Validação concluída',
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings
      };
    } catch (error) {
      console.error('Erro ao validar configurações:', error);
      throw new HttpException('Erro ao validar configurações', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Histórico de alterações de configuração
  @Get('history/:key')
  async getConfigHistory(@Param('key') key: string) {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key }
      });

      if (!config) {
        throw new HttpException('Configuração não encontrada', HttpStatus.NOT_FOUND);
      }

      const history = await this.prisma.auditLog.findMany({
        where: {
          resourceType: 'SYSTEM_CONFIG',
          resourceId: config.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        message: 'Histórico carregado',
        config: {
          key: config.key,
          category: config.category,
          currentValue: config.value,
          updatedAt: config.updatedAt
        },
        history: history.map(log => ({
          id: log.id,
          action: log.action,
          user: log.user,
          oldValues: log.oldValues,
          newValues: log.newValues,
          createdAt: log.createdAt
        }))
      };
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Erro ao carregar histórico', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Inicializar configurações padrão
  @Post('initialize')
  async initializeDefaultConfigs(@Body() data: { initializedBy?: string }) {
    try {
      const existingConfigs = await this.prisma.systemConfig.count();
      
      if (existingConfigs > 0) {
        return {
          message: 'Configurações já foram inicializadas',
          existingCount: existingConfigs
        };
      }

      const defaultConfigs = this.getDefaultConfigs();
      
      await this.prisma.systemConfig.createMany({
        data: defaultConfigs
      });

      if (data.initializedBy) {
        await this.prisma.auditLog.create({
          data: {
            userId: data.initializedBy,
            action: 'INITIALIZE_CONFIGS',
            resourceType: 'SYSTEM_CONFIG',
            resourceId: 'all',
            newValues: JSON.stringify({ count: defaultConfigs.length }),
          }
        });
      }

      return {
        message: 'Configurações padrão inicializadas com sucesso',
        configsCreated: defaultConfigs.length,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao inicializar configurações:', error);
      throw new HttpException('Erro ao inicializar configurações', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint de teste
  @Get('test')
  async test() {
    return { 
      message: 'Config Controller funcionando!', 
      timestamp: new Date(),
      route: '/api/config/test',
      version: '2.0'
    };
  }

  // ===== MÉTODOS PRIVADOS AUXILIARES =====
  
  private getCategoryBySection(section: string): string {
    const categoryMap: Record<string, string> = {
      'institution': 'GENERAL',
      'contact': 'GENERAL',
      'logo': 'GENERAL',
      'visual': 'GENERAL',
      'regional': 'GENERAL',
      'system': 'GENERAL',
      'email': 'GENERAL',
      'patrimony': 'PATRIMONY',
      'categories': 'PATRIMONY',
      'status': 'PATRIMONY',
      'qrcode': 'QRCODE',
      'reports': 'REPORTS',
      'security': 'SECURITY',
      'notifications': 'NOTIFICATIONS'
    };

    for (const [prefix, category] of Object.entries(categoryMap)) {
      if (section.startsWith(prefix)) {
        return category;
      }
    }
    return 'GENERAL';
  }

  private getCategoryLabel(category: string): string {
    const labelMap: Record<string, string> = {
      'GENERAL': 'Configurações Gerais',
      'PATRIMONY': 'Patrimônio',
      'QRCODE': 'QR Codes',
      'REPORTS': 'Relatórios',
      'SECURITY': 'Segurança',
      'NOTIFICATIONS': 'Notificações'
    };
    return labelMap[category] || category;
  }

  private getCategoryDescription(category: string): string {
    const descriptionMap: Record<string, string> = {
      'GENERAL': 'Informações básicas da instituição e contatos',
      'PATRIMONY': 'Configurações de categorias, status e códigos',
      'QRCODE': 'Configurações de geração e layout de QR codes',
      'REPORTS': 'Templates e configurações de relatórios',
      'SECURITY': 'Configurações de segurança e auditoria',
      'NOTIFICATIONS': 'Configurações de notificações e alertas'
    };
    return descriptionMap[category] || 'Configurações do sistema';
  }

  private validateConfigData(config: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config) {
      errors.push('Dados de configuração são obrigatórios');
      return { isValid: false, errors, warnings };
    }

    if (config.institution && !config.institution.name) {
      errors.push('Nome da instituição é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private getDefaultConfigs(): any[] {
    return [
      {
        key: 'institution',
        category: 'GENERAL',
        value: JSON.stringify({
          name: 'Prefeitura Municipal',
          fullName: 'Prefeitura Municipal - Secretaria de Educação',
          city: 'Sua Cidade',
          state: 'SP'
        })
      },
      {
        key: 'categories',
        category: 'PATRIMONY',
        value: JSON.stringify([
          'INFORMÁTICA',
          'AUDIOVISUAL',
          'MOBILIÁRIO',
          'EQUIPAMENTOS'
        ])
      },
      {
        key: 'qrcode',
        category: 'QRCODE',
        value: JSON.stringify({
          baseUrl: 'https://patrimonio.prefeitura.gov.br',
          includeContact: true,
          includeLogo: false
        })
      }
    ];
  }
}