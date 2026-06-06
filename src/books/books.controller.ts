import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly categoriesService: CategoriesService,
  ) {}

  /** Browse / search published books (mobile offline sync). */
  @Get()
  findAll(@Query('q') q?: string) {
    return this.booksService.findAllPublishedMobile(q);
  }

  @Get('sync')
  sync(@Query('since') since?: string) {
    const sinceDate = since ? new Date(since) : undefined;
    if (since && Number.isNaN(sinceDate!.getTime())) {
      return this.booksService.findAllPublishedMobile();
    }
    return this.booksService.findPublishedSinceMobile(sinceDate);
  }

  @Get('categories/list')
  categories() {
    return this.categoriesService.findNames();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.booksService.findOneMobile(slug);
  }
}
