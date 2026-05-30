export default function AuthErrorPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Authentication Error</h1>
        <p className="text-muted-foreground">
          Something went wrong during authentication. Please try again.
        </p>
        <a 
          href="/auth/login" 
          className="inline-block text-primary underline-offset-4 hover:underline"
        >
          Back to login
        </a>
      </div>
    </main>
  )
}
