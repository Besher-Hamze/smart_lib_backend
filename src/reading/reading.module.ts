import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { Bookmark, BookmarkSchema } from './schemas/bookmark.schema';
import { ReadingProgress, ReadingProgressSchema } from './schemas/reading-progress.schema';
import { ReadingService } from './reading.service';
import { ReadingController } from './reading.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Bookmark.name, schema: BookmarkSchema },
      { name: ReadingProgress.name, schema: ReadingProgressSchema },
    ]),
  ],
  controllers: [ReadingController],
  providers: [ReadingService],
  exports: [ReadingService],
})
export class ReadingModule {}
