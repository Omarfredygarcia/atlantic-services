const stats = [
  { number: '15+', label: 'Years of experience' },
  { number: '500+', label: 'Projects completed' },
  { number: 'A+', label: 'BBB Rating' },
  { number: '100%', label: 'Licensed & insured' },
]

export default function Stats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 bg-[#E8951A]">
      {stats.map((stat, index) => (
        <div key={index} className="py-8 px-8 text-center border-r border-white/20 last:border-r-0">
          <p className="font-serif text-4xl font-semibold text-white">{stat.number}</p>
          <p className="text-xs text-white/80 uppercase tracking-wider mt-2 font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}