import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Author, AuthorDocument } from './schemas/author.schema';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';

@Injectable()
export class AuthorsService {
  constructor(@InjectModel(Author.name) private authorModel: Model<AuthorDocument>) {}

  toResponse(doc: AuthorDocument) {
    const ts = doc as AuthorDocument & { createdAt?: Date; updatedAt?: Date };
    return {
      id: doc._id.toString(),
      name: doc.name,
      bio: doc.bio,
      avatarUrl: doc.avatarUrl,
      createdAt: ts.createdAt?.toISOString?.() ?? null,
      updatedAt: ts.updatedAt?.toISOString?.() ?? null,
    };
  }

  async findAll() {
    const docs = await this.authorModel.find().sort({ name: 1 }).exec();
    return docs.map((d) => this.toResponse(d));
  }

  async findById(id: string) {
    const doc = await this.authorModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Author not found');
    return this.toResponse(doc);
  }

  async findByIdDoc(id: string): Promise<AuthorDocument> {
    const doc = await this.authorModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Author not found');
    return doc;
  }

  async findByName(name: string): Promise<AuthorDocument | null> {
    return this.authorModel.findOne({ name }).exec();
  }

  async create(dto: CreateAuthorDto) {
    const doc = await this.authorModel.create({
      name: dto.name.trim(),
      bio: dto.bio ?? '',
      avatarUrl: dto.avatarUrl ?? '',
    });
    return this.toResponse(doc);
  }

  async update(id: string, dto: UpdateAuthorDto) {
    const doc = await this.authorModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('Author not found');
    return this.toResponse(doc);
  }

  async remove(id: string) {
    const res = await this.authorModel.deleteOne({ _id: id }).exec();
    if (res.deletedCount === 0) throw new NotFoundException('Author not found');
  }
}
