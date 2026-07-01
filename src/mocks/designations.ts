export const designations = [
  'Sales',
  'Operations',
  'HR',
  'IT',
  'Finance',
  'Front Desk',
  'Housekeeping',
  'Management',
  'Kitchen Staff',
] as const;

export type Designation = typeof designations[number];