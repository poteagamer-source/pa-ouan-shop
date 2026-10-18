export function cleanProductName(value) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error('กรุณาระบุชื่อสินค้า');
    error.status = 400;
    throw error;
  }
  return value.trim();
}

// Must run inside the same transaction as INSERT/UPDATE. The lock prevents two
// requests from passing the duplicate check simultaneously, including renames.
export async function assertProductNameAvailable(client, name, excludingId = null) {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('product-name:' || lower($1)))", [name]);
  const { rows } = await client.query(
    'SELECT id FROM products WHERE lower(btrim(name)) = lower($1) AND ($2::text IS NULL OR id <> $2) LIMIT 1',
    [name, excludingId],
  );
  if (rows.length) {
    const error = new Error('มีชื่อสินค้านี้อยู่แล้ว กรุณาใช้ชื่ออื่น');
    error.status = 409;
    throw error;
  }
}
