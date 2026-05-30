import { LoginForm } from '@/features/auth/components'

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-sky-100/50 to-white p-4">
      <LoginForm />
    </main>
  )
}
