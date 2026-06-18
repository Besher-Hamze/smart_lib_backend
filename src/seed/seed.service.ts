import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthorsService } from '../authors/authors.service';
import { CategoriesService } from '../categories/categories.service';
import { Book, BookDocument, PublishStatus } from '../books/schemas/book.schema';
import { Chapter, ChapterDocument } from '../chapters/schemas/chapter.schema';
import { estimateReadMinutes, wordCount } from '../common/slug.util';
import { SEED_CATALOG } from './seed-books.data';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    private authorsService: AuthorsService,
    private categoriesService: CategoriesService,
  ) {}

  async seedBooks() {
    let booksUpserted = 0;
    let chaptersUpserted = 0;

    for (const entry of SEED_CATALOG) {
      let author = await this.authorsService.findByName(entry.authorName);
      if (!author) {
        await this.authorsService.create({ name: entry.authorName });
        author = await this.authorsService.findByName(entry.authorName);
      }

      const categoryIds: string[] = [];
      for (const name of entry.categoryNames) {
        const all = await this.categoriesService.findAll();
        let cat = all.find((c) => c.name === name);
        if (!cat) {
          cat = await this.categoriesService.create({ name });
        }
        categoryIds.push(cat.id);
      }

      const categoryObjectIds = categoryIds.map((id) => new Types.ObjectId(id));

      let book = await this.bookModel.findOne({ slug: entry.slug }).exec();
      if (!book) {
        book = await this.bookModel.create({
          title: entry.title,
          slug: entry.slug,
          description: entry.description,
          coverUrl: '',
          language: 'ar',
          publishStatus: PublishStatus.PUBLISHED,
          authorId: author!._id,
          categoryIds: categoryObjectIds,
          chaptersCount: 0,
        });
        booksUpserted++;
      } else {
        book.title = entry.title;
        book.description = entry.description;
        book.authorId = author!._id;
        book.categoryIds = categoryObjectIds;
        book.publishStatus = PublishStatus.PUBLISHED;
        await book.save();
      }

      for (let i = 0; i < entry.chapters.length; i++) {
        const ch = entry.chapters[i];
        const chapterNumber = i + 1;
        const existing = await this.chapterModel
          .findOne({ bookId: book._id, chapterNumber, isDeleted: false })
          .exec();
        if (!existing) {
          await this.chapterModel.create({
            bookId: book._id,
            chapterNumber,
            title: ch.title,
            contentText: ch.contentText,
            wordCount: wordCount(ch.contentText),
            estimatedReadMinutes: estimateReadMinutes(ch.contentText),
          });
          chaptersUpserted++;
        } else {
          existing.title = ch.title;
          existing.contentText = ch.contentText;
          existing.wordCount = wordCount(ch.contentText);
          existing.estimatedReadMinutes = estimateReadMinutes(ch.contentText);
          await existing.save();
          chaptersUpserted++;
        }
      }

      const count = await this.chapterModel
        .countDocuments({ bookId: book._id, isDeleted: false })
        .exec();
      book.chaptersCount = count;
      await book.save();
    }

    return {
      ok: true,
      total: SEED_CATALOG.length,
      booksUpserted,
      chaptersUpserted,
    };
  }
}
