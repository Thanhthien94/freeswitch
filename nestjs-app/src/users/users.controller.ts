import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto, UserQueryDto, BulkUpdateDto, BulkDeleteDto } from './dto/update-user.dto';
import { ProfessionalAuthGuard } from '../auth/guards/professional-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(ProfessionalAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'List of users with pagination' })
  @RequirePermissions('users:read')
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  @RequirePermissions('users:read')
  async getStats() {
    return this.usersService.getStats();
  }

  @Get('export')
  @ApiOperation({ summary: 'Export users to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file' })
  @RequirePermissions('users:export')
  async exportUsers(@Query() query: UserQueryDto, @Res() res: Response) {
    const csvData = await this.usersService.exportUsers(query);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvData);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import users from CSV' })
  @ApiResponse({ status: 200, description: 'Import results' })
  @RequirePermissions('users:create')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: any) {
    return this.usersService.importUsers(file);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @RequirePermissions('users:read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity history' })
  @ApiResponse({ status: 200, description: 'User activity' })
  @RequirePermissions('users:read')
  async getUserActivity(
    @Param('id', ParseIntPipe) id: number,
    @Query('days') days: number = 30
  ) {
    return this.usersService.getUserActivity(id, days);
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Get user active sessions' })
  @ApiResponse({ status: 200, description: 'User sessions' })
  @RequirePermissions('users:read')
  async getUserSessions(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserSessions(id);
  }

  @Get(':id/preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences' })
  @RequirePermissions('users:read')
  async getUserPreferences(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserPreferences(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @RequirePermissions('users:create')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @RequirePermissions('users:update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @RequirePermissions('users:update')
  async updatePreferences(
    @Param('id', ParseIntPipe) id: number,
    @Body() preferences: Record<string, any>
  ) {
    return this.usersService.updateUserPreferences(id, preferences);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle user status' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  @RequirePermissions('users:update')
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'active' | 'inactive' | 'suspended' }
  ) {
    return this.usersService.toggleStatus(id, body.status);
  }

  @Patch(':id/roles')
  @ApiOperation({ summary: 'Assign roles to user' })
  @ApiResponse({ status: 200, description: 'Roles assigned' })
  @RequirePermissions('users:manage')
  async assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { roles: string[] }
  ) {
    return this.usersService.assignRoles(id, body.roles);
  }

  @Post(':id/change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @RequirePermissions('users:update')
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  @RequirePermissions('users:manage')
  async resetPassword(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.resetPassword(id);
  }

  @Post(':id/profile-picture')
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture uploaded' })
  @RequirePermissions('users:update')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any
  ) {
    return this.usersService.uploadProfilePicture(id, file);
  }

  @Delete(':id/profile-picture')
  @ApiOperation({ summary: 'Delete profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture deleted' })
  @RequirePermissions('users:update')
  async deleteProfilePicture(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteProfilePicture(id);
  }

  @Delete(':id/sessions/:sessionId')
  @ApiOperation({ summary: 'Terminate user session' })
  @ApiResponse({ status: 200, description: 'Session terminated' })
  @RequirePermissions('users:manage')
  async terminateSession(
    @Param('id', ParseIntPipe) id: number,
    @Param('sessionId') sessionId: string
  ) {
    return this.usersService.terminateSession(id, sessionId);
  }

  @Post(':id/2fa/enable')
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({ status: 200, description: '2FA enabled' })
  @RequirePermissions('users:update')
  async enableTwoFactor(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.enableTwoFactor(id);
  }

  @Post(':id/2fa/disable')
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({ status: 200, description: '2FA disabled' })
  @RequirePermissions('users:update')
  async disableTwoFactor(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.disableTwoFactor(id);
  }

  @Post(':id/2fa/verify')
  @ApiOperation({ summary: 'Verify two-factor authentication token' })
  @ApiResponse({ status: 200, description: '2FA verified' })
  @RequirePermissions('users:update')
  async verifyTwoFactor(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { token: string }
  ) {
    return this.usersService.verifyTwoFactor(id, body.token);
  }

  @Patch('bulk')
  @ApiOperation({ summary: 'Bulk update users' })
  @ApiResponse({ status: 200, description: 'Users updated' })
  @RequirePermissions('users:update')
  async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateDto) {
    return this.usersService.bulkUpdate(bulkUpdateDto);
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Bulk delete users' })
  @ApiResponse({ status: 200, description: 'Users deleted' })
  @RequirePermissions('users:delete')
  async bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.usersService.bulkDelete(bulkDeleteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @RequirePermissions('users:delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
