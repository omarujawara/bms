import type { PinStatus, StaffMember, StaffMemberWithStatus } from './types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function daysAhead(days: number): string {
  return daysAgo(-days)
}

const RAW_STAFF: StaffMember[] = [
  {
    id: 'st-0',
    fullName: 'Omaru Jawara',
    email: 'owner@bms.gm',
    role: 'owner',
    isActive: true,
    pinSet: true,
    pinExpiresAt: daysAhead(20),   // active PIN
    createdAt: daysAgo(400),
  },
  {
    id: 'st-1',
    fullName: 'Awa Sanneh',
    email: 'awa@bms.gm',
    role: 'sales_rep',
    isActive: true,
    pinSet: true,
    pinExpiresAt: daysAhead(5),    // active PIN
    createdAt: daysAgo(220),
  },
  {
    id: 'st-2',
    fullName: 'Lamin Touray',
    email: 'lamin@bms.gm',
    role: 'sales_rep',
    isActive: true,
    pinSet: true,
    pinExpiresAt: daysAgo(3),      // expired PIN — needs full login
    createdAt: daysAgo(150),
  },
  {
    id: 'st-3',
    fullName: 'Fatou Ceesay',
    email: 'fatou@bms.gm',
    role: 'sales_rep',
    isActive: true,
    pinSet: false,
    pinExpiresAt: null,            // never set a PIN
    createdAt: daysAgo(30),
  },
  {
    id: 'st-4',
    fullName: 'Modou Bah',
    email: 'modou@bms.gm',
    role: 'sales_rep',
    isActive: false,              // deactivated (left the company)
    pinSet: true,
    pinExpiresAt: daysAgo(60),
    createdAt: daysAgo(300),
  },
]

function derivePinStatus(s: StaffMember): PinStatus {
  if (!s.pinSet || !s.pinExpiresAt) return 'none'
  return new Date(s.pinExpiresAt).getTime() > Date.now() ? 'active' : 'expired'
}

export const MOCK_STAFF: StaffMemberWithStatus[] = RAW_STAFF.map(s => ({
  ...s,
  pinStatus: derivePinStatus(s),
}))
