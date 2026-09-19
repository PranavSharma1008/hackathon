import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';

export class ApplicationModel {
  static format(row) {
    if (!row) return null;
    return {
      id: row.id,
      user_id: row.user_id,
      user_email: row.user_email,
      company_name: row.company_name,
      phone: row.phone || null,
      gst_number: row.gst_number || null,
      fssai_license: row.fssai_license || null,
      address: row.address || null,
      location: {
        latitude: row.latitude,
        longitude: row.longitude
      },
      processing_capacity_tons: row.processing_capacity_tons,
      target_crops: row.target_crops,
      status: row.status, // 'pending', 'approved', 'rejected'
      admin_notes: row.admin_notes || null,
      created_at: row.created_at,
      reviewed_at: row.reviewed_at || null
    };
  }

  static create(data) {
    const db = getDb();
    const id = data.id || `app_${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();

    const latitude = Number(data.location?.latitude ?? data.latitude ?? 30.9010);
    const longitude = Number(data.location?.longitude ?? data.longitude ?? 75.8573);

    const stmt = db.prepare(`
      INSERT INTO processor_applications (
        id, user_id, user_email, company_name, phone, gst_number, fssai_license,
        address, latitude, longitude, processing_capacity_tons, target_crops,
        status, admin_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.user_id || null,
      (data.user_email || '').toLowerCase().trim(),
      data.company_name,
      data.phone || null,
      data.gst_number || null,
      data.fssai_license || null,
      data.address || null,
      latitude,
      longitude,
      Number(data.processing_capacity_tons || 500),
      data.target_crops || 'Wheat, Potato, Soybean',
      'pending',
      null,
      createdAt
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM processor_applications WHERE id = ?');
    const row = stmt.get(id);
    return this.format(row);
  }

  static findByEmail(email) {
    if (!email) return null;
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM processor_applications WHERE LOWER(user_email) = ? ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get(email.toLowerCase().trim());
    return this.format(row);
  }

  static findByUserId(userId) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM processor_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get(userId);
    return this.format(row);
  }

  static findAll(status = null) {
    const db = getDb();
    let sql = 'SELECT * FROM processor_applications';
    const params = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map((r) => this.format(r));
  }

  static updateStatus(id, { status, admin_notes = null }) {
    const db = getDb();
    const reviewedAt = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE processor_applications
      SET status = ?, admin_notes = ?, reviewed_at = ?
      WHERE id = ?
    `);
    stmt.run(status, admin_notes, reviewedAt, id);
    return this.findById(id);
  }

  static countPending() {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as count FROM processor_applications WHERE status = 'pending'").get();
    return row?.count || 0;
  }
}
