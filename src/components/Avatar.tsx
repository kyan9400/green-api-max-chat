const COLORS = ['#3d7bff', '#8a4dff', '#ff6b6b', '#1fb88a', '#ff9f1c', '#00a8e8', '#e8488a']

export function Avatar({ title, size = 44 }: { title: string; size?: number }) {
  // Initials from words that start with a letter; chats named by phone number get a person icon.
  const initials = title
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  const hash = [...title].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return (
    <span className="avatar" style={{ width: size, height: size, background: COLORS[hash % COLORS.length] }} aria-hidden="true">
      {initials || (
        <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5}>
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor" />
        </svg>
      )}
    </span>
  )
}
