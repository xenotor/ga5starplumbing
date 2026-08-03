/** Inline SVGs replace the legacy Font Awesome stylesheet (no external CSS). */

const base = 'h-5 w-5'

export function PhoneIcon({ className = base }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.58 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.6a1 1 0 01-.25 1l-2.22 2.2z" />
    </svg>
  )
}

export function MailIcon({ className = base }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

export function CheckIcon({ className = base }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  )
}

export function StarIcon({ className = base }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17.3l-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z" />
    </svg>
  )
}

export function FacebookIcon({ className = base }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z" />
    </svg>
  )
}

export function TwitterIcon({ className = base }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.4L6.2 22H3.1l7.3-8.3L2.4 2h6.5l4.4 5.9L18.9 2zm-1.1 18h1.7L8.3 3.8H6.5L17.8 20z" />
    </svg>
  )
}

export function GoogleIcon({ className = base }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 10.2v3.9h5.5a4.7 4.7 0 01-2 3.1l3.2 2.5c1.9-1.7 3-4.3 3-7.4 0-.7-.1-1.4-.2-2H12z" />
      <path d="M6.5 14.3l-.7.6-2.6 2A9.9 9.9 0 0012 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 1-3.5 1a6 6 0 01-5.5-3.8z" />
      <path d="M3.2 7.4A9.9 9.9 0 002 12c0 1.6.4 3.2 1.2 4.6l3.3-2.6a5.9 5.9 0 010-3.8L3.2 7.4z" />
      <path d="M12 6.2c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.9 9.9 0 003.2 7.4l3.3 2.6A6 6 0 0112 6.2z" />
    </svg>
  )
}

export function MenuIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
    </svg>
  )
}

export function CloseIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4L10.6 10.6l6.3-6.3z" />
    </svg>
  )
}

export function ChevronIcon({ className = base, direction = 'right' }) {
  return (
    <svg
      className={`${className} ${direction === 'left' ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6-1.4-1.4L12.2 12 7.6 7.4z" />
    </svg>
  )
}
