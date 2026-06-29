import type { Rental, RentalRateType, RentalWithDerived } from './types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function daysAhead(days: number): string {
  return daysAgo(-days)
}

const RAW_RENTALS: Rental[] = [
  {
    id: 'rn-001',
    rentalRef: 'RN-001',
    customer: { id: 'rc-1', fullName: 'Ousman Ceesay', contactNumber: '+220 700 1122', idImageUrl: 'https://example.test/ids/ousman.jpg' },
    item: { id: 'ri-1', name: 'Scaffolding Set (10 units)', categoryName: 'Scaffolding' },
    startDate: daysAgo(20),
    expectedReturnDate: daysAgo(6),   // past due, still active → OVERDUE
    actualReturnDate: null,
    rateType: 'weekly',
    rateSnapshot: 3500,
    status: 'active',
    notes: 'Large site — customer requested extension verbally',
    createdByName: 'Awa Sanneh',
    payments: [
      { id: 'rnp-1a', rentalId: 'rn-001', amount: 7000, paymentDate: daysAgo(20), paymentMethod: 'transfer', notes: 'First two weeks' },
    ],
  },
  {
    id: 'rn-002',
    rentalRef: 'RN-002',
    customer: { id: 'rc-2', fullName: 'Mariama Bah', contactNumber: '+220 711 3344', idImageUrl: null },
    item: { id: 'ri-2', name: 'Concrete Mixer', categoryName: 'Machinery' },
    startDate: daysAgo(3),
    expectedReturnDate: daysAhead(4),  // not yet due, active → ON TIME
    actualReturnDate: null,
    rateType: 'daily',
    rateSnapshot: 1200,
    status: 'active',
    notes: null,
    createdByName: 'Lamin Touray',
    payments: [
      { id: 'rnp-2a', rentalId: 'rn-002', amount: 3600, paymentDate: daysAgo(3), paymentMethod: 'cash', notes: 'Deposit — 3 days' },
    ],
  },
  {
    id: 'rn-003',
    rentalRef: 'RN-003',
    customer: { id: 'rc-3', fullName: 'Sulayman Jobe', contactNumber: '+220 722 5566', idImageUrl: 'https://example.test/ids/sulayman.jpg' },
    item: { id: 'ri-3', name: 'Vibrating Poker', categoryName: 'Machinery' },
    startDate: daysAgo(15),
    expectedReturnDate: daysAgo(8),
    actualReturnDate: daysAgo(8),     // returned on time
    rateType: 'daily',
    rateSnapshot: 800,
    status: 'returned',
    notes: null,
    createdByName: 'Awa Sanneh',
    payments: [
      { id: 'rnp-3a', rentalId: 'rn-003', amount: 5600, paymentDate: daysAgo(8), paymentMethod: 'cash', notes: 'Paid in full on return' },
    ],
  },
  {
    id: 'rn-004',
    rentalRef: 'RN-004',
    customer: { id: 'rc-4', fullName: 'Isatou Njie', contactNumber: '+220 733 7788', idImageUrl: null },
    item: { id: 'ri-4', name: 'Wheelbarrow (×5)', categoryName: 'Tools' },
    startDate: daysAgo(30),
    expectedReturnDate: daysAgo(23),
    actualReturnDate: daysAgo(21),    // returned 2 days late
    rateType: 'weekly',
    rateSnapshot: 1500,
    status: 'returned',
    notes: 'Returned slightly late — no extra charge applied',
    createdByName: 'Lamin Touray',
    payments: [
      { id: 'rnp-4a', rentalId: 'rn-004', amount: 1500, paymentDate: daysAgo(30), paymentMethod: 'cash', notes: null },
    ],
  },
  {
    id: 'rn-005',
    rentalRef: 'RN-005',
    customer: { id: 'rc-2', fullName: 'Mariama Bah', contactNumber: '+220 711 3344', idImageUrl: null },
    item: { id: 'ri-5', name: 'Plate Compactor', categoryName: 'Machinery' },
    startDate: daysAgo(1),
    expectedReturnDate: daysAhead(6),  // active, recently started, unpaid
    actualReturnDate: null,
    rateType: 'daily',
    rateSnapshot: 1500,
    status: 'active',
    notes: 'Payment on return agreed',
    createdByName: 'Awa Sanneh',
    payments: [],
  },
]

function diffDays(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function estimateCharge(days: number, rateType: RentalRateType, rate: number): number {
  if (rateType === 'weekly') return Math.ceil(days / 7) * rate
  return days * rate
}

function buildDerived(r: Rental): RentalWithDerived {
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = r.status === 'active' && r.expectedReturnDate < today
  const endRef    = r.actualReturnDate ?? today
  const daysOut   = diffDays(r.startDate, endRef)
  const estimatedCharge = estimateCharge(daysOut, r.rateType, r.rateSnapshot)
  const totalPaid = r.payments.reduce((s, p) => s + p.amount, 0)

  return {
    ...r,
    isOverdue,
    daysOut,
    estimatedCharge,
    totalPaid,
    balanceDue: estimatedCharge - totalPaid,
  }
}

export const MOCK_RENTALS: RentalWithDerived[] = RAW_RENTALS.map(buildDerived)
