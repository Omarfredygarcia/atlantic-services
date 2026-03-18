import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-10 py-2 border-b border-white/10 bg-black sticky top-0 z-50">
      <div className="flex items-center">
        <Image
          src="/images/Logo-transparent.png"
          alt="Atlantic Services"
          width={280}
          height={110}
          className="object-contain"
          priority
        />
      </div>
      <ul className="hidden md:flex gap-8 list-none">
        <li className="text-sm font-semibold text-white/80 uppercase tracking-wider cursor-pointer hover:text-[#E8951A] transition-colors">Services</li>
        <li className="text-sm font-semibold text-white/80 uppercase tracking-wider cursor-pointer hover:text-[#E8951A] transition-colors">
          <a href="/gallery" className="hover:text-[#E8951A]">Projects</a>
        </li>
        <li className="text-sm font-semibold text-white/80 uppercase tracking-wider cursor-pointer hover:text-[#E8951A] transition-colors">About</li>
        <li className="text-sm font-semibold text-white/80 uppercase tracking-wider cursor-pointer hover:text-[#E8951A] transition-colors">Contact</li>
      </ul>
      <button className="text-sm font-bold uppercase tracking-wider px-6 py-3 bg-[#E8951A] text-white rounded-sm hover:bg-[#d4841a] transition-colors">
        Free Estimate
      </button>
    </nav>
  )
}