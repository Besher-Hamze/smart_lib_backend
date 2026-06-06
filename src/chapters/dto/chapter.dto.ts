import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChapterDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  contentText: string;
}

export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  contentText?: string;
}
