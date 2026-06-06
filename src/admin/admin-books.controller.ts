import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BooksService } from '../books/books.service';
import { CreateBookDto, UpdateBookDto } from '../books/dto/book.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin/books')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminBooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll() {
    return this.booksService.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOneAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.booksService.softDelete(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.booksService.publish(id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.booksService.unpublish(id);
  }
}
