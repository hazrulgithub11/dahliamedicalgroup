import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clinic')({
  head: () => ({
    meta: [
      {
        title: 'Clinic · Dahlia Medical Group',
      },
    ],
  }),
  component: Clinic,
})

function Clinic() {
  return (
    <main className="px-4 py-5">
      <h1 className="text-2xl font-semibold">Clinic</h1>
      <p className="text-[var(--text-muted)]">Staff board</p>
    </main>
  )
}
