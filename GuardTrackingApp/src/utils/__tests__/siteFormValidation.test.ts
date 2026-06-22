import { validateSiteForm } from '../siteFormValidation';

describe('validateSiteForm', () => {
  const base = {
    name: 'Main Gate',
    address: '123 Security Ave',
    city: 'New York',
    contactPerson: 'Jane Doe',
  };

  it('accepts complete form', () => {
    expect(validateSiteForm(base).valid).toBe(true);
  });

  it('requires site name', () => {
    const result = validateSiteForm({ ...base, name: '  ' });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/name/i);
  });

  it('requires client when configured', () => {
    const result = validateSiteForm(base, { requireClient: true });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/client/i);
  });
});
