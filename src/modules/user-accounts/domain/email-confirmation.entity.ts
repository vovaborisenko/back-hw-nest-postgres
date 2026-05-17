import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseDbEntity } from '../../../core/domain/baseDbEntity';
import { User } from './user.entity';

@Entity()
export class EmailConfirmation extends BaseDbEntity {
  @Column({ type: 'timestamptz', default: new Date(Date.now() + 3.6e6) })
  expirationDate: Date;

  @Column({ type: 'uuid', default: crypto.randomUUID() })
  confirmationCode: string;

  @Column({ default: false })
  isConfirmed: boolean;

  @OneToOne(() => User, (user) => user.emailConfirmation, { nullable: false })
  @JoinColumn()
  user: User;

  @Column({ nullable: false })
  userId: number;

  static create(): EmailConfirmation {
    const emailConfirmation = new EmailConfirmation();

    emailConfirmation.expirationDate = new Date(Date.now() + 3.6e6);
    emailConfirmation.confirmationCode = crypto.randomUUID();
    emailConfirmation.isConfirmed = false;

    return emailConfirmation;
  }
}
