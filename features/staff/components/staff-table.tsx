'use client'

import { useState, useMemo } from 'react'
import {
  UserPlus, Search, MoreHorizontal, Eye, KeyRound, Power, Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { StaffDetailSheet, PIN_STATUS_CONFIG } from './staff-detail-sheet'
import type { StaffMemberWithStatus } from '../types'

interface StaffTableProps {
  staff: StaffMemberWithStatus[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function StaffTable({ staff }: StaffTableProps) {
  const [search, setSearch]           = useState('')
  const [roleFilter, setRoleFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected]       = useState<StaffMemberWithStatus | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return staff.filter(s => {
      if (q && !s.fullName.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false
      if (roleFilter !== 'all' && s.role !== roleFilter) return false
      if (statusFilter === 'active'   && !s.isActive) return false
      if (statusFilter === 'inactive' &&  s.isActive) return false
      return true
    })
  }, [staff, search, roleFilter, statusFilter])

  const stats = useMemo(() => ({
    total:    staff.length,
    active:   staff.filter(s => s.isActive).length,
    reps:     staff.filter(s => s.role === 'sales_rep' && s.isActive).length,
    pinIssues: staff.filter(s => s.isActive && s.pinStatus === 'expired').length,
  }), [staff])

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Staff</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage accounts, roles, and access
          </p>
        </div>
        {/* TODO: open Add Staff form — creates an auth user via the admin client */}
        <Button size="sm">
          <UserPlus />
          Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Staff" value={stats.total.toString()} />
        <StatCard label="Active" value={stats.active.toString()} />
        <StatCard label="Active Reps" value={stats.reps.toString()} />
        <StatCard
          label="PIN Expired"
          value={stats.pinIssues.toString()}
          valueClass={stats.pinIssues > 0 ? 'text-destructive' : 'text-muted-foreground'}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="sales_rep">Sales Rep</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all') }}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-[10px] text-muted-foreground">
          {filtered.length} of {staff.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>PIN</TableHead>
              <TableHead className="w-28">Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Users className="size-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No staff match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map(s => {
              const pin = PIN_STATUS_CONFIG[s.pinStatus]
              return (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(s)}
                >
                  {/* Name with avatar */}
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <span className="text-[10px] font-semibold text-primary">
                          {s.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{s.fullName}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">{s.email}</TableCell>

                  {/* Role */}
                  <TableCell>
                    <Badge variant={s.role === 'owner' ? 'secondary' : 'outline'}>
                      {s.role === 'owner' ? 'Owner' : 'Sales Rep'}
                    </Badge>
                  </TableCell>

                  {/* PIN status */}
                  <TableCell>
                    <Badge variant={pin.variant}>{pin.label}</Badge>
                  </TableCell>

                  {/* Joined */}
                  <TableCell className="text-muted-foreground">{formatDate(s.createdAt)}</TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={s.isActive ? 'default' : 'outline'}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon" />}
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                          <DropdownMenuItem onClick={() => setSelected(s)}>
                            <Eye />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <KeyRound />
                            Reset password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant={s.isActive ? 'destructive' : 'default'}>
                            <Power />
                            {s.isActive ? 'Deactivate' : 'Reactivate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail sheet */}
      <StaffDetailSheet
        member={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-lg font-semibold leading-none ${valueClass ?? 'text-foreground'}`}>
        {value}
      </span>
    </div>
  )
}
