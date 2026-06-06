import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChapterDocument = HydratedDocument<Chapter>;

@Schema({ timestamps: true, collection: 'chapters' })
export class Chapter {
  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ required: true })
  chapterNumber: number;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  contentText: string;

  @Prop({ default: 0 })
  wordCount: number;

  @Prop({ default: 0 })
  estimatedReadMinutes: number;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
ChapterSchema.index({ bookId: 1, chapterNumber: 1 }, { unique: true });
