// Types pour le wizard de création de disponibilités

export interface AvailabilityPreference {
  id: string;
  ownerId: string;
  ownerType: string;
  name: string;
  description?: string;
  isDefault: boolean;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  allowedKindIds: string[];
  excludedTimes: string[];
  minBookingNotice?: number;
  maxBookingAdvance?: number;
  autoConfirm: boolean;
  allowCancellation: boolean;
  cancellationDeadline?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentKind {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  doctorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WizardFormData {
  // Step 1: Horaires
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;

  // Step 2: Récurrence
  daysOfWeek: number[];
  startDate: string;
  endDate: string;
  excludedTimes: string[];

  // Step 3: Options
  allowedKindIds: string[];
  minBookingNotice?: number;
  maxBookingAdvance?: number;
  autoConfirm: boolean;
  allowCancellation: boolean;
  cancellationDeadline?: number;
}

export interface CreateAvailabilityRulePayload {
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  allowedKindIds: string[];
  excludedTimes: string[];
  minBookingNotice?: number;
  maxBookingAdvance?: number;
  autoConfirm: boolean;
  allowCancellation: boolean;
  cancellationDeadline?: number;
}

export interface CreatePreferencePayload {
  name: string;
  description?: string;
  isDefault: boolean;
  daysOfWeek: number[];
  startHour: number;
  endHour: number;
  slotDurationMins: number;
  capacity: number;
  allowedKindIds: string[];
  excludedTimes: string[];
  minBookingNotice?: number;
  maxBookingAdvance?: number;
  autoConfirm: boolean;
  allowCancellation: boolean;
  cancellationDeadline?: number;
}

export interface Step1Props {
  formData: WizardFormData;
  onChange: (data: Partial<WizardFormData>) => void;
  templates: AvailabilityPreference[];
  selectedTemplate: string | null;
  onTemplateSelect: (templateId: string | null) => void;
  onSetDefaultTemplate?: (templateId: string) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

export interface Step2Props {
  formData: WizardFormData;
  onChange: (data: Partial<WizardFormData>) => void;
}

export interface Step3Props {
  formData: WizardFormData;
  onChange: (data: Partial<WizardFormData>) => void;
  appointmentKinds: AppointmentKind[];
  saveAsTemplate: boolean;
  onSaveAsTemplateChange: (value: boolean) => void;
  templateName: string;
  onTemplateNameChange: (value: string) => void;
  templateDescription: string;
  onTemplateDescriptionChange: (value: string) => void;
  templateCount: number;
}

export interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}
