export default function Footer() {
  return (
    <footer className="bg-[#3D4F5C] px-10 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
        
        <div className="max-w-xs">
          <p className="font-serif text-2xl font-semibold text-white mb-2">ATLANTIC SERVICES</p>
          <p className="text-sm text-white/50 uppercase tracking-widest mb-4">General Construction</p>
          <p className="text-sm text-white/60 leading-relaxed font-light">
            Quality construction solutions in Indianapolis, Indiana. Licensed, insured and BBB A+ accredited.
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8951A] mb-4">Navigation</p>
          <div className="flex flex-col gap-3">
            <span className="text-base text-white/70 cursor-pointer hover:text-[#E8951A] transition-colors">Services</span>
            <span className="text-base text-white/70 cursor-pointer hover:text-[#E8951A] transition-colors">Projects</span>
            <span className="text-base text-white/70 cursor-pointer hover:text-[#E8951A] transition-colors">About</span>
            <span className="text-base text-white/70 cursor-pointer hover:text-[#E8951A] transition-colors">Contact</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8951A] mb-4">Contact</p>
          <div className="flex flex-col gap-3">
            <p className="text-base text-white/70">(317) 991-5878</p>
            <p className="text-base text-white/70">(317) 607-1196</p>
            <p className="text-base text-white/70">info@atlanticser.com</p>
            <p className="text-base text-white/70">5341 W. 86th St.<br/>Indianapolis, IN 46268</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8951A] mb-4">Hours</p>
          <div className="flex flex-col gap-3">
            <p className="text-base text-white/70">Mon–Fri: 8:00am – 5:00pm</p>
            <p className="text-base text-white/70">Saturday: 9:00am – 12:00pm</p>
            <p className="text-base text-white/70">Sunday: Closed</p>
          </div>
        </div>

      </div>

      <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="text-sm text-white/40">© 2025 Atlantic Services LLC · Indianapolis, IN 46268</p>
        <div className="flex gap-6">
          <span className="text-sm text-white/40 cursor-pointer hover:text-white/70 transition-colors">Privacy Policy</span>
          <span className="text-sm text-white/40 cursor-pointer hover:text-white/70 transition-colors">BBB Accredited</span>
        </div>
      </div>

    </footer>
  )
}