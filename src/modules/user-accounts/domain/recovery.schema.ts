import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Recovery {
  @Prop({ type: Date, required: true })
  expirationDate: Date;

  @Prop({ type: String, required: true })
  code: string;
}

export const RecoverySchema = SchemaFactory.createForClass(Recovery);
