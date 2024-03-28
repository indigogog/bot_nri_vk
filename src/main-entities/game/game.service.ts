import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameEntity } from './game.entity';
import { Repository } from 'typeorm';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
  ) {
  }

  async createGame(dto: CreateGameDto) {
    const findGame = await this.gameRepository.findOne({ where: { name: dto.name } });

    if (findGame) {
      throw new Error('Игра с таким название уже существует');
    }

    const newName = this.gameRepository.create(dto);
    return await this.gameRepository.save(newName);
  }

  async updateGame(dto: UpdateGameDto) {
    const updateObj = {};

    for (const [key, value] of Object.entries(dto)) {
      if (!value || key === 'id') {
        continue;
      }

      updateObj[key] = value;
    }

    await this.gameRepository.update({ id: dto.id }, updateObj);
  }

  async findGame(id: number) {
    return await this.gameRepository.findOne({ where: { id } });
  }

  async getAllGames() {
    return await this.gameRepository.find({ order: { id: 'ASC' } });
  }

  async deleteGame(id: number) {
    return await this.gameRepository.delete({ id });
  }
}
