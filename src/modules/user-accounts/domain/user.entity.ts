import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import {
  EmailConfirmation,
  EmailConfirmationSchema,
} from './email-confirmation.schema';
import { Recovery, RecoverySchema } from './recovery.schema';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true })
  login: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  createdAt: Date;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  @Prop({ type: EmailConfirmationSchema })
  emailConfirmation: EmailConfirmation;

  @Prop({ type: RecoverySchema, nullable: true, default: null })
  recovery: Recovery | null;

  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();

    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.emailConfirmation = {
      expirationDate: new Date(Date.now() + 3.6e6),
      confirmationCode: crypto.randomUUID(),
      isConfirmed: false,
    };

    return user as UserDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }

    this.deletedAt = new Date();
  }

  confirm() {
    if (this.emailConfirmation.isConfirmed) {
      throw new Error('Entity already confirmed');
    }

    if (this.emailConfirmation.expirationDate.valueOf() < Date.now()) {
      throw new Error('Entity confirmation expired');
    }

    this.emailConfirmation.isConfirmed = true;
  }

  updateEmailConfirmation() {
    if (this.emailConfirmation.isConfirmed) {
      throw new Error('Entity already confirmed');
    }

    this.emailConfirmation.expirationDate = new Date(Date.now() + 3.6e6);
    this.emailConfirmation.confirmationCode = crypto.randomUUID();
  }

  createRecovery() {
    this.recovery = {
      expirationDate: new Date(Date.now() + 3.6e6),
      code: crypto.randomUUID(),
    };
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;
export type UserModelType = Model<UserDocument> & typeof User;
