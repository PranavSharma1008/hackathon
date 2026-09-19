import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';

export class StoreModel {
  static format(row) {
    if (!row) return null;
    return {
      id: row.id,
      farmer_id: row.farmer_id,
      farmer_name: row.farmer_name || null,
      farmer_phone: row.farmer_phone || null,
      farmer_location: row.farmer_latitude ? {
        latitude: row.farmer_latitude,
        longitude: row.farmer_longitude,
        address: row.farmer_address
      } : null,
      crop_name: row.crop_name,
      grade: row.grade,
      quantity_quintals: row.quantity_quintals,
      price_per_quintal: row.price_per_quintal,
      total_value_inr: Math.round(row.quantity_quintals * row.price_per_quintal),
      storage_type: row.storage_type,
      harvest_date: row.harvest_date || null,
      moisture_percentage: row.moisture_percentage ?? 11.5,
      local_names: row.local_names || '',
      soil_type: row.soil_type || 'Loamy',
      tags: row.local_names ? row.local_names.split(',').map(s => s.trim()).filter(Boolean) : [],
      status: row.status, // 'available', 'reserved', 'sold'
      notes: row.notes || null,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  static create(data) {
    const db = getDb();
    const id = data.id || `item_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO farmer_store_items (
        id, farmer_id, crop_name, grade, quantity_quintals, price_per_quintal,
        storage_type, harvest_date, moisture_percentage, local_names, soil_type, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.farmer_id,
      data.crop_name,
      data.grade || 'Grade A',
      Number(data.quantity_quintals),
      Number(data.price_per_quintal),
      data.storage_type || 'Farm Silo',
      data.harvest_date || null,
      Number(data.moisture_percentage || 11.5),
      data.local_names || '',
      data.soil_type || 'Loamy',
      data.status || 'available',
      data.notes || null,
      now,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT s.*, f.name as farmer_name, f.phone as farmer_phone,
             f.latitude as farmer_latitude, f.longitude as farmer_longitude, f.address as farmer_address
      FROM farmer_store_items s
      LEFT JOIN farmers f ON s.farmer_id = f.id
      WHERE s.id = ?
    `);
    const row = stmt.get(id);
    return this.format(row);
  }

  static findByFarmerId(farmerId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT s.*, f.name as farmer_name, f.phone as farmer_phone,
             f.latitude as farmer_latitude, f.longitude as farmer_longitude, f.address as farmer_address
      FROM farmer_store_items s
      LEFT JOIN farmers f ON s.farmer_id = f.id
      WHERE s.farmer_id = ?
      ORDER BY s.created_at DESC
    `);
    const rows = stmt.all(farmerId);
    return rows.map((r) => this.format(r));
  }

  static findAll({ crop = null, maxPrice = null, storageType = null, status = 'available' } = {}) {
    const db = getDb();
    let sql = `
      SELECT s.*, f.name as farmer_name, f.phone as farmer_phone,
             f.latitude as farmer_latitude, f.longitude as farmer_longitude, f.address as farmer_address
      FROM farmer_store_items s
      LEFT JOIN farmers f ON s.farmer_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    if (crop) {
      const q = crop.toLowerCase().trim();
      const terms = new Set([q]);

      const VERNACULAR_ALIASES = {
        maize: ['makka', 'makki', 'yellow makka', 'yellow makki', 'bhutta', 'sweet corn', 'corn', 'chhalli'],
        corn: ['makka', 'makki', 'yellow makka', 'yellow makki', 'bhutta', 'sweet corn', 'maize'],
        makka: ['maize', 'corn', 'makki', 'yellow corn', 'yellow corn / maize', 'bhutta'],
        makki: ['maize', 'corn', 'makka', 'yellow corn', 'yellow corn / maize', 'bhutta'],
        wheat: ['gehun', 'gehu', 'kanak', 'sharbati', 'atta'],
        gehun: ['wheat', 'sharbati', 'kanak'],
        rice: ['chawal', 'dhan', 'basmati', 'pusa'],
        chawal: ['rice', 'dhan', 'basmati'],
        potato: ['aloo', 'alu', 'batata', 'chipsona'],
        aloo: ['potato', 'kufri chipsona'],
        mustard: ['sarson', 'rai'],
        sarson: ['mustard', 'sarson'],
        soybean: ['soya', 'soyabean'],
        soya: ['soybean']
      };

      for (const [k, aliases] of Object.entries(VERNACULAR_ALIASES)) {
        if (q.includes(k) || aliases.some(a => a.includes(q) || q.includes(a))) {
          terms.add(k);
          aliases.forEach(a => terms.add(a));
        }
      }

      const orParts = [];
      for (const term of terms) {
        orParts.push("(LOWER(s.crop_name) LIKE ? OR LOWER(COALESCE(s.local_names, '')) LIKE ?)");
        params.push(`%${term}%`, `%${term}%`);
      }
      sql += ` AND (${orParts.join(' OR ')})`;
    }
    if (maxPrice) {
      sql += ' AND s.price_per_quintal <= ?';
      params.push(Number(maxPrice));
    }
    if (storageType) {
      sql += ' AND s.storage_type = ?';
      params.push(storageType);
    }

    sql += ' ORDER BY s.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map((r) => this.format(r));
  }

  static update(id, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    if (updates.crop_name !== undefined) {
      fields.push('crop_name = ?');
      values.push(updates.crop_name);
    }
    if (updates.quantity_quintals !== undefined) {
      fields.push('quantity_quintals = ?');
      values.push(Number(updates.quantity_quintals));
    }
    if (updates.price_per_quintal !== undefined) {
      fields.push('price_per_quintal = ?');
      values.push(Number(updates.price_per_quintal));
    }
    if (updates.grade !== undefined) {
      fields.push('grade = ?');
      values.push(updates.grade);
    }
    if (updates.local_names !== undefined) {
      fields.push('local_names = ?');
      values.push(updates.local_names);
    }
    if (updates.soil_type !== undefined) {
      fields.push('soil_type = ?');
      values.push(updates.soil_type);
    }
    if (updates.storage_type !== undefined) {
      fields.push('storage_type = ?');
      values.push(updates.storage_type);
    }
    if (updates.moisture_percentage !== undefined) {
      fields.push('moisture_percentage = ?');
      values.push(Number(updates.moisture_percentage));
    }
    if (updates.harvest_date !== undefined) {
      fields.push('harvest_date = ?');
      values.push(updates.harvest_date);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);
    const sql = `UPDATE farmer_store_items SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM farmer_store_items WHERE id = ?');
    stmt.run(id);
    return true;
  }

  static count() {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM farmer_store_items').get();
    return row?.count || 0;
  }
}
