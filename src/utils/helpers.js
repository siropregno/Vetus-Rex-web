/**
 * Strip HTML tags from a string and return plain text
 */
export const stripHtml = (html) => {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

/**
 * Truncate text to a max length, adding ellipsis if needed
 */
export const truncateText = (text, maxLength = 150) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trimEnd() + '...'
}

/**
 * Format a date string into a readable format
 */
export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Check if a profile is admin
 */
export const isProfileAdmin = (profile) => profile?.role === 'admin'

/**
 * Get display name for a profile
 */
export const getAuthorName = (profile) => profile?.username || 'Unknown'

/**
 * News tag definitions with labels and colors
 */
export const NEWS_TAGS = {
  update: { label: 'Update', color: '#3b82f6' },
  patch: { label: 'Patch', color: '#8b5cf6' },
  event: { label: 'Event', color: '#f59e0b' },
  announcement: { label: 'Announcement', color: '#ef4444' },
  community: { label: 'Community', color: '#10b981' },
}
