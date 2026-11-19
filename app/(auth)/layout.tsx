import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-104px)] lg:grid-cols-2">
      <div className="relative hidden bg-night lg:block">
        <Image src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=80" alt="" fill sizes="50vw" className="object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/80 to-transparent" />
        <p className="absolute bottom-12 left-12 max-w-sm font-display text-5xl font-black uppercase leading-[0.9] text-white">
          Vista a cidade.<br /><span className="text-flame">Viva o movimento.</span>
        </p>
      </div>
      <div className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
