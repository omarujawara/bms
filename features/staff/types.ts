export type StaffRole = 'owner' | 'sales_rep'

// NOTE: pin_hash is deliberately absent. It is a server-only secret and is
// never sent to the client. The UI only ever sees PIN *status*, derived from
// whether a PIN is set and whether pin_expires_at has passed.
export type StaffMember = {
  id: string
  fullName: string
  email: string
  role: StaffRole
  isActive: boolean
  pinSet: boolean
  pinExpiresAt: string | null
  createdAt: string
}

export type PinStatus = 'active' | 'expired' | 'none'

export type StaffMemberWithStatus = StaffMember & {
  pinStatus: PinStatus
}
