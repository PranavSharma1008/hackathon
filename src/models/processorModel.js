import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';

export class ProcessorModel {
  static format(row) {
    if (!row) return null;
    return {
      id: row.id,
      user_id: row.user_id || null,
      is_trusted: row.is_trusted === undefined || row.is_trusted === null ? true : Boolean(row.is_trusted),
      is_service_active: row.is_service_active === undefined || row.is_service_active === null ? true : Boolean(row.is_service_active),
      company_name: row.company_name,
      location: {
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address || null
      },
      required_crop: row.required_crop,
      required_grade: row.required_grade,
      quantity_needed_tons: row.quantity_needed_tons,
      max_distance_km: row.max_distance_km,
      deadline: row.deadline,
      target_price_per_ton: row.target_price_per_ton ?? null,
      created_at: row.created_at
    };
  }

  static create(data) {
    const db = getDb();
    const id = data.id || `proc_${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();

    const latitude = Number(data.location?.latitude ?? data.latitude);
    const longitude = Number(data.location?.longitude ?? data.longitude);
    const address = data.location?.address ?? data.address ?? null;

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Valid processor location latitude and longitude coordinates are required');
    }

    const isTrusted = data.is_trusted === undefined ? 1 : (data.is_trusted ? 1 : 0);
    const isServiceActive = data.is_service_active === undefined ? 1 : (data.is_service_active ? 1 : 0);

    const stmt = db.prepare(`
      INSERT INTO processors (
        id, user_id, is_trusted, is_service_active, company_name, latitude, longitude, address, required_crop,
        required_grade, quantity_needed_tons, max_distance_km, deadline,
        target_price_per_ton, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.user_id || null,
      isTrusted,
      isServiceActive,
      data.company_name,
      latitude,
      longitude,
      address,
      data.required_crop,
      data.required_grade,
      Number(data.quantity_needed_tons),
      Number(data.max_distance_km),
      data.deadline,
      data.target_price_per_ton ? Number(data.target_price_per_ton) : null,
      createdAt
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM processors WHERE id = ?');
    const row = stmt.get(id);
    return this.format(row);
  }

  static findByUserId(userId) {
    if (!userId) return null;
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM processors WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get(userId);
    return this.format(row);
  }

  static update(id, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    if (updates.company_name !== undefined) {
      fields.push('company_name = ?');
      values.push(updates.company_name);
    }
    if (updates.address !== undefined) {
      fields.push('address = ?');
      values.push(updates.address);
    }
    if (updates.latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(Number(updates.latitude));
    }
    if (updates.longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(Number(updates.longitude));
    }
    if (updates.required_crop !== undefined) {
      fields.push('required_crop = ?');
      values.push(updates.required_crop);
    }
    if (updates.required_grade !== undefined) {
      fields.push('required_grade = ?');
      values.push(updates.required_grade);
    }
    if (updates.quantity_needed_tons !== undefined) {
      fields.push('quantity_needed_tons = ?');
      values.push(Number(updates.quantity_needed_tons));
    }
    if (updates.max_distance_km !== undefined) {
      fields.push('max_distance_km = ?');
      values.push(Number(updates.max_distance_km));
    }
    if (updates.deadline !== undefined) {
      fields.push('deadline = ?');
      values.push(updates.deadline);
    }
    if (updates.target_price_per_ton !== undefined) {
      fields.push('target_price_per_ton = ?');
      values.push(updates.target_price_per_ton ? Number(updates.target_price_per_ton) : null);
    }
    if (updates.is_service_active !== undefined) {
      fields.push('is_service_active = ?');
      values.push(updates.is_service_active ? 1 : 0);
    }
    if (updates.is_trusted !== undefined) {
      fields.push('is_trusted = ?');
      values.push(updates.is_trusted ? 1 : 0);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `UPDATE processors SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);
    return this.findById(id);
  }

  static findAll() {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM processors ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map((r) => this.format(r));
  }

  static count() {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM processors').get();
    return row?.count || 0;
  }
}
