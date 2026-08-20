/** Emblème BRIN SAUVAGE : une corolle sur sa tige, au trait. */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <path
        d="M24 44V21"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M24 33c-6.5 0-9.5-3.2-9.5-7.4 4.3 0 9.5 2.1 9.5 7.4Z"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 28c6.5 0 9.5-3.2 9.5-7.4-4.3 0-9.5 2.1-9.5 7.4Z"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g fill="currentColor" fillOpacity="0.9">
        <circle cx="24" cy="13.5" r="4.6" />
        <circle cx="16" cy="16.8" r="3.8" />
        <circle cx="32" cy="16.8" r="3.8" />
        <circle cx="19.2" cy="8.2" r="3.6" />
        <circle cx="28.8" cy="8.2" r="3.6" />
      </g>
    </svg>
  );
}
