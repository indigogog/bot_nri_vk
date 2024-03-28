import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AfficheEntity } from '../affiche/affiche.entity';

@Entity('game')
export class GameEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', nullable: false, unique: true })
  name: string;

  @Column({ name: 'description', nullable: false })
  description: string;

  @OneToMany(() => AfficheEntity, (affiche) => affiche.game)
  affiches: AfficheEntity[];
}
