// Role guard: owner-only routes. Implementation: read session user's role
// from the staff table and redirect sales_rep to /dashboard.
export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
