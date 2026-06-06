import { Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { AuthorsModule } from '../authors/authors.module';
import { AuthModule } from '../auth/auth.module';
import { SeedModule } from '../seed/seed.module';
import { CategoriesModule } from '../categories/categories.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { AdminBooksController } from './admin-books.controller';
import { AdminSeedController } from './admin-seed.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminChaptersController } from './admin-chapters.controller';
import { AdminAuthorsController } from './admin-authors.controller';

@Module({
  imports: [
    BooksModule,
    AuthorsModule,
    AuthModule,
    SeedModule,
    CategoriesModule,
    ChaptersModule,
  ],
  controllers: [
    AdminAuthorsController,
    AdminBooksController,
    AdminCategoriesController,
    AdminChaptersController,
    AdminSeedController,
  ],
})
export class AdminModule {}
