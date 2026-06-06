import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorsModule } from '../authors/authors.module';
import { CategoriesModule } from '../categories/categories.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema';
import { SeedService } from './seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
    AuthorsModule,
    CategoriesModule,
    ChaptersModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
