import { Injectable } from '@nestjs/common';

interface DefaultConfig {
  key: string;
  value: any;
  category: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class ConfigService {
  
  // Mapear seções para categorias
  getCategoryBySection(section: string): string {
    const categoryMap: Record<string, string> = {
      // Configurações Gerais
      'institution': 'GENERAL',
      'contact': 'GENERAL',
      'regional': 'GENERAL',
      'logo': 'GENERAL',
      
      // Patrimônio
      'patrimony': 'PATRIMONY',
      'categories': 'PATRIMONY',
      'status': 'PATRIMONY',
      'prefixes': 'PATRIMONY',
      
      // QR Codes
      'qrcode': 'QRCODE',
      'qr_settings': 'QRCODE',
      
      // Relatórios
      'reports': 'REPORTS',
      'export': 'REPORTS',
      'templates': 'REPORTS',
      
      // Segurança
      'security': 'SECURITY',
      'backup': 'SECURITY',
      'audit': 'SECURITY',
      'auth': 'SECURITY',
      
      // Notificações
      'notifications': 'NOTIFICATIONS',
      'email': 'NOTIFICATIONS',
      'alerts': 'NOTIFICATIONS'
    };

    // Buscar categoria baseada na seção
    for (const [prefix, category] of Object.entries(categoryMap)) {
      if (section.startsWith(prefix)) {
        return category;
      }
    }

    // Categoria padrão
    return 'GENERAL';
  }

  // Obter label da categoria
  getCategoryLabel(category: string): string {
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

  // Obter descrição da categoria
  getCategoryDescription(category: string): string {
    const descriptionMap: Record<string, string> = {
      'GENERAL': 'Informações básicas da instituição e contatos',
      'PATRIMONY': 'Configurações de categorias, status e códigos de patrimônio',
      'QRCODE': 'Configurações de geração e layout de QR codes',
      'REPORTS': 'Templates e configurações de relatórios',
      'SECURITY': 'Configurações de segurança, backup e auditoria',
      'NOTIFICATIONS': 'Configurações de notificações e alertas'
    };

    return descriptionMap[category] || 'Configurações do sistema';
  }

  // Obter configurações padrão
  getDefaultConfigs(): DefaultConfig[] {
    return [
      // === CONFIGURAÇÕES GERAIS ===
      {
        key: 'institution',
        category: 'GENERAL',
        value: {
          name: 'Prefeitura Municipal',
          fullName: 'Prefeitura Municipal - Secretaria de Educação',
          city: 'Sua Cidade',
          state: 'SP',
          cnpj: '',
          address: 'Endereço da Prefeitura',
          cep: '',
          phone: '(11) 3333-3333',
          email: 'contato@prefeitura.gov.br',
          website: 'https://www.prefeitura.gov.br'
        }
      },
      {
        key: 'contact',
        category: 'GENERAL',
        value: {
          supportEmail: 'suporte@prefeitura.gov.br',
          supportPhone: '(11) 3333-3334',
          technicalResponsible: 'Responsável Técnico',
          technicalEmail: 'tecnico@prefeitura.gov.br',
          emergencyContact: '(11) 99999-9999'
        }
      },
      {
        key: 'logo',
        category: 'GENERAL',
        value: {
          url: '',
          width: 120,
          height: 120,
          format: 'PNG',
          maxSize: '2MB'
        }
      },

      // === PATRIMÔNIO ===
      {
        key: 'patrimony',
        category: 'PATRIMONY',
        value: {
          codePrefix: 'PAT',
          autoCode: true,
          requiredFields: ['name', 'category', 'location'],
          defaultWarrantyMonths: 12,
          depreciationEnabled: true,
          transferApprovalRequired: true
        }
      },
      {
        key: 'categories',
        category: 'PATRIMONY',
        value: [
          'INFORMÁTICA',
          'AUDIOVISUAL',
          'MOBILIÁRIO',
          'EQUIPAMENTOS',
          'FERRAMENTAS',
          'VEÍCULOS',
          'LIVROS',
          'OUTROS'
        ]
      },
      {
        key: 'status',
        category: 'PATRIMONY',
        value: [
          'ATIVO',
          'INATIVO',
          'MANUTENÇÃO',
          'BAIXADO'
        ]
      },

      // === QR CODES ===
      {
        key: 'qrcode',
        category: 'QRCODE',
        value: {
          baseUrl: 'https://patrimonio.prefeitura.gov.br',
          includeContact: true,
          includeLogo: false,
          size: 200,
          margin: 4,
          errorCorrection: 'M',
          format: 'PNG'
        }
      },
      {
        key: 'qr_settings',
        category: 'QRCODE',
        value: {
          colors: {
            foreground: '#000000',
            background: '#FFFFFF'
          },
          logoSize: 40,
          logoMargin: 8,
          borderRadius: 8,
          includeText: true,
          textSize: 12
        }
      },

      // === RELATÓRIOS ===
      {
        key: 'reports',
        category: 'REPORTS',
        value: {
          defaultFormat: 'PDF',
          includeLogos: true,
          includeCharts: true,
          autoSchedule: false,
          maxRecords: 10000,
          retention: {
            days: 90,
            autoCleanup: true
          }
        }
      },
      {
        key: 'templates',
        category: 'REPORTS',
        value: {
          inventory: {
            title: 'Relatório de Inventário',
            fields: ['code', 'name', 'category', 'location', 'status', 'value'],
            groupBy: 'category',
            includeImages: false
          },
          disposal: {
            title: 'Relatório de Baixas',
            fields: ['code', 'name', 'reason', 'value', 'date'],
            includeApprovals: true,
            requireSignatures: true
          },
          maintenance: {
            title: 'Relatório de Manutenção',
            fields: ['code', 'name', 'lastMaintenance', 'nextMaintenance', 'cost'],
            alertDays: 30
          }
        }
      },

      // === SEGURANÇA ===
      {
        key: 'security',
        category: 'SECURITY',
        value: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            expirationDays: 90
          },
          sessionTimeout: 480, // 8 horas em minutos
          maxLoginAttempts: 5,
          lockoutDuration: 30, // minutos
          twoFactorAuth: false
        }
      },
      {
        key: 'backup',
        category: 'SECURITY',
        value: {
          enabled: true,
          frequency: 'daily',
          time: '02:00',
          retention: 30, // dias
          includeFiles: true,
          compression: true,
          encryption: true
        }
      },
      {
        key: 'audit',
        category: 'SECURITY',
        value: {
          enabled: true,
          logLevel: 'INFO',
          retention: 365, // dias
          includeUserAgent: true,
          includeIP: true,
          alertOnSensitiveActions: true
        }
      },

      // === NOTIFICAÇÕES ===
      {
        key: 'notifications',
        category: 'NOTIFICATIONS',
        value: {
          enabled: true,
          channels: ['email', 'system'],
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          digestFrequency: 'daily'
        }
      },
      {
        key: 'email',
        category: 'NOTIFICATIONS',
        value: {
          smtp: {
            host: '',
            port: 587,
            secure: false,
            username: '',
            password: ''
          },
          from: 'noreply@prefeitura.gov.br',
          templates: {
            disposalRequest: 'template_disposal_request',
            disposalApproved: 'template_disposal_approved',
            ticketAssigned: 'template_ticket_assigned',
            maintenanceAlert: 'template_maintenance_alert'
          }
        }
      },
      {
        key: 'alerts',
        category: 'NOTIFICATIONS',
        value: {
          warrantyExpiring: {
            enabled: true,
            daysBefore: 30,
            recipients: ['admin@prefeitura.gov.br']
          },
          maintenanceDue: {
            enabled: true,
            daysBefore: 15,
            recipients: ['manutencao@prefeitura.gov.br']
          },
          disposalRequests: {
            enabled: true,
            immediateNotify: true,
            recipients: ['admin@prefeitura.gov.br']
          },
          systemHealth: {
            enabled: true,
            checkInterval: 60, // minutos
            recipients: ['tecnico@prefeitura.gov.br']
          }
        }
      }
    ];
  }

  // Validar configurações
  validateConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validar configurações de instituição
      if (config.institution) {
        if (!config.institution.name || config.institution.name.trim() === '') {
          errors.push('Nome da instituição é obrigatório');
        }
        if (config.institution.cnpj && !this.validateCNPJ(config.institution.cnpj)) {
          errors.push('CNPJ inválido');
        }
        if (config.institution.email && !this.validateEmail(config.institution.email)) {
          errors.push('E-mail da instituição inválido');
        }
      }

      // Validar configurações de contato
      if (config.contact) {
        if (config.contact.supportEmail && !this.validateEmail(config.contact.supportEmail)) {
          errors.push('E-mail de suporte inválido');
        }
        if (config.contact.technicalEmail && !this.validateEmail(config.contact.technicalEmail)) {
          errors.push('E-mail técnico inválido');
        }
      }

      // Validar QR Code
      if (config.qrcode) {
        if (config.qrcode.baseUrl && !this.validateURL(config.qrcode.baseUrl)) {
          errors.push('URL base do QR Code inválida');
        }
        if (config.qrcode.size && (config.qrcode.size < 50 || config.qrcode.size > 1000)) {
          warnings.push('Tamanho do QR Code deve estar entre 50 e 1000 pixels');
        }
      }

      // Validar categorias de patrimônio
      if (config.categories) {
        if (!Array.isArray(config.categories)) {
          errors.push('Categorias devem ser uma lista');
        } else if (config.categories.length === 0) {
          warnings.push('Nenhuma categoria de patrimônio definida');
        }
      }

      // Validar status de patrimônio
      if (config.status) {
        if (!Array.isArray(config.status)) {
          errors.push('Status devem ser uma lista');
        } else if (config.status.length === 0) {
          warnings.push('Nenhum status de patrimônio definido');
        }
      }

      // Validar configurações de segurança
      if (config.security) {
        if (config.security.passwordPolicy) {
          const policy = config.security.passwordPolicy;
          if (policy.minLength && policy.minLength < 6) {
            warnings.push('Comprimento mínimo de senha muito baixo (recomendado: 8+)');
          }
        }
        if (config.security.sessionTimeout && config.security.sessionTimeout < 30) {
          warnings.push('Timeout de sessão muito baixo (recomendado: 30+ minutos)');
        }
      }

      // Validar configurações de e-mail
      if (config.email && config.email.smtp) {
        const smtp = config.email.smtp;
        if (smtp.host && smtp.host.trim() === '') {
          errors.push('Host SMTP não pode estar vazio');
        }
        if (smtp.port && (smtp.port < 1 || smtp.port > 65535)) {
          errors.push('Porta SMTP inválida');
        }
      }

    } catch (error) {
      errors.push('Erro durante validação: ' + error.message);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validação de CNPJ (simples)
  private validateCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) {
      return false;
    }

    // Verifica se não são todos iguais
    if (/^(\d)\1+$/.test(cleanCNPJ)) {
      return false;
    }

    // Aqui poderia ter validação completa de CNPJ
    return true;
  }

  // Validação de e-mail
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validação de URL
  private validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Obter configuração específica com valor padrão
  getConfigValue(configs: any[], key: string, defaultValue: any = null): any {
    const config = configs.find(c => c.key === key);
    return config ? config.value : defaultValue;
  }

  // Formatar configurações para frontend
  formatConfigForFrontend(configs: any[]): any {
    const formatted = {};
    
    configs.forEach(config => {
      formatted[config.key] = config.value;
    });

    return formatted;
  }

  // Preparar configurações para backup
  prepareConfigBackup(configs: any[]): any {
    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      totalConfigs: configs.length,
      configs: configs.map(config => ({
        key: config.key,
        category: config.category,
        value: config.value,
        updatedAt: config.updatedAt
      }))
    };
  }

  // Restaurar configurações de backup
  parseConfigBackup(backupData: any): { isValid: boolean; configs?: any[]; error?: string } {
    try {
      if (!backupData.version || !backupData.configs) {
        return { isValid: false, error: 'Formato de backup inválido' };
      }

      if (!Array.isArray(backupData.configs)) {
        return { isValid: false, error: 'Lista de configurações inválida' };
      }

      const configs = backupData.configs.map(config => ({
        key: config.key,
        category: config.category || 'GENERAL',
        value: config.value
      }));

      return { isValid: true, configs };
    } catch (error) {
      return { isValid: false, error: 'Erro ao processar backup: ' + error.message };
    }
  }
}