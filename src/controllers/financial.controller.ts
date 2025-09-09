import { Request, Response } from 'express';
import { financialRecordService } from '../services/financial.service';

interface AuthenticatedRequest extends Request {
  user?: { userId: number; role: string; };
}

export class FinancialRecordController {

    getAllRecords = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const records = await financialRecordService.getAllRecords();
            res.status(200).json(records);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to retrieve financial records.' });
        }
    }

    createRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
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
