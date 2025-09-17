// src/assets/dto/create-asset.dto.ts
import { IsString, IsOptional, IsEnum, IsNumber, IsUrl } from 'class-validator';

export enum AssetStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  MANUTENCAO = 'MANUTENCAO',
  BAIXADO = 'BAIXADO'
}

export enum AssetCondition {
  OTIMO = 'OTIMO',
  BOM = 'BOM',
  REGULAR = 'REGULAR',
  RUIM = 'RUIM'
}

export class CreateAssetDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsNumber()
  purchaseValue?: number;

  @IsEnum(AssetStatus)
  status: AssetStatus;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition; // NOVO CAMPO

  @IsOptional()
  @IsString()
  imageUrl?: string; // NOVO CAMPO

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  responsible?: string;

  @IsString()
  tenantId: string;
}