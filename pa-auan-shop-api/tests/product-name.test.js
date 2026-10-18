import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanProductName, assertProductNameAvailable } from '../src/product-name.js';

test('trim names and reject blank or non-string input', () => {
  assert.equal(cleanProductName('  ชาไทย  '), 'ชาไทย');
  for (const value of ['', '   ', null, 123]) assert.throws(() => cleanProductName(value), { status: 400 });
});

test('duplicate check locks before reading and rejects an existing name', async () => {
  const calls = [];
  const client = { query: async (sql, params) => {
    calls.push({ sql, params });
    return { rows: sql.startsWith('SELECT id') ? [{ id: 'P1' }] : [] };
  } };
  await assert.rejects(assertProductNameAvailable(client, 'ชาไทย'), { status: 409 });
  assert.match(calls[0].sql, /pg_advisory_xact_lock/);
  assert.deepEqual(calls[1].params, ['ชาไทย', null]);
});

test('renaming excludes the current product and accepts an available name', async () => {
  const calls = [];
  const client = { query: async (sql, params) => { calls.push({ sql, params }); return { rows: [] }; } };
  await assertProductNameAvailable(client, 'ชาไทย', 'P1');
  assert.deepEqual(calls[1].params, ['ชาไทย', 'P1']);
});
