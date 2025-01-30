// utils/redisLock.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedisClient() {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('REDIS_URL is not defined. Redis-based locking will be disabled.');
      return null;
    }
    
    try {
      redis = new Redis(redisUrl);
      redis.on('error', (err) => {
        console.error('Redis connection error:', err);
        redis = null;
      });
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      return null;
    }
  }
  return redis;
}

export async function acquireLock(key: string, ttl: number): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    console.warn('Redis client not available, skipping lock acquisition');
    return true; // Proceed without lock if Redis is unavailable
  }
  try {
    const result = await client.set(key, '1', 'PX', ttl, 'NX');
    return result === 'OK';
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return true; // Proceed without lock if there's an error
  }
}

export async function releaseLock(key: string): Promise<void> {
  const client = getRedisClient();
  if (client) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }
}