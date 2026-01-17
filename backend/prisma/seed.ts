import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - be careful in production!)
  console.log('🧹 Clearing existing data...');
  // Delete in order to respect foreign key constraints
  await prisma.stockTransaction.deleteMany();
  await prisma.sparesRequest.deleteMany();
  await prisma.toolHandoverItem.deleteMany();
  await prisma.toolHandover.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.pRSupplier.deleteMany();
  await prisma.criticalSpare.deleteMany();
  await prisma.pRItem.deleteMany();
  await prisma.purchaseRequisition.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.supplierCategory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.project.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  // Create users with different roles
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('Password@123', 10);

  const approver = await prisma.user.create({
    data: {
      email: 'approver@toolmgmt.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Approver',
      role: 'Approver',
      employeeId: 'EMP-001',
      department: 'Management',
      isActive: true,
    },
  });

  const npd = await prisma.user.create({
    data: {
      email: 'npd@toolmgmt.com',
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'NPD',
      role: 'NPD',
      employeeId: 'EMP-002',
      department: 'Product Development',
      isActive: true,
    },
  });

  const maintenance = await prisma.user.create({
    data: {
      email: 'maintenance@toolmgmt.com',
      passwordHash: hashedPassword,
      firstName: 'Mike',
      lastName: 'Maintenance',
      role: 'Maintenance',
      employeeId: 'EMP-003',
      department: 'Maintenance',
      isActive: true,
    },
  });

  const spares = await prisma.user.create({
    data: {
      email: 'spares@toolmgmt.com',
      passwordHash: hashedPassword,
      firstName: 'Lisa',
      lastName: 'Spares',
      role: 'Spares',
      employeeId: 'EMP-004',
      department: 'Inventory',
      isActive: true,
    },
  });

  const indentor = await prisma.user.create({
    data: {
      email: 'indentor@toolmgmt.com',
      passwordHash: hashedPassword,
      firstName: 'David',
      lastName: 'Indentor',
      role: 'Indentor',
      employeeId: 'EMP-005',
      department: 'Production',
      isActive: true,
    },
  });

  console.log('✅ Users created');

  // Create projects
  console.log('📁 Creating projects...');
  const project1 = await prisma.project.create({
    data: {
      projectNumber: 'PROJ-2024-001',
      customerPO: 'PO-2024-001',
      partNumber: 'PART-1001',
      toolNumber: 'TOOL-2001',
      price: 500000,
      targetDate: new Date('2024-06-30'),
      status: 'Active',
      description: 'Expansion of production line A with new tooling',
      createdBy: approver.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      projectNumber: 'PROJ-2024-002',
      customerPO: 'PO-2024-002',
      partNumber: 'PART-1002',
      toolNumber: 'TOOL-2002',
      price: 300000,
      targetDate: new Date('2024-08-31'),
      status: 'Active',
      description: 'Upgrade tooling for quality improvement',
      createdBy: approver.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      projectNumber: 'PROJ-2024-003',
      customerPO: 'PO-2024-003',
      partNumber: 'PART-1003',
      toolNumber: 'TOOL-2003',
      price: 750000,
      targetDate: new Date('2024-12-31'),
      status: 'OnHold',
      description: 'Complete maintenance overhaul project',
      createdBy: approver.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      projectNumber: 'PROJ-2023-001',
      customerPO: 'PO-2023-001',
      partNumber: 'PART-1004',
      toolNumber: 'TOOL-2004',
      price: 1000000,
      targetDate: new Date('2023-12-31'),
      status: 'Completed',
      description: 'Successfully completed project',
      createdBy: approver.id,
    },
  });

  console.log('✅ Projects created');

  // Create suppliers (without categories first)
  console.log('🏭 Creating suppliers...');
  const supplier1 = await prisma.supplier.create({
    data: {
      supplierCode: 'SUP-001',
      name: 'Precision Tools Inc.',
      contactPerson: 'John Smith',
      email: 'contact@precisiontools.com',
      phone: '+1-555-0101',
      address: '123 Industrial Ave, Manufacturing City',
      status: 'Active',
      createdBy: approver.id,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      supplierCode: 'SUP-002',
      name: 'Advanced Manufacturing Co.',
      contactPerson: 'Jane Doe',
      email: 'sales@advancedmfg.com',
      phone: '+1-555-0102',
      address: '456 Production Blvd, Tech Park',
      status: 'Active',
      createdBy: approver.id,
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      supplierCode: 'SUP-003',
      name: 'Quality Materials Ltd.',
      contactPerson: 'Robert Johnson',
      email: 'info@qualitymaterials.com',
      phone: '+1-555-0103',
      address: '789 Material Street, Supply District',
      status: 'Active',
      createdBy: approver.id,
    },
  });

  const supplier4 = await prisma.supplier.create({
    data: {
      supplierCode: 'SUP-004',
      name: 'Elite Tooling Solutions',
      contactPerson: 'Emily Brown',
      email: 'contact@elitetooling.com',
      phone: '+1-555-0104',
      address: '321 Excellence Road, Innovation Hub',
      status: 'Inactive',
      createdBy: approver.id,
    },
  });

  console.log('✅ Suppliers created');

  // Create Purchase Requisitions
  console.log('📋 Creating Purchase Requisitions...');
  const pr1 = await prisma.purchaseRequisition.create({
    data: {
      prNumber: 'PR-2024-001',
      projectId: project1.id,
      prType: 'NewSet',
      modRefReason: null,
      status: 'Approved',
      createdBy: npd.id,
      approvedBy: approver.id,
      approvedAt: new Date('2024-01-20'),
      approverComments: 'Approved for production line expansion',
    },
  });

  const pr2 = await prisma.purchaseRequisition.create({
    data: {
      prNumber: 'PR-2024-002',
      projectId: project1.id,
      prType: 'Modification',
      modRefReason: 'Upgrade existing tooling for higher capacity',
      status: 'Submitted',
      createdBy: npd.id,
    },
  });

  const pr3 = await prisma.purchaseRequisition.create({
    data: {
      prNumber: 'PR-2024-003',
      projectId: project2.id,
      prType: 'NewSet',
      modRefReason: null,
      status: 'Approved',
      createdBy: npd.id,
      approvedBy: approver.id,
      approvedAt: new Date('2024-02-10'),
      approverComments: 'Approved for quality improvement',
    },
  });

  // Create PR Items
  console.log('📦 Creating PR Items...');
  const prItem1 = await prisma.pRItem.create({
    data: {
      prId: pr1.id,
      itemCode: 'IC-1001',
      name: 'Injection Mold Cavity',
      specification: 'High-grade steel P20, hardness 28-32 HRC',
      quantity: 2,
      requirements: 'Mirror finish, tolerance ±0.01mm',
      bomUnitPrice: 37500,
    },
  });

  const prItem2 = await prisma.pRItem.create({
    data: {
      prId: pr1.id,
      itemCode: 'IC-1002',
      name: 'Ejection System',
      specification: 'Stainless steel 316, precision machined',
      quantity: 4,
      requirements: 'Smooth operation, low friction',
      bomUnitPrice: 12500,
    },
  });

  const prItem3 = await prisma.pRItem.create({
    data: {
      prId: pr2.id,
      itemCode: 'IC-2001',
      name: 'Modified Cooling Channels',
      specification: 'Copper tubing, enhanced flow design',
      quantity: 8,
      requirements: 'Improved cooling efficiency',
      bomUnitPrice: 8500,
    },
  });

  const prItem4 = await prisma.pRItem.create({
    data: {
      prId: pr3.id,
      itemCode: 'IC-3001',
      name: 'Quality Control Gauge',
      specification: 'Precision measurement tool, ±0.001mm accuracy',
      quantity: 1,
      requirements: 'Calibrated and certified',
      bomUnitPrice: 45000,
    },
  });

  // Create Critical Spares
  const criticalSpare1 = await prisma.criticalSpare.create({
    data: {
      prId: pr1.id,
      prItemId: prItem1.id,
      quantity: 1,
      notes: 'Critical for production continuity',
    },
  });

  // Link suppliers to PRs
  await prisma.pRSupplier.create({
    data: {
      prId: pr1.id,
      supplierId: supplier1.id,
      status: 'Invited',
    },
  });

  await prisma.pRSupplier.create({
    data: {
      prId: pr1.id,
      supplierId: supplier2.id,
      status: 'Invited',
    },
  });

  await prisma.pRSupplier.create({
    data: {
      prId: pr3.id,
      supplierId: supplier1.id,
      status: 'Invited',
    },
  });

  console.log('✅ Purchase Requisitions created');

  // Create Quotations
  console.log('💰 Creating Quotations...');
  const quotation1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QUO-2024-001',
      prId: pr1.id,
      supplierId: supplier1.id,
      status: 'Selected',
      submittedBy: npd.id, // Quotations are submitted by NPD users, not suppliers
      evaluatedBy: npd.id,
      evaluatedAt: new Date('2024-01-25'),
      notes: 'Best price and quality match',
      deliveryTerms: 'FOB Factory',
      deliveryDate: new Date('2024-03-15'),
      validityDate: new Date('2024-04-15'),
      totalPrice: 120000, // Will be calculated from items
    },
  });

  const quotation2 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QUO-2024-002',
      prId: pr1.id,
      supplierId: supplier2.id,
      status: 'Rejected',
      submittedBy: npd.id,
      evaluatedBy: npd.id,
      evaluatedAt: new Date('2024-01-25'),
      notes: 'Price too high',
      deliveryTerms: 'CIF Destination',
      deliveryDate: new Date('2024-03-20'),
      validityDate: new Date('2024-04-20'),
      totalPrice: 80000, // Will be calculated from items
    },
  });

  const quotation3 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QUO-2024-003',
      prId: pr3.id,
      supplierId: supplier1.id,
      status: 'Pending',
      submittedBy: npd.id,
      deliveryTerms: 'FOB Factory',
      deliveryDate: new Date('2024-04-01'),
      validityDate: new Date('2024-05-01'),
      totalPrice: 44000, // Will be calculated from items
    },
  });

  // Create Quotation Items
  // Get PR item details for quotation items
  const prItem1ForQuo = await prisma.pRItem.findUnique({
    where: { id: prItem1.id },
  });
  const prItem2ForQuo = await prisma.pRItem.findUnique({
    where: { id: prItem2.id },
  });
  const prItem4ForQuo = await prisma.pRItem.findUnique({
    where: { id: prItem4.id },
  });

  await prisma.quotationItem.create({
    data: {
      quotationId: quotation1.id,
      prItemId: prItem1.id,
      itemName: prItem1ForQuo!.name,
      unitPrice: 36000,
      quantity: 2,
      totalPrice: 72000,
    },
  });

  await prisma.quotationItem.create({
    data: {
      quotationId: quotation1.id,
      prItemId: prItem2.id,
      itemName: prItem2ForQuo!.name,
      unitPrice: 12000,
      quantity: 4,
      totalPrice: 48000,
    },
  });

  await prisma.quotationItem.create({
    data: {
      quotationId: quotation2.id,
      prItemId: prItem1.id,
      itemName: prItem1ForQuo!.name,
      unitPrice: 40000,
      quantity: 2,
      totalPrice: 80000,
    },
  });

  await prisma.quotationItem.create({
    data: {
      quotationId: quotation3.id,
      prItemId: prItem4.id,
      itemName: prItem4ForQuo!.name,
      unitPrice: 44000,
      quantity: 1,
      totalPrice: 44000,
    },
  });

  console.log('✅ Quotations created');

  // Create Tool Handovers
  console.log('📦 Creating Tool Handovers...');
  const handover1 = await prisma.toolHandover.create({
    data: {
      handoverNumber: 'HAND-2024-001',
      projectId: project1.id,
      prId: pr1.id,
      toolSetDescription: 'Complete tool set for Production Line A',
      status: 'Approved',
      initiatedBy: npd.id,
      inspectedBy: maintenance.id,
      inspectionDate: new Date('2024-02-15'),
      remarks: 'All items received in excellent condition',
    },
  });

  const handover2 = await prisma.toolHandover.create({
    data: {
      handoverNumber: 'HAND-2024-002',
      projectId: project2.id,
      prId: pr3.id,
      toolSetDescription: 'Quality control tooling set',
      status: 'PendingInspection',
      initiatedBy: npd.id,
    },
  });

  // Create Handover Items (reuse PR item details from quotation items section)
  await prisma.toolHandoverItem.create({
    data: {
      handoverId: handover1.id,
      prItemId: prItem1.id,
      itemName: prItem1ForQuo!.name,
      specification: prItem1ForQuo!.specification,
      quantity: prItem1ForQuo!.quantity,
      requirements: prItem1ForQuo!.requirements,
      receivedQuantity: 2,
      isCriticalSpare: true,
    },
  });

  await prisma.toolHandoverItem.create({
    data: {
      handoverId: handover1.id,
      prItemId: prItem2.id,
      itemName: prItem2ForQuo!.name,
      specification: prItem2ForQuo!.specification,
      quantity: prItem2ForQuo!.quantity,
      requirements: prItem2ForQuo!.requirements,
      receivedQuantity: 4,
      isCriticalSpare: false,
    },
  });

  await prisma.toolHandoverItem.create({
    data: {
      handoverId: handover2.id,
      prItemId: prItem4.id,
      itemName: prItem4ForQuo!.name,
      specification: prItem4ForQuo!.specification,
      quantity: prItem4ForQuo!.quantity,
      requirements: prItem4ForQuo!.requirements,
      receivedQuantity: 1,
      isCriticalSpare: false,
    },
  });

  console.log('✅ Tool Handovers created');

  // Create Inventory Items
  console.log('📊 Creating Inventory Items...');
  const inventory1 = await prisma.inventoryItem.create({
    data: {
      partNumber: 'PN-1001',
      toolNumber: 'TN-2001',
      itemCode: 'IC-1001',
      name: 'Injection Mold Cavity',
      currentStock: 2,
      minStockLevel: 1,
      maxStockLevel: 5,
      unitOfMeasure: 'PCS',
      status: 'InStock',
      location: 'Warehouse A-1',
      lastRestockedAt: new Date('2024-02-15'),
      lastRestockedQuantity: 2,
    },
  });

  const inventory2 = await prisma.inventoryItem.create({
    data: {
      partNumber: 'PN-1002',
      toolNumber: 'TN-2002',
      itemCode: 'IC-1002',
      name: 'Ejection System',
      currentStock: 4,
      minStockLevel: 2,
      maxStockLevel: 10,
      unitOfMeasure: 'PCS',
      status: 'InStock',
      location: 'Warehouse A-2',
      lastRestockedAt: new Date('2024-02-15'),
      lastRestockedQuantity: 4,
    },
  });

  const inventory3 = await prisma.inventoryItem.create({
    data: {
      partNumber: 'PN-3001',
      toolNumber: 'TN-3001',
      itemCode: 'IC-3001',
      name: 'Quality Control Gauge',
      currentStock: 1,
      minStockLevel: 1,
      maxStockLevel: 3,
      unitOfMeasure: 'PCS',
      status: 'InStock',
      location: 'Warehouse B-1',
      lastRestockedAt: new Date('2024-03-01'),
      lastRestockedQuantity: 1,
    },
  });

  const inventory4 = await prisma.inventoryItem.create({
    data: {
      partNumber: 'PN-4001',
      toolNumber: 'TN-4001',
      itemCode: 'IC-4001',
      name: 'Spare Part - Cooling Fan',
      currentStock: 2,
      minStockLevel: 5,
      maxStockLevel: 20,
      unitOfMeasure: 'PCS',
      status: 'LowStock',
      location: 'Warehouse C-1',
      lastRestockedAt: new Date('2024-01-10'),
      lastRestockedQuantity: 2,
    },
  });

  const inventory5 = await prisma.inventoryItem.create({
    data: {
      partNumber: 'PN-5001',
      toolNumber: 'TN-5001',
      itemCode: 'IC-5001',
      name: 'Out of Stock Item',
      currentStock: 0,
      minStockLevel: 3,
      maxStockLevel: 15,
      unitOfMeasure: 'PCS',
      status: 'OutOfStock',
      location: 'Warehouse D-1',
    },
  });

  // Create Stock Transactions
  await prisma.stockTransaction.create({
    data: {
      inventoryItemId: inventory1.id,
      transactionType: 'Addition',
      quantity: 2,
      balanceAfter: 2,
      referenceType: 'Handover',
      referenceId: handover1.id,
      prNumber: pr1.prNumber,
      projectId: project1.id,
      purpose: 'Handover approval',
      performedBy: maintenance.id,
      notes: 'Received from handover',
    },
  });

  await prisma.stockTransaction.create({
    data: {
      inventoryItemId: inventory2.id,
      transactionType: 'Addition',
      quantity: 4,
      balanceAfter: 4,
      referenceType: 'Handover',
      referenceId: handover1.id,
      prNumber: pr1.prNumber,
      projectId: project1.id,
      purpose: 'Handover approval',
      performedBy: maintenance.id,
      notes: 'Received from handover',
    },
  });

  console.log('✅ Inventory Items created');

  // Create Spares Requests
  console.log('📝 Creating Spares Requests...');
  const request1 = await prisma.sparesRequest.create({
    data: {
      requestNumber: 'REQ-2024-001',
      requestedBy: indentor.id,
      inventoryItemId: inventory1.id,
      itemName: inventory1.name,
      partNumber: inventory1.partNumber,
      toolNumber: inventory1.toolNumber,
      quantityRequested: 1,
      quantityFulfilled: 1,
      status: 'Fulfilled',
      projectId: project1.id,
      purpose: 'Production line maintenance',
      fulfilledBy: spares.id,
      fulfilledAt: new Date('2024-02-20'),
    },
  });

  const request2 = await prisma.sparesRequest.create({
    data: {
      requestNumber: 'REQ-2024-002',
      requestedBy: indentor.id,
      inventoryItemId: inventory2.id,
      itemName: inventory2.name,
      partNumber: inventory2.partNumber,
      toolNumber: inventory2.toolNumber,
      quantityRequested: 2,
      quantityFulfilled: 2,
      status: 'Fulfilled',
      projectId: project1.id,
      purpose: 'Replacement parts',
      fulfilledBy: spares.id,
      fulfilledAt: new Date('2024-02-22'),
    },
  });

  const request3 = await prisma.sparesRequest.create({
    data: {
      requestNumber: 'REQ-2024-003',
      requestedBy: indentor.id,
      inventoryItemId: inventory4.id,
      itemName: inventory4.name,
      partNumber: inventory4.partNumber,
      toolNumber: inventory4.toolNumber,
      quantityRequested: 5,
      quantityFulfilled: 2,
      status: 'PartiallyFulfilled',
      projectId: project2.id,
      purpose: 'Emergency maintenance',
      fulfilledBy: spares.id,
      fulfilledAt: new Date('2024-03-05'),
    },
  });

  const request4 = await prisma.sparesRequest.create({
    data: {
      requestNumber: 'REQ-2024-004',
      requestedBy: indentor.id,
      inventoryItemId: inventory5.id,
      itemName: inventory5.name,
      partNumber: inventory5.partNumber,
      toolNumber: inventory5.toolNumber,
      quantityRequested: 3,
      status: 'Pending',
      projectId: project2.id,
      purpose: 'Production requirement',
    },
  });

  const request5 = await prisma.sparesRequest.create({
    data: {
      requestNumber: 'REQ-2024-005',
      requestedBy: indentor.id,
      inventoryItemId: inventory5.id,
      itemName: inventory5.name,
      partNumber: inventory5.partNumber,
      toolNumber: inventory5.toolNumber,
      quantityRequested: 2,
      status: 'Rejected',
      projectId: project1.id,
      purpose: 'Maintenance need',
      fulfilledBy: spares.id,
      fulfilledAt: new Date('2024-03-10'),
      rejectionReason: 'Item out of stock, alternative solution recommended',
    },
  });

  // Create stock transactions for fulfilled requests
  await prisma.stockTransaction.create({
    data: {
      inventoryItemId: inventory1.id,
      transactionType: 'Removal',
      quantity: 1,
      balanceAfter: 1,
      referenceType: 'SparesRequest',
      referenceId: request1.id,
      purpose: 'Request fulfillment',
      performedBy: spares.id,
      notes: 'Fulfilled request REQ-2024-001',
    },
  });

  await prisma.stockTransaction.create({
    data: {
      inventoryItemId: inventory2.id,
      transactionType: 'Removal',
      quantity: 2,
      balanceAfter: 2,
      referenceType: 'SparesRequest',
      referenceId: request2.id,
      purpose: 'Request fulfillment',
      performedBy: spares.id,
      notes: 'Fulfilled request REQ-2024-002',
    },
  });

  await prisma.stockTransaction.create({
    data: {
      inventoryItemId: inventory4.id,
      transactionType: 'Removal',
      quantity: 2,
      balanceAfter: 0,
      referenceType: 'SparesRequest',
      referenceId: request3.id,
      purpose: 'Request fulfillment',
      performedBy: spares.id,
      notes: 'Partial fulfillment REQ-2024-003',
    },
  });

  // Update inventory stock levels
  await prisma.inventoryItem.update({
    where: { id: inventory1.id },
    data: { currentStock: 1 },
  });

  await prisma.inventoryItem.update({
    where: { id: inventory2.id },
    data: { currentStock: 2 },
  });

  await prisma.inventoryItem.update({
    where: { id: inventory4.id },
    data: { currentStock: 0, status: 'OutOfStock' },
  });

  console.log('✅ Spares Requests created');

  // Create Notifications
  console.log('🔔 Creating Notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: approver.id,
        title: 'New PR Created',
        message: 'PR-2024-002 has been created and is awaiting your approval',
        type: 'Info',
        relatedEntityType: 'PR',
        relatedEntityId: pr2.id,
        isRead: false,
      },
      {
        userId: npd.id,
        title: 'PR Approved',
        message: 'PR-2024-001 has been approved',
        type: 'Success',
        relatedEntityType: 'PR',
        relatedEntityId: pr1.id,
        isRead: true,
        readAt: new Date('2024-01-20'),
      },
      {
        userId: npd.id,
        title: 'Quotation Received',
        message: 'New quotation received from Precision Tools Inc. for PR PR-2024-001',
        type: 'Info',
        relatedEntityType: 'Quotation',
        relatedEntityId: quotation1.id,
        isRead: false,
      },
      {
        userId: maintenance.id,
        title: 'Handover Pending Inspection',
        message: 'Tool handover HAND-2024-002 is pending your inspection',
        type: 'Warning',
        relatedEntityType: 'Handover',
        relatedEntityId: handover2.id,
        isRead: false,
      },
      {
        userId: spares.id,
        title: 'Low Stock Alert',
        message: 'Spare Part - Cooling Fan is running low. Current stock: 0, Minimum required: 5',
        type: 'Warning',
        relatedEntityType: 'InventoryItem',
        relatedEntityId: inventory4.id,
        isRead: false,
      },
      {
        userId: spares.id,
        title: 'New Spares Request',
        message: 'New spares request REQ-2024-004 for Out of Stock Item',
        type: 'Info',
        relatedEntityType: 'SparesRequest',
        relatedEntityId: request4.id,
        isRead: false,
      },
    ],
  });

  console.log('✅ Notifications created');

  console.log('\n✨ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: 5 (1 Approver, 1 NPD, 1 Maintenance, 1 Spares, 1 Indentor)`);
  console.log(`   - Projects: 4 (2 Active, 1 OnHold, 1 Completed)`);
  console.log(`   - Suppliers: 4 (3 Active, 1 Inactive)`);
  console.log(`   - Purchase Requisitions: 3`);
  console.log(`   - Quotations: 3`);
  console.log(`   - Tool Handovers: 2`);
  console.log(`   - Inventory Items: 5`);
  console.log(`   - Spares Requests: 5`);
  console.log(`   - Notifications: 6`);
  console.log('\n🔑 Login Credentials (all users):');
  console.log('   Email: [role]@toolmgmt.com (e.g., approver@toolmgmt.com)');
  console.log('   Password: Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

