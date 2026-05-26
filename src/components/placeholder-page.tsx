'use client'

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">{title}</h1>
      <div className="neo-card text-center py-16">
        <div className="text-4xl mb-4">🚧</div>
        <h2 className="font-heading font-bold text-xl mb-2">{title}</h2>
        <p className="text-dark-light text-sm max-w-sm mx-auto">
          This feature is coming in a future phase. Currently building the foundation first.
        </p>
      </div>
    </div>
  )
}