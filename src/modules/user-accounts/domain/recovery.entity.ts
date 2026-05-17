import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseDbEntity } from '../../../core/domain/baseDbEntity';
import { User } from './user.entity';

@Entity()
export class Recovery extends BaseDbEntity {
  @Column({ type: 'timestamptz' })
  expiredAt: Date;

  @Column({ type: 'uuid', default: crypto.randomUUID() })
  code: string;

  @OneToOne(() => User, (user) => user.recovery, { nullable: false })
  @JoinColumn()
  user: User;

  @Column({ nullable: false })
  userId: number;

  static create(): Recovery {
    const recovery = new Recovery();

    recovery.expiredAt = new Date(Date.now() + 3.6e6);
    recovery.code = crypto.randomUUID();

    return recovery;
  }
}
