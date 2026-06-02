import { Controller, Get, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('internal/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUserSummary(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
