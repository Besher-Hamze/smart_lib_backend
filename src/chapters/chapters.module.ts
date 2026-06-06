import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from './schemas/chapter.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { ChaptersService } from './chapters.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chapter.name, schema: ChapterSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
