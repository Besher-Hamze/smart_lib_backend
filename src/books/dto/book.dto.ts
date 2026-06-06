import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PublishStatus } from '../schemas/book.schema';

export class CreateBookDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsMongoId()
  authorId: string;

  @IsArray()
  @IsMongoId({ each: true })
  categoryIds: string[];

  @IsOptional()
  @IsEnum(PublishStatus)
  publishStatus?: PublishStatus;
}

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsMongoId()
  authorId?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsEnum(PublishStatus)
  publishStatus?: PublishStatus;
}
