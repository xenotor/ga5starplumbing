export default function SectionHeading({ eyebrow, title, invert = false }) {
  return (
    <div>
      {eyebrow && (
        <p className={`text-sm font-bold uppercase tracking-[0.2em] ${invert ? 'text-accent-400' : 'text-brand-600'}`}>
          {eyebrow}
        </p>
      )}
      <h2
        className={`mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl ${
          invert ? 'text-white' : 'text-brand-950'
        }`}
      >
        {title}
      </h2>
      <div className="mt-4 h-1 w-16 rounded bg-accent-500" />
    </div>
  )
}
