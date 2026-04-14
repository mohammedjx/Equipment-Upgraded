import { z } from "zod";

export const officerRegistrationSchema = z.object({
  badgeId: z.string().trim().min(1),
  nuid: z.string().trim().min(1),
  fullName: z.string().trim().min(2),
  photoData: z.string().optional().nullable(),
});

export const shiftStartSchema = z.object({
  badgeId: z.string().trim().min(1),
});

export const noEquipmentSchema = z.object({
  shiftId: z.string().trim().min(1),
});

export const endShiftSchema = z.object({
  shiftId: z.string().trim().min(1),
});

export const equipmentRegistrationSchema = z.object({
  qrCode: z.string().trim().min(1),
  label: z.string().trim().min(1),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export const equipmentScanSchema = z.object({
  shiftId: z.string().trim().min(1),
  qrCode: z.string().trim().min(1),
  action: z.enum(["CHECK_OUT", "CHECK_IN"]),
});
