import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users = [
    { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin' },
    { id: '2', username: 'user1', email: 'user1@example.com', role: 'user' },
  ];

  async findAll() {
    return {
      data: this.users,
      total: this.users.length
    };
  }

  async findOne(id: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async create(createUserDto: any) {
    const newUser = {
      id: (this.users.length + 1).toString(),
      ...createUserDto
    };
    this.users.push(newUser);
    return newUser;
  }

  async update(id: string, updateUserDto: any) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    this.users[userIndex] = { ...this.users[userIndex], ...updateUserDto };
    return this.users[userIndex];
  }

  async remove(id: string) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    const removedUser = this.users.splice(userIndex, 1)[0];
    return { message: 'User deleted', user: removedUser };
  }
}
