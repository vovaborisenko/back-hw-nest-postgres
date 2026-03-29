import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class EmailConfirmation {
  @Prop({ type: Date, default: Date.now() + 3.6e6 })
  expirationDate: Date;

  @Prop({ type: String, default: crypto.randomUUID() })
  confirmationCode: string;

  @Prop({ type: Boolean, default: false })
  isConfirmed: boolean;
}

export const EmailConfirmationSchema =
  SchemaFactory.createForClass(EmailConfirmation);
