import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(query: any = {}) {
    try {
      console.log('findAll called with query:', query);

      const {
        page = 1,
        limit = 10
      } = query;

      console.log('About to query users...');

      // Very simple query first
      const users = await this.userRepository.find({
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
        order: { createdAt: 'DESC' }
      });

      console.log('Users found:', users.length);

      const total = await this.userRepository.count();
      console.log('Total count:', total);

      const result = {
        data: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.fullName || user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.isActive ? 'active' : 'inactive',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roles: ['user'],
          permissions: [],
          primaryRole: 'user'
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

      console.log('Returning result:', result);
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [
        { email: emailOrUsername },
        { username: emailOrUsername },
      ],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === createUserDto.username) {
        throw new ConflictException('Username already exists');
      }
    }

    // Check if extension is already taken
    if (createUserDto.extension) {
      const existingExtension = await this.userRepository.findOne({
        where: { extension: createUserDto.extension },
      });
      if (existingExtension) {
        throw new ConflictException('Extension already exists');
      }
    }

    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check for conflicts if updating email or username
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.findByUsername(updateUserDto.username);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Username already exists');
      }
    }

    if (updateUserDto.extension && updateUserDto.extension !== user.extension) {
      const existingExtension = await this.userRepository.findOne({
        where: { extension: updateUserDto.extension },
      });
      if (existingExtension && existingExtension.id !== id) {
        throw new ConflictException('Extension already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto, isAdmin: boolean = false): Promise<void> {
    const user = await this.findOne(id);

    // Verify current password for non-admin users
    if (!isAdmin && changePasswordDto.currentPassword) {
      const isCurrentPasswordValid = await user.validatePassword(changePasswordDto.currentPassword);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    user.password = changePasswordDto.newPassword;
    await this.userRepository.save(user);
  }

  async toggleActive(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async findByExtension(extension: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { extension } });
  }

  async getUserStats() {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { isActive: true } });
    const inactive = total - active;

    const roleStats = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    return {
      total,
      active,
      inactive,
      roleStats,
    };
  }

  // Enhanced methods for User Management
  async getStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    const inactiveUsers = await this.userRepository.count({ where: { isActive: false } });
    const suspendedUsers = 0; // Not implemented in current schema

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      onlineUsers: 0, // Would need session tracking
      usersByRole: {},
      usersByDomain: {},
      recentRegistrations: 0,
      lastLoginStats: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
      },
    };
  }

  async toggleStatus(id: number, status: 'active' | 'inactive' | 'suspended') {
    const user = await this.findOne(id);
    user.isActive = status === 'active';
    return this.userRepository.save(user);
  }

  async assignRoles(id: number, roles: string[]) {
    const user = await this.findOne(id);
    // Note: Role assignment would need to be handled via UserRole entity
    // This is a simplified implementation
    return user;
  }

  async resetPassword(id: number) {
    const user = await this.findOne(id);
    const temporaryPassword = Math.random().toString(36).slice(-8);
    user.password = temporaryPassword; // Should be hashed in real implementation
    await this.userRepository.save(user);
    return { temporaryPassword };
  }

  async getUserActivity(id: number, days: number = 30) {
    // Mock implementation
    return [
      {
        description: 'User logged in',
        timestamp: new Date(),
        type: 'login'
      }
    ];
  }

  async getUserSessions(id: number) {
    // Mock implementation
    return [
      {
        id: 'session-1',
        device: 'Chrome on Windows',
        ipAddress: '192.168.1.100',
        createdAt: new Date(),
        lastActivity: new Date()
      }
    ];
  }

  async terminateSession(id: number, sessionId: string) {
    return { success: true };
  }

  async getUserPreferences(id: number) {
    const user = await this.findOne(id);
    return user.getPreferences();
  }

  async updateUserPreferences(id: number, preferences: Record<string, any>) {
    const user = await this.findOne(id);
    // Update language and timezone which are the available preference fields
    if (preferences.language) user.language = preferences.language;
    if (preferences.timezone) user.timezone = preferences.timezone;
    await this.userRepository.save(user);
    return user.getPreferences();
  }

  async enableTwoFactor(id: number) {
    const user = await this.findOne(id);
    user.mfaEnabled = true;
    await this.userRepository.save(user);
    return {
      qrCode: 'mock-qr-code-data',
      secret: 'mock-secret-key'
    };
  }

  async disableTwoFactor(id: number) {
    const user = await this.findOne(id);
    user.mfaEnabled = false;
    await this.userRepository.save(user);
  }

  async verifyTwoFactor(id: number, token: string) {
    return { verified: true };
  }

  async uploadProfilePicture(id: number, file: any) {
    const user = await this.findOne(id);
    const profilePicture = `/uploads/profiles/${id}-${Date.now()}.jpg`;
    // Note: User entity doesn't have profilePicture field in current schema
    // This would need to be added to the entity
    await this.userRepository.save(user);
    return { profilePicture };
  }

  async deleteProfilePicture(id: number) {
    const user = await this.findOne(id);
    // Note: User entity doesn't have profilePicture field in current schema
    await this.userRepository.save(user);
  }

  async bulkUpdate(bulkUpdateDto: any) {
    const { userIds, updates } = bulkUpdateDto;
    await this.userRepository.update(userIds, updates);
    return { updated: userIds.length };
  }

  async bulkDelete(bulkDeleteDto: any) {
    const { userIds } = bulkDeleteDto;
    await this.userRepository.delete(userIds);
    return { deleted: userIds.length };
  }

  async exportUsers(query: any = {}) {
    const users = await this.findAll({ ...query, limit: 10000 });

    const headers = ['ID', 'Username', 'Email', 'Full Name', 'Domain', 'Active', 'Created At'];
    const rows = users.data.map(user => [
      user.id,
      user.username,
      user.email,
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      '', // Domain removed for now
      user.status === 'active' ? 'Yes' : 'No',
      user.createdAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  async importUsers(file: any) {
    return {
      success: 0,
      failed: 0,
      errors: []
    };
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
