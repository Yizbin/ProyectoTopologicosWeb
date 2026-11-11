import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    if (!process.env.DATABASE_URL) {
      process.loadEnvFile?.('.env');
    }
    const databaseUrl = new URL(process.env.DATABASE_URL!);
    const esConexionLocal = ['localhost', '127.0.0.1', '[::1]'].includes(databaseUrl.hostname);
    if (esConexionLocal && !databaseUrl.searchParams.has('allowPublicKeyRetrieval')) {
      databaseUrl.searchParams.set('allowPublicKeyRetrieval', 'true');
    }
    const adapter = new PrismaMariaDb(databaseUrl.toString());
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
