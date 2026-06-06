import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuthorDocument = HydratedDocument<Author>;

@Schema({ timestamps: true, collection: 'authors' })
export class Author {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  avatarUrl: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
