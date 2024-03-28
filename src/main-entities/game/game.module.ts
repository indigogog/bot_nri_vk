import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './game.entity';
import { GameService } from './game.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity])],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
