import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorsModule } from './authors/authors.module';
import { BooksModule } from './books/books.module';
import { CategoriesModule } from './categories/categories.module';
import { ChaptersModule } from './chapters/chapters.module';
import { AuthModule } from './auth/auth.module';
import { ReadingModule } from './reading/reading.module';
import { AdminModule } from './admin/admin.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_lib',
    ),
    AuthorsModule,
    CategoriesModule,
    ChaptersModule,
    BooksModule,
    AuthModule,
    ReadingModule,
    AdminModule,
    SeedModule,
  ],
})
export class AppModule {}
