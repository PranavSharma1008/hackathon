import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';

export class OrderModel {
  static format(row) {
    if (!row) return null;
    return {
      id: row.id,
      store_item_id: row.store_item_id,
      farmer_id: row.farmer_id,
      farmer_name: row.farmer_name || null,
      buyer_user_id: row.buyer_user_id || null,
      buyer_name: row.buyer_name,
      buyer_email: row.buyer_email,
      buyer_role: row.buyer_role,
      crop_name: row.crop_name,
      quantity_quintals: row.quantity_quintals,
      offered_price_per_quintal: row.offered_price_per_quintal,
      total_amount_inr: Math.round(row.quantity_quintals * row.offered_price_per_quintal),
      status: row.status, // 'Pending', 'Served', 'Cancelled'
      cancel_reason: row.cancel_reason || null,
      notes: row.notes || null,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  static create(data) {
    const db = getDb();
    const id = data.id || `req_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO store_requests (
        id, store_item_id, farmer_id, buyer_user_id, buyer_name, buyer_email, buyer_role,
        crop_name, quantity_quintals, offered_price_per_quintal, status, cancel_reason, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.store_item_id,
      data.farmer_id,
      data.buyer_user_id || null,
      data.buyer_name,
      data.buyer_email,
      data.buyer_role || 'processor',
      data.crop_name,
      Number(data.quantity_quintals),
      Number(data.offered_price_per_quintal),
      data.status || 'Pending',
      data.cancel_reason || null,
      data.notes || null,
      now,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT r.*, f.name as farmer_name
      FROM store_requests r
      LEFT JOIN farmers f ON r.farmer_id = f.id
      WHERE r.id = ?
    `);
    const row = stmt.get(id);
    return this.format(row);
  }

  static findByFarmerId(farmerId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT r.*, f.name as farmer_name
      FROM store_requests r
      LEFT JOIN farmers f ON r.farmer_id = f.id
      WHERE r.farmer_id = ?
      ORDER BY r.created_at DESC
    `);
    const rows = stmt.all(farmerId);
    return rows.map((r) => this.format(r));
  }

  static findAll() {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT r.*, f.name as farmer_name
      FROM store_requests r
      LEFT JOIN farmers f ON r.farmer_id = f.id
      ORDER BY r.created_at DESC
    `);
    const rows = stmt.all();
    return rows.map((r) => this.format(r));
  }

  static findByBuyerEmail(buyerEmail) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT r.*, f.name as farmer_name
      FROM store_requests r
      LEFT JOIN farmers f ON r.farmer_id = f.id
      WHERE LOWER(r.buyer_email) = ?
      ORDER BY r.created_at DESC
    `);
    const rows = stmt.all(buyerEmail.toLowerCase().trim());
    return rows.map((r) => this.format(r));
  }

  static serve(id) {
    const db = getDb();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE store_requests
      SET status = 'Served', updated_at = ?
      WHERE id = ?
    `);
    stmt.run(now, id);
    return this.findById(id);
  }

  static cancel(id, reason = 'Order declined by farmer') {
    const db = getDb();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE store_requests
      SET status = 'Cancelled', cancel_reason = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(reason, now, id);
    return this.findById(id);
  }
}
