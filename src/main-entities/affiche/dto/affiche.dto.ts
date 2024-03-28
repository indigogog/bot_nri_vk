import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAfficheDto {
  @IsNotEmpty()
  @IsNumber()
  idGame: number;

  @IsNotEmpty()
  @IsString()
  dog: string;
}

export class UpdateAfficheDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  dog: string;
}

export class DeleteAfficheDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class GetAffichesByDateDto {
  @IsNotEmpty()
  @IsString()
  start: string;

  @IsNotEmpty()
  @IsString()
  end: string;

  @IsOptional()
  @IsNumber()
  gameId: number;
}

export class GetAffichesByGame {
  @IsNotEmpty()
  @IsNumber()
  gameId: number;
}
