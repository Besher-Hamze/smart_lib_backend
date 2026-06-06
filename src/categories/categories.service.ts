import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { slugify, uniqueSlug } from '../common/slug.util';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

const DEFAULT_CATEGORIES = [
  { name: 'روايات', description: 'روايات أدبية' },
  { name: 'تاريخي', description: 'كتب تاريخية' },
  { name: 'قصص وحكايات', description: '' },
  { name: 'أدب وحكم', description: '' },
  { name: 'شعر', description: '' },
  { name: 'رحلات', description: '' },
  { name: 'تاريخ وفلسفة', description: '' },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  async onModuleInit() {
    await this.dropLegacyNameIndex();

    for (const c of DEFAULT_CATEGORIES) {
      const slug = slugify(c.name);
      const existing = await this.categoryModel
        .findOne({ $or: [{ name: c.name }, { slug }] })
        .exec();

      if (existing) {
        let changed = false;
        if (!existing.slug) {
          existing.slug = slug;
          changed = true;
        }
        if (!existing.description && c.description) {
          existing.description = c.description;
          changed = true;
        }
        if (changed) await existing.save();
        continue;
      }

      await this.categoryModel.create({
        name: c.name,
        slug,
        description: c.description,
      });
    }
  }

  /** Old schema had unique index on name; ERD uses unique slug only. */
  private async dropLegacyNameIndex() {
    try {
      const indexes = await this.categoryModel.collection.indexes();
      if (indexes.some((i) => i.name === 'name_1')) {
        await this.categoryModel.collection.dropIndex('name_1');
      }
    } catch {
      // Index may already be gone.
    }
  }

  toResponse(doc: CategoryDocument) {
    const ts = doc as CategoryDocument & { createdAt?: Date; updatedAt?: Date };
    return {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      createdAt: ts.createdAt?.toISOString?.() ?? null,
      updatedAt: ts.updatedAt?.toISOString?.() ?? null,
    };
  }

  async findAll() {
    const docs = await this.categoryModel.find().sort({ name: 1 }).exec();
    return docs.map((d) => this.toResponse(d));
  }

  async findNames(): Promise<string[]> {
    const docs = await this.findAll();
    return docs.map((d) => d.name);
  }

  async findById(id: string): Promise<CategoryDocument> {
    const doc = await this.categoryModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Category not found');
    return doc;
  }

  async findBySlug(slug: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findOne({ slug }).exec();
  }

  async create(dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const byName = await this.categoryModel.findOne({ name }).exec();
    if (byName) throw new ConflictException(`Category "${name}" already exists`);
    const slug = await uniqueSlug(name, async (s) =>
      !!(await this.categoryModel.findOne({ slug: s }).exec()),
    );
    const doc = await this.categoryModel.create({
      name,
      slug,
      description: dto.description ?? '',
    });
    return this.toResponse(doc);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const doc = await this.categoryModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Category not found');
    if (dto.name && dto.name.trim() !== doc.name) {
      doc.name = dto.name.trim();
      doc.slug = await uniqueSlug(doc.name, async (s) => {
        const other = await this.categoryModel.findOne({ slug: s }).exec();
        return !!other && other._id.toString() !== id;
      });
    }
    if (dto.description !== undefined) doc.description = dto.description;
    await doc.save();
    return this.toResponse(doc);
  }

  async remove(id: string) {
    const res = await this.categoryModel.deleteOne({ _id: id }).exec();
    if (res.deletedCount === 0) throw new NotFoundException('Category not found');
  }
}
