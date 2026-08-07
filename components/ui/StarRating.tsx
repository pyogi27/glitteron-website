interface StarRatingProps {
  rating: number
  max?: number
  size?: number
  light?: boolean
}

export default function StarRating({ rating, max = 5, size = 11, light = false }: StarRatingProps) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i < Math.round(rating) ? '#C4714A' : (light ? 'rgba(255,255,255,0.3)' : '#D8D0C4')}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      ))}
    </div>
  )
}
