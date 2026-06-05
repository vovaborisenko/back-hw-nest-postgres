import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { EmailConfirmation } from './email-confirmation.entity';
import { Recovery } from './recovery.entity';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { BaseDbEntity } from '../../../core/domain/baseDbEntity';
import { SecurityDevice } from '../security-devices/domain/security-device.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-code';
import { Comment } from '../../bloggers-platform/comments/domain/comment.entity';
import { PlayerProgress } from '../../quiz/player-progress/domain/player-progress.entity';

@Entity()
export class User extends BaseDbEntity {
  @Column({ unique: true })
  login: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @OneToOne(
    () => EmailConfirmation,
    (emailConfirmation) => emailConfirmation.user,
    { cascade: true },
  )
  emailConfirmation: EmailConfirmation;

  @OneToOne(() => Recovery, (recovery) => recovery.user, { cascade: true })
  recovery: Recovery | null;

  @OneToMany(() => SecurityDevice, (sd) => sd.user, {
    orphanedRowAction: 'soft-delete',
  })
  securityDevices: SecurityDevice[];

  @OneToMany(() => Comment, (comment) => comment.author, {
    orphanedRowAction: 'soft-delete',
  })
  comments: Comment[];

  @OneToMany(() => PlayerProgress, (player) => player.user)
  playerProgresses: PlayerProgress[];

  static create(dto: CreateUserDomainDto): User {
    const user = new this();

    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.emailConfirmation = EmailConfirmation.create();

    return user;
  }

  confirm() {
    if (this.emailConfirmation.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Entity already confirmed',
        extensions: [{ field: 'code', message: 'already confirmed' }],
      });
    }

    if (this.emailConfirmation.expirationDate.valueOf() < Date.now()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Entity confirmation expired',
        extensions: [{ field: 'code', message: 'expired' }],
      });
    }

    this.emailConfirmation.isConfirmed = true;
  }

  updateEmailConfirmation() {
    if (this.emailConfirmation.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Entity already confirmed',
        extensions: [{ field: 'email', message: 'already confirmed' }],
      });
    }

    this.emailConfirmation.expirationDate = new Date(Date.now() + 3.6e6);
    this.emailConfirmation.confirmationCode = crypto.randomUUID();
  }

  createRecoveryCode() {
    this.recovery = Recovery.create();
  }
}
