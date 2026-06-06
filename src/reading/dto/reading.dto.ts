import { IsMongoId, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertReadingProgressDto {
  @IsMongoId()
  bookId: string;

  @IsOptional()
  @IsMongoId()
  chapterId?: string;

  @IsNumber()
  chapterNumber: number;

  @IsOptional()
  @IsNumber()
  scrollOffset?: number;
}

export class CreateBookmarkDto {
  @IsMongoId()
  bookId: string;

  @IsMongoId()
  chapterId: string;

  @IsNumber()
  chapterNumber: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class FavoriteBookDto {
  @IsMongoId()
  bookId: string;
}
