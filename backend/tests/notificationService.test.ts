import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import notificationService from '../src/services/notificationService.js';

describe('NotificationService.filterRecipients', () => {
  it('deduplicates user ids', () => {
    const result = notificationService.filterRecipients([
      'user-a',
      'user-a',
      'user-b',
    ]);
    assert.deepEqual(result, ['user-a', 'user-b']);
  });

  it('excludes actor ids', () => {
    const result = notificationService.filterRecipients(
      ['user-a', 'user-b', 'user-c'],
      'user-b'
    );
    assert.deepEqual(result, ['user-a', 'user-c']);
  });

  it('excludes multiple actors', () => {
    const result = notificationService.filterRecipients(
      ['user-a', 'user-b', 'user-c'],
      ['user-a', 'user-c']
    );
    assert.deepEqual(result, ['user-b']);
  });

  it('filters empty ids', () => {
    const result = notificationService.filterRecipients(['', 'user-a', '']);
    assert.deepEqual(result, ['user-a']);
  });
});
