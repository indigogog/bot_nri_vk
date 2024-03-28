import { Module } from '@nestjs/common';
import { UserRequestService } from './user-request.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfficheModule } from '../affiche/affiche.module';
import { UserRequestEntity } from './user-request.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRequestEntity]),
    UserModule,
    AfficheModule,
  ],
  providers: [UserRequestService],
  exports: [UserRequestService],
})
export class UserRequestModule {
}