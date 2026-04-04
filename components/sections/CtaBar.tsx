export default function CtaBar() {
  return (
    <div className="bg-[#3D4F5C] px-10 py-16 flex flex-col md:flex-row justify-between items-center gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#E2B84A] mb-3">Let's work together</p>
        <h2 className="font-serif text-4xl font-semibold text-white">Ready to build something great?</h2>
        <p className="text-base text-white/50 mt-2 font-light">Free estimates · BBB A+ Accredited · Indianapolis & surrounding areas</p>
      </div>
      <div className="flex gap-4 flex-shrink-0">
        <button className="px-8 py-4 border-2 border-white/20 text-white text-sm font-medium uppercase tracking-wider rounded-sm hover:border-[#E2B84A] hover:text-[#E2B84A] transition-colors">
          (317) 991-5878
        </button>
        <button className="px-8 py-4 bg-[#E2B84A] text-white text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#c49a2e] transition-colors">
          Get Free Estimate
        </button>
      </div>
    </div>
  )
}
