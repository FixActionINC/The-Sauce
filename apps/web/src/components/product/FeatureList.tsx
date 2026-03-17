interface FeatureListProps {
  features: string[];
}

export default function FeatureList({ features }: FeatureListProps) {
  if (features.length === 0) return null;

  return (
    <ul className="mt-6 space-y-3">
      {features.map((feature) => (
        <li
          key={feature}
          className="flex items-start gap-3 text-sm leading-relaxed text-text-secondary"
        >
          <span className="mt-0.5 flex-shrink-0 text-brand-orange" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {feature}
        </li>
      ))}
    </ul>
  );
}
