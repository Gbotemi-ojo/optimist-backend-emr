import { db } from '../config/database';
import { financialRecords, patients } from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { InferInsertModel } from 'drizzle-orm';

type FinancialRecordInsert = InferInsertModel<typeof financialRecords>;

// --- THIS IS THE FIX ---
// Define the payload to EXACTLY match the data sent from the React modal.
interface FinancialFormPayload {
  patientName: string;
  procedureDone: string;
  pricePaid: string;
  totalPrice: string;
  date: string; // This is an ISO date string like "YYYY-MM-DD" from <input type="date">
  outstandingBalance: string;
}

// Update the type aliases to use the correct payload interface
type FinancialRecordPayload = FinancialFormPayload;
// The update function also receives the full form payload, not a partial one
type UpdateRecordPayload = FinancialFormPayload;


export class FinancialRecordService {
    async getAllRecords() {
        return await db.select().from(financialRecords).orderBy(desc(financialRecords.date));
    }

    async getRecordById(id: number) {
        const [record] = await db.select().from(financialRecords).where(eq(financialRecords.id, id));
        return record;
    }

    // --- UPDATED FUNCTION ---
    async createRecord(data: FinancialRecordPayload, recordedById: number) {
        // Manually destructure ALL expected fields from the known payload.
        // This avoids the unreliable ...restOfData spread.
        const { 
            patientName, 
            procedureDone, 
            pricePaid, 
            totalPrice, 
            date, 
            outstandingBalance 
        } = data;

        // Find or Create patient by name (This logic is correct)
        let [patient] = await db.select({ id: patients.id }).from(patients).where(eq(patients.name, patientName.trim()));
        
        let patientIdToUse: number;

        if (!patient) {
            // Patient not found, create a new one
            const [newPatient] = await db.insert(patients).values({
                name: patientName.trim(),
                sex: "Unknown", // You correctly added this required default
                outstanding: "0.00" 
            });
            patientIdToUse = newPatient.insertId;
        } else {
            // Patient found, use their ID
            patientIdToUse = patient.id;
        }

        // --- THIS IS THE FIX ---
        // Explicitly build the insert object instead of spreading restOfData.
        // Convert the date string to a proper Date object.
        const [inserted] = await db.insert(financialRecords).values({
            procedureDone: procedureDone,
            pricePaid: pricePaid,
            totalPrice: totalPrice,
            outstandingBalance: outstandingBalance,
            date: new Date(date), // Convert string to Date object for the DB
            
            // Add the service-derived fields
            patientId: patientIdToUse,
            patientName: patientName.trim(),
            recordedById: recordedById,
        });

        // Update patient's total outstanding balance (This logic is correct)
        await this.updatePatientOutstanding(patientIdToUse);
        
        return { id: inserted.insertId };
    }

    // --- UPDATED FUNCTION ---
    // The 'data' param now correctly uses the full payload type
    async updateRecord(id: number, data: UpdateRecordPayload) {
        // Fetch existing record's patientId AND patientName (This logic is correct)
        const [existingRecord] = await db.select({ 
            patientId: financialRecords.patientId, 
            patientName: financialRecords.patientName 
        }).from(financialRecords).where(eq(financialRecords.id, id));
        
        if (!existingRecord) {
            throw new Error('Record not found.');
        }
        
        let newPatientId: number | null = null;

        // --- THIS IS THE FIX ---
        // Create an update payload from the KNOWN data fields.
        // This replaces the generic 'any' type and ensures the date is converted.
        const updatePayload = {
            ...data, // Spread the known payload
            date: new Date(data.date) // OVERWRITE the date string with a Date object
        };

        // Patient change logic (This is correct)
        if (data.patientName && data.patientName.trim() !== existingRecord.patientName) {
            const newName = data.patientName.trim();
            
            let [newPatient] = await db.select({ id: patients.id }).from(patients).where(eq(patients.name, newName));
            
            if (!newPatient) {
                const [insertedPatient] = await db.insert(patients).values({
                    name: newName,
                    sex: "Unknown", 
                    outstanding: "0.00"
                });
                newPatientId = insertedPatient.insertId;
            } else {
                newPatientId = newPatient.id;
            }
            
            // Add the new patientId and trimmed name to our clean payload
            (updatePayload as any).patientId = newPatientId;
            updatePayload.patientName = newName;
        } else if (data.patientName) {
             updatePayload.patientName = data.patientName.trim();
        }

        // Perform the update with the clean, type-corrected payload
        await db.update(financialRecords).set({ ...updatePayload, updatedAt: new Date() }).where(eq(financialRecords.id, id));
        
        // Update outstanding balance logic (This is correct)
        await this.updatePatientOutstanding(existingRecord.patientId);

        if (newPatientId) {
            await this.updatePatientOutstanding(newPatientId);
        }

        return { success: true };
    }

    async deleteRecord(id: number) {
        const [record] = await db.select({ patientId: financialRecords.patientId }).from(financialRecords).where(eq(financialRecords.id, id));
        if (!record) {
             throw new Error('Record not found.');
        }

        await db.delete(financialRecords).where(eq(financialRecords.id, id));

        // Update the related patient's outstanding balance
        await this.updatePatientOutstanding(record.patientId);
        
        return { success: true };
    }

    private async updatePatientOutstanding(patientId: number) {
        const result = await db
            .select({
                totalOutstanding: sql<string>`SUM(${financialRecords.outstandingBalance})`.mapWith(Number),
            })
            .from(financialRecords)
            .where(eq(financialRecords.patientId, patientId));
            
        const newOutstanding = result[0]?.totalOutstanding || 0;

        await db.update(patients)
            .set({ outstanding: newOutstanding.toFixed(2) })
            .where(eq(patients.id, patientId));
    }
}

export const financialRecordService = new FinancialRecordService();
