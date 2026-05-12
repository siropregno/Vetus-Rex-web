import i18n from '../i18n/i18n'
import { faShieldHalved, faComments, faPalette, faMugHot, faWrench, faBug, faLightbulb, faUserShield, faGamepad, faEllipsis } from '@fortawesome/free-solid-svg-icons'

export const SUPPORTED_LANGS = ['en', 'es', 'de']

export const getLang = () => {
  const seg = window.location.pathname.split('/')[1]
  if (SUPPORTED_LANGS.includes(seg)) return seg
  const detected = (i18n.resolvedLanguage || i18n.language || 'en').substring(0, 2)
  return SUPPORTED_LANGS.includes(detected) ? detected : 'en'
}

export const langPath = (path) => `/${getLang()}${path}`

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
export const formatDate = (dateString, locale) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString(locale || undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Check if a profile is admin
 */
export const isProfileAdmin = (profile) => profile?.role === 'admin'
export const isProfileModerator = (profile) => profile?.role === 'moderator'
export const isProfileStaff = (profile) => profile?.role === 'admin' || profile?.role === 'moderator'
export const canAccessAdmin = (profile) => isProfileStaff(profile)

export const ROLE_COLORS = {
  user: '#6b7280',
  moderator: '#3b82f6',
  admin: '#f59e0b',
}

export const ROLE_LABELS = {
  user: 'admin.roles.user',
  moderator: 'admin.roles.moderator',
  admin: 'admin.roles.admin',
}

export const isUserBanned = (profile) => {
  if (!profile?.banned_until) return false
  return new Date(profile.banned_until) > new Date()
}

export const getBanExpiry = (profile) => {
  if (!profile?.banned_until) return null
  return new Date(profile.banned_until)
}

export const isBanPermanent = (profile) => {
  if (!profile?.banned_until) return false
  return new Date(profile.banned_until).getFullYear() >= 9000
}

/**
 * Get display name for a profile
 */
export const getAuthorName = (profile) => profile?.username || 'Unknown'

/**
 * News tag definitions with labels and colors
 */
export const RANKING_TAGS = {
  gold: { label: 'rankingTags.gold', color: '#f59e0b' },
  experience: { label: 'rankingTags.experience', color: '#3b82f6' },
}

export const NEWS_TAGS = {
  update: { label: 'tags.update', color: '#3b82f6' },
  patch: { label: 'tags.patch', color: '#8b5cf6' },
  event: { label: 'tags.event', color: '#f59e0b' },
  announcement: { label: 'tags.announcement', color: '#ef4444' },
  community: { label: 'tags.community', color: '#10b981' },
}

export const FORUM_CATEGORIES = {
  welcome: { label: 'forumCategories.welcome', desc: 'forumCategories.welcomeDesc', color: '#10b981', icon: faShieldHalved },
  general: { label: 'forumCategories.general', desc: 'forumCategories.generalDesc', color: '#3b82f6', icon: faComments },
  images: { label: 'forumCategories.images', desc: 'forumCategories.imagesDesc', color: '#8b5cf6', icon: faPalette },
  tavern: { label: 'forumCategories.tavern', desc: 'forumCategories.tavernDesc', color: '#f59e0b', icon: faMugHot },
  support: { label: 'forumCategories.support', desc: 'forumCategories.supportDesc', color: '#ef4444', icon: faGamepad },
}

export const timeAgo = (dateString) => {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'justNow'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return { key: 'minutesAgo', count: minutes }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return { key: 'hoursAgo', count: hours }
  const days = Math.floor(hours / 24)
  return { key: 'daysAgo', count: days }
}

export const TICKET_TAGS = {
  bug: { label: 'support.tags.bug', color: '#ef4444', icon: faBug },
  feature_request: { label: 'support.tags.featureRequest', color: '#8b5cf6', icon: faLightbulb },
  account_issue: { label: 'support.tags.accountIssue', color: '#f59e0b', icon: faUserShield },
  gameplay: { label: 'support.tags.gameplay', color: '#3b82f6', icon: faGamepad },
  other: { label: 'support.tags.other', color: '#6b7280', icon: faEllipsis },
}

export const TICKET_STATUSES = {
  open: { label: 'support.status.open', color: '#3b82f6' },
  in_progress: { label: 'support.status.inProgress', color: '#f59e0b' },
  resolved: { label: 'support.status.resolved', color: '#10b981' },
  closed: { label: 'support.status.closed', color: '#6b7280' },
}

export const TICKET_PRIORITIES = {
  low: { label: 'support.priority.low', color: '#6b7280' },
  normal: { label: 'support.priority.normal', color: '#3b82f6' },
  high: { label: 'support.priority.high', color: '#f59e0b' },
  critical: { label: 'support.priority.critical', color: '#ef4444' },
}
