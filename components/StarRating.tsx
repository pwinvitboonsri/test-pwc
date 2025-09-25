interface StarRatingProps {
  rating: number;
  reviewCount?: number;
}

const MAX_STARS = 5;

export function StarRating({ rating, reviewCount }: StarRatingProps) {
  const clampedRating = Math.max(0, Math.min(rating, MAX_STARS));
  const stars = Array.from({ length: MAX_STARS }, (_, index) => {
    const starValue = index + 1;
    if (clampedRating >= starValue) {
      return "full" as const;
    }
    if (clampedRating >= starValue - 0.5) {
      return "half" as const;
    }
    return "empty" as const;
  });

  return (
    <div className="flex items-center gap-2" aria-label={`Rating: ${clampedRating.toFixed(1)} out of 5`}>
      <div className="flex">
        {stars.map((state, index) => (
          <span
            key={`star-${index}`}
            className={
              state === "full"
                ? "text-yellow-500"
                : state === "half"
                  ? "text-yellow-500"
                  : "text-slate-300"
            }
          >
            {state === "half" ? "☆" : "★"}
          </span>
        ))}
      </div>
      <span className="text-sm text-slate-500">
        {clampedRating.toFixed(1)}
        {reviewCount !== undefined ? ` (${reviewCount})` : null}
      </span>
    </div>
  );
}
