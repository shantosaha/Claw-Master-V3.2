/**
 * Machine Migration Script
 * This file exports the 324 new machines to be loaded into the web app.
 * Import this and merge with existing machines in demoData or use directly.
 */

import machinesData from '../../mock_machines.json';
import { ArcadeMachine } from '@/types';

// Convert JSON date strings to Date objects
export const MIGRATED_MACHINES: ArcadeMachine[] = machinesData.map((m: any) => ({
    ...m,
    createdAt: new Date(m.createdAt),
    updatedAt: new Date(m.updatedAt),
    lastSyncedAt: m.lastSyncedAt ? new Date(m.lastSyncedAt) : undefined,
}));

export default MIGRATED_MACHINES;
