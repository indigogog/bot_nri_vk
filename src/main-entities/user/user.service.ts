import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
  }

  async createUser(dto: CreateUserDto) {
    const findUser = await this.userRepository.findOne({ where: { vkId: dto.vkId } });

    if (findUser) {
      return;
    }

    const newUser = this.userRepository.create();
    newUser.vkId = dto.vkId;
    newUser.firstname = dto.firstname;
    newUser.lastname = dto.lastname;
    newUser.sex = dto.sex;
    newUser.dateCreated = new Date();

    if (dto.dob) {
      newUser.dob = dto.dob;

      if (dto.dob.length > 4 && dayjs(dto.dob).isValid()) {
        newUser.age = dayjs().diff(dayjs(dto.dob), 'years');
      }
    }

    await this.userRepository.save(newUser);
    return 'ok';
  }

  async getUser(vkId: number) {
    return await this.userRepository.findOne({ where: { vkId } });
  }

  async updateUserData(vkId: number, field: 'firstname' | 'lastname' | 'age' | 'communication' | 'sex', data: string) {
    const updateData = {};
    updateData[field] = data;
    return await this.userRepository.update({ vkId }, updateData);
  }
}
