"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Check if data already exists
    const existingOrgs = await prisma.organization.count();
    if (existingOrgs > 0) {
        console.log('⚠️  Database already has data. Skipping seed.');
        await prisma.$disconnect();
        process.exit(0);
    }
    // Create organization
    const org = await prisma.organization.create({
        data: {
            name: 'Sentix Demo',
            slug: 'sentix-demo',
            settings: {
                retention_days: 365,
                timezone: 'UTC',
                i18n: { locales: ['en'] },
            },
        },
    });
    console.log(`✓ Created organization: ${org.name}`);
    // Create user
    const user = await prisma.user.create({
        data: {
            email: 'demo@sentix.ai',
            name: 'Demo User',
            password_hash: '$2a$10$YourHashedPasswordHere', // Not used in seed, but placeholder
            organization_id: org.id,
            role: 'ADMIN',
        },
    });
    console.log(`✓ Created user: ${user.email}`);
    // Create project
    const project = await prisma.project.create({
        data: {
            name: 'Demo Project',
            description: 'Demo project for Sentix',
            organization_id: org.id,
        },
    });
    console.log(`✓ Created project: ${project.name}`);
    // Create signals (3 main test signals as per spec)
    const signals = [
        {
            source_type: 'support',
            text: 'Customers are consistently reporting errors when trying to upload CSV files. Many are getting "Invalid file format" errors even for simple spreadsheets. This is causing frustration and increasing support ticket volume.',
            account_name: 'Acme Corp',
        },
        {
            source_type: 'sales',
            text: 'Lost 3 deals last month because we don\'t have SAML/SSO integration. Enterprise prospects require SSO for compliance and our lack of it is blocking sales. Competitors all offer this feature. Need to prioritize SAML implementation urgently.',
            account_name: 'TechCorp',
        },
        {
            source_type: 'nps',
            text: 'Product manager feedback is too generic. The AI-generated themes and analyses lack specific, actionable insights. We get high-level summaries but can\'t drill down into the actual customer pain points. The reasoning needs to be more transparent and detailed.',
            account_name: 'Feedback Survey',
        },
        // Additional signals to enrich the analysis
        {
            source_type: 'support',
            text: 'I tried to import my customer data from a CSV file but the upload kept failing. The error message was unclear. I need to migrate my data urgently.',
            account_name: 'SmallBiz Inc',
        },
        {
            source_type: 'sales',
            text: 'Our security team requires SSO for all SaaS tools. We love what Sentix does but we can\'t purchase without SAML support. Please add this as soon as possible.',
            account_name: 'Enterprise Co',
        },
        {
            source_type: 'nps',
            text: 'The platform is great but the AI insights feel superficial. I wish I could understand why certain themes are prioritized the way they are. More transparency in the analysis would help.',
            account_name: 'Product Team Lead',
        },
        {
            source_type: 'support',
            text: 'File upload is broken! CSV files with special characters in headers cause errors. Need a fix quickly.',
            account_name: 'StartupXYZ',
        },
        {
            source_type: 'manual',
            text: 'Deal closed but lost due to missing enterprise features. SAML was the main blocker. Customer went with competitor that had SSO.',
            account_name: 'BigEnterprise',
        },
    ];
    for (const signal of signals) {
        await prisma.signal.create({
            data: {
                project_id: project.id,
                source_type: signal.source_type,
                text: signal.text,
                account_name: signal.account_name,
                metadata: { seeded: true, source: 'seed script' },
            },
        });
    }
    console.log(`✓ Created ${signals.length} signals`);
    console.log('✅ Seed completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run synthesis: POST /synthesize with project_id');
    console.log('2. Verify roadmap buckets match expected output:');
    console.log('   - NOW: "CSV", "upload", "error", "file", "format" related → Fix CSV upload failures');
    console.log('   - NEXT: "SAML", "SSO", "enterprise", "security", "compliance" → Implement SAML/SSO');
    console.log('   - LATER: "AI", "output", "clarity", "insight", "transparency" → Improve AI output clarity');
    await prisma.$disconnect();
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map