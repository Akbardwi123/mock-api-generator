import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-xl font-bold tracking-tighter">MockNest</div>
        <div>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl relative z-10 leading-tight">
          Buat Mock API dalam hitungan{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Detik
          </span>
          .
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-10 relative z-10 leading-relaxed">
          Berhenti menunggu backend selesai. Definisikan endpoint, simulasikan
          delay, atur response sesuka hati, dan dapatkan URL yang langsung siap
          dipakai untuk frontend Anda.
        </p>

        <div className="relative z-10 flex gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/30">
                Mulai Gratis Sekarang
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <a
              href="/dashboard"
              className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/30"
            >
              Masuk ke Dashboard
            </a>
          </Show>
        </div>
      </main>
    </div>
  );
}
