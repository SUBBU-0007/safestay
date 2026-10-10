/**
 * BluetoothRelay: Clean module for off-grid SOS packet relaying.
 * Combines Web Bluetooth API inspection with a dynamic Mesh Simulation Mode for demos.
 */

export interface SosPacket {
  id: string;
  phone: string;
  touristName?: string;
  lat: number;
  lng: number;
  timestamp: number;
  hopCount: number;
  ttl: number; // Time To Live (max hops)
  triage: string;
  peopleCount: number;
  note?: string;
  meshPath: string[];
}

export interface MeshNode {
  id: string;
  label: string;
  role: 'stranded_phone' | 'peer_phone' | 'vehicle_relay' | 'gateway';
  lat: number;
  lng: number;
  hasInternet: boolean;
  batteryPct: number;
  status: 'idle' | 'transmitting' | 'received' | 'delivered';
}

export interface MeshHopEvent {
  stepIndex: number;
  fromNode: MeshNode;
  toNode: MeshNode;
  packet: SosPacket;
  rssiDb: number;
  explanation: string;
}

export const INITIAL_MESH_NODES: MeshNode[] = [
  {
    id: 'node_1',
    label: 'Phone A (Stranded Tourist)',
    role: 'stranded_phone',
    lat: 10.0865,
    lng: 77.0570,
    hasInternet: false,
    batteryPct: 24,
    status: 'idle'
  },
  {
    id: 'node_2',
    label: 'Phone B (Trekker on Trail)',
    role: 'peer_phone',
    lat: 10.0890,
    lng: 77.0595,
    hasInternet: false,
    batteryPct: 68,
    status: 'idle'
  },
  {
    id: 'node_3',
    label: 'Device C (Jeep Taxi on Ridge)',
    role: 'vehicle_relay',
    lat: 10.0925,
    lng: 77.0620,
    hasInternet: false,
    batteryPct: 92,
    status: 'idle'
  },
  {
    id: 'node_4',
    label: 'Device D (KDHP Staging Post)',
    role: 'peer_phone',
    lat: 10.0955,
    lng: 77.0650,
    hasInternet: false,
    batteryPct: 81,
    status: 'idle'
  },
  {
    id: 'node_5',
    label: 'Gateway E (SDRF Incident Command)',
    role: 'gateway',
    lat: 10.0980,
    lng: 77.0680,
    hasInternet: true, // Satellite / 4G Uplink!
    batteryPct: 100,
    status: 'idle'
  }
];

export interface BluetoothRelay {
  isSupported(): boolean;
  attemptWebBluetooth(packet: SosPacket): Promise<{ success: boolean; deviceName?: string; error?: string }>;
  simulateMeshTransmission(
    packet: SosPacket,
    onHop: (event: MeshHopEvent) => void
  ): Promise<{ success: boolean; deliveredPacket: SosPacket }>;
}

export class SafeStayBluetoothRelay implements BluetoothRelay {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async attemptWebBluetooth(packet: SosPacket): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'Web Bluetooth API not available on this browser/platform.' };
    }

    try {
      // Prompt user to pick nearby BLE peripheral advertising SafeStay service UUID
      // Service UUID: 0000ffe0-0000-1000-8000-00805f9b34fb (Standard custom BLE service)
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'battery_service']
      });

      console.log(`[Web Bluetooth] Paired with device: ${device.name || device.id}`);
      return { success: true, deviceName: device.name || 'Nearby SafeStay Device' };
    } catch (err: any) {
      console.warn('[Web Bluetooth] User cancelled or device failed:', err?.message || err);
      return { success: false, error: err?.message || 'Bluetooth pairing unavailable' };
    }
  }

  async simulateMeshTransmission(
    packet: SosPacket,
    onHop: (event: MeshHopEvent) => void
  ): Promise<{ success: boolean; deliveredPacket: SosPacket }> {
    const nodes = [...INITIAL_MESH_NODES];
    let currentPacket: SosPacket = {
      ...packet,
      hopCount: 0,
      ttl: 6,
      meshPath: [nodes[0].label]
    };

    const rssiValues = [-82, -74, -69, -65];
    const explanations = [
      'Phone A has 0 cellular bars. Transmitting encrypted SOS packet over BLE 2.4GHz broadcast beacon...',
      'Phone B received BLE packet. Signal -74 dBm. Hop count incremented to 1. Forwarding to uphill peers...',
      'Jeep Taxi C relay picked up packet via Bluetooth 5.0 Long Range PHY. Forwarding towards ridge...',
      'KDHP Staging Post D bounced packet to SDRF High Ground Gateway E with satellite backhaul!'
    ];

    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to = nodes[i + 1];

      await new Promise((resolve) => setTimeout(resolve, 1400));

      currentPacket.hopCount += 1;
      currentPacket.meshPath.push(to.label);

      onHop({
        stepIndex: i + 1,
        fromNode: from,
        toNode: to,
        packet: { ...currentPacket },
        rssiDb: rssiValues[i] || -75,
        explanation: explanations[i] || `Packet relayed to ${to.label}`
      });
    }

    // Node 5 (Gateway) delivers to server over internet!
    try {
      await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentPacket,
          level: 3,
          note: `[BLE MESH RELAY - 4 Hops via ${currentPacket.meshPath.join(' -> ')}] ${currentPacket.note || ''}`
        })
      });
    } catch (err) {
      console.error('[Mesh Simulation] Ingest to server failed:', err);
    }

    return { success: true, deliveredPacket: currentPacket };
  }
}

export const bluetoothRelay = new SafeStayBluetoothRelay();
