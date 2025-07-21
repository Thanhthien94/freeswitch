import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/user.entity';

export async function seedEntityUser(dataSource: DataSource) {
  try {
    const userRepository = dataSource.getRepository(User);

    // Check if admin user already exists
    const existingUser = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (existingUser) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create new user
    const user = new User();
    user.username = 'admin';
    user.email = 'admin@test.local';
    user.passwordHash = hashedPassword;
    user.firstName = 'Admin';
    user.lastName = 'User';
    user.domainId = '1'; // Assuming domain 1 exists
    user.isActive = true;
    user.emailVerified = true;
    user.language = 'en';
    user.timezone = 'UTC';

    await userRepository.save(user);

    console.log('✅ Admin user created successfully');
    console.log('📋 Test credentials: admin/admin123');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  import('../data-source').then(({ AppDataSource }) => {
    AppDataSource.initialize()
      .then(() => seedEntityUser(AppDataSource))
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
      });
  });
}
