import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

type LegacyAccountType = 'EMAIL' | 'USERNAME';

export interface LegacyAccountRecord {
  id: string;
  credential: string | null;
  password: string;
  type: LegacyAccountType | null;
  userId: string;
  isVerified?: boolean | null;
}

export interface LegacyUserRecord {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: any): Promise<User> {
    const username =
      (userData.username || userData.email?.split('@')[0] || '').trim().toLowerCase() || null;
    const fullName = this.normalizeFullName(
      userData.fullName,
      userData.firstName,
      userData.lastName,
      userData.email,
    );

    const user = this.userRepository.create({
      email: userData.email,
      password: userData.password,
      fullName,
      phone: userData.phone ?? null,
      avatarUrl: username,
      role: userData.role ?? 'CUSTOMER',
      isActive: userData.isActive ?? true,
      refreshToken: userData.refreshToken ?? null,
    });

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { avatarUrl: username } });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const normalized = identifier.trim().toLowerCase();
    return this.userRepository.findOne({
      where: [{ email: normalized }, { avatarUrl: normalized }],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(userId, { refreshToken });
  }

  async migrateLegacyUsers(
    accounts: LegacyAccountRecord[],
    legacyUsers: LegacyUserRecord[],
  ): Promise<User[]> {
    const usersById = new Map(legacyUsers.map((legacyUser) => [legacyUser.id, legacyUser]));
    const migratedUsers: User[] = [];

    for (const account of accounts) {
      const legacyUser = usersById.get(account.userId);
      const email = this.resolveEmail(account, legacyUser);
      if (!email) {
        continue;
      }

      const exists = await this.userRepository.findOne({ where: { email } });
      if (exists) {
        migratedUsers.push(exists);
        continue;
      }

      const fullName = this.normalizeFullName(
        null,
        legacyUser?.firstName,
        legacyUser?.lastName,
        account.credential,
      );

      const entity = this.userRepository.create({
        email,
        password: account.password,
        fullName,
        phone: legacyUser?.phoneNumber ?? null,
        role: 'CUSTOMER',
        isActive: account.isVerified ?? true,
        refreshToken: null,
      });

      const saved = await this.userRepository.save(entity);
      migratedUsers.push(saved);
    }

    return migratedUsers;
  }

  private resolveEmail(account: LegacyAccountRecord, legacyUser?: LegacyUserRecord): string | null {
    if (legacyUser?.email) {
      return legacyUser.email.toLowerCase();
    }

    if (account.type === 'EMAIL' && account.credential) {
      return account.credential.toLowerCase();
    }

    if (!account.credential) {
      return null;
    }

    return `${account.credential.toLowerCase()}@legacy.local`;
  }

  private normalizeFullName(
    fullName?: string | null,
    firstName?: string | null,
    lastName?: string | null,
    fallback?: string | null,
  ): string {
    if (fullName?.trim()) {
      return fullName.trim();
    }

    const joinedName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    if (joinedName) {
      return joinedName;
    }

    if (fallback?.trim()) {
      return fallback.trim();
    }

    return 'Unknown User';
  }

  async findByRole(role: string): Promise<User[]> {
    return this.userRepository.find({ where: { role } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
