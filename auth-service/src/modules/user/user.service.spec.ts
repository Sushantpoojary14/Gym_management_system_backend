import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './user.service';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { Repository } from 'typeorm';
import { UserRole } from 'src/common/enums/role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;
  let cache: Cache;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    phone: '1234567890',
    fullName: 'Test User',
    gender: 'MALE',
    dateOfBirth: new Date(),
    isVerified: true,
    profileUrl: '',
    createdAt: new Date(),
    password: 'password',
    role: UserRole.USER,
    isDeleted: false,
    status: 'active',
    lastSeen: new Date(),
    is18: true,
    updatedAt: new Date(),
  } as User;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockAwsService = {
    uploadFile: jest.fn().mockResolvedValue('https://s3.amazonaws.com/fake-url'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: AwsS3Service, useValue: mockAwsService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
    cache = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return user from cache if exists', async () => {
      mockCacheManager.get.mockResolvedValue(mockUser);
      const result = await service.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`user:email:${mockUser.email}`);
    });

    it('should return user from DB and cache it if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
      expect(mockCacheManager.set).toHaveBeenCalledWith(`user:email:${mockUser.email}`, mockUser, 300);
    });

    it('should throw if DB call fails', async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error('DB error'));
      await expect(service.findByEmail(mockUser.email)).rejects.toThrow('DB error');
    });
  });

  describe('findById', () => {
    it('should return user from cache if exists', async () => {
      mockCacheManager.get.mockResolvedValue(mockUser);
      const result = await service.findById(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`user:id:${mockUser.id}`);
    });

    it('should return user from DB and cache it if not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findById(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(mockCacheManager.set).toHaveBeenCalledWith(`user:id:${mockUser.id}`, mockUser, 300);
    });
  });

  it('should return user using findByEmailOrPhone', async () => {
    mockUserRepository.findOne.mockResolvedValue(mockUser);
    const result = await service.findByEmailOrPhone(mockUser.email, mockUser.phone);
    expect(result).toEqual(mockUser);
  });

  it('should return user using findByPhone', async () => {
    mockUserRepository.findOne.mockResolvedValue(mockUser);
    const result = await service.findByPhone(mockUser.phone);
    expect(result).toEqual(mockUser);
  });

  it('should return all users', async () => {
    mockUserRepository.findAndCount.mockResolvedValue([[mockUser, mockUser], 2]);
    const result = await service.findAll();
    expect(result).toEqual({
      data: [mockUser, mockUser],
      total: 2,
      page: 1,
      limit: 10,
    });
  });

  it('should soft delete a user', async () => {
    mockUserRepository.update.mockResolvedValue(undefined);
    const result = await service.remove(mockUser.id);
    expect(result).toEqual({
      message: 'User deleted successfully',
      status: 200,
    });
  });

  // You can uncomment and adapt this when implementing status-based aggregation
  it('should return users by status', async () => {
    mockUserRepository.createQueryBuilder().getRawMany.mockResolvedValue([
      { status: 'active', count: 1 },
      { status: 'inactive', count: 1 },
    ]);
    const result = await service.findAllByStatus();
    expect(result).toEqual({ active: 1, inactive: 1 });
  });

  it('should return user by creation',async()=>{
    const result = await service.create(mockUser);
    expect(result).toEqual(mockUser);
    expect(result).not.toBeNull();
  })

  it('should return user by update',async()=>{
    const result = await service.update(mockUser.id,mockUser);
    expect(result).toEqual(mockUser);
    expect(result).not.toBeNull();
  })
});
