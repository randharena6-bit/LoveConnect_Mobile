import { createConnection } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, AuthProvider, UserRole, UserStatus } from './entities/user.entity';
import { Profile, Gender, Orientation } from './entities/profile.entity';
import { UserSettings } from './entities/settings.entity';
import { Interest } from './entities/interest.entity';

async function seed() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'loveo',
    password: process.env.DATABASE_PASSWORD || 'loveo_secret',
    database: process.env.DATABASE_NAME || 'loveo_db',
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    synchronize: true,
  });

  const userRepo = connection.getRepository(User);
  const profileRepo = connection.getRepository(Profile);
  const settingsRepo = connection.getRepository(UserSettings);
  const interestRepo = connection.getRepository(Interest);

  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@loveo.app' } });
  if (existingAdmin) {
    console.log('Database already seeded');
    await connection.close();
    return;
  }

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = userRepo.create({
    email: 'admin@loveo.app',
    passwordHash,
    authProvider: AuthProvider.EMAIL,
    isVerified: true,
    isIdentityVerified: true,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  });
  await userRepo.save(admin);

  await settingsRepo.save(settingsRepo.create({ userId: admin.id }));

  const adminProfile = profileRepo.create({
    userId: admin.id,
    name: 'Admin Loveo',
    birthDate: new Date('1995-01-01'),
    age: 31,
    gender: Gender.OTHER,
    orientation: Orientation.HETEROSEXUAL,
    bio: 'Administrateur de Loveo',
  });
  await profileRepo.save(adminProfile);

  const interests = [
    { name: 'Voyage', category: 'Loisirs' },
    { name: 'Musique', category: 'Culture' },
    { name: 'Cinéma', category: 'Culture' },
    { name: 'Sport', category: 'Loisirs' },
    { name: 'Lecture', category: 'Culture' },
    { name: 'Cuisine', category: 'Loisirs' },
    { name: 'Photographie', category: 'Arts' },
    { name: 'Randonnée', category: 'Sport' },
    { name: 'Yoga', category: 'Sport' },
    { name: 'Danse', category: 'Arts' },
    { name: 'Jeux vidéo', category: 'Loisirs' },
    { name: 'Art', category: 'Arts' },
    { name: 'Théâtre', category: 'Culture' },
    { name: 'Animaux', category: 'Loisirs' },
    { name: 'Nature', category: 'Loisirs' },
    { name: 'Technologie', category: 'Culture' },
    { name: 'Mode', category: 'Arts' },
    { name: 'Fitness', category: 'Sport' },
    { name: 'Méditation', category: 'Bien-être' },
    { name: 'Bénévolat', category: 'Engagement' },
  ];

  await interestRepo.save(interests.map((i) => interestRepo.create(i)));

  console.log('Database seeded successfully!');
  console.log('Admin credentials: admin@loveo.app / Admin123!');
  await connection.close();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
