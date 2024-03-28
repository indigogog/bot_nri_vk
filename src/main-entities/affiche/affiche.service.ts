import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AfficheEntity } from './affiche.entity';
import { MoreThan, Repository } from 'typeorm';
import { CreateAfficheDto, DeleteAfficheDto, UpdateAfficheDto } from './dto/affiche.dto';
import { GameService } from '../game/game.service';
import { BetweenDates } from '../../bot/common/helpers/BetweenDates.helper';
import { GetNewAfficheWithFreePlacesType } from './types/getNewAfficheWithFreePlaces.type';

@Injectable()
export class AfficheService {
  constructor(
    @InjectRepository(AfficheEntity)
    private readonly afficheRepository: Repository<AfficheEntity>,
    private readonly gameService: GameService,
  ) {}

  async createAffiche(dto: CreateAfficheDto) {
    const newAffiche = this.afficheRepository.create();

    newAffiche.game = await this.gameService.findGame(dto.idGame);
    newAffiche.dog = dto.dog;

    return await this.afficheRepository.save(newAffiche);
  }

  async updateAffiche(dto: UpdateAfficheDto) {
    const updateObj = { dog: dto.dog };

    return await this.afficheRepository.update({ id: dto.id }, updateObj);
  }

  async deleteAffiche(dto: DeleteAfficheDto) {
    return await this.afficheRepository.delete({ id: dto.id });
  }

  async getAfficheById(id: number) {
    return await this.afficheRepository.findOne({ where: { id }, relations: { game: true } });
  }

  async checkAfficheWithThisTime(dog: string) {
    return await this.afficheRepository.findOne({ where: { dog }, relations: { game: true } });
  }

  async getOldAffiches(start: string, end: string) {
    return await this.afficheRepository.find({
      where: { dog: BetweenDates(start, end) },
      relations: { game: true },
      order: { dog: 'DESC' },
    });
  }

  async getNewAffiches(): Promise<GetNewAfficheWithFreePlacesType[]> {
    const sql = `
       WITH input_params AS (
          SELECT
          a.id,
          a.dog,
          g.name
          FROM public.affiche AS a
          LEFT JOIN public.game g on g.id = a.id_game
          WHERE a.dog > $1::date
          GROUP BY a.id, g.name
      ),
       count_places AS (
           SELECT
              count(ur.id) AS "busyPlaces",
              ip.*
           FROM user_request AS ur
           RIGHT JOIN input_params ip ON ip.id = ur.id_affiche
           GROUP BY ip.id, dog, name
           )
      SELECT
          cp.*,
          6 - cp."busyPlaces"     AS "freePlaces"
      FROM count_places AS cp
    `;
    return await this.afficheRepository.query(sql, [
      new Date().toDateString(),
    ]);
  }
}
