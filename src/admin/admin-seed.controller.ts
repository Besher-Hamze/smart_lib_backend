import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SeedService } from '../seed/seed.service';

@Controller('admin/seed')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  seed() {
    return this.seedService.seedBooks();
  }
}
