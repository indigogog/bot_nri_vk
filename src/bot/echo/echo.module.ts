import { Module } from '@nestjs/common';
import { EchoUpdate } from './echo.update';
import { FirstScene } from '../scenes/first.scene';
import { AdminMainScene } from '../scenes/admin/admin-main.scene';
import { UserRequestModule } from '../../main-entities/user-request/user-request.module';
import { GameModule } from '../../main-entities/game/game.module';
import { GameScene } from '../scenes/game/game.scene';
import { UpdateGameScene } from '../scenes/admin/game/update-game.scene';
import { CreateGameScene } from '../scenes/admin/game/create-game.scene';
import { deleteGameScene } from '../scenes/admin/game/delete-game.scene';
import { AfficheModule } from '../../main-entities/affiche/affiche.module';
import { AfficheScene } from '../scenes/affiche/affiche.scene';
import { CreateAfficheScene } from '../scenes/admin/affiche/create-affiche.scene';
import { ShowAfficheScene } from '../scenes/affiche/show-affiche.scene';
import { UpdateAfficheScene } from '../scenes/admin/affiche/update-affiche.scene';
import { DeleteAfficheScene } from '../scenes/admin/affiche/delete-affiche.scene';
import { UserModule } from '../../main-entities/user/user.module';
import { SubScene } from '../scenes/sub/sub.scene';
import { CreateUserRequestScene } from '../scenes/user-request/create-user-request.scene';
import { UserRequestScene } from '../scenes/user-request/user-request.scene';
import { MyRequestsScene } from '../scenes/user-request/my-requests.scene';
import { DeleteUserRequestScene } from '../scenes/user-request/delete-user-request.scene';
import { GetUserRequestsScene } from '../scenes/admin/user-request/get-user-requests.scene';
import { UpdateUserDataScene } from '../scenes/user/update-user-data.scene';
import { CommentUserRequestScene } from '../scenes/admin/user-request/comment-user-request.scene';

@Module({
  imports: [UserRequestModule, GameModule, AfficheModule, UserModule],
  providers: [
    EchoUpdate,
    FirstScene,
    AdminMainScene,
    GameScene,
    UpdateGameScene,
    CreateGameScene,
    deleteGameScene,
    AfficheScene,
    CreateAfficheScene,
    ShowAfficheScene,
    UpdateAfficheScene,
    DeleteAfficheScene,
    SubScene,
    CreateUserRequestScene,
    UserRequestScene,
    MyRequestsScene,
    DeleteUserRequestScene,
    GetUserRequestsScene,
    UpdateUserDataScene,
    CommentUserRequestScene,
  ],
})
export class EchoModule {
}
