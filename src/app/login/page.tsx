import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 muted">Your garage and repair history are saved to your account.</p>
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          That sign-in link didn&apos;t work. Please request a new one.
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : "/garage"} />
    </div>
  );
}
