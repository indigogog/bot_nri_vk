import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfficheEntity } from './affiche.entity';
import { GameModule } from '../game/game.module';
import { AfficheService } from './affiche.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AfficheEntity]),
    GameModule,
  ],
  providers: [AfficheService],
  exports: [AfficheService],
})
export class AfficheModule {
}