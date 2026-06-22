const { loginAsGuard } = require('./helpers/login');
const { checkInAtSite, checkOutAtSite } = require('./helpers/shiftActions');

describe('Guard shift lifecycle (check-in → check-out)', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' },
    });
  });

  it('completes check-in and check-out for the seeded shift', async () => {
    await loginAsGuard();
    await checkInAtSite();
    await checkOutAtSite();

    await waitFor(element(by.id('guard-no-shifts-today')))
      .toBeVisible()
      .withTimeout(20000);
  });
});
