export interface SiteFormFields {
  name: string;
  address: string;
  city: string;
  contactPerson: string;
  clientId?: string;
}

export interface SiteFormValidationOptions {
  requireClient?: boolean;
}

export interface SiteFormValidationResult {
  valid: boolean;
  message?: string;
}

export function validateSiteForm(
  fields: SiteFormFields,
  options: SiteFormValidationOptions = {}
): SiteFormValidationResult {
  if (options.requireClient && !fields.clientId?.trim()) {
    return { valid: false, message: 'Please select a client.' };
  }
  if (!fields.name?.trim()) {
    return { valid: false, message: 'Site name is required.' };
  }
  if (!fields.address?.trim()) {
    return { valid: false, message: 'Street address is required.' };
  }
  if (!fields.city?.trim()) {
    return { valid: false, message: 'City is required.' };
  }
  if (!fields.contactPerson?.trim()) {
    return { valid: false, message: 'Contact person is required.' };
  }
  return { valid: true };
}
