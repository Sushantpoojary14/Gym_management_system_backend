import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike, LessThan, In } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from 'src/common/enums/role.enum';
import { UserStatus } from 'src/common/enums/status.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { validateAndCalculateAge } from 'src/common/utils/validate-age.util';

@Injectable()
export class UsersService {
  private readonly TTL_SECONDS = 300 // 5 minutes
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private awsService: AwsS3Service,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) { }

  public async findByEmail(email: string, includePassword = false): Promise<User | null> {
    const cacheKey = `user:email:${email}`;
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached && !includePassword) return cached;
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    await this.cacheManager.set(cacheKey, userWithoutPassword as User, this.TTL_SECONDS);

    return includePassword ? user : userWithoutPassword as User;
  }

  public async findOne<T extends keyof User>(key: T, value: User[T]): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { [key]: value },
      select: ['id', 'email', 'phone', 'fullName', 'gender', 'role', 'dateOfBirth', 'isVerified', 'profileUrl', 'createdAt']
    });

    return user;
  }

  public async findById(id: number): Promise<User | null> {
    const cacheKey = `user:id:${id}`;
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'phone', 'fullName', 'gender', 'role', 'dateOfBirth', 'isVerified', 'profileUrl', 'createdAt']
    });

    if (user) {
      await this.cacheManager.set(cacheKey, user, this.TTL_SECONDS);
    }
    return user;
  }

  public async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'phone', 'fullName','password', 'gender', 'role', 'dateOfBirth', 'isVerified', 'profileUrl', 'createdAt']
    });
  }

  public async findByEmailOrPhone(email?: string, phone?: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ email }, { phone }],
      select: ['id', 'email', 'phone', 'fullName', 'gender', 'role', 'dateOfBirth', 'isVerified', 'profileUrl', 'createdAt']
    });
  }

  public async findByPhone(phone: string): Promise<User | null> {
    const cacheKey = `user:phone:${phone}`;
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findOne({
      where: { phone },
      select: ['id', 'email', 'phone', 'fullName', 'gender', 'role', 'dateOfBirth', 'isVerified', 'profileUrl', 'createdAt']
    });

    if (user) {
      await this.cacheManager.set(cacheKey, user, this.TTL_SECONDS);
    }
    return user;
  }

  public async findAll(
    page = 1,
    limit = 10,
    filters?: {
      search?: string;
      role?: string;
      status?: UserStatus;
    },
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const where: FindManyOptions<User>['where'] = {};

      if (filters?.search) {
        where['fullName'] = ILike(`%${filters.search}%`);
      }

      if (filters?.role) {
        where['role'] = filters.role as UserRole;
      }

      if (filters?.status) {
        where['status'] = filters.status;
      }

      const [data, total] = await this.userRepository.findAndCount({
        where,
        select: ['id', 'email', 'phone', 'fullName', 'gender', 'role', 'dateOfBirth', 'isVerified', 'is18', 'lastSeen', 'isDeleted', 'profileUrl', 'createdAt', 'updatedAt'],
        take: limit,
        skip: (page - 1) * limit,
        order: { createdAt: 'DESC' },
      });

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message ?? 'Failed to fetch users');
    }
  }

  public async findAllByStatus(): Promise<Record<UserStatus, number>> {
    try {
      const result: Record<UserStatus, number> = {
        [UserStatus.ACTIVE]: 0,
        [UserStatus.INACTIVE]: 0,
        [UserStatus.SUSPENDED]: 0,
        [UserStatus.BLOCKED]: 0,
      };
      const raw = await this.userRepository
        .createQueryBuilder('user')
        .select('user.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('user.status')
        .getRawMany();

      raw.forEach(row => {
        result[row.status] = parseInt(row.count, 10);
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(error.message ?? 'Failed to fetch users');
    }
  }

  public async create(userData: any): Promise<User> {
    try {
      const user = await this.userRepository.save(userData);
      const createdUser = await this.findById(user.id);
      if (!createdUser) {
        throw new InternalServerErrorException('User creation failed');
      }
      return createdUser
    } catch (error) {
      throw new InternalServerErrorException(error.message ?? 'Failed to create user')
    }
  }

  public async update(id: number, userData: UpdateUserDto, profileFile?: Express.Multer.File): Promise<User | null> {
    try {
      const existingUser = await this.userRepository.findOne({ where: { id } });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }
      if ('status' in userData && existingUser.role !== UserRole.SUPER_ADMIN) {
        delete userData.status;
      }

      if (userData.reqUrl && userData.reqUrl.match(/^\/user\/\d+$/)) {
        const restrictedFields = new Set(['lastSeen', 'isVerified', 'is18', 'password']);
        const invalidFields = Object.keys(userData).filter((key) => restrictedFields.has(key));

        if (invalidFields.length > 0) {
          throw new BadRequestException(
            `You are not allowed to update the following field(s): ${invalidFields.join(', ')}`
          );
        }
        delete userData.reqUrl;
      }

      let profileUrl = '';
      if (profileFile) {
        profileUrl = await this.awsService.uploadFile(profileFile, 'users/profiles');
      }

      if ('dateOfBirth' in userData && userData.dateOfBirth) {
        validateAndCalculateAge(userData.dateOfBirth);
      }

      await this.userRepository.update(id, userData);

      const updated = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'email', 'phone', 'fullName', 'gender', 'dateOfBirth', 'isVerified', 'profileUrl', 'createdAt'],
      });

      if (updated) {
        await Promise.all([
          this.cacheManager.del(`user:id:${updated.id}`),
          this.cacheManager.del(`user:email:${existingUser.email}`),
          this.cacheManager.del(`user:phone:${existingUser.phone}`),
        ]);
        await Promise.all([
          this.cacheManager.set(`user:id:${updated.id}`, updated, this.TTL_SECONDS),
          this.cacheManager.set(`user:email:${updated.email}`, updated, this.TTL_SECONDS),
        ]);
      }
      return updated;
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException(error.message ?? 'User update failed');
    }
  }

  public async bulkUpdate(ids: number[], status: UserStatus): Promise<User[]> {
    try {
      const users = await this.userRepository.find({ where: { id: In(ids) } });

      if (!users.length) {
        throw new NotFoundException('No users found for the provided IDs');
      }

      await this.userRepository.update({ id: In(ids) }, { status });

      const updatedUsers = await this.userRepository.find({
        where: { id: In(ids) },
        select: [
          'id', 'email', 'phone', 'fullName', 'gender', 'dateOfBirth', 'is18',
           'isDeleted','status', 'isVerified', 'profileUrl', 'createdAt',
        ],
      });

      const cacheTasks: Promise<any>[] = [];

      for (const user of updatedUsers) {
        const keysToDelete = [
          `user:id:${user.id}`,
          `user:email:${user.email}`,
          `user:phone:${user.phone}`,
        ];

        // Invalidate old cache
        cacheTasks.push(...keysToDelete.map(key => this.cacheManager.del(key)));
      }

      await Promise.all(cacheTasks);

      return updatedUsers;
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException(error?.message || 'Bulk user update failed');
    }
  }

  public async remove(id: number): Promise<{ message: string, status: number }> {
    const user = await this.findById(id);
    if (user) {
      await Promise.all([
        this.cacheManager.del(`user:id:${user.id}`),
        this.cacheManager.del(`user:email:${user.email}`),
        this.cacheManager.del(`user:phone:${user.phone}`),
      ]);
    }
    await this.userRepository.update(id, { status: UserStatus.SUSPENDED, isDeleted: true, scheduledDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    return {
      message: 'User deleted successfully',
      status: 200
    };
  }

  public async deleteExpiredUsers(): Promise<void> {
    const expiredUsers = await this.userRepository.find({
      where: {
        isDeleted: true,
        scheduledDeletionDate: LessThan(new Date()),
      },
    });

    if (expiredUsers.length === 0) {
      return;
    }

    for (const user of expiredUsers) {
      await this.cacheManager.del(`user:id:${user.id}`);
      await this.cacheManager.del(`user:email:${user.email}`);
      await this.cacheManager.del(`user:phone:${user.phone}`);

      await this.userRepository.delete(user.id);
    }
  }
}
