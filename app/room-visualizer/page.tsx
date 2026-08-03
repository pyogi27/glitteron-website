// app/room-visualizer/page.tsx
import type { Metadata } from 'next'
import RoomVisualizerClient from '@/components/visualizer/RoomVisualizerClient'

export const metadata: Metadata = {
  title: 'Free Room Lighting Visualizer — See Lights in Your Space',
  description:
    'Upload a photo of your room and see how our chandeliers and pendant lights look in your space before you buy. Free, no signup needed.',
  alternates: { canonical: '/room-visualizer' },
}

export default function RoomVisualizerPage() {
  return <RoomVisualizerClient />
}
