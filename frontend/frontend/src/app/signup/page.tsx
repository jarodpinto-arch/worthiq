import Link from 'next/link';
export default function Signup() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
      <h2 className="text-3xl font-black mb-8 italic">Create your WorthIQ account</h2>
      <div className="w-full max-w-sm space-y-4">
        <input type="text" placeholder="Full Name" className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-blue-500 text-black" />
        <input type="email" placeholder="Email" className="w-full p-4 border border-slate-200 rounded-2xl focus:outline-blue-500 text-black" />
        <Link href="/connect" className="block w-full bg-black text-white py-4 rounded-2xl font-bold text-center">Create Account</Link>
      </div>
    </div>
  );
}
