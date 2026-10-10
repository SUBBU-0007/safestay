import { EmergencyContact } from '../../../shared/types.js';

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'c_112',
    name: 'National Emergency Helpline',
    number: '112',
    category: 'national',
    description: 'Unified 24/7 Police, Fire, Ambulance & SDRF dispatch across India'
  },
  {
    id: 'c_108',
    name: 'Free Emergency Ambulance & Paramedic Service',
    number: '108',
    category: 'national',
    description: 'Rapid response trauma ambulances and medical first responders'
  },
  {
    id: 'c_1070',
    name: 'State Disaster Management Control Room',
    number: '1070',
    category: 'disaster',
    description: 'State Emergency Operation Centre (Tamil Nadu & Kerala SEOC)'
  },
  {
    id: 'c_1077',
    name: 'District Disaster Emergency Cell (Idukki / Dindigul)',
    number: '1077',
    category: 'state',
    description: 'District Collectorate round-the-clock disaster management cell'
  },
  {
    id: 'c_ndrf',
    name: 'NDRF Southern Command HQ (Arakkonam / Thrissur)',
    number: '+91 4177 246594',
    category: 'disaster',
    description: 'National Disaster Response Force tactical flood & landslide rescue battalion'
  },
  {
    id: 'c_emb_us',
    name: 'U.S. Consulate General Chennai (Emergency Assistance)',
    number: '+91 44 28574000',
    category: 'embassy',
    country: 'United States',
    description: '24/7 Citizen emergency line for American tourists'
  },
  {
    id: 'c_emb_uk',
    name: 'British Deputy High Commission Chennai',
    number: '+91 44 42192151',
    category: 'embassy',
    country: 'United Kingdom',
    description: 'Emergency consular assistance for UK nationals'
  },
  {
    id: 'c_emb_fr',
    name: 'Consulat Général de France (Puducherry & Chennai)',
    number: '+91 413 2231000',
    category: 'embassy',
    country: 'France',
    description: 'Ligne d\'urgence consulaire 24/7 pour ressortissants français'
  },
  {
    id: 'c_emb_de',
    name: 'German Consulate General Chennai',
    number: '+91 44 24301600',
    category: 'embassy',
    country: 'Germany',
    description: 'Konsularischer Notfalldienst für deutsche Staatsangehörige'
  },
  {
    id: 'c_emb_ja',
    name: 'Consulate-General of Japan in Chennai',
    number: '+91 44 24983101',
    category: 'embassy',
    country: 'Japan',
    description: '邦人保護・緊急時ホットライン (24時間対応)'
  },
  {
    id: 'c_emb_uae',
    name: 'UAE Consulate General (Kerala / South India)',
    number: '+91 471 3352222',
    category: 'embassy',
    country: 'United Arab Emirates',
    description: 'خط الطوارئ القنصلي لرعايا دولة الإمارات'
  },
  {
    id: 'c_emb_ru',
    name: 'Consulate General of the Russian Federation in Chennai',
    number: '+91 44 24982330',
    category: 'embassy',
    country: 'Russia',
    description: 'Экстренная телефонная линия для граждан РФ'
  }
];
