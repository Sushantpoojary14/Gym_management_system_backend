
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
        await this.$connect();
        console.log("Database connected");
        
    } catch (error) {
        console.log("Database connection error",error);
        throw error;
    }
  }
}
