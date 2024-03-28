import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRequestEntity } from '../user-request/user-request.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vk_id', unique: true })
  vkId: number;

  @Column({ name: 'firstname', nullable: false })
  firstname: string;

  @Column({ name: 'lastname', nullable: false })
  lastname: string;

  @Column({ name: 'dob', type: 'varchar' })
  dob: string;

  @Column({ name: 'sex', type: 'varchar' })
  sex: string;

  @Column({ name: 'communication', type: 'varchar' })
  communication: string;

  @Column({ name: 'age', type: 'smallint' })
  age: number;

  @CreateDateColumn({ name: 'date_created', type: 'timestamp without time zone' })
  dateCreated: Date;

  @OneToMany(() => UserRequestEntity, (request) => request.user)
  requests: UserRequestEntity[];
}
