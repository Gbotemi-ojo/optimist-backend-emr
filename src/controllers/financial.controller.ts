import { Request, Response } from 'express';
import { financialRecordService } from '../services/financial.service';
import { settingsService } from '../services/settings.service'; // Import settings service

interface AuthenticatedRequest extends Request {
  user?: { userId: number; role: string; };
}

// Helper to check permissions
const hasPermission = (settings: any, userRole: string, permissionKey: string): boolean => {
    if (!settings || !settings.financials || !userRole) return false;
    if (userRole === 'owner') return true; // Owner always has permission
    return settings.financials[permissionKey]?.includes(userRole);
};


export class FinancialRecordController {

    getAllRecords = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const settings = await settingsService.getSettings();
            if (!hasPermission(settings, req.user!.role, 'canViewFinancialRecords')) {
                res.status(403).json({ error: 'You do not have permission to view financial records.' });
                return;
            }

            const records = await financialRecordService.getAllRecords();
            res.status(200).json(records);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to retrieve financial records.' });
        }
    }

    createRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const settings = await settingsService.getSettings();
            if (!hasPermission(settings, req.user!.role, 'canAddFinancialRecord')) {
                res.status(403).json({ error: 'You do not have permission to add financial records.' });
                return;
            }

            const recordedById = req.user?.userId;
            if (!recordedById) {
                res.status(403).json({ error: 'User not authenticated.' });
                return;
            }
            const record = await financialRecordService.createRecord(req.body, recordedById);
            res.status(201).json(record);
        } catch (error: any) {
             if (error.message.includes('Patient not found')) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to create financial record.' });
            }
        }
    }

    updateRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const settings = await settingsService.getSettings();
            if (!hasPermission(settings, req.user!.role, 'canEditFinancialRecord')) {
                res.status(403).json({ error: 'You do not have permission to edit financial records.' });
                return;
            }

            const id = parseInt(req.params.id);
            await financialRecordService.updateRecord(id, req.body);
            res.status(200).json({ message: 'Record updated successfully.' });
        } catch (error: any) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to update financial record.' });
            }
        }
    }

    deleteRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const settings = await settingsService.getSettings();
            if (!hasPermission(settings, req.user!.role, 'canDeleteFinancialRecord')) {
                res.status(403).json({ error: 'You do not have permission to delete financial records.' });
                return;
            }
            
            const id = parseInt(req.params.id);
            await financialRecordService.deleteRecord(id);
            res.status(200).json({ message: 'Record deleted successfully.' });
        } catch (error: any) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to delete financial record.' });
            }
        }
    }
}

export const financialController = new FinancialRecordController();

