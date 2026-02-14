import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function SignInScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3">Photo Library</h1>
          <p className="text-lg text-muted-foreground">
            Your personal photo gallery
          </p>
        </div>

        <button
          onClick={login}
          disabled={isLoggingIn}
          className="w-full rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
        >
          {isLoggingIn ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>

        <p className="mt-6 text-sm text-muted-foreground">
          Sign in to access your photos
        </p>
      </div>
    </div>
  );
}

