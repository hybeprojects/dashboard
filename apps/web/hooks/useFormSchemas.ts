import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'At least 8 characters').required('Password is required'),
  otp: yup.string().matches(/^\d{6}$/g, { message: '6-digit code', excludeEmptyString: true }).optional(),
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
