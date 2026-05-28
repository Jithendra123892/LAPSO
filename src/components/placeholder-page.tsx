'use client'

import { Wrench } from '@phosphor-icons/react'

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">{title}</h1>
      <div className="neo-card text-center py-16">
        <div className="mb-4 flex items-center justify-center">
          <div className="w-12 h-12 border-3 border-dark rounded-none flex items-center justify-center" style={{ backgroundColor: '#FFE66D' }}>
            <Wrench size={28} weight="bold" className="text-dark" />
          </div>
        </div>
        <h2 className="font-heading font-bold text-xl mb-2">{title}</h2>
        <p className="font-body text-dark-light text-sm max-w-sm mx-auto">
          This feature is coming in a future phase. Currently building the foundation first.
        </p>
      </div>
    </div>
  )
}