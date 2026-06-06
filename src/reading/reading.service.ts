import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';
import { Bookmark, BookmarkDocument } from './schemas/bookmark.schema';
import {
  ReadingProgress,
  ReadingProgressDocument,
} from './schemas/reading-progress.schema';
import {
  CreateBookmarkDto,
  UpsertReadingProgressDto,
} from './dto/reading.dto';

@Injectable()
export class ReadingService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(ReadingProgress.name)
    private progressModel: Model<ReadingProgressDocument>,
  ) {}

  async listFavorites(userId: string) {
    const docs = await this.favoriteModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();
    return docs.map((d) => ({ bookId: d.bookId.toString() }));
  }

  async addFavorite(userId: string, bookId: string) {
    try {
      await this.favoriteModel.create({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      });
    } catch {
      throw new ConflictException('Already in favorites');
    }
    return { ok: true };
  }

  async removeFavorite(userId: string, bookId: string) {
    await this.favoriteModel.deleteOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });
    return { ok: true };
  }

  async listBookmarks(userId: string) {
    const docs = await this.bookmarkModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
    return docs.map((d) => ({
      id: d._id.toString(),
      bookId: d.bookId.toString(),
      chapterId: d.chapterId.toString(),
      chapterNumber: d.chapterNumber,
      note: d.note,
    }));
  }

  async addBookmark(userId: string, dto: CreateBookmarkDto) {
    const doc = await this.bookmarkModel.create({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(dto.bookId),
      chapterId: new Types.ObjectId(dto.chapterId),
      chapterNumber: dto.chapterNumber,
      note: dto.note ?? '',
    });
    return {
      id: doc._id.toString(),
      bookId: doc.bookId.toString(),
      chapterId: doc.chapterId.toString(),
      chapterNumber: doc.chapterNumber,
      note: doc.note,
    };
  }

  async removeBookmark(userId: string, bookmarkId: string) {
    const res = await this.bookmarkModel.deleteOne({
      _id: bookmarkId,
      userId: new Types.ObjectId(userId),
    });
    if (res.deletedCount === 0) throw new NotFoundException('Bookmark not found');
    return { ok: true };
  }

  async upsertProgress(userId: string, dto: UpsertReadingProgressDto) {
    const doc = await this.progressModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          bookId: new Types.ObjectId(dto.bookId),
        },
        {
          chapterId: dto.chapterId ? new Types.ObjectId(dto.chapterId) : undefined,
          chapterNumber: dto.chapterNumber,
          scrollOffset: dto.scrollOffset ?? 0,
        },
        { upsert: true, new: true },
      )
      .exec();
    return {
      bookId: doc!.bookId.toString(),
      chapterId: doc!.chapterId?.toString() ?? null,
      chapterNumber: doc!.chapterNumber,
      scrollOffset: doc!.scrollOffset,
      updatedAt: (doc as ReadingProgressDocument & { updatedAt?: Date }).updatedAt?.toISOString?.(),
    };
  }

  async getProgress(userId: string, bookId: string) {
    const doc = await this.progressModel
      .findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      })
      .exec();
    if (!doc) return null;
    return {
      bookId: doc.bookId.toString(),
      chapterId: doc.chapterId?.toString() ?? null,
      chapterNumber: doc.chapterNumber,
      scrollOffset: doc.scrollOffset,
      updatedAt: (doc as ReadingProgressDocument & { updatedAt?: Date }).updatedAt?.toISOString?.(),
    };
  }

  async getLastReading(userId: string) {
    const doc = await this.progressModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
    if (!doc) return null;
    return {
      bookId: doc.bookId.toString(),
      chapterId: doc.chapterId?.toString() ?? null,
      chapterNumber: doc.chapterNumber,
      scrollOffset: doc.scrollOffset,
      updatedAt: (doc as ReadingProgressDocument & { updatedAt?: Date }).updatedAt?.toISOString?.(),
    };
  }
}
