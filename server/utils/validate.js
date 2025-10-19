function validateKycPayload({ fullName, dob, ssn, address, email } = {}) {
  const errors = [];
  if (!fullName || String(fullName).trim().length < 2) errors.push('fullName is required');
  if (!dob || isNaN(Date.parse(dob))) errors.push('dob is required and must be a valid date');
  if (!ssn || String(ssn).replace(/\D/g, '').length < 4) errors.push('ssn is required (at least last 4 digits)');
  if (!address || String(address).trim().length < 5) errors.push('address is required');
  if (!email || !String(email).includes('@')) errors.push('email is required and must be valid');
  return { valid: errors.length === 0, errors };
}

module.exports = { validateKycPayload };
