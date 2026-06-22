import {
  formatPlanPrice,
  formatPlanDate,
  statusColor,
  usageLabel,
} from '../subscriptionUtils';

describe('subscriptionUtils', () => {
  it('formatPlanPrice converts cents to USD', () => {
    expect(formatPlanPrice(9900)).toBe('$99');
  });

  it('formatPlanDate returns em dash for empty input', () => {
    expect(formatPlanDate(null)).toBe('—');
  });

  it('statusColor maps known statuses', () => {
    expect(statusColor('ACTIVE')).toBe('#4CAF50');
    expect(statusColor('UNKNOWN')).toBe('#828282');
  });

  it('usageLabel pluralizes resource names', () => {
    expect(usageLabel({ used: 1, max: 10, percent: 10 }, 'site', 'sites')).toBe(
      '1 / 10 sites'
    );
    expect(usageLabel({ used: 1, max: 1, percent: 100 }, 'site', 'sites')).toBe(
      '1 / 1 site'
    );
  });
});
