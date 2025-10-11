import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'At least 8 characters').required('Password is required'),
  otp: yup
    .string()
    .matches(/^\d{6}$/g, { message: '6-digit code', excludeEmptyString: true })
    .optional(),
});

export const registerSchema = yup.object({
  firstName: yup.string().required('First name required'),
  lastName: yup.string().required('Last name required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(12, 'Use 12+ chars')
    .matches(/[A-Z]/, 'Include uppercase letter')
    .matches(/[a-z]/, 'Include lowercase letter')
    .matches(/\d/, 'Include a number')
    .matches(/[^A-Za-z0-9]/, 'Include a symbol')
    .required('Password is required'),
});

export const businessRegisterSchema = yup.object({
  businessName: yup.string().required('Business name required'),
  businessAddress: yup.string().required('Business address required'),
  taxId: yup.string().required('Tax ID (EIN) required'),
  annualIncome: yup.number().min(0).required('Annual income required'),
  depositAccountNumber: yup.string().required('Account number required'),
  routingNumber: yup.string().required('Routing number required'),
  initialDeposit: yup
    .number()
    .min(500, 'Minimum initial deposit is $500')
    .required('Initial deposit required'),
  representativeName: yup.string().required('Representative name required'),
  representativeSsn: yup.string().required('SSN required'),
});

export const personalRegisterSchema = yup.object({
  fullName: yup.string().required('Full name required'),
  dob: yup
    .string()
    .required('Date of birth required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD')
    .test('is-valid-date', 'Invalid date', (v) => {
      if (!v) return false;
      const d = new Date(v);
      return !Number.isNaN(d.getTime());
    }),
  ssn: yup.string().required('SSN required'),
  address: yup.string().required('Address required'),
});
