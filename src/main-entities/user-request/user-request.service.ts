import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRequestEntity } from './user-request.entity';
import { MoreThan, Repository } from 'typeorm';
import { CreteUserRequestDto } from './dto/user-request.dto';
import { UserService } from '../user/user.service';
import { AfficheService } from '../affiche/affiche.service';
import { BetweenDates } from '../../bot/common/helpers/BetweenDates.helper';

@Injectable()
export class UserRequestService {
  constructor(
    @InjectRepository(UserRequestEntity)
    private readonly userRequestRepository: Repository<UserRequestEntity>,
    private readonly userService: UserService,
    private readonly afficheService: AfficheService,
  ) {
  }

  async createUserRequest(dto: CreteUserRequestDto) {
    const newRequest = this.userRequestRepository.create();

    newRequest.user = await this.userService.getUser(dto.userVkId);
    newRequest.userComment = dto.userComment;
    newRequest.idUser = newRequest.user.id;
    newRequest.affiche = await this.afficheService.getAfficheById(dto.afficheId);
    newRequest.idAffiche = dto.afficheId;
    newRequest.dateCreated = new Date();

    return await this.userRequestRepository.save(newRequest);
  }

  async addAdminComment(id: number, comment: string) {
    return await this.userRequestRepository.update({ id }, { adminComment: comment });
  }

  async getActualRequests() {
    return await this.userRequestRepository.find({
      where: {
        affiche: {
          dog: MoreThan(new Date().toDateString()),
        },
      },
      withDeleted: true,
      relations: {
        affiche: {
          game: true,
        },
        user: true,
      },
      order: {
        affiche: {
          id: 'ASC',
        },
      },
    });
  }

  async getActualRequestsByAffiche(afficheId: number) {
    return await this.userRequestRepository.find({
      where: { affiche: { id: afficheId, dog: MoreThan(new Date().toDateString()) } },
      withDeleted: true,
      relations: {
        affiche: {
          game: true,
        },
        user: true,
      },
    });
  }

  async getAllRequests() {
    return await this.userRequestRepository.find({
      relations: {
        affiche: {
          game: true,
        },
        user: true,
      },
      withDeleted: true,
      order: {
        affiche: {
          id: 'ASC',
        },
      },
    });
  }

  async getUserRequestById(id: number) {
    return await this.userRequestRepository.findOne({
      where: { id },
      relations: {
        affiche: {
          game: true,
        },
      },
    });
  }

  async getUserRequests(vkId: number) {
    return await this.userRequestRepository.find({
      where: {
        user: { vkId },
        affiche: {
          dog: MoreThan(new Date().toDateString()),
        },
      },
      relations: {
        affiche: {
          game: true,
        },
      },
    });
  }

  async getOldUserRequests(vkId: number, start: string, end: string) {
    return await this.userRequestRepository.find({
      where: {
        user: { vkId },
        affiche: { dog: BetweenDates(start, end) },
      },
      relations: {
        affiche: {
          game: true,
        },
      },
    });
  }

  async deleteUserRequest(id: number) {
    return await this.userRequestRepository.update({ id }, { dateDeleted: new Date().toISOString() });
  }
}
