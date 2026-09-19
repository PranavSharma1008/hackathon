import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';
import { ContractModel } from './contractModel.js';

export class DeliveryModel {
  static format(row) {
    if (!row) return null;
    let trackingNotes = [];
    try {
      trackingNotes = typeof row.tracking_notes === 'string'
        ? JSON.parse(row.tracking_notes)
        : row.tracking_notes || [];
    } catch {
      trackingNotes = [];
    }

    return {
      id: row.id,
      contract_id: row.contract_id,
      crop: row.crop || null,
      quantity: row.quantity || null,
      processor_name: row.processor_name || null,
      farmer_name: row.farmer_name || null,
      status: row.status,
      delivery_date: row.delivery_date,
      tracking_notes: trackingNotes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  static create(data) {
    const db = getDb();
    const id = data.id || `del_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    const status = data.status || 'Scheduled';

    const validStatuses = ['Scheduled', 'In Transit', 'Delivered'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Verify contract exists
    const contract = ContractModel.findById(data.contract_id);
    if (!contract) {
      throw new Error(`Contract with ID '${data.contract_id}' does not exist`);
    }

    const initialNote = {
      timestamp: now,
      status,
      checkpoint: data.checkpoint || 'Delivery created and scheduled',
      notes: data.notes || 'Awaiting logistics dispatch'
    };

    const trackingNotesJson = JSON.stringify(
      Array.isArray(data.tracking_notes) ? data.tracking_notes : [initialNote]
    );

    const stmt = db.prepare(`
      INSERT INTO deliveries (
        id, contract_id, status, delivery_date, tracking_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.contract_id,
      status,
      data.delivery_date || now.split('T')[0],
      trackingNotesJson,
      now,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        d.*,
        c.crop,
        c.quantity,
        c.agreed_price,
        p.company_name as processor_name,
        f.name as farmer_name
      FROM deliveries d
      LEFT JOIN contracts c ON d.contract_id = c.id
      LEFT JOIN processors p ON c.processor_id = p.id
      LEFT JOIN farmers f ON c.farmer_id = f.id
      WHERE d.id = ?
    `);
    const row = stmt.get(id);
    return this.format(row);
  }

  static findByContractId(contractId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        d.*,
        c.crop,
        c.quantity,
        p.company_name as processor_name,
        f.name as farmer_name
      FROM deliveries d
      LEFT JOIN contracts c ON d.contract_id = c.id
      LEFT JOIN processors p ON c.processor_id = p.id
      LEFT JOIN farmers f ON c.farmer_id = f.id
      WHERE d.contract_id = ?
      ORDER BY d.created_at DESC
    `);
    const rows = stmt.all(contractId);
    return rows.map((r) => this.format(r));
  }

  static findAll(filter = {}) {
    const db = getDb();
    let query = `
      SELECT 
        d.*,
        c.crop,
        c.quantity,
        p.company_name as processor_name,
        f.name as farmer_name
      FROM deliveries d
      LEFT JOIN contracts c ON d.contract_id = c.id
      LEFT JOIN processors p ON c.processor_id = p.id
      LEFT JOIN farmers f ON c.farmer_id = f.id
    `;
    const params = [];

    if (filter.status) {
      query += ' WHERE d.status = ?';
      params.push(filter.status);
    }

    query += ' ORDER BY d.created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map((r) => this.format(r));
  }

  static updateMilestone(deliveryId, { status, delivery_date, checkpoint, notes }) {
    const db = getDb();
    const existing = this.findById(deliveryId);
    if (!existing) {
      throw new Error(`Delivery with ID '${deliveryId}' not found`);
    }

    const newStatus = status || existing.status;
    const validStatuses = ['Scheduled', 'In Transit', 'Delivered'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status '${newStatus}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    const now = new Date().toISOString();
    const newDeliveryDate = delivery_date || existing.delivery_date;

    const newMilestone = {
      timestamp: now,
      status: newStatus,
      checkpoint: checkpoint || `Status updated to ${newStatus}`,
      notes: notes || ''
    };

    const updatedNotes = [...existing.tracking_notes, newMilestone];

    const stmt = db.prepare(`
      UPDATE deliveries
      SET status = ?, delivery_date = ?, tracking_notes = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      newStatus,
      newDeliveryDate,
      JSON.stringify(updatedNotes),
      now,
      deliveryId
    );

    // If delivered, auto fulfill contract
    if (newStatus === 'Delivered') {
      ContractModel.updateStatus(existing.contract_id, 'Fulfilled');
    }

    return this.findById(deliveryId);
  }

  static count() {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM deliveries').get();
    return row?.count || 0;
  }
}
