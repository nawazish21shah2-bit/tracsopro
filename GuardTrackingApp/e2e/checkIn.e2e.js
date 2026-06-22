const { loginAsGuard } = require('./helpers/login');
const { checkInAtSite } = require('./helpers/shiftActions');

describe('Guard check-in flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' },
    });
  });

  it('logs in and checks in to the seeded shift', async () => {
    await loginAsGuard();
    await checkInAtSite();
  });
});
