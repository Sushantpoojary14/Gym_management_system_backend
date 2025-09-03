import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      const url = process.env.DATABASE_URL!;
      const dbName = url.split('/').pop(); // last part = db name

      // Connect to postgres default DB
      const adminClient = new Client({
        connectionString: url.replace(`/${dbName}`, '/postgres'),
      });

      await adminClient.connect();

      const res = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName],
      );

      if (res.rowCount === 0) {
        await adminClient.query(`CREATE DATABASE "${dbName}"`);
        console.log(`Database ${dbName} created ✅`);
      }

      await adminClient.end();

      await this.$connect();
      console.log('Database connected ✅');
    } catch (error) {
      console.error('Database connection error ❌', error);
      throw error;
    }
  }
}
