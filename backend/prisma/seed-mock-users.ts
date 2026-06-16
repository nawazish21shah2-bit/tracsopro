import { PrismaClient, Role, CompanyRole, AccountType, GuardStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding mock users for development...\n');

  try {
    // Create or get SecurityCompany
    let company = await prisma.securityCompany.findFirst({
      where: { email: 'company@mockdev.com' }
    });

    if (!company) {
      company = await prisma.securityCompany.create({
        data: {
          name: 'Mock Dev Security Company',
          email: 'company@mockdev.com',
          phone: '1234567890',
          address: '123 Security St, Dev City',
          subscriptionPlan: 'PROFESSIONAL',
          subscriptionStatus: 'ACTIVE',
          maxGuards: 50,
          maxClients: 20,
          maxSites: 30,
          isActive: true
        }
      });
      console.log('✅ Created SecurityCompany:', company.name);
    } else {
      console.log('✅ Using existing SecurityCompany:', company.name);
    }

    // Create or get Company Admin User
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@mockdev.com' }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@mockdev.com',
          password: hashedPassword,
          firstName: 'Company',
          lastName: 'Admin',
          phone: '1111111111',
          role: 'ADMIN',
          accountType: 'COMPANY',
          isActive: true,
          isEmailVerified: true
        }
      });
      console.log('✅ Created Company Admin User:', adminUser.email);
    } else {
      console.log('✅ Using existing Company Admin User:', adminUser.email);
    }

    // Link admin to company
    let companyAdmin = await prisma.companyUser.findFirst({
      where: {
        securityCompanyId: company.id,
        userId: adminUser.id
      }
    });

    if (!companyAdmin) {
      companyAdmin = await prisma.companyUser.create({
        data: {
          securityCompanyId: company.id,
          userId: adminUser.id,
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log('✅ Linked admin to company');
    }

    // Create or get Guard User
    let guardUser = await prisma.user.findUnique({
      where: { email: 'guard@mockdev.com' }
    });

    if (!guardUser) {
      const hashedPassword = await bcrypt.hash('GuardPass123!', 10);
      guardUser = await prisma.user.create({
        data: {
          email: 'guard@mockdev.com',
          password: hashedPassword,
          firstName: 'Mock',
          lastName: 'Guard',
          phone: '2222222222',
          role: 'GUARD',
          accountType: 'INDIVIDUAL',
          isActive: true,
          isEmailVerified: true
        }
      });
      console.log('✅ Created Guard User:', guardUser.email);
    } else {
      console.log('✅ Using existing Guard User:', guardUser.email);
    }

    // Create Guard profile
    let guard = await prisma.guard.findUnique({
      where: { userId: guardUser.id }
    });

    if (!guard) {
      guard = await prisma.guard.create({
        data: {
          userId: guardUser.id,
          employeeId: 'EMP-001-DEV',
          department: 'Security Operations',
          experience: '5 years',
          status: GuardStatus.ACTIVE,
          hireDate: new Date('2022-01-01')
        }
      });
      console.log('✅ Created Guard profile:', guard.employeeId);
    } else {
      console.log('✅ Using existing Guard profile:', guard.employeeId);
    }

    // Link guard to company
    let companyGuard = await prisma.companyGuard.findFirst({
      where: {
        securityCompanyId: company.id,
        guardId: guard.id
      }
    });

    if (!companyGuard) {
      companyGuard = await prisma.companyGuard.create({
        data: {
          securityCompanyId: company.id,
          guardId: guard.id,
          employeeNumber: 'GUARD-001',
          department: 'Field Operations',
          hourlyRate: 25.50,
          isActive: true
        }
      });
      console.log('✅ Linked guard to company');
    }

    // Create or get Client User
    let clientUser = await prisma.user.findUnique({
      where: { email: 'client@mockdev.com' }
    });

    if (!clientUser) {
      const hashedPassword = await bcrypt.hash('ClientPass123!', 10);
      clientUser = await prisma.user.create({
        data: {
          email: 'client@mockdev.com',
          password: hashedPassword,
          firstName: 'Mock',
          lastName: 'Client',
          phone: '3333333333',
          role: 'CLIENT',
          accountType: 'COMPANY',
          isActive: true,
          isEmailVerified: true
        }
      });
      console.log('✅ Created Client User:', clientUser.email);
    } else {
      console.log('✅ Using existing Client User:', clientUser.email);
    }

    // Create Client profile
    let client = await prisma.client.findUnique({
      where: { userId: clientUser.id }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: clientUser.id,
          accountType: AccountType.COMPANY,
          companyName: 'Mock Dev Client Inc.',
          companyRegistrationNumber: 'REG-123456',
          taxId: 'TAX-987654',
          address: '456 Client Ave, Dev City',
          city: 'Dev City',
          state: 'DC',
          zipCode: '12345',
          country: 'USA',
          website: 'https://mockdevclient.example.com'
        }
      });
      console.log('✅ Created Client profile:', client.companyName);
    } else {
      console.log('✅ Using existing Client profile:', client.companyName);
    }

    // Link client to company
    let companyClient = await prisma.companyClient.findFirst({
      where: {
        securityCompanyId: company.id,
        clientId: client.id
      }
    });

    if (!companyClient) {
      companyClient = await prisma.companyClient.create({
        data: {
          securityCompanyId: company.id,
          clientId: client.id,
          contractStartDate: new Date('2024-01-01'),
          contractValue: 50000,
          paymentTerms: 'Net 30',
          isActive: true
        }
      });
      console.log('✅ Linked client to company');
    }

    // Create a Site for the client
    let site = await prisma.site.findFirst({
      where: {
        clientId: client.id,
        name: 'Mock Dev Main Site'
      }
    });

    if (!site) {
      site = await prisma.site.create({
        data: {
          clientId: client.id,
          name: 'Mock Dev Main Site',
          address: '789 Main Site St, Dev City',
          latitude: 40.7128,
          longitude: -74.006,
          description: 'Primary security location for development testing',
          requirements: 'Standard security protocols',
          isActive: true
        }
      });
      console.log('✅ Created Site:', site.name);
    } else {
      console.log('✅ Using existing Site:', site.name);
    }

    // Link site to company
    let companySite = await prisma.companySite.findFirst({
      where: {
        securityCompanyId: company.id,
        siteId: site.id
      }
    });

    if (!companySite) {
      companySite = await prisma.companySite.create({
        data: {
          securityCompanyId: company.id,
          siteId: site.id,
          isActive: true
        }
      });
      console.log('✅ Linked site to company');
    }

    console.log('\n✨ Mock users seeded successfully!\n');
    console.log('📝 Test Credentials:');
    console.log('   Company Admin:');
    console.log('     Email: admin@mockdev.com');
    console.log('     Password: AdminPass123!');
    console.log('   Guard:');
    console.log('     Email: guard@mockdev.com');
    console.log('     Password: GuardPass123!');
    console.log('   Client:');
    console.log('     Email: client@mockdev.com');
    console.log('     Password: ClientPass123!\n');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
