import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreteUserRequestDto {
  @IsNotEmpty()
  @IsNumber()
  afficheId: number;

  @IsNotEmpty()
  @IsNumber()
  userVkId: number;

  @IsOptional()
  @IsString()
  userComment?: string;
}
