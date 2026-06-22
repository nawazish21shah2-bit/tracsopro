import { isSubscriptionLimitError, resourceLabel } from '../subscriptionLimitAlert';

describe('subscriptionLimitAlert helpers', () => {
  it('detects subscription limit errors', () => {
    expect(isSubscriptionLimitError('Trial limit reached (2 guards)')).toBe(true);
    expect(isSubscriptionLimitError('Network timeout')).toBe(false);
  });

  it('returns resource labels', () => {
    expect(resourceLabel('guards')).toBe('guard');
    expect(resourceLabel('sites')).toBe('site');
  });
});
