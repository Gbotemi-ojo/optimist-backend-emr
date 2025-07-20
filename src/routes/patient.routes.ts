// src/routes/patient.routes.ts
import { Router } from 'express';
import { patientController } from '../controllers/patient.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// --- PATIENT & FAMILY MANAGEMENT ROUTES ---
router.post('/guest-submit', patientController.submitGuestPatient);
router.post('/guest-family-submit', patientController.submitGuestFamilyPatient);
router.post('/returning-guest-visit', patientController.recordReturningGuestVisit);

router.post(
    '/:headId/members',
    authenticateToken,
    authorizeRoles(['owner', 'staff', 'doctor']),
    patientController.addFamilyMember
);

router.get('/', authenticateToken, authorizeRoles(['owner', 'staff', 'nurse', 'doctor']), patientController.getAllPatients);
router.get('/:id', authenticateToken, authorizeRoles(['owner', 'staff', 'nurse', 'doctor']), patientController.getPatientById);
router.put('/:id', authenticateToken, authorizeRoles(['owner', 'staff']), patientController.updatePatient);

// --- APPOINTMENT SCHEDULING & REMINDER ROUTES ---
router.post(
    '/:patientId/schedule-appointment',
    authenticateToken,
    authorizeRoles(['owner', 'staff', 'doctor','nurse']),
    patientController.scheduleNextAppointment
);

router.post(
    '/:patientId/send-reminder',
    authenticateToken,
    authorizeRoles(['owner', 'staff', 'doctor','nurse']),
    patientController.sendAppointmentReminder
);

// --- DENTAL RECORD MANAGEMENT ROUTES ---
router.post('/:patientId/dental-records', authenticateToken, authorizeRoles(['owner', 'staff', 'nurse', 'doctor']), patientController.createDentalRecord);
router.get('/:patientId/dental-records', authenticateToken, authorizeRoles(['owner', 'staff', 'nurse', 'doctor']), patientController.getDentalRecordsByPatientId);
router.get('/:patientId/dental-records/:recordId', authenticateToken, authorizeRoles(['owner', 'staff', 'nurse', 'doctor']), patientController.getSpecificDentalRecordForPatient);

router.get('/dental-records/:id', authenticateToken, authorizeRoles(['owner', 'staff', 'nurse', 'doctor']), patientController.getDentalRecordById);
router.put('/dental-records/:id', authenticateToken, authorizeRoles(['owner', 'staff', 'nurse', 'doctor']), patientController.updateDentalRecord);
router.delete('/dental-records/:id', authenticateToken, authorizeRoles(['owner', 'staff', 'nurse', 'doctor']), patientController.deleteDentalRecord);

export default router;
