// app/room-visualizer/page.tsx
import type { Metadata } from 'next'
import RoomVisualizerClient from '@/components/visualizer/RoomVisualizerClient'

export const metadata: Metadata = {
  title: 'Room Lighting Visualizer — LitMeUp',
  description: 'Select your room type, upload a photo, and see how our decorative lights look in your space.',
}

export default function RoomVisualizerPage() {
  return <RoomVisualizerClient />
}
