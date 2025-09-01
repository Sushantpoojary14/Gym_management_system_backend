// src/redis-storage.ts
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

export class RedisStorage implements ThrottlerStorage {
  private readonly redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<any> {
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.pexpire(key, ttl);
    }

    const timeToExpire = await this.redis.pttl(key); // time in ms

    const isBlocked = current > limit;

    return {
      totalHits: current,
      timeToExpire: timeToExpire > 0 ? timeToExpire : ttl,
      isBlocked,
    };
  }

  async get(key: string): Promise<any | null> {
    const val = await this.redis.get(key);
    if (!val) return null;

    const totalHits = parseInt(val, 10);
    const timeToExpire = await this.redis.pttl(key);
    const isBlocked = false; // `get()` doesn't check for block logic

    return {
      totalHits,
      timeToExpire: timeToExpire > 0 ? timeToExpire : 0,
      isBlocked,
    };
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
