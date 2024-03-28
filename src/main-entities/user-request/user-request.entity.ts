import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { AfficheEntity } from '../affiche/affiche.entity';
import { UserEntity } from '../user/user.entity';

@Entity('user_request')
export class UserRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_user', type: 'int' })
  idUser: number;

  @Column({ name: 'id_affiche', type: 'int' })
  idAffiche: number;

  @Column({ name: 'user_comment', type: 'varchar' })
  userComment?: string;

  @Column({ name: 'admin_comment', type: 'varchar' })
  adminComment?: string;

  @DeleteDateColumn({ name: 'date_deleted', type: 'timestamp without time zone' })
  dateDeleted: Date;

  @CreateDateColumn({ name: 'date_created', type: 'timestamp without time zone' })
  dateCreated: Date;

  @ManyToOne(() => AfficheEntity, (affiche) => affiche.userRequests)
  @JoinColumn({
    name: 'id_affiche',
    referencedColumnName: 'id',
  })
  affiche: AfficheEntity;

  @ManyToOne(() => UserEntity, (user) => user.requests)
  @JoinColumn({
    name: 'id_user',
    referencedColumnName: 'id',
  })
  user: UserEntity;
}
