import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';

export class ContractModel {
  static format(row) {
    if (!row) return null;
    return {
      id: row.id,
      processor_id: row.processor_id,
      processor_name: row.processor_name || null,
      farmer_id: row.farmer_id,
      farmer_name: row.farmer_name || null,
      crop: row.crop,
      quantity: row.quantity,
      agreed_price: row.agreed_price,
      status: row.status, // 'Pending', 'Accepted', 'Signed', 'Fulfilled', 'Cancelled'
      served_by: row.served_by || null,
      cancelled_by: row.cancelled_by || null,
      cancel_reason: row.cancel_reason || null,
      advance_payment_status: row.advance_payment_status || 'pending',
      advance_paid_percentage: row.advance_paid_percentage || 0.0,
      advance_paid_amount: row.advance_paid_amount || 0.0,
      payment_transaction_id: row.payment_transaction_id || null,
      contract_text: row.contract_text,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  static create(data) {
    const db = getDb();
    const id = data.id || `cont_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    const status = data.status || 'Pending';

    const validStatuses = ['Pending', 'Accepted', 'Signed', 'Fulfilled', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    const stmt = db.prepare(`
      INSERT INTO contracts (
        id, processor_id, farmer_id, crop, quantity, agreed_price, status, served_by, cancelled_by, cancel_reason, contract_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.processor_id,
      data.farmer_id,
      data.crop,
      Number(data.quantity),
      Number(data.agreed_price),
      status,
      data.served_by || null,
      data.cancelled_by || null,
      data.cancel_reason || null,
      data.contract_text,
      now,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        c.*, 
        p.company_name as processor_name,
        f.name as farmer_name
      FROM contracts c
      LEFT JOIN processors p ON c.processor_id = p.id
      LEFT JOIN farmers f ON c.farmer_id = f.id
      WHERE c.id = ?
    `);
    const row = stmt.get(id);
    return this.format(row);
  }

  static findAll(filter = {}) {
    const db = getDb();
    let query = `
      SELECT 
        c.*, 
        p.company_name as processor_name,
        f.name as farmer_name
      FROM contracts c
      LEFT JOIN processors p ON c.processor_id = p.id
      LEFT JOIN farmers f ON c.farmer_id = f.id
    `;
    const params = [];
    const conditions = [];

    if (filter.status) {
      conditions.push('c.status = ?');
      params.push(filter.status);
    }
    if (filter.farmer_id) {
      conditions.push('c.farmer_id = ?');
      params.push(filter.farmer_id);
    }
    if (filter.processor_id) {
      conditions.push('c.processor_id = ?');
      params.push(filter.processor_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY c.created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map((r) => this.format(r));
  }

  static updateStatus(id, status) {
    const validStatuses = ['Pending', 'Accepted', 'Signed', 'Fulfilled', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    const db = getDb();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE contracts 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(status, now, id);
    return this.findById(id);
  }

  static serve(id, servedBy = 'farmer') {
    const db = getDb();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE contracts 
      SET status = 'Accepted', served_by = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(servedBy, now, id);
    return this.findById(id);
  }

  static cancel(id, { cancelledBy = 'farmer', reason = 'Request declined by user' } = {}) {
    const db = getDb();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE contracts 
      SET status = 'Cancelled', cancelled_by = ?, cancel_reason = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(cancelledBy, reason, now, id);
    return this.findById(id);
  }

  static payAdvance(id, { amount, paymentMethod = 'UPI', transactionRef } = {}) {
    const db = getDb();
    const contract = this.findById(id);
    if (!contract) {
      throw new Error(`Contract with ID '${id}' not found`);
    }

    const advanceAmount = amount !== undefined && Number(amount) > 0
      ? Number(amount)
      : Math.round(contract.agreed_price * 0.3);
    const txnRef = transactionRef || `TXN-AGRI30-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE contracts 
      SET status = 'Signed',
          advance_payment_status = 'paid',
          advance_paid_percentage = 30.0,
          advance_paid_amount = ?,
          payment_transaction_id = ?,
          updated_at = ?
      WHERE id = ?
    `);

    stmt.run(advanceAmount, txnRef, now, id);
    return this.findById(id);
  }

  static count() {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM contracts').get();
    return row?.count || 0;
  }
}
