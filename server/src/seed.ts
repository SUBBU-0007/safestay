import { db, initSchema } from './db.js';
import { DangerZone, SafePlace, Tourist, RumorNotice } from '../../shared/types.js';

export function runSeed() {
  initSchema();

  console.log('[Seed] Clearing existing demo tables...');
  try { db.prepare('DELETE FROM incidents').run(); } catch(e) {}
  db.prepare('DELETE FROM alert_deliveries').run();
  db.prepare('DELETE FROM alerts').run();
  db.prepare('DELETE FROM danger_zones').run();
  db.prepare('DELETE FROM safe_places').run();
  db.prepare('DELETE FROM tourists').run();
  db.prepare('DELETE FROM sos_requests').run();
  db.prepare('DELETE FROM checkins').run();
  db.prepare('DELETE FROM rumor_notices').run();
  db.prepare('DELETE FROM sms_log').run();

  console.log('[Seed] Inserting Safe Places (Shelters, Hospitals, Rescue Staging)...');

  const safePlaces: SafePlace[] = [
    // Munnar Safe Places
    {
      id: 'sp_munnar_school',
      name: 'Government Higher Secondary School Relief Camp',
      type: 'shelter',
      lat: 10.0915,
      lng: 77.0645,
      capacity: 650,
      currentOccupancy: 120,
      phone: '+91 4865 230303',
      address: 'High School Junction, Munnar Top Road, Idukki, Kerala 685612',
      contactPerson: 'Mr. Pradeep Kumar (Tahsildar Devikulam)',
      amenities: ['Clean Drinking Water', 'Dry Food Rations', 'Backup Generator', 'First Aid Station', 'Satellite Phone']
    },
    {
      id: 'sp_munnar_hospital',
      name: 'Tata Tea General Hospital Munnar',
      type: 'hospital',
      lat: 10.0862,
      lng: 77.0638,
      capacity: 250,
      currentOccupancy: 45,
      phone: '+91 4865 230222',
      address: 'Nullatanni, Munnar, Kerala 685612',
      contactPerson: 'Dr. Susan Mathew (Chief Medical Officer)',
      amenities: ['24/7 Trauma ICU', 'Oxygen Plant', 'Ambulance Fleet', 'Emergency Surgery', 'Pediatric Care']
    },
    {
      id: 'sp_munnar_high_ground',
      name: 'KDHP Tea Sanctuary High Ground Pavilion',
      type: 'high_ground',
      lat: 10.0980,
      lng: 77.0680,
      capacity: 400,
      currentOccupancy: 60,
      phone: '+91 4865 230404',
      address: 'Pothamedu Ridge, Munnar Heights, Kerala 685612',
      contactPerson: 'Capt. R. Varma (Disaster Response Volunteer)',
      amenities: ['Elevated Hill Plateau', 'Helipad Access', 'Tents & Blankets', 'Solar Charging Stations']
    },
    {
      id: 'sp_munnar_rescue',
      name: 'Kerala SDRF & Fire Rescue Headquarters',
      type: 'rescue_center',
      lat: 10.0760,
      lng: 77.0515,
      capacity: 200,
      currentOccupancy: 30,
      phone: '+91 4865 230505',
      address: 'Old Munnar Bypass Rd, Munnar, Kerala 685612',
      contactPerson: 'Station Officer S. Nair',
      amenities: ['Inflatable Rescue Boats', 'Drones with Thermal Cameras', 'Satellite Uplink', 'Rope Rescue Gear']
    },

    // Kodaikanal Safe Places
    {
      id: 'sp_kodai_hall',
      name: 'Kodaikanal Sub-Collectorate Community Relief Hall',
      type: 'shelter',
      lat: 10.2415,
      lng: 77.4985,
      capacity: 500,
      currentOccupancy: 85,
      phone: '+91 4542 240217',
      address: 'Bazaar Road, Upper Kodaikanal, Tamil Nadu 624101',
      contactPerson: 'Thiru M. Arumugam (Revenue Divisional Officer)',
      amenities: ['Community Kitchen', 'Bedding & Heaters', 'Medical Officer on Duty', 'Free Wi-Fi Mesh']
    },
    {
      id: 'sp_kodai_hospital',
      name: 'Van Allen Community Hospital Kodaikanal',
      type: 'hospital',
      lat: 10.2325,
      lng: 77.4915,
      capacity: 180,
      currentOccupancy: 28,
      phone: '+91 4542 241273',
      address: 'Near Coaker\'s Walk, Kodaikanal, Tamil Nadu 624101',
      contactPerson: 'Dr. Joseph John',
      amenities: ['Emergency Ward', 'Hypothermia Care', 'Blood Bank', 'Pharmacy']
    },

    // Chennai Coast Safe Places
    {
      id: 'sp_chennai_santhome',
      name: 'Santhome Coastal Community Relief Shelter',
      type: 'shelter',
      lat: 13.0345,
      lng: 80.2795,
      capacity: 1200,
      currentOccupancy: 210,
      phone: '+91 44 24640001',
      address: 'Santhome High Road, Mylapore, Chennai, Tamil Nadu 600004',
      contactPerson: 'Mrs. Jayalakshmi IAS (Zonal Officer)',
      amenities: ['High Capacity Generator', 'Canteen', 'Potable Water Tankers', 'Separate Family Dorms']
    },
    {
      id: 'sp_chennai_rggh',
      name: 'Rajiv Gandhi Government General Hospital (RGGH)',
      type: 'hospital',
      lat: 13.0818,
      lng: 80.2778,
      capacity: 1500,
      currentOccupancy: 890,
      phone: '+91 44 25305000',
      address: 'EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003',
      contactPerson: 'Dean, Madras Medical College',
      amenities: ['Tertiary Trauma Center', 'NDRF Staging Point', 'Mass Casualty Decontamination']
    },

    // Rameswaram Safe Place
    {
      id: 'sp_rameswaram_mandapam',
      name: 'Mandapam Multipurpose Cyclone Shelter',
      type: 'shelter',
      lat: 9.2785,
      lng: 79.1360,
      capacity: 800,
      currentOccupancy: 95,
      phone: '+91 4573 241222',
      address: 'Pamban Coast Road, Mandapam, Ramanathapuram, Tamil Nadu 623518',
      contactPerson: 'Mr. K. Selvam (Disaster Management Cell)',
      amenities: ['Cyclone-Resistant Reinforced Structure', 'Desalination Unit', 'Coast Guard Liaison']
    }
  ];

  const insertSafePlace = db.prepare(`
    INSERT INTO safe_places (id, name, type, lat, lng, capacity, current_occupancy, phone, address, contact_person, amenities_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const sp of safePlaces) {
    insertSafePlace.run(
      sp.id,
      sp.name,
      sp.type,
      sp.lat,
      sp.lng,
      sp.capacity,
      sp.currentOccupancy,
      sp.phone,
      sp.address,
      sp.contactPerson,
      JSON.stringify(sp.amenities)
    );
  }

  console.log('[Seed] Inserting Danger Zones (Munnar Flash Flood, Kodaikanal Landslide, Chennai Storm Surge)...');

  const dangerZones: DangerZone[] = [
    {
      id: 'dz_munnar_flood',
      name: 'Munnar Valley Flash Flood & Mudflow Red Zone',
      hazardType: 'flood',
      severity: 'red',
      // Polygon enclosing Muthirapuzha river basin, Old Munnar market, tea factory lowlands
      coordinates: [
        [10.0820, 77.0520],
        [10.0910, 77.0540],
        [10.0925, 77.0610],
        [10.0860, 77.0620],
        [10.0805, 77.0585]
      ],
      center: [10.0864, 77.0575],
      radiusKm: 0.85,
      message: 'Muthirapuzha river breached banks following 180mm cloudburst. 3 to 4 feet raging water in low market streets. Bridges impassable. Immediate uphill evacuation mandatory.',
      source: 'Kerala State Disaster Management Authority (KSDMA) / IMD Thiruvananthapuram',
      createdAt: Date.now() - 3600000,
      expiresAt: Date.now() + 86400000,
      isActive: true
    },
    {
      id: 'dz_kodai_landslide',
      name: 'Kodaikanal Silver Cascade Ghat Landslide Amber Zone',
      hazardType: 'landslide',
      severity: 'amber',
      coordinates: [
        [10.2280, 77.4980],
        [10.2360, 77.5080],
        [10.2440, 77.5020],
        [10.2350, 77.4890]
      ],
      center: [10.2357, 77.4992],
      radiusKm: 1.1,
      message: 'Active mudslide and falling rock debris along Ghat Road near Silver Cascade. Road blocked for non-emergency transit. Heavy fog with near zero visibility.',
      source: 'Tamil Nadu Disaster Risk Reduction Agency / Dindigul Collectorate',
      createdAt: Date.now() - 7200000,
      expiresAt: Date.now() + 86400000,
      isActive: true
    },
    {
      id: 'dz_chennai_cyclone',
      name: 'Marina Beach & Adyar Estuary Storm Surge Warning',
      hazardType: 'cyclone',
      severity: 'amber',
      coordinates: [
        [13.0450, 80.2750],
        [13.0650, 80.2850],
        [13.0600, 80.2950],
        [13.0400, 80.2850]
      ],
      center: [13.0525, 77.2850],
      radiusKm: 1.5,
      message: 'Cyclonic storm bringing sea swell of 2.8 meters and gale gusts up to 75 km/h. Coastal promenade submerged. All beachfront recreation prohibited.',
      source: 'Regional Meteorological Centre Chennai (IMD)',
      createdAt: Date.now() - 10800000,
      expiresAt: Date.now() + 86400000,
      isActive: true
    }
  ];

  const insertZone = db.prepare(`
    INSERT INTO danger_zones (id, name, hazard_type, severity, coordinates_json, center_lat, center_lng, radius_km, message, source, created_at, expires_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const dz of dangerZones) {
    insertZone.run(
      dz.id,
      dz.name,
      dz.hazardType,
      dz.severity,
      JSON.stringify(dz.coordinates),
      dz.center ? dz.center[0] : null,
      dz.center ? dz.center[1] : null,
      dz.radiusKm || null,
      dz.message,
      dz.source,
      dz.createdAt,
      dz.expiresAt,
      dz.isActive ? 1 : 0
    );
  }

  console.log('[Seed] Inserting Realistic Multi-National Tourists in Munnar & region...');

  const tourists: Tourist[] = [
    {
      id: 't_jean_fr',
      name: 'Jean-Luc Moreau',
      phone: '+33612345678',
      country: 'France',
      language: 'fr',
      hotel: 'Tea County Resort, Old Munnar',
      lat: 10.0865,
      lng: 77.0570, // inside Munnar Red Flood Zone
      status: 'in_danger',
      lastUpdated: Date.now() - 1200000
    },
    {
      id: 't_hans_de',
      name: 'Hans & Greta Gruber',
      phone: '+491701234567',
      country: 'Germany',
      language: 'de',
      hotel: 'River View Homestay, Munnar',
      lat: 10.0875,
      lng: 77.0580, // inside Munnar Red Flood Zone
      status: 'in_danger',
      lastUpdated: Date.now() - 900000
    },
    {
      id: 't_fatima_ar',
      name: 'Fatima Al-Mansoor',
      phone: '+971501234567',
      country: 'United Arab Emirates',
      language: 'ar',
      hotel: 'Silver Cloud Estate, Old Munnar',
      lat: 10.0855,
      lng: 77.0560, // inside Munnar Red Flood Zone
      status: 'in_danger',
      lastUpdated: Date.now() - 600000
    },
    {
      id: 't_kenji_ja',
      name: 'Kenji Sato',
      phone: '+819012345678',
      country: 'Japan',
      language: 'ja',
      hotel: 'Munnar Heritage Inn',
      lat: 10.0888,
      lng: 77.0592, // inside Munnar Red Flood Zone
      status: 'in_danger',
      lastUpdated: Date.now() - 300000
    },
    {
      id: 't_rajesh_hi',
      name: 'Rajesh & Sunita Sharma',
      phone: '+919876543210',
      country: 'India',
      language: 'hi',
      hotel: 'Hill Mist Holiday Cottages',
      lat: 10.0845,
      lng: 77.0575, // inside Munnar Red Flood Zone
      status: 'in_danger',
      lastUpdated: Date.now() - 1500000
    },
    {
      id: 't_priya_en',
      name: 'Priya & David Jenkins',
      phone: '+447911123456',
      country: 'United Kingdom',
      language: 'en',
      hotel: 'Highland Glade Resort Munnar',
      lat: 10.0965,
      lng: 77.0670, // safe outside zone on ridge
      status: 'safe',
      lastUpdated: Date.now() - 1800000
    },
    {
      id: 't_elena_ru',
      name: 'Elena Petrova',
      phone: '+79031234567',
      country: 'Russia',
      language: 'ru',
      hotel: 'The Carlton, Kodaikanal',
      lat: 10.2370,
      lng: 77.4900,
      status: 'safe',
      lastUpdated: Date.now() - 2500000
    },
    {
      id: 't_karthik_ta',
      name: 'Karthik Subramanian',
      phone: '+919444012345',
      country: 'India',
      language: 'ta',
      hotel: 'Marina Gateway Suites, Chennai',
      lat: 13.0500,
      lng: 80.2720,
      status: 'safe',
      lastUpdated: Date.now() - 3000000
    }
  ];

  const insertTourist = db.prepare(`
    INSERT INTO tourists (id, name, phone, country, language, hotel, lat, lng, status, last_updated, notification_consent, last_location_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  for (const t of tourists) {
    insertTourist.run(t.id, t.name, t.phone, t.country, t.language, t.hotel, t.lat, t.lng, t.status, t.lastUpdated, t.lastUpdated);
  }

  console.log('[Seed] Inserting Verified Rumor Control Board notices...');

  const rumors: RumorNotice[] = [
    {
      id: 'rumor_kundala_dam',
      title: 'Rumor: Kundala Dam gates were opened without prior siren',
      content: 'DEBUNKED BY OFFICIALS: Kerala State Electricity Board (KSEB) confirms Kundala Dam is operating normally at 71.4% capacity. No shutter operations have been undertaken. Rising water levels in Old Munnar are entirely caused by intense local cloudburst stream flows.',
      status: 'debunked',
      source: 'Idukki District Collectorate Information Cell',
      timestamp: Date.now() - 1800000
    },
    {
      id: 'rumor_heli_evac',
      title: 'IAF Helicopter Evacuation Flights from Munnar High Ground',
      content: 'VERIFIED OFFICIAL NOTICE: Two Indian Air Force rescue helicopters have been assigned for medical triage airlift from the KDHP Tea Sanctuary Pavilion starting at 09:30 hrs. Priority allocated to injured persons, expecting mothers, and tourists requiring dialysis/cardiac medication.',
      status: 'verified',
      source: 'National Disaster Response Force (NDRF) Southern Command',
      timestamp: Date.now() - 3600000
    },
    {
      id: 'rumor_kodai_road',
      title: 'Rumor: Kodaikanal Batlagundu Ghat Road completely washed away',
      content: 'DEBUNKED BY HIGHWAYS DEPT: The main ghat road is intact. Boulders fell near the 14th hairpin bend; Tamil Nadu Highways quick-response earthmovers have created a single-lane emergency passage. Light emergency ambulances are moving normally.',
      status: 'debunked',
      source: 'Tamil Nadu Highways & Police Control Room Dindigul',
      timestamp: Date.now() - 7200000
    }
  ];

  const insertRumor = db.prepare(`
    INSERT INTO rumor_notices (id, title, content, status, source, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const r of rumors) {
    insertRumor.run(r.id, r.title, r.content, r.status, r.source, r.timestamp);
  }

  console.log('[Seed] Inserting active sample SOS requests...');

  const insertSos = db.prepare(`
    INSERT INTO sos_requests (id, tourist_name, phone, lat, lng, language, people_count, triage, note, level, status, timestamp, hop_count, mesh_path_json, assigned_rescue_center, eta_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSos.run(
    'sos_seed_1',
    'Jean-Luc Moreau',
    '+33612345678',
    10.0865,
    77.0570,
    'fr',
    2,
    'injured',
    'Sprained ankle while attempting to exit ground floor. Water at waist height outside door. Need boat extraction.',
    1,
    'dispatched',
    Date.now() - 900000,
    0,
    JSON.stringify(['Direct Internet (4G)']),
    'Kerala SDRF & Fire Rescue Headquarters',
    12
  );

  insertSos.run(
    'sos_seed_2',
    'Hans Gruber',
    '+491701234567',
    10.0875,
    77.0580,
    'de',
    2,
    'stuck_safe',
    'Safe on second-floor terrace of homestay. Power cut. Have drinking water for 12 hours.',
    3,
    'relayed',
    Date.now() - 400000,
    2,
    JSON.stringify(['Tourist Phone (de)', 'Trail Guide Relay (in)', 'Pothamedu Ridge Gateway']),
    'Kerala SDRF & Fire Rescue Headquarters',
    25
  );

  console.log('[Seed] Database successfully populated with realistic Tamil Nadu & Kerala disaster scenarios!');
}

// Run immediately if executed directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
  process.exit(0);
}
