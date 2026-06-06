import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

export enum PublishStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Schema({ timestamps: true, collection: 'books' })
export class Book {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: '' })
  coverUrl: string;

  @Prop({ default: 'ar' })
  language: string;

  @Prop({
    required: true,
    enum: Object.values(PublishStatus),
    default: PublishStatus.DRAFT,
    index: true,
  })
  publishStatus: PublishStatus;

  @Prop({ type: Types.ObjectId, ref: 'Author', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  categoryIds: Types.ObjectId[];

  @Prop({ default: 0 })
  chaptersCount: number;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const BookSchema = SchemaFactory.createForClass(Book);
