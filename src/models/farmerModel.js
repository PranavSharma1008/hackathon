import crypto from 'node:crypto';
import { getDb } from '../db/connection.js';

export class FarmerModel {
  /**
   * Format DB row into clean API entity
   */
  static format(row) {
    if (!row) return null;
    let yieldHistory = [];
    try {
      yieldHistory = typeof row.past_yield_history === 'string'
        ? JSON.parse(row.past_yield_history)
        : row.past_yield_history || [];
    } catch {
      yieldHistory = [];
    }

    let landParcels = [];
    try {
      landParcels = typeof row.land_parcels === 'string'
        ? JSON.parse(row.land_parcels)
        : (row.land_parcels || []);
    } catch {
      landParcels = [];
    }

    if (!Array.isArray(landParcels) || landParcels.length === 0) {
      landParcels = [
        {
          id: 'parcel_primary',
          name: 'Primary Agricultural Holding',
          soil_type: row.soil_type || 'Loamy',
          acreage: Number(row.total_acreage) || 45,
          address: row.address || 'Tehsil Farmlands, Ludhiana, Punjab',
          irrigation_type: 'Canal & Tubewell',
          primary_crop: 'Wheat & Corn',
          ph_index: 6.8,
          organic_carbon: 1.24,
          nitrogen_kg_ha: 290,
          phosphorus_kg_ha: 22.4,
          notes: 'Main registered agricultural holding'
        }
      ];
    }

    const distinctSoils = [...new Set(landParcels.map(p => p.soil_type).filter(Boolean))];
    const totalAcreageFromParcels = landParcels.reduce((sum, p) => sum + (Number(p.acreage) || 0), 0);

    return {
      id: row.id,
      user_id: row.user_id || null,
      email: row.email || null,
      name: row.name,
      location: {
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address || null
      },
      soil_type: row.soil_type || distinctSoils[0] || 'Loamy',
      soil_types: distinctSoils.length > 0 ? distinctSoils : [row.soil_type || 'Loamy'],
      total_acreage: totalAcreageFromParcels > 0 ? totalAcreageFromParcels : Number(row.total_acreage || 0),
      land_parcels: landParcels,
      past_yield_history: yieldHistory,
      phone: row.phone || null,
      is_service_active: row.is_service_active === undefined || row.is_service_active === null ? true : Boolean(row.is_service_active),
      created_at: row.created_at
    };
  }

  static create(data) {
    const db = getDb();
    const id = data.id || `farm_${crypto.randomBytes(4).toString('hex')}`;
    const createdAt = new Date().toISOString();

    const latitude = Number(data.location?.latitude ?? data.latitude);
    const longitude = Number(data.location?.longitude ?? data.longitude);
    const address = data.location?.address ?? data.address ?? null;

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Valid latitude and longitude coordinates are required');
    }

    let landParcels = data.land_parcels || [];
    if (!Array.isArray(landParcels) || landParcels.length === 0) {
      landParcels = [
        {
          id: `parcel_${crypto.randomBytes(3).toString('hex')}`,
          name: 'Primary Agricultural Holding',
          soil_type: data.soil_type || 'Loamy',
          acreage: Number(data.total_acreage) || 45,
          address: address || 'Tehsil Farmlands, Ludhiana, Punjab',
          irrigation_type: 'Canal & Tubewell',
          primary_crop: 'Wheat & Corn',
          ph_index: 6.8,
          organic_carbon: 1.24,
          nitrogen_kg_ha: 290,
          phosphorus_kg_ha: 22.4,
          notes: 'Main registered agricultural holding'
        }
      ];
    }

    const totalAcreage = landParcels.reduce((sum, p) => sum + (Number(p.acreage) || 0), 0) || Number(data.total_acreage || 45);
    const primarySoil = data.soil_type || landParcels[0]?.soil_type || 'Loamy';
    const landParcelsJson = JSON.stringify(landParcels);
    const pastYieldHistoryJson = JSON.stringify(data.past_yield_history || []);
    const isServiceActive = data.is_service_active === undefined ? 1 : (data.is_service_active ? 1 : 0);

    const stmt = db.prepare(`
      INSERT INTO farmers (
        id, user_id, email, name, latitude, longitude, address, soil_type, total_acreage, land_parcels, past_yield_history, phone, is_service_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.user_id || null,
      data.email ? data.email.toLowerCase().trim() : null,
      data.name,
      latitude,
      longitude,
      address,
      primarySoil,
      Number(totalAcreage),
      landParcelsJson,
      pastYieldHistoryJson,
      data.phone || null,
      isServiceActive,
      createdAt
    );

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM farmers WHERE id = ?');
    const row = stmt.get(id);
    return this.format(row);
  }

  static findByUserId(userId) {
    if (!userId) return null;
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM farmers WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get(userId);
    return this.format(row);
  }

  static findByEmail(email) {
    if (!email) return null;
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM farmers WHERE LOWER(email) = ? ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get(email.toLowerCase().trim());
    return this.format(row);
  }

  static update(id, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.soil_type !== undefined) {
      fields.push('soil_type = ?');
      values.push(updates.soil_type);
    }
    if (updates.total_acreage !== undefined) {
      fields.push('total_acreage = ?');
      values.push(Number(updates.total_acreage));
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone);
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
    if (updates.is_service_active !== undefined) {
      fields.push('is_service_active = ?');
      values.push(updates.is_service_active ? 1 : 0);
    }
    if (updates.past_yield_history !== undefined) {
      fields.push('past_yield_history = ?');
      values.push(JSON.stringify(updates.past_yield_history));
    }
    if (updates.land_parcels !== undefined) {
      const parcels = Array.isArray(updates.land_parcels) ? updates.land_parcels : [];
      fields.push('land_parcels = ?');
      values.push(JSON.stringify(parcels));

      if (updates.total_acreage === undefined && parcels.length > 0) {
        const sumAcreage = parcels.reduce((sum, p) => sum + (Number(p.acreage) || 0), 0);
        fields.push('total_acreage = ?');
        values.push(sumAcreage);
      }
      if (updates.soil_type === undefined && parcels.length > 0 && parcels[0].soil_type) {
        fields.push('soil_type = ?');
        values.push(parcels[0].soil_type);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `UPDATE farmers SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);
    return this.findById(id);
  }

  static findAll() {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM farmers ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map((r) => this.format(r));
  }

  static count() {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM farmers').get();
    return row?.count || 0;
  }
}
