#!/usr/bin/env ts-node
/**
 * Migration Script: Remove Slot IDs from Stock Items
 * 
 * This script cleans up legacy slot-related fields from stock items:
 * - Removes `assignedSlotId` from items
 * - Removes `slotId` and `slotName` from machineAssignments arrays
 * 
 * Run with: npx ts-node scripts/migrate-remove-slot-ids.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
    // Check for service account file or use default credentials
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    try {
        const serviceAccount = require(serviceAccountPath);
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('✓ Initialized with service account');
    } catch {
        // Fall back to default credentials (for local development with gcloud auth)
        initializeApp();
        console.log('✓ Initialized with default credentials');
    }
}

const db = getFirestore();

interface MachineAssignment {
    machineId: string;
    machineName: string;
    status: 'Using' | 'Replacement';
    slotId?: string;
    slotName?: string;
    assignedAt: Date | string;
}

interface StockItemData {
    assignedSlotId?: string;
    machineAssignments?: MachineAssignment[];
    [key: string]: any;
}

async function migrateStockItems() {
    console.log('\n🔄 Starting Slot ID Removal Migration...\n');

    const stockCollection = db.collection('stock');
    const snapshot = await stockCollection.get();

    console.log(`📦 Found ${snapshot.size} stock items to check\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data() as StockItemData;
        const updates: Partial<StockItemData> = {};
        let needsUpdate = false;

        // Check if assignedSlotId exists and needs removal
        if (data.assignedSlotId !== undefined) {
            updates.assignedSlotId = null as any; // Will be deleted
            needsUpdate = true;
            console.log(`  📌 ${doc.id}: Removing assignedSlotId`);
        }

        // Check if machineAssignments has slot fields
        if (data.machineAssignments && Array.isArray(data.machineAssignments)) {
            const hasSlotFields = data.machineAssignments.some(
                a => a.slotId !== undefined || a.slotName !== undefined
            );

            if (hasSlotFields) {
                // Clean slot fields from assignments
                updates.machineAssignments = data.machineAssignments.map(a => {
                    const { slotId, slotName, ...rest } = a;
                    return rest as MachineAssignment;
                });
                needsUpdate = true;
                console.log(`  📌 ${doc.id}: Cleaning slot fields from ${data.machineAssignments.length} assignments`);
            }
        }

        if (needsUpdate) {
            try {
                // Use FieldValue.delete() for assignedSlotId
                const finalUpdates: any = { ...updates };
                if (data.assignedSlotId !== undefined) {
                    const { FieldValue } = require('firebase-admin/firestore');
                    finalUpdates.assignedSlotId = FieldValue.delete();
                }

                await stockCollection.doc(doc.id).update(finalUpdates);
                updatedCount++;
                console.log(`  ✓ ${doc.id}: Updated successfully`);
            } catch (error) {
                errorCount++;
                console.error(`  ✗ ${doc.id}: Update failed -`, error);
            }
        } else {
            skippedCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✓ Updated: ${updatedCount} items`);
    console.log(`   ○ Skipped (no changes needed): ${skippedCount} items`);
    console.log(`   ✗ Errors: ${errorCount} items`);
    console.log('='.repeat(50) + '\n');

    if (errorCount > 0) {
        console.log('⚠️  Some items failed to update. Please review the errors above.');
        process.exit(1);
    } else {
        console.log('✅ Migration completed successfully!');
        process.exit(0);
    }
}

// Run the migration
migrateStockItems().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
