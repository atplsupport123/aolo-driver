// Form validation with zod. Rules mirror the Laravel validation so drivers see
// errors before submitting; server 422 errors still win (mapped with setError).
import { z } from 'zod';
import type { FieldValues, Resolver } from 'react-hook-form';

const mobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a 10 digit mobile number');
const optionalMobile = z.union([z.literal(''), mobile]).optional();
const required = (label: string) => z.string().trim().min(1, `${label} is required`);
const ddmmyyyy = z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use DD/MM/YYYY');

export const mobileSchema = z.object({ mobile });

export const ownerSchema = z.object({
  branch_city: required('Branch / City'),
  full_name: required('Full name'),
  mobile_1: mobile,
  mobile_2: optionalMobile,
  aadhaar: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits')),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Enter a valid PAN, like ABCDE1234F')),
  gst: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => !v || /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(v), 'Enter a valid GST number')
    .optional(),
  upi_id: z
    .string()
    .trim()
    .refine((v) => !v || /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(v), 'Enter a valid UPI ID, like name@upi')
    .optional(),
  bank_account: z.string().regex(/^\d{9,18}$/, 'Account number must be 9 to 18 digits'),
  ifsc: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC, like SBIN0001234')),
});
export type OwnerValues = z.input<typeof ownerSchema>;

export const driverSchema = z.discriminatedUnion('is_owner_driver', [
  z.object({ is_owner_driver: z.literal(true) }),
  z.object({
    is_owner_driver: z.literal(false),
    name: required('Driver name'),
    mobile,
    aadhaar: z
      .string()
      .transform((v) => v.replace(/\s/g, ''))
      .pipe(z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits')),
    badge_no: required('Badge no.'),
    experience_years: z.string().regex(/^\d{1,2}$/, 'Enter years, e.g. 5'),
    address: required('Address'),
  }),
]);
export type DriverValues = {
  is_owner_driver: boolean;
  name?: string;
  mobile?: string;
  aadhaar?: string;
  badge_no?: string;
  experience_years?: string;
  address?: string;
};

const thisYear = new Date().getFullYear();
export const vehicleSchema = z.object({
  vehicle_type: z.enum(['hatchback', 'sedan', 'suv', 'muv', 'auto', 'toto', 'bike', 'other']),
  vehicle_number: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.string().regex(/^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{4}$/, 'Enter like BR 19 AB 1234')),
  year: z.string().refine((v) => /^\d{4}$/.test(v) && +v >= 1990 && +v <= thisYear, 'Enter a valid year'),
  colour: required('Colour'),
  owner_name: z.string().optional(),
  fitness_valid_upto: ddmmyyyy,
  puc_valid_upto: ddmmyyyy,
  fastag_no: z.string().optional(),
  has_gps: z.boolean(),
  has_dashcam: z.boolean(),
});
export type VehicleValues = z.input<typeof vehicleSchema>;

export const leadSchema = z.object({
  kind: z.enum(['going_empty', 'need_vehicle']),
  from_city: required('From city'),
  to_city: required('To city'),
  date: ddmmyyyy,
  time: required('Time'),
  vehicle_type: z.enum(['hatchback', 'sedan', 'suv', 'muv', 'auto', 'toto', 'bike', 'other']),
  fare: z.string().regex(/^\d*$/, 'Numbers only').optional(),
  note: z.string().max(200, 'Keep it under 200 characters').optional(),
  contact_in_app: z.boolean(),
});
export type LeadValues = z.input<typeof leadSchema>;

/**
 * Minimal zod → react-hook-form resolver, so we don't need @hookform/resolvers.
 * Returns parsed (transformed) values on success.
 */
export function zodResolver<T extends FieldValues>(schema: z.ZodTypeAny): Resolver<T> {
  return async (values) => {
    const r = schema.safeParse(values);
    if (r.success) return { values: r.data as T, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of r.error.issues) {
      const key = issue.path.join('.');
      if (key && !errors[key]) errors[key] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as any };
  };
}

/** Copies Laravel 422 field errors into the form. */
export function applyServerErrors<T extends FieldValues>(
  setError: (name: any, e: { type: string; message: string }) => void,
  fieldErrors: Record<string, string>,
) {
  Object.entries(fieldErrors).forEach(([k, m]) => setError(k as keyof T, { type: 'server', message: m }));
}

export const digits = (max: number) => (v: string) => v.replace(/\D/g, '').slice(0, max);
export const dateMask = (t: string) => {
  const d = t.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
};
