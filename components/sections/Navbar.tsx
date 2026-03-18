import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-10 py-2 border-b border-white/10 bg-black sticky top-0 z-50">
      <div className="flex items-center">
        <a href="/">
          <Image
            src="/images/Logo-transparent.png"
            alt="Atlantic Services"
            width={280}
            height={110}
            className="object-contain"
            priority
          />
        </a>
      </div>
      <ul className="hidden md:flex gap-8 list-none">
        <li>
          <a href="/#services" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E8951A] transition-colors">Services</a>
        </li>
        <li>
          <a href="/gallery" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E8951A] transition-colors">Projects</a>
        </li>
        <li>
          <a href="/about" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E8951A] transition-colors">About</a>
        </li>
        <li>
          <a href="/#contact" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E8951A] transition-colors">Contact</a>
        </li>
      </ul>
      <a href="/#contact" className="text-sm font-bold uppercase tracking-wider px-6 py-3 bg-[#E8951A] text-white rounded-sm hover:bg-[#d4841a] transition-colors">
        Free Estimate
      </a>
    </nav>
  )
}