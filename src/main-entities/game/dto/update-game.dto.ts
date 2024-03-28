import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateGameDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;
}