import {PrismaClient} from '@prisma/client'
import { NODE_ENV } from "../credentials.js"

const globalForPrisma = globalThis

// Create Prisma client with error handling
let prismaClient;
try {
  prismaClient = new PrismaClient({
    log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
} catch (error) {
  console.error('Failed to create Prisma client:', error.message);
  // Create a mock client that won't crash the app
  prismaClient = {
    $connect: () => Promise.reject(new Error('Database not configured')),
    $disconnect: () => Promise.resolve(),
  };
}

export const prisma = globalForPrisma.prisma || prismaClient

if (NODE_ENV !== 'production') globalForPrisma.prisma = prisma