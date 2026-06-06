import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { uniqueSlug } from '../common/slug.util';
import { ChaptersService } from '../chapters/chapters.service';
import { Author, AuthorDocument } from '../authors/schemas/author.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Book, BookDocument, PublishStatus } from './schemas/book.schema';
import { CreateBookDto, UpdateBookDto } from './dto/book.dto';
import { ChapterDocument } from '../chapters/schemas/chapter.schema';

export interface MobileBookResponse {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  rating: number;
  pagesCount: number;
  coverGradientIndex: number;
  readingTimeMinutes: number;
  chapters: { index: number; title: string; content: string }[];
  updatedAt: string;
}

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private chaptersService: ChaptersService,
  ) {}

  private hashGradient(slug: string): number {
    let h = 0;
    for (let i = 0; i < slug.length; i++) h = (h + slug.charCodeAt(i)) % 6;
    return h;
  }

  async toAdminResponse(doc: BookDocument) {
    const author = await this.authorModel.findById(doc.authorId).exec();
    const categories = await this.categoryModel
      .find({ _id: { $in: doc.categoryIds } })
      .exec();
    const chapters = await this.chaptersService.listByBook(doc._id.toString(), true);
    const updatedAt =
      (doc as BookDocument & { updatedAt?: Date }).updatedAt?.toISOString() ??
      new Date().toISOString();
    return {
      id: doc._id.toString(),
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      coverUrl: doc.coverUrl,
      language: doc.language,
      publishStatus: doc.publishStatus,
      authorId: doc.authorId.toString(),
      authorName: author?.name ?? '',
      categoryIds: doc.categoryIds.map((c) => c.toString()),
      categories: categories.map((c) => ({ id: c._id.toString(), name: c.name, slug: c.slug })),
      chaptersCount: doc.chaptersCount,
      chapters,
      isDeleted: doc.isDeleted,
      updatedAt,
    };
  }

  async toMobileResponse(
    doc: BookDocument,
    chapters: ChapterDocument[],
    author?: AuthorDocument | null,
    categories?: CategoryDocument[],
  ): Promise<MobileBookResponse> {
    const authorName = author?.name ?? '';
    const categoryName = categories?.[0]?.name ?? '';
    const totalWords = chapters.reduce((s, c) => s + c.wordCount, 0);
    const readMinutes = chapters.reduce((s, c) => s + c.estimatedReadMinutes, 0);
    const updatedAt =
      (doc as BookDocument & { updatedAt?: Date }).updatedAt?.toISOString() ??
      new Date().toISOString();
    return {
      id: doc.slug,
      title: doc.title,
      author: authorName,
      description: doc.description,
      category: categoryName,
      rating: 4.5,
      pagesCount: Math.max(1, Math.round(totalWords / 250)),
      coverGradientIndex: this.hashGradient(doc.slug),
      readingTimeMinutes: Math.max(1, readMinutes),
      chapters: chapters.map((c) => ({
        index: c.chapterNumber - 1,
        title: c.title,
        content: c.contentText,
      })),
      updatedAt,
    };
  }

  private async loadMobileBatch(docs: BookDocument[]): Promise<MobileBookResponse[]> {
    if (!docs.length) return [];
    const authorIds = [...new Set(docs.map((d) => d.authorId.toString()))];
    const categoryIds = [...new Set(docs.flatMap((d) => d.categoryIds.map((c) => c.toString())))];
    const bookIds = docs.map((d) => d._id);

    const [authors, categories, chapters] = await Promise.all([
      this.authorModel.find({ _id: { $in: authorIds } }).exec(),
      this.categoryModel.find({ _id: { $in: categoryIds } }).exec(),
      this.chaptersService.getActiveChaptersForBooks(bookIds),
    ]);

    const authorMap = new Map(authors.map((a) => [a._id.toString(), a]));
    const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]));
    const chaptersByBook = new Map<string, ChapterDocument[]>();
    for (const ch of chapters) {
      const key = ch.bookId.toString();
      if (!chaptersByBook.has(key)) chaptersByBook.set(key, []);
      chaptersByBook.get(key)!.push(ch);
    }

    const out: MobileBookResponse[] = [];
    for (const doc of docs) {
      const cats = doc.categoryIds
        .map((id) => categoryMap.get(id.toString()))
        .filter(Boolean) as CategoryDocument[];
      out.push(
        await this.toMobileResponse(
          doc,
          chaptersByBook.get(doc._id.toString()) ?? [],
          authorMap.get(doc.authorId.toString()),
          cats,
        ),
      );
    }
    return out;
  }

  async findAllPublishedMobile(search?: string): Promise<MobileBookResponse[]> {
    const filter: Record<string, unknown> = {
      publishStatus: PublishStatus.PUBLISHED,
      isDeleted: false,
    };
    if (search?.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    const docs = await this.bookModel.find(filter).sort({ title: 1 }).exec();
    return this.loadMobileBatch(docs);
  }

  async findPublishedSinceMobile(since?: Date): Promise<MobileBookResponse[]> {
    const filter: Record<string, unknown> = {
      publishStatus: PublishStatus.PUBLISHED,
      isDeleted: false,
    };
    if (since) filter.updatedAt = { $gte: since };
    const docs = await this.bookModel.find(filter).sort({ updatedAt: -1 }).exec();
    return this.loadMobileBatch(docs);
  }

  async findOneMobile(slugOrId: string): Promise<MobileBookResponse> {
    const doc = await this.findBookDoc(slugOrId);
    if (doc.publishStatus !== PublishStatus.PUBLISHED || doc.isDeleted) {
      throw new NotFoundException('Book not found');
    }
    const [author, categories, chapters] = await Promise.all([
      this.authorModel.findById(doc.authorId).exec(),
      this.categoryModel.find({ _id: { $in: doc.categoryIds } }).exec(),
      this.chaptersService.getActiveChaptersForBooks([doc._id]),
    ]);
    return this.toMobileResponse(doc, chapters, author, categories);
  }

  private async findBookDoc(slugOrId: string): Promise<BookDocument> {
    let doc = await this.bookModel.findOne({ slug: slugOrId, isDeleted: false }).exec();
    if (!doc && Types.ObjectId.isValid(slugOrId)) {
      doc = await this.bookModel.findOne({ _id: slugOrId, isDeleted: false }).exec();
    }
    if (!doc) throw new NotFoundException('Book not found');
    return doc;
  }

  async findAllAdmin() {
    const docs = await this.bookModel.find({ isDeleted: false }).sort({ updatedAt: -1 }).exec();
    return Promise.all(docs.map((d) => this.toAdminResponse(d)));
  }

  async findOneAdmin(id: string) {
    const doc = await this.findBookDoc(id);
    return this.toAdminResponse(doc);
  }

  async create(dto: CreateBookDto) {
    const slug = await uniqueSlug(dto.title, async (s) =>
      !!(await this.bookModel.findOne({ slug: s }).exec()),
    );
    const doc = await this.bookModel.create({
      title: dto.title.trim(),
      slug,
      description: dto.description,
      coverUrl: dto.coverUrl ?? '',
      language: dto.language ?? 'ar',
      publishStatus: dto.publishStatus ?? PublishStatus.DRAFT,
      authorId: new Types.ObjectId(dto.authorId),
      categoryIds: dto.categoryIds.map((id) => new Types.ObjectId(id)),
      chaptersCount: 0,
    });
    return this.toAdminResponse(doc);
  }

  async update(id: string, dto: UpdateBookDto) {
    const doc = await this.findBookDoc(id);
    if (dto.title !== undefined) {
      doc.title = dto.title.trim();
      doc.slug = await uniqueSlug(doc.title, async (s) => {
        const other = await this.bookModel.findOne({ slug: s }).exec();
        return !!other && other._id.toString() !== doc._id.toString();
      });
    }
    if (dto.description !== undefined) doc.description = dto.description;
    if (dto.coverUrl !== undefined) doc.coverUrl = dto.coverUrl;
    if (dto.language !== undefined) doc.language = dto.language;
    if (dto.publishStatus !== undefined) doc.publishStatus = dto.publishStatus;
    if (dto.authorId !== undefined) doc.authorId = new Types.ObjectId(dto.authorId);
    if (dto.categoryIds !== undefined) {
      doc.categoryIds = dto.categoryIds.map((cid) => new Types.ObjectId(cid));
    }
    await doc.save();
    return this.toAdminResponse(doc);
  }

  async publish(id: string) {
    return this.update(id, { publishStatus: PublishStatus.PUBLISHED });
  }

  async unpublish(id: string) {
    return this.update(id, { publishStatus: PublishStatus.DRAFT });
  }

  async softDelete(id: string) {
    const doc = await this.findBookDoc(id);
    doc.isDeleted = true;
    await doc.save();
    return { ok: true };
  }
}
