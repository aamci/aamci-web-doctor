// Templates génériques pour documents médicaux
// Avec support pour logos et impression

export { default as DocumentHeader } from './DocumentHeader';
export type { DoctorInfo } from './DocumentHeader';

export { default as InvoiceTemplate } from './InvoiceTemplate';
export type { PatientInfo as InvoicePatientInfo, InvoiceItem, InvoiceData } from './InvoiceTemplate';

export { default as PrescriptionTemplate } from './PrescriptionTemplate';
export type { PatientInfo as PrescriptionPatientInfo, Medication, PrescriptionData } from './PrescriptionTemplate';

export { default as PrintButton } from './PrintButton';
