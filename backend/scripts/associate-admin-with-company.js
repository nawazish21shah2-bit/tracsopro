/**
 * Script to associate an admin user with a security company
 * 
 * Usage:
 *   node backend/scripts/associate-admin-with-company.js <adminEmail> <companyId>
 * 
 * Example:
 *   node backend/scripts/associate-admin-with-company.js admin@example.com <company-uuid>
 * 
 * Or to create a new company and associate:
 *   node backend/scripts/associate-admin-with-company.js admin@example.com --create "Company Name"
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function associateAdminWithCompany() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node associate-admin-with-company.js <adminEmail> <companyId|--create "Company Name">');
    console.error('\nExamples:');
    console.error('  node associate-admin-with-company.js admin@example.com <existing-company-id>');
    console.error('  node associate-admin-with-company.js admin@example.com --create "My Security Company"');
    process.exit(1);
  }

  const adminEmail = args[0];
  const companyArg = args[1];

  try {
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });

    if (!adminUser) {
      console.error(`❌ User with email ${adminEmail} not found`);
      process.exit(1);
    }

    if (adminUser.role !== 'ADMIN') {
      console.error(`❌ User ${adminEmail} is not an ADMIN (role: ${adminUser.role})`);
      process.exit(1);
    }

    console.log(`✓ Found admin user: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);

    let securityCompanyId;
    let companyName;

    // Check if we need to create a company
    if (companyArg === '--create') {
      companyName = args[2] || 'New Security Company';
      
      console.log(`\nCreating new security company: ${companyName}...`);
      
      const newCompany = await prisma.securityCompany.create({
        data: {
          name: companyName,
          email: adminEmail, // Use admin email as company email
          subscriptionPlan: 'BASIC',
          subscriptionStatus: 'TRIAL',
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        }
      });

      securityCompanyId = newCompany.id;
      console.log(`✓ Created security company: ${newCompany.name} (ID: ${newCompany.id})`);
    } else {
      securityCompanyId = companyArg;
      
      // Verify company exists
      const company = await prisma.securityCompany.findUnique({
        where: { id: securityCompanyId },
        select: { id: true, name: true }
      });

      if (!company) {
        console.error(`❌ Security company with ID ${securityCompanyId} not found`);
        process.exit(1);
      }

      companyName = company.name;
      console.log(`✓ Found security company: ${company.name} (ID: ${company.id})`);
    }

    // Check if association already exists
    const existingAssociation = await prisma.companyUser.findFirst({
      where: {
        userId: adminUser.id,
        securityCompanyId: securityCompanyId,
        isActive: true
      }
    });

    if (existingAssociation) {
      console.log(`\n⚠️  Admin is already associated with this company`);
      console.log(`   Association ID: ${existingAssociation.id}`);
      console.log(`   Role: ${existingAssociation.role}`);
      process.exit(0);
    }

    // Create the association
    console.log(`\nCreating CompanyUser association...`);
    const companyUser = await prisma.companyUser.create({
      data: {
        userId: adminUser.id,
        securityCompanyId: securityCompanyId,
        role: 'ADMIN', // Set as ADMIN role in the company
        isActive: true,
      }
    });

    console.log(`\n✅ Successfully associated admin with company!`);
    console.log(`   Admin: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);
    console.log(`   Company: ${companyName}`);
    console.log(`   Company Role: ${companyUser.role}`);
    console.log(`   Association ID: ${companyUser.id}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.error('   This association already exists (unique constraint violation)');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

associateAdminWithCompany();

