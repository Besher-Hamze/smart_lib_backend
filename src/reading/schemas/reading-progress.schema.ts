import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReadingProgressDocument = HydratedDocument<ReadingProgress>;

@Schema({ timestamps: true, collection: 'reading_progress' })
export class ReadingProgress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chapter' })
  chapterId?: Types.ObjectId;

  @Prop({ default: 1 })
  chapterNumber: number;

  @Prop({ default: 0 })
  scrollOffset: number;
}

export const ReadingProgressSchema = SchemaFactory.createForClass(ReadingProgress);
ReadingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });
