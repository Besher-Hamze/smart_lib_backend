import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserGuard } from '../auth/user.guard';
import { ReadingService } from './reading.service';
import {
  CreateBookmarkDto,
  FavoriteBookDto,
  UpsertReadingProgressDto,
} from './dto/reading.dto';

@Controller('me')
@UseGuards(JwtAuthGuard, UserGuard)
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  @Get('favorites')
  listFavorites(@Req() req: { user: { userId: string } }) {
    return this.readingService.listFavorites(req.user.userId);
  }

  @Post('favorites')
  addFavorite(@Req() req: { user: { userId: string } }, @Body() dto: FavoriteBookDto) {
    return this.readingService.addFavorite(req.user.userId, dto.bookId);
  }

  @Delete('favorites/:bookId')
  removeFavorite(
    @Req() req: { user: { userId: string } },
    @Param('bookId') bookId: string,
  ) {
    return this.readingService.removeFavorite(req.user.userId, bookId);
  }

  @Get('bookmarks')
  listBookmarks(@Req() req: { user: { userId: string } }) {
    return this.readingService.listBookmarks(req.user.userId);
  }

  @Post('bookmarks')
  addBookmark(@Req() req: { user: { userId: string } }, @Body() dto: CreateBookmarkDto) {
    return this.readingService.addBookmark(req.user.userId, dto);
  }

  @Delete('bookmarks/:id')
  removeBookmark(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.readingService.removeBookmark(req.user.userId, id);
  }

  @Put('reading-progress')
  upsertProgress(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpsertReadingProgressDto,
  ) {
    return this.readingService.upsertProgress(req.user.userId, dto);
  }

  @Get('reading-progress/last')
  lastReading(@Req() req: { user: { userId: string } }) {
    return this.readingService.getLastReading(req.user.userId);
  }

  @Get('reading-progress/:bookId')
  getProgress(
    @Req() req: { user: { userId: string } },
    @Param('bookId') bookId: string,
  ) {
    return this.readingService.getProgress(req.user.userId, bookId);
  }
}
