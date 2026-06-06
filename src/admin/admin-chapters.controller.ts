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
import { ChaptersService } from '../chapters/chapters.service';
import { CreateChapterDto, UpdateChapterDto } from '../chapters/dto/chapter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get('books/:bookId/chapters')
  list(@Param('bookId') bookId: string) {
    return this.chaptersService.listByBook(bookId, true);
  }

  @Post('books/:bookId/chapters')
  add(@Param('bookId') bookId: string, @Body() dto: CreateChapterDto) {
    return this.chaptersService.addToBook(bookId, dto);
  }

  @Patch('chapters/:id')
  update(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.chaptersService.update(id, dto);
  }

  @Delete('chapters/:id')
  async remove(@Param('id') id: string) {
    return this.chaptersService.softDelete(id);
  }
}
