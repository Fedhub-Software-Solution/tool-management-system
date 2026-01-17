/**
 * Script to create an Approver user in the database
 * Usage: npx tsx scripts/create-approver-user.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function createApproverUser() {
  try {
    // Check if Approver user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@toolmgmt.com' },
    });

    if (existingUser) {
      console.log('Approver user already exists!');
      console.log('Email: admin@toolmgmt.com');
      console.log('Password: (use the password you set earlier)');
      return;
    }

    // Default password for Approver user
    const password = 'Admin@123';
    const passwordHash = await hashPassword(password);

    // Create Approver user
    const approverUser = await prisma.user.create({
      data: {
        email: 'admin@toolmgmt.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'Approver',
        employeeId: 'ADMIN001',
        department: 'Administration',
        isActive: true,
      },
    });

    console.log('✅ Approver user created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('─────────────────────────────────────');
    console.log(`Email:    ${approverUser.email}`);
    console.log(`Password: ${password}`);
    console.log('─────────────────────────────────────');
    console.log('\n⚠️  Please change the password after first login!');
    console.log('\nUser ID:', approverUser.id);
  } catch (error) {
    console.error('❌ Error creating Approver user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createApproverUser();

