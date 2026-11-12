const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  { stageNumber: 1, name: 'Customer Registration & Requirement Gathering', description: 'Initial showroom inquiry, style preferences and budget finalization.', duration: 3 },
  { stageNumber: 2, name: 'Site Measurement & Technical Survey', description: 'Laser measurement of site walls, plumbing outlets, gas pipeline, and electrical points.', duration: 2 },
  { stageNumber: 3, name: '2D / 3D Kitchen Design Preparation', description: 'Preparation of modular layout, ergonomics, 3D photorealistic visualization and finish samples.', duration: 5 },
  { stageNumber: 4, name: 'Customer Design Presentation & Approval', description: 'Reviewing 3D renders with customer and receiving sign-off on layouts and finishes.', duration: 4 },
  { stageNumber: 5, name: 'Quotation Preparation & Cost Estimation', description: 'Itemized estimation of carcasses, shutters, hardware, countertop and GST calculations.', duration: 2 },
  { stageNumber: 6, name: 'Quotation Approval & Advance Payment', description: 'Quotation acceptance by customer and receipt of 50% production advance payment.', duration: 3 },
  { stageNumber: 7, name: 'Raw Material Procurement & Stock Allocation', description: 'Allocating plywood, laminates/acrylic, Blum/Hettich hinges, and tandem boxes from inventory.', duration: 4 },
  { stageNumber: 8, name: 'Factory Manufacturing & CNC Edge Banding', description: 'Precision panel cutting, CNC drilling, PUR edge-banding and carcass pre-assembly at factory.', duration: 10 },
  { stageNumber: 9, name: 'Factory Quality Inspection (QC Audit)', description: 'Multi-point checklist verification of shutter alignment, finish flaws and dimensional accuracy.', duration: 2 },
  { stageNumber: 10, name: 'Protective Packaging & Site Dispatch', description: 'Bubble wrapping, corner protectors and dispatch via freight vehicle to client site.', duration: 2 },
  { stageNumber: 11, name: 'On-Site Modular Installation', description: 'Carcass leveling, wall hanging, countertop cutout, drawer alignment and sink fitting.', duration: 5 },
  { stageNumber: 12, name: 'Final Inspection & Snag List Rectification', description: 'Soft-close tension adjustment, silicone sealing, handle fitting and cleaning.', duration: 2 },
  { stageNumber: 13, name: 'Customer Handover & Sign-Off', description: 'Joint walkthrough with client, care instructions guide handover and final payment settlement.', duration: 1 },
  { stageNumber: 14, name: 'Project Completed & Warranty Activation', description: 'Official completion certificate issue and 10-year warranty registration.', duration: 1 },
];

async function seed() {
  console.log('🌱 Starting CKTracker database seed...');

  // 1. Password Hashes
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const designerPassword = await bcrypt.hash('Designer@123', 10);
  const customerPassword = await bcrypt.hash('Customer@123', 10);

  // 2. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cktracker.com' },
    update: {},
    create: {
      email: 'admin@cktracker.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      fullName: 'Vikramaditya Singhania',
      phoneNumber: '+919876543210',
    },
  });

  const adminEmployee = await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      employeeCode: 'EMP-ADM-001',
      department: 'MANAGEMENT',
      designation: 'Managing Director & Operations Head',
    },
  });

  // 3. Manager User
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager.rahul@cktracker.com' },
    update: {},
    create: {
      email: 'manager.rahul@cktracker.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
      status: 'ACTIVE',
      fullName: 'Rahul Sharma',
      phoneNumber: '+919811223344',
    },
  });

  const managerEmployee = await prisma.employee.upsert({
    where: { userId: managerUser.id },
    update: {},
    create: {
      userId: managerUser.id,
      employeeCode: 'EMP-MGR-002',
      department: 'SALES',
      designation: 'Senior Project Manager & Field Lead',
    },
  });

  // 4. Designer User
  const designerUser = await prisma.user.upsert({
    where: { email: 'designer.priya@cktracker.com' },
    update: {},
    create: {
      email: 'designer.priya@cktracker.com',
      passwordHash: designerPassword,
      role: 'MANAGER',
      status: 'ACTIVE',
      fullName: 'Priya Deshmukh',
      phoneNumber: '+919822334455',
    },
  });

  const designerEmployee = await prisma.employee.upsert({
    where: { userId: designerUser.id },
    update: {},
    create: {
      userId: designerUser.id,
      employeeCode: 'EMP-DSG-003',
      department: 'DESIGN',
      designation: 'Lead Modular Kitchen Architect',
    },
  });

  // 5. Customer 1 (Active Kitchen Project in Manufacturing)
  const cust1User = await prisma.user.upsert({
    where: { email: 'customer.sharma@gmail.com' },
    update: {},
    create: {
      email: 'customer.sharma@gmail.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      fullName: 'Amitabh & Sunita Sharma',
      phoneNumber: '+919871122334',
    },
  });

  const cust1Profile = await prisma.customer.upsert({
    where: { userId: cust1User.id },
    update: {},
    create: {
      userId: cust1User.id,
      address: 'Villa 42, Palm Meadows, Whitefield',
      city: 'Bangalore',
      pincode: '560066',
      propertyType: 'Luxury Villa',
      kitchenDimensions: '15ft x 12ft Island Kitchen',
      estimatedBudget: 850000,
      preferredStyle: 'Modern Minimalist with Breakfast Counter',
      preferredMaterials: 'BWP Marine Ply with High-Gloss Acrylic & Quartz Countertop',
      leadSource: 'Architect Referral',
      requirementsNotes: 'Prefers matte black Gola profile handles, Blum soft-close tandem boxes, tall pantry unit with pull-out trays.',
    },
  });

  // 6. Customer 2 (New Inquiry at Design Stage)
  const cust2User = await prisma.user.upsert({
    where: { email: 'customer.verma@gmail.com' },
    update: {},
    create: {
      email: 'customer.verma@gmail.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      fullName: 'Dr. Rajesh Verma',
      phoneNumber: '+919988776655',
    },
  });

  const cust2Profile = await prisma.customer.upsert({
    where: { userId: cust2User.id },
    update: {},
    create: {
      userId: cust2User.id,
      address: 'Apartment 902, Tower B, Prestige Lakeside Habitat',
      city: 'Bangalore',
      pincode: '560087',
      propertyType: '3BHK Apartment',
      kitchenDimensions: '11ft x 9ft Parallel Kitchen',
      estimatedBudget: 520000,
      preferredStyle: 'Scandinavian Warm Wood & Cream',
      preferredMaterials: 'HDHMR with Soft-Touch Anti-Fingerprint Laminate',
      leadSource: 'Showroom Walk-in',
      requirementsNotes: 'Needs maximum storage, dedicated spice pull-outs, microwave oven tall unit.',
    },
  });

  // 7. Seed Inventory Items
  const inventoryItems = [
    { itemCode: 'PLY-BWP-18', name: 'Century Club Prime Marine BWP Plywood 18mm (8x4)', category: 'BASE_CABINETS', unit: 'Sheets', currentStock: 85, minimumStockLevel: 25, unitCost: 3450 },
    { itemCode: 'PLY-MR-12', name: 'Century Pro MR Commercial Plywood 12mm (8x4)', category: 'WALL_CABINETS', unit: 'Sheets', currentStock: 60, minimumStockLevel: 20, unitCost: 1950 },
    { itemCode: 'HDHMR-18', name: 'Greenpanel HDHMR Board 18mm Moisture Resistant (8x4)', category: 'BASE_CABINETS', unit: 'Sheets', currentStock: 75, minimumStockLevel: 30, unitCost: 2650 },
    { itemCode: 'ACR-REH-WHT', name: 'Rehau Crystal Pure High-Gloss Acrylic Sheet 2mm (8x4)', category: 'ACRYLIC_FINISHES', unit: 'Sheets', currentStock: 40, minimumStockLevel: 15, unitCost: 4800 },
    { itemCode: 'LAM-MFL-OAK', name: 'Merino Natural Oak Soft-Touch Laminate 1mm (8x4)', category: 'LAMINATES', unit: 'Sheets', currentStock: 55, minimumStockLevel: 20, unitCost: 1850 },
    { itemCode: 'HNG-HET-SENS', name: 'Hettich Sensys 110 Degree Soft-Close Integrated Hinge', category: 'HINGES', unit: 'Pairs', currentStock: 320, minimumStockLevel: 80, unitCost: 380 },
    { itemCode: 'DRW-BLM-LEG', name: 'Blum Legrabox Pure Drawer System 500mm (40kg)', category: 'DRAWER_CHANNELS', unit: 'Sets', currentStock: 48, minimumStockLevel: 15, unitCost: 4200 },
    { itemCode: 'HDL-GOLA-BLK', name: 'Aluminium J-Profile Gola Handle Matte Black (3 Meters)', category: 'HANDLES', unit: 'Pieces', currentStock: 90, minimumStockLevel: 30, unitCost: 850 },
    { itemCode: 'ACC-PANTRY-600', name: 'Hafele 6-Layer Tandem Tall Pantry Unit 600mm', category: 'KITCHEN_ACCESSORIES', unit: 'Pieces', currentStock: 12, minimumStockLevel: 4, unitCost: 18500 },
    { itemCode: 'CNT-KAL-QRTZ', name: 'Kalinga Stone Calacatta White Quartz Slab 20mm', category: 'COUNTERTOPS', unit: 'SqFt', currentStock: 250, minimumStockLevel: 100, unitCost: 480 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { itemCode: item.itemCode },
      update: {},
      create: item,
    });
  }

  // 8. Seed Suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { supplierCode: 'SUP-PLY-001' },
    update: {},
    create: {
      supplierCode: 'SUP-PLY-001',
      companyName: 'Century Plyboards Ltd (Authorized Distributor)',
      contactPerson: 'Harish Mehta',
      email: 'sales@centurydistributors.com',
      phone: '+919844011223',
      gstin: '29AAACC1234F1Z5',
      address: 'Industrial Area Phase 2, Peenya, Bangalore',
      materialCategories: 'Plywood, Veneers, Blockboards',
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { supplierCode: 'SUP-HRD-002' },
    update: {},
    create: {
      supplierCode: 'SUP-HRD-002',
      companyName: 'Hettich & Blum Premium Hardware Depot',
      contactPerson: 'Sanjay Chawla',
      email: 'orders@premiumhardware.in',
      phone: '+919845099887',
      gstin: '29AABCH5678K1Z9',
      address: 'BTM 2nd Stage, Outer Ring Road, Bangalore',
      materialCategories: 'Hinges, Drawer Channels, Baskets, Lift-up Systems',
    },
  });

  // 9. Seed Project 1 for Customer 1 (Active, at Stage 8: Manufacturing)
  const project1 = await prisma.project.upsert({
    where: { projectCode: 'CK-2026-101' },
    update: {},
    create: {
      projectCode: 'CK-2026-101',
      title: 'Sharma Villa - Contemporary Acrylic & Quartz Island Kitchen',
      kitchenType: 'Island Kitchen',
      budget: 850000,
      contractAmount: 825000,
      startDate: new Date('2026-09-15'),
      expectedCompletion: new Date('2026-11-20'),
      currentStageNumber: 8,
      status: 'IN_PROGRESS',
      customerId: cust1Profile.id,
      assignedManagerId: managerEmployee.id,
      notes: 'Customer approved 3D visual render V2. 50% advance payment confirmed. Under production at Bangalore plant.',
    },
  });

  // Create 14 stages for Project 1
  for (const s of DEFAULT_STAGES) {
    let stageStatus = 'PENDING';
    let startDate = null;
    let completionDate = null;

    if (s.stageNumber < 8) {
      stageStatus = 'COMPLETED';
      startDate = new Date('2026-09-15');
      completionDate = new Date('2026-10-10');
    } else if (s.stageNumber === 8) {
      stageStatus = 'IN_PROGRESS';
      startDate = new Date('2026-10-12');
    }

    await prisma.projectStage.upsert({
      where: {
        projectId_stageNumber: {
          projectId: project1.id,
          stageNumber: s.stageNumber,
        },
      },
      update: {},
      create: {
        projectId: project1.id,
        stageNumber: s.stageNumber,
        name: s.name,
        description: s.description,
        status: stageStatus,
        expectedDurationDays: s.duration,
        startDate,
        completionDate,
        assignedEmployeeId: s.stageNumber <= 4 ? designerEmployee.id : managerEmployee.id,
        remarks: s.stageNumber === 8 ? 'Carcass precision cutting completed. Edge banding in progress.' : null,
      },
    });
  }

  // 10. Seed Design for Project 1
  const design1 = await prisma.design.upsert({
    where: {
      projectId_versionNumber: {
        projectId: project1.id,
        versionNumber: 1,
      },
    },
    update: {},
    create: {
      projectId: project1.id,
      versionNumber: 1,
      title: 'V1 - Acrylic Pure White & Marquina Black Island Render',
      description: 'L-shaped carcass with 7ft freestanding breakfast island. Built-in microwave and pull-out pantry.',
      materialsDescription: 'Century Marine BWP 18mm, Rehau High-Gloss White Acrylic, Soft-close Blum tandem drawers.',
      finishes: 'Dual-tone High-Gloss White & Dark Walnut accents',
      status: 'APPROVED',
      layout2DUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      render3DUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      uploadedByUserId: designerUser.id,
    },
  });

  // Record approval
  await prisma.designApproval.create({
    data: {
      designId: design1.id,
      decision: 'APPROVED',
      customerComments: 'We love the island layout and lighting! Ready to proceed with quotation.',
      decidedAt: new Date('2026-09-28'),
    },
  });

  // 11. Seed Quotation for Project 1
  const quotation1 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QT-2026-101-V1' },
    update: {},
    create: {
      quotationNumber: 'QT-2026-101-V1',
      projectId: project1.id,
      versionNumber: 1,
      quotationDate: new Date('2026-09-29'),
      expiryDate: new Date('2026-10-29'),
      status: 'APPROVED',
      subtotal: 699152.54,
      discountPercentage: 0,
      discountAmount: 0,
      gstPercentage: 18.0,
      gstAmount: 125847.46,
      installationCharges: 0,
      transportCharges: 0,
      additionalCharges: 0,
      grandTotal: 825000.0,
      termsAndConditions: '1. 50% advance on order confirmation, 40% before factory dispatch, 10% after handover. 2. 10-year warranty on hardware. 3. Free maintenance for first 12 months.',
      isFrozen: true,
    },
  });

  // Quotation items
  const qItems = [
    { category: 'BASE_CABINETS', description: 'BWP Marine Ply Base Units with Sink Cabinet & Corner Carousel', dimensions: '15ft run, 850mm height', materialFinish: 'Century Marine Ply + Inner Laminate', quantity: 1, unitPrice: 245000, totalPrice: 245000 },
    { category: 'WALL_CABINETS', description: 'Wall Units with Aventos Bi-fold Lift-up Hydraulic Systems', dimensions: '12ft run, 720mm height', materialFinish: 'Rehau Pure White Gloss Acrylic', quantity: 1, unitPrice: 165000, totalPrice: 165000 },
    { category: 'TALL_UNITS', description: 'Tall Pantry Unit (600mm) + Built-in Microwave/Oven housing', dimensions: '600mm x 2100mm x 600mm', materialFinish: 'Marine Ply with Hafele Tandem Baskets', quantity: 1, unitPrice: 115000, totalPrice: 115000 },
    { category: 'COUNTERTOPS', description: 'Kalinga Stone 20mm Calacatta Quartz with Beveled Edge', dimensions: '65 SqFt', materialFinish: 'Polished Quartz with undermount sink cutout', quantity: 65, unitPrice: 1450, totalPrice: 94250 },
    { category: 'DRAWER_CHANNELS', description: 'Blum Legrabox Soft-Close Drawer Boxes (Cutlery, Thali, Cup & Saucer)', dimensions: '500mm depth', materialFinish: 'Stainless Steel Silk White finish', quantity: 6, unitPrice: 4200, totalPrice: 25200 },
    { category: 'HINGES', description: 'Hettich Sensys 110 Soft-Close Hinges with damper caps', dimensions: 'Standard', materialFinish: 'Nickel Plated', quantity: 28, unitPrice: 380, totalPrice: 10640 },
    { category: 'INSTALLATION_SERVICES', description: 'Professional factory technician installation, leveling and testing', dimensions: 'Full site execution', materialFinish: 'All hardware and sealant included', quantity: 1, unitPrice: 44062.54, totalPrice: 44062.54 },
  ];

  for (const qi of qItems) {
    await prisma.quotationItem.create({
      data: {
        quotationId: quotation1.id,
        ...qi,
      },
    });
  }

  // 12. Seed Invoice & Payment for Project 1
  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-101-01' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-101-01',
      projectId: project1.id,
      quotationId: quotation1.id,
      issueDate: new Date('2026-10-02'),
      dueDate: new Date('2026-10-10'),
      status: 'PARTIALLY_PAID',
      totalAmount: 825000.0,
      paidAmount: 412500.0,
      balanceDue: 412500.0,
      notes: 'Stage 6 milestone invoice: 50% Production Advance.',
    },
  });

  await prisma.payment.upsert({
    where: { receiptNumber: 'RCPT-2026-101-01' },
    update: {},
    create: {
      receiptNumber: 'RCPT-2026-101-01',
      projectId: project1.id,
      invoiceId: invoice1.id,
      amount: 412500.0,
      paymentDate: new Date('2026-10-04'),
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'COMPLETED',
      transactionReference: 'NEFT/HDFC/20261004/8899221',
      milestoneTitle: '50% Production Advance Token',
      notes: 'Customer transferred via HDFC NetBanking. Payment verified by accounts.',
      recordedByUserId: adminUser.id,
    },
  });

  // 13. Project 2 for Customer 2 (Planning / Design Stage)
  const project2 = await prisma.project.upsert({
    where: { projectCode: 'CK-2026-102' },
    update: {},
    create: {
      projectCode: 'CK-2026-102',
      title: 'Verma Residence - Scandinavian Parallel Modular Kitchen',
      kitchenType: 'Parallel Kitchen',
      budget: 520000,
      startDate: new Date('2026-10-20'),
      expectedCompletion: new Date('2026-12-15'),
      currentStageNumber: 3,
      status: 'PLANNING',
      customerId: cust2Profile.id,
      assignedManagerId: managerEmployee.id,
      notes: 'Site measurement survey completed. 3D renders currently under preparation by Priya.',
    },
  });

  for (const s of DEFAULT_STAGES) {
    let stageStatus = 'PENDING';
    let startDate = null;
    let completionDate = null;

    if (s.stageNumber < 3) {
      stageStatus = 'COMPLETED';
      startDate = new Date('2026-10-20');
      completionDate = new Date('2026-10-25');
    } else if (s.stageNumber === 3) {
      stageStatus = 'IN_PROGRESS';
      startDate = new Date('2026-10-26');
    }

    await prisma.projectStage.upsert({
      where: {
        projectId_stageNumber: {
          projectId: project2.id,
          stageNumber: s.stageNumber,
        },
      },
      update: {},
      create: {
        projectId: project2.id,
        stageNumber: s.stageNumber,
        name: s.name,
        description: s.description,
        status: stageStatus,
        expectedDurationDays: s.duration,
        startDate,
        completionDate,
        assignedEmployeeId: s.stageNumber <= 4 ? designerEmployee.id : managerEmployee.id,
      },
    });
  }

  // 14. Activity Logs
  await prisma.activityLog.create({
    data: {
      actorId: adminUser.id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SYSTEM',
      details: 'CKTracker Modular Kitchen Management System database seeded with enterprise baseline.',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Admin:    admin@cktracker.com / Admin@123');
  console.log('Manager:  manager.rahul@cktracker.com / Manager@123');
  console.log('Designer: designer.priya@cktracker.com / Designer@123');
  console.log('Customer: customer.sharma@gmail.com / Customer@123');
  console.log('Customer: customer.verma@gmail.com / Customer@123');
  console.log('----------------------------------------------------');
}

seed()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
