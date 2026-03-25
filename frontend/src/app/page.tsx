import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 text-center">
      <h1 className="text-6xl font-black text-slate-900 mb-2 italic tracking-tighter italic">WorthIQ™</h1>
      <p className="text-slate-500 mb-12 text-xl font-medium tracking-tight">Master your capital with AI.</p>
      
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link href="/login" className="bg-black text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl">
          Log In
        </Link>
        <Link href="/signup" className="border-2 border-slate-100 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all text-slate-900">
          Create Account
        </Link>
        
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Experience the AI</span></div>
        </div>

        <Link href="/guest" className="text-blue-600 font-bold hover:text-blue-700 text-lg transition-colors">
          Continue as Guest →
        </Link>
      </div>
    </div>
  );
}
