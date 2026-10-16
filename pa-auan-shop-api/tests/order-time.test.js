import test from 'node:test';
import assert from 'node:assert/strict';
import { orderDateTime } from '../src/order-time.js';

test('UTC order times are displayed in Bangkok without an ISO date suffix', () => {
  assert.deepEqual(orderDateTime('2026-10-16T06:21:00Z'), { date: '2026-10-16', time: '13:21:00' });
});

test('Bangkok midnight rolls across month and year boundaries', () => {
  assert.deepEqual(orderDateTime('2026-10-31T17:00:00Z'), { date: '2026-11-01', time: '00:00:00' });
  assert.deepEqual(orderDateTime('2026-12-31T17:05:00Z'), { date: '2027-01-01', time: '00:05:00' });
});

test('Date values from PostgreSQL and equivalent offset strings agree', () => {
  assert.deepEqual(orderDateTime(new Date('2026-10-16T06:21:00Z')), orderDateTime('2026-10-16T13:21:00+07:00'));
});
