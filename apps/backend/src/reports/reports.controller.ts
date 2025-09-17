import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ReportsService, DashboardData, ReportsFilters } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('test')
  testEndpoint() {
    console.log('=== TESTE: Reports controller funcionando! ===');
    return { 
      message: 'Reports controller funcionando!', 
      timestamp: new Date(),
      success: true 
    };
  }

  @Get('dashboard')
  async getDashboard(
    @Query('period') period?: string,
    @Query('schoolId') schoolId?: string,
    @Query('category') category?: string
  ): Promise<DashboardData> {
    try {
      console.log('=== DASHBOARD ENDPOINT CHAMADO ===');
      console.log('Query params:', { period, schoolId, category });
      
      // Mock user como SUPER_ADMIN para ver todos os dados
      const filters: ReportsFilters = {
        period: period || 'month',
        schoolId: schoolId || 'all', 
        category: category || 'all',
        userRole: 'SUPER_ADMIN',
        userTenantId: undefined
      };

      console.log('Filtros que serão aplicados:', filters);
      
      const dashboardData = await this.reportsService.getDashboardData(filters);
      
      console.log('Dados retornados com sucesso!');
      console.log('Total de ativos:', dashboardData.totalAssets);
      
      return dashboardData;

    } catch (error) {
      console.error('ERRO no dashboard endpoint:', error);
      throw new HttpException(
        `Erro ao buscar relatórios: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('inventory')
  async getInventoryReport() {
    return {
      message: 'Relatório de inventário em desenvolvimento',
      timestamp: new Date()
    };
  }

  @Get('maintenance') 
  async getMaintenanceReport() {
    return {
      message: 'Relatório de manutenção em desenvolvimento',
      timestamp: new Date()
    };
  }

  @Get('movements')
  async getMovementsReport() {
    return {
      message: 'Relatório de movimentações em desenvolvimento', 
      timestamp: new Date()
    };
  }
}