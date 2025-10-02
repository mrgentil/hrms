const db = require("./models");
const bcrypt = require("bcrypt");
require("dotenv").config();

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Force sync to recreate tables (optional - use with caution)
    // await db.sequelize.sync({ force: true });
    
    // Ensure tables exist
    await db.sequelize.sync({ alter: true });

    // Create Departments
    console.log("📁 Creating departments...");
    const departments = await db.department.bulkCreate([
      { department_name: "Human Resources" },
      { department_name: "Information Technology" },
      { department_name: "Finance" },
      { department_name: "Marketing" },
      { department_name: "Operations" }
    ], { ignoreDuplicates: true });

    console.log(`✅ Created ${departments.length} departments`);

    // Hash password for users
    const hashedPassword = await bcrypt.hash("pass123!", 10);

    // Create Users
    console.log("👥 Creating users...");
    const users = await db.user.bulkCreate([
      {
        username: "bill",
        password: hashedPassword,
        fullName: "Bill Johnson",
        role: "ROLE_ADMIN",
        active: true,
        department_id: 2 // IT Department
      },
      {
        username: "alice",
        password: hashedPassword,
        fullName: "Alice Smith",
        role: "ROLE_MANAGER",
        active: true,
        department_id: 1 // HR Department
      },
      {
        username: "john",
        password: hashedPassword,
        fullName: "John Doe",
        role: "ROLE_EMPLOYEE",
        active: true,
        department_id: 2 // IT Department
      },
      {
        username: "sarah",
        password: hashedPassword,
        fullName: "Sarah Wilson",
        role: "ROLE_EMPLOYEE",
        active: true,
        department_id: 3 // Finance Department
      },
      {
        username: "mike",
        password: hashedPassword,
        fullName: "Mike Brown",
        role: "ROLE_MANAGER",
        active: true,
        department_id: 4 // Marketing Department
      }
    ], { ignoreDuplicates: true });

    console.log(`✅ Created ${users.length} users`);

    // Create Personal Information for users
    console.log("📋 Creating personal information...");
    const personalInfos = await db.userPersonalInfo.bulkCreate([
      {
        user_id: 1, // bill
        date_of_birth: new Date("1985-06-15"),
        gender: "Male",
        marital_status: "Married",
        father_name: "Robert Johnson",
        id_number: "ID123456789",
        address: "123 Main Street",
        city: "New York",
        country: "USA",
        mobile: "+1-555-0101",
        phone: "+1-555-0102",
        email_address: "bill.johnson@company.com"
      },
      {
        user_id: 2, // alice
        date_of_birth: new Date("1988-03-22"),
        gender: "Female",
        marital_status: "Single",
        father_name: "David Smith",
        id_number: "ID987654321",
        address: "456 Oak Avenue",
        city: "Los Angeles",
        country: "USA",
        mobile: "+1-555-0201",
        phone: "+1-555-0202",
        email_address: "alice.smith@company.com"
      },
      {
        user_id: 3, // john
        date_of_birth: new Date("1990-11-08"),
        gender: "Male",
        marital_status: "Single",
        father_name: "James Doe",
        id_number: "ID456789123",
        address: "789 Pine Road",
        city: "Chicago",
        country: "USA",
        mobile: "+1-555-0301",
        phone: "+1-555-0302",
        email_address: "john.doe@company.com"
      },
      {
        user_id: 4, // sarah
        date_of_birth: new Date("1987-09-14"),
        gender: "Female",
        marital_status: "Married",
        father_name: "William Wilson",
        id_number: "ID789123456",
        address: "321 Elm Street",
        city: "Houston",
        country: "USA",
        mobile: "+1-555-0401",
        phone: "+1-555-0402",
        email_address: "sarah.wilson@company.com"
      },
      {
        user_id: 5, // mike
        date_of_birth: new Date("1983-12-03"),
        gender: "Male",
        marital_status: "Married",
        father_name: "Charles Brown",
        id_number: "ID321654987",
        address: "654 Maple Drive",
        city: "Phoenix",
        country: "USA",
        mobile: "+1-555-0501",
        phone: "+1-555-0502",
        email_address: "mike.brown@company.com"
      }
    ], { ignoreDuplicates: true });

    console.log(`✅ Created ${personalInfos.length} personal information records`);

    // Create Financial Information for users
    console.log("💰 Creating financial information...");
    const financialInfos = await db.userFinancialInfo.bulkCreate([
      {
        user_id: 1, // bill - Admin
        employment_type: "Full Time",
        salary_basic: 8000,
        salary_gross: 10000,
        salary_net: 7500,
        allowance_house_rent: 1000,
        allowance_medical: 500,
        allowance_special: 300,
        allowance_fuel: 200,
        allowance_phone_bill: 100,
        allowance_other: 0,
        allowance_total: 2100,
        deduction_provident_fund: 800,
        deduction_tax: 1700,
        deduction_other: 0,
        deduction_total: 2500,
        bank_name: "Chase Bank",
        account_name: "Bill Johnson",
        account_number: "1234567890",
        iban: "US12CHAS0000001234567890"
      },
      {
        user_id: 2, // alice - Manager
        employment_type: "Full Time",
        salary_basic: 6000,
        salary_gross: 7500,
        salary_net: 5800,
        allowance_house_rent: 800,
        allowance_medical: 400,
        allowance_special: 200,
        allowance_fuel: 100,
        allowance_phone_bill: 50,
        allowance_other: 0,
        allowance_total: 1550,
        deduction_provident_fund: 600,
        deduction_tax: 1150,
        deduction_other: 0,
        deduction_total: 1750,
        bank_name: "Bank of America",
        account_name: "Alice Smith",
        account_number: "2345678901",
        iban: "US34BOFA0000002345678901"
      },
      {
        user_id: 3, // john - Employee
        employment_type: "Full Time",
        salary_basic: 4000,
        salary_gross: 5000,
        salary_net: 3900,
        allowance_house_rent: 600,
        allowance_medical: 300,
        allowance_special: 100,
        allowance_fuel: 0,
        allowance_phone_bill: 0,
        allowance_other: 0,
        allowance_total: 1000,
        deduction_provident_fund: 400,
        deduction_tax: 700,
        deduction_other: 0,
        deduction_total: 1100,
        bank_name: "Wells Fargo",
        account_name: "John Doe",
        account_number: "3456789012",
        iban: "US56WFBI0000003456789012"
      },
      {
        user_id: 4, // sarah - Employee
        employment_type: "Full Time",
        salary_basic: 4500,
        salary_gross: 5500,
        salary_net: 4200,
        allowance_house_rent: 650,
        allowance_medical: 250,
        allowance_special: 100,
        allowance_fuel: 0,
        allowance_phone_bill: 0,
        allowance_other: 0,
        allowance_total: 1000,
        deduction_provident_fund: 450,
        deduction_tax: 850,
        deduction_other: 0,
        deduction_total: 1300,
        bank_name: "Citibank",
        account_name: "Sarah Wilson",
        account_number: "4567890123",
        iban: "US78CITI0000004567890123"
      },
      {
        user_id: 5, // mike - Manager
        employment_type: "Full Time",
        salary_basic: 5500,
        salary_gross: 7000,
        salary_net: 5400,
        allowance_house_rent: 750,
        allowance_medical: 350,
        allowance_special: 200,
        allowance_fuel: 200,
        allowance_phone_bill: 0,
        allowance_other: 0,
        allowance_total: 1500,
        deduction_provident_fund: 550,
        deduction_tax: 1050,
        deduction_other: 0,
        deduction_total: 1600,
        bank_name: "US Bank",
        account_name: "Mike Brown",
        account_number: "5678901234",
        iban: "US90USBA0000005678901234"
      }
    ], { ignoreDuplicates: true });

    console.log(`✅ Created ${financialInfos.length} financial information records`);

    // Create some Jobs
    console.log("💼 Creating jobs...");
    const jobs = await db.job.bulkCreate([
      {
        job_title: "System Administrator",
        start_date: new Date("2023-01-01"),
        end_date: new Date("2024-12-31"),
        user_id: 1 // bill
      },
      {
        job_title: "HR Manager",
        start_date: new Date("2023-01-01"),
        end_date: new Date("2024-12-31"),
        user_id: 2 // alice
      },
      {
        job_title: "Software Developer",
        start_date: new Date("2023-06-01"),
        end_date: new Date("2024-12-31"),
        user_id: 3 // john
      },
      {
        job_title: "Financial Analyst",
        start_date: new Date("2023-03-01"),
        end_date: new Date("2024-12-31"),
        user_id: 4 // sarah
      },
      {
        job_title: "Marketing Manager",
        start_date: new Date("2023-02-01"),
        end_date: new Date("2024-12-31"),
        user_id: 5 // mike
      }
    ], { ignoreDuplicates: true });

    console.log(`✅ Created ${jobs.length} jobs`);

    // Create some sample applications (leave requests)
    console.log("📝 Creating sample applications...");
    const applications = await db.application.bulkCreate([
      {
        reason: "Family vacation",
        start_date: new Date("2024-07-15"),
        end_date: new Date("2024-07-25"),
        status: "Approved",
        type: "Normal",
        user_id: 3 // john
      },
      {
        reason: "Medical appointment",
        start_date: new Date("2024-08-10"),
        end_date: new Date("2024-08-12"),
        status: "Pending",
        type: "Illness",
        user_id: 4 // sarah
      }
    ], { ignoreDuplicates: true });

    console.log(`✅ Created ${applications.length} applications`);

    // Create some expenses
    console.log("💸 Creating sample expenses...");
    const expenses = await db.expense.bulkCreate([
      {
        expense_item_name: "Office Supplies",
        expense_item_store: "Staples",
        date: new Date("2024-01-15"),
        amount: 250,
        department_id: 2 // IT
      },
      {
        expense_item_name: "Team Lunch",
        expense_item_store: "Local Restaurant",
        date: new Date("2024-01-20"),
        amount: 180,
        department_id: 1 // HR
      },
      {
        expense_item_name: "Software License",
        expense_item_store: "Microsoft",
        date: new Date("2024-02-01"),
        amount: 1200,
        department_id: 2 // IT
      }
    ], { ignoreDuplicates: true });

    console.log(`✅ Created ${expenses.length} expenses`);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 Test Accounts Created:");
    console.log("👤 Admin: username='bill', password='pass123!'");
    console.log("👤 Manager: username='alice', password='pass123!'");
    console.log("👤 Employee: username='john', password='pass123!'");
    console.log("👤 Employee: username='sarah', password='pass123!'");
    console.log("👤 Manager: username='mike', password='pass123!'");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
