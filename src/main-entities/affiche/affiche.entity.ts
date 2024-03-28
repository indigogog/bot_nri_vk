import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GameEntity } from '../game/game.entity';
import { UserRequestEntity } from '../user-request/user-request.entity';

@Entity('affiche')
export class AfficheEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dog', type: 'timestamp without time zone' })
  dog: string; //date of game

  @Column({ name: 'id_game', type: 'int' })
  idGame: number;

  @OneToMany(() => UserRequestEntity, (request) => request.affiche)
  userRequests: UserRequestEntity[];

  @ManyToOne(() => GameEntity, (game) => game.affiches)
  @JoinColumn({
    name: 'id_game',
    referencedColumnName: 'id',
  })
  game: GameEntity;
}
