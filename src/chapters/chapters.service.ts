import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { estimateReadMinutes, wordCount } from '../common/slug.util';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapter.dto';
import { Book, BookDocument } from '../books/schemas/book.schema';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  toResponse(doc: ChapterDocument) {
    return {
      id: doc._id.toString(),
      bookId: doc.bookId.toString(),
      chapterNumber: doc.chapterNumber,
      title: doc.title,
      contentText: doc.contentText,
      wordCount: doc.wordCount,
      estimatedReadMinutes: doc.estimatedReadMinutes,
      isDeleted: doc.isDeleted,
      createdAt: (doc as ChapterDocument & { createdAt?: Date }).createdAt?.toISOString?.() ?? null,
      updatedAt: (doc as ChapterDocument & { updatedAt?: Date }).updatedAt?.toISOString?.() ?? null,
    };
  }

  async listByBook(bookId: string, includeDeleted = false) {
    const filter: Record<string, unknown> = {
      bookId: new Types.ObjectId(bookId),
    };
    if (!includeDeleted) filter.isDeleted = false;
    const docs = await this.chapterModel
      .find(filter)
      .sort({ chapterNumber: 1 })
      .exec();
    return docs.map((d) => this.toResponse(d));
  }

  async findById(id: string) {
    const doc = await this.chapterModel.findById(id).exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Chapter not found');
    return this.toResponse(doc);
  }

  private async syncBookChapterCount(bookId: Types.ObjectId) {
    const count = await this.chapterModel
      .countDocuments({ bookId, isDeleted: false })
      .exec();
    await this.bookModel.updateOne({ _id: bookId }, { chaptersCount: count }).exec();
  }

  async addToBook(bookId: string, dto: CreateChapterDto) {
    const book = await this.bookModel.findById(bookId).exec();
    if (!book || book.isDeleted) throw new NotFoundException('Book not found');

    const last = await this.chapterModel
      .findOne({ bookId: book._id, isDeleted: false })
      .sort({ chapterNumber: -1 })
      .exec();
    const chapterNumber = last ? last.chapterNumber + 1 : 1;
    const wc = wordCount(dto.contentText);

    const doc = await this.chapterModel.create({
      bookId: book._id,
      chapterNumber,
      title: dto.title.trim(),
      contentText: dto.contentText,
      wordCount: wc,
      estimatedReadMinutes: estimateReadMinutes(dto.contentText),
    });
    await this.syncBookChapterCount(book._id);
    return this.toResponse(doc);
  }

  async update(id: string, dto: UpdateChapterDto) {
    const doc = await this.chapterModel.findById(id).exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Chapter not found');
    if (dto.title !== undefined) doc.title = dto.title.trim();
    if (dto.contentText !== undefined) {
      doc.contentText = dto.contentText;
      doc.wordCount = wordCount(dto.contentText);
      doc.estimatedReadMinutes = estimateReadMinutes(dto.contentText);
    }
    await doc.save();
    return this.toResponse(doc);
  }

  async softDelete(id: string) {
    const doc = await this.chapterModel.findById(id).exec();
    if (!doc || doc.isDeleted) throw new NotFoundException('Chapter not found');
    doc.isDeleted = true;
    await doc.save();
    await this.syncBookChapterCount(doc.bookId);
    return { ok: true };
  }

  async getActiveChaptersForBooks(bookIds: Types.ObjectId[]) {
    return this.chapterModel
      .find({ bookId: { $in: bookIds }, isDeleted: false })
      .sort({ chapterNumber: 1 })
      .exec();
  }
}
