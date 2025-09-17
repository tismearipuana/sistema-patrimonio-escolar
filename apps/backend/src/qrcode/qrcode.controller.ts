import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Controller('qrcode')
export class QrcodeController {
  constructor(private prisma: PrismaService) {}

  // Gerar QR Code para um ativo específico
  @Get('asset/:id')
  async generateAssetQRCode(@Param('id') id: string, @Res() res: Response) {
    try {
      const asset = await this.prisma.asset.findUnique({
        where: { id },
        include: {
          tenant: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      if (!asset) {
        return res.status(404).json({
          message: 'Ativo não encontrado!',
          error: true
        });
      }

      // URL que será codificada no QR Code
      const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/asset/${asset.id}`;
      
      // Dados para exibir no QR Code
      const qrData = JSON.stringify({
        id: asset.id,
        code: asset.code,
        name: asset.name,
        school: asset.tenant.name,
        url: qrUrl
      });

      // Gera o QR Code como imagem PNG
      const qrCodeBuffer = await QRCode.toBuffer(qrUrl, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="qrcode-${asset.code}.png"`);
      res.send(qrCodeBuffer);

    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      res.status(500).json({
        message: 'Erro ao gerar QR Code!',
        error: true
      });
    }
  }

  // Gerar QR Code como SVG (para exibir na tela)
  @Get('asset/:id/svg')
  async generateAssetQRCodeSVG(@Param('id') id: string, @Res() res: Response) {
    try {
      const asset = await this.prisma.asset.findUnique({
        where: { id },
        include: {
          tenant: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      if (!asset) {
        return res.status(404).json({
          message: 'Ativo não encontrado!',
          error: true
        });
      }

      // URL que será codificada no QR Code
      const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/asset/${asset.id}`;

      // Gera o QR Code como SVG
      const qrCodeSVG = await QRCode.toString(qrUrl, {
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(qrCodeSVG);

    } catch (error) {
      console.error('Erro ao gerar QR Code SVG:', error);
      res.status(500).json({
        message: 'Erro ao gerar QR Code SVG!',
        error: true
      });
    }
  }

  // Gerar QR Codes em lote para múltiplos ativos
  @Get('batch/:tenantId')
  async generateBatchQRCodes(@Param('tenantId') tenantId: string) {
    try {
      const assets = await this.prisma.asset.findMany({
        where: { 
          tenantId: tenantId,
          status: 'ATIVO'
        },
        include: {
          tenant: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      if (assets.length === 0) {
        return {
          message: 'Nenhum ativo ativo encontrado para esta escola!',
          error: true
        };
      }

      const qrCodes = await Promise.all(
        assets.map(async (asset) => {
          const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/asset/${asset.id}`;
          
          const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          return {
            assetId: asset.id,
            code: asset.code,
            name: asset.name,
            qrCodeDataUrl: qrCodeDataUrl,
            url: qrUrl
          };
        })
      );

      return {
        message: `${qrCodes.length} QR Codes gerados com sucesso!`,
        school: assets[0].tenant.name,
        qrCodes: qrCodes
      };

    } catch (error) {
      console.error('Erro ao gerar QR Codes em lote:', error);
      return {
        message: 'Erro ao gerar QR Codes em lote!',
        error: true
      };
    }
  }

  // Informações do ativo pelo QR Code (para quando escanear)
  @Get('info/:id')
  async getAssetInfo(@Param('id') id: string) {
    try {
      const asset = await this.prisma.asset.findUnique({
        where: { id },
        include: {
          tenant: {
            select: {
              name: true,
              code: true,
              address: true,
              phone: true,
            },
          },
        },
      });

      if (!asset) {
        return {
          message: 'Ativo não encontrado!',
          error: true
        };
      }

      return {
        message: 'Informações do ativo carregadas!',
        asset: {
          id: asset.id,
          code: asset.code,
          name: asset.name,
          description: asset.description,
          category: asset.category,
          brand: asset.brand,
          model: asset.model,
          serialNumber: asset.serialNumber,
          status: asset.status,
          location: asset.location,
          responsible: asset.responsible,
          school: {
            name: asset.tenant.name,
            code: asset.tenant.code,
            address: asset.tenant.address,
            phone: asset.tenant.phone,
          },
          qrCodeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/asset/${asset.id}`
        }
      };

    } catch (error) {
      console.error('Erro ao buscar informações do ativo:', error);
      return {
        message: 'Erro ao buscar informações do ativo!',
        error: true
      };
    }
  }
}