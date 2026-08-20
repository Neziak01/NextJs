/** Emblème WILD GYM : une feuille de monstera stylisée. */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M24 45C24 45 6 36 6 20.5 6 10.28 14.06 3 24 3s18 7.28 18 17.5C42 36 24 45 24 45Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path
        d="M24 45V9"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M24 17.5 13.5 11M24 25 11.5 20M24 32.5 13 30M24 17.5 34.5 11M24 25l12.5-5M24 32.5 35 30"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M24 45C24 45 6 36 6 20.5 6 10.28 14.06 3 24 3s18 7.28 18 17.5C42 36 24 45 24 45Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
