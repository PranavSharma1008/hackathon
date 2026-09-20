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
      agreed_price: row.agreed_price || null,
      processor_name: row.processor_name || null,
      farmer_name: row.farmer_name || null,
      farmer_location: row.farmer_latitude ? {
        latitude: row.farmer_latitude,
        longitude: row.farmer_longitude,
        address: row.farmer_address
      } : null,
      processor_location: row.processor_latitude ? {
        latitude: row.processor_latitude,
        longitude: row.processor_longitude,
        address: row.processor_address
      } : null,
      status: row.status,
      delivery_date: row.delivery_date,
      current_latitude: row.current_latitude ?? row.farmer_latitude ?? 30.7046,
      current_longitude: row.current_longitude ?? row.farmer_longitude ?? 75.8573,
      current_checkpoint: row.current_checkpoint || 'Farm Gate Loading Bay',
      driver_name: row.driver_name || 'Jagtar Singh',
      driver_phone: row.driver_phone || '+91-98140-11223',
      vehicle_number: row.vehicle_number || 'PB-10-AZ-9981',
      speed_kmh: row.speed_kmh ?? 48.0,
      eta_minutes: row.eta_minutes ?? 45,
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
      notes: data.notes || 'Awaiting logistics dispatch',
      latitude: data.current_latitude,
      longitude: data.current_longitude
    };

    const trackingNotesJson = JSON.stringify(
      Array.isArray(data.tracking_notes) ? data.tracking_notes : [initialNote]
    );

    const stmt = db.prepare(`
      INSERT INTO deliveries (
        id, contract_id, status, delivery_date, current_latitude, current_longitude,
        current_checkpoint, driver_name, driver_phone, vehicle_number, speed_kmh, eta_minutes,
        tracking_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.contract_id,
      status,
      data.delivery_date || now.split('T')[0],
      data.current_latitude ?? 30.7046,
      data.current_longitude ?? 75.8573,
      data.current_checkpoint || 'Farm Gate Loading Bay',
      data.driver_name || 'Jagtar Singh',
      data.driver_phone || '+91-98140-11223',
      data.vehicle_number || 'PB-10-AZ-9981',
      data.speed_kmh ?? 48.0,
      data.eta_minutes ?? 45,
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
        p.latitude as processor_latitude,
        p.longitude as processor_longitude,
        p.address as processor_address,
        f.name as farmer_name,
        f.latitude as farmer_latitude,
        f.longitude as farmer_longitude,
        f.address as farmer_address
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
        c.agreed_price,
        p.company_name as processor_name,
        p.latitude as processor_latitude,
        p.longitude as processor_longitude,
        p.address as processor_address,
        f.name as farmer_name,
        f.latitude as farmer_latitude,
        f.longitude as farmer_longitude,
        f.address as farmer_address
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
        c.agreed_price,
        p.company_name as processor_name,
        p.latitude as processor_latitude,
        p.longitude as processor_longitude,
        p.address as processor_address,
        f.name as farmer_name,
        f.latitude as farmer_latitude,
        f.longitude as farmer_longitude,
        f.address as farmer_address
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

  static updateLocation(deliveryId, { latitude, longitude, checkpoint, speedKmh, etaMinutes, notes }) {
    const db = getDb();
    const existing = this.findById(deliveryId);
    if (!existing) throw new Error(`Delivery with ID '${deliveryId}' not found`);

    const now = new Date().toISOString();
    const lat = latitude !== undefined ? Number(latitude) : existing.current_latitude;
    const lng = longitude !== undefined ? Number(longitude) : existing.current_longitude;
    const chk = checkpoint || existing.current_checkpoint;
    const speed = speedKmh !== undefined ? Number(speedKmh) : existing.speed_kmh;
    const eta = etaMinutes !== undefined ? Number(etaMinutes) : existing.eta_minutes;

    const newMilestone = {
      timestamp: now,
      status: existing.status,
      checkpoint: chk,
      latitude: lat,
      longitude: lng,
      speed_kmh: speed,
      notes: notes || `Live GPS ping recorded at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };

    const updatedNotes = [...existing.tracking_notes, newMilestone];

    const stmt = db.prepare(`
      UPDATE deliveries
      SET current_latitude = ?, current_longitude = ?, current_checkpoint = ?,
          speed_kmh = ?, eta_minutes = ?, tracking_notes = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(lat, lng, chk, speed, eta, JSON.stringify(updatedNotes), now, deliveryId);
    return this.findById(deliveryId);
  }

  static advanceLocationStep(deliveryId) {
    const existing = this.findById(deliveryId);
    if (!existing) throw new Error(`Delivery '${deliveryId}' not found`);

    const fLat = existing.farmer_location?.latitude || 30.7046;
    const fLng = existing.farmer_location?.longitude || 75.8573;
    const pLat = existing.processor_location?.latitude || 30.9010;
    const pLng = existing.processor_location?.longitude || 75.8573;

    const count = existing.tracking_notes.length;
    let nextPct = 0.33;
    let nextChk = 'En Route: NH-44 Toll Plaza Checkpoint Passed (Khanna Bypass)';
    let nextSpeed = 54.0;
    let nextEta = 32;
    let nextStatus = 'In Transit';

    if (count <= 1) {
      nextPct = 0.33;
      nextChk = 'En Route: NH-44 Toll Plaza Checkpoint Passed (Khanna Bypass)';
      nextSpeed = 54.0;
      nextEta = 32;
    } else if (count === 2) {
      nextPct = 0.68;
      nextChk = 'In Transit: Grand Trunk Agro Freight Corridor (Highway NH-44)';
      nextSpeed = 48.0;
      nextEta = 15;
    } else {
      nextPct = 1.0;
      nextChk = 'Arrived at Processing Silo Gate - Certified Weighbridge Slip Issued';
      nextSpeed = 0.0;
      nextEta = 0;
      nextStatus = 'Delivered';
    }

    const nextLat = fLat + nextPct * (pLat - fLat);
    const nextLng = fLng + nextPct * (pLng - fLng);

    const updated = this.updateLocation(deliveryId, {
      latitude: nextLat,
      longitude: nextLng,
      checkpoint: nextChk,
      speedKmh: nextSpeed,
      etaMinutes: nextEta,
      notes: `Vehicle #PB-10-AZ-9981 driver Jagtar Singh reported checkpoint: ${nextChk}`
    });

    if (nextStatus === 'Delivered') {
      return this.updateMilestone(deliveryId, {
        status: 'Delivered',
        checkpoint: nextChk,
        notes: 'Final delivery confirmed by Intake Lab & Certified Weighbridge. Contract auto-fulfilled.'
      });
    }

    return updated;
  }

  static count() {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM deliveries').get();
    return row?.count || 0;
  }
}
