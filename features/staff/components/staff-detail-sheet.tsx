'use client'

import { Mail, Shield, KeyRound, RotateCcw, Power } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { PinStatus, StaffMemberWithStatus } from '../types'

export const PIN_STATUS_CONFIG: Record<PinStatus, {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
}> = {
  active:  { label: 'PIN active',  variant: 'default' },
  expired: { label: 'PIN expired', variant: 'destructive' },
  none:    { label: 'No PIN',      variant: 'outline' },
}

interface StaffDetailSheetProps {
  member: StaffMemberWithStatus | null
  open: boolean
  onClose: () => void
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-foreground mb-2">{children}</h3>
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-28">{label}</span>
      <span className="text-xs text-foreground text-right">{value}</span>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function StaffDetailSheet({ member, open, onClose }: StaffDetailSheetProps) {
  if (!member) return null

  const pin = PIN_STATUS_CONFIG[member.pinStatus]

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-md w-full flex flex-col overflow-y-auto">

        {/* Header */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <span className="text-sm font-semibold text-primary">
                {member.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle>{member.fullName}</SheetTitle>
              <SheetDescription className="flex items-center gap-1">
                <Mail className="size-3" />
                {member.email}
              </SheetDescription>
            </div>
            <Badge variant={member.isActive ? 'default' : 'outline'}>
              {member.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 flex-1">

          {/* Account */}
          <section>
            <SectionHeader>Account</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <DetailRow
                label="Role"
                value={
                  <span className="flex items-center justify-end gap-1">
                    <Shield className="size-3 text-muted-foreground" />
                    {member.role === 'owner' ? 'Owner' : 'Sales Rep'}
                  </span>
                }
              />
              <DetailRow label="Email" value={member.email} />
              <DetailRow label="Member since" value={formatDate(member.createdAt)} />
            </div>
          </section>

          {/* Quick-login PIN */}
          <section>
            <SectionHeader>Quick-Login PIN</SectionHeader>
            <div className="rounded-lg border border-border/60 px-3 py-1">
              <DetailRow
                label="Status"
                value={<Badge variant={pin.variant}>{pin.label}</Badge>}
              />
              <DetailRow
                label="Expires"
                value={
                  member.pinExpiresAt
                    ? formatDate(member.pinExpiresAt)
                    : <span className="text-muted-foreground">—</span>
                }
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              The PIN allows quick re-login on a trusted device. After it expires, a full
              email and password login is required.
            </p>
          </section>

          {/* Actions */}
          <section className="mt-auto flex flex-col gap-2">
            {/* TODO: wire to server actions (admin client for account ops) */}
            <Button variant="outline" size="sm" className="justify-start">
              <KeyRound />
              Reset password
            </Button>
            {member.pinStatus !== 'none' && (
              <Button variant="outline" size="sm" className="justify-start">
                <RotateCcw />
                Clear PIN
              </Button>
            )}
            <Button
              variant={member.isActive ? 'destructive' : 'outline'}
              size="sm"
              className="justify-start"
            >
              <Power />
              {member.isActive ? 'Deactivate account' : 'Reactivate account'}
            </Button>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  )
}
