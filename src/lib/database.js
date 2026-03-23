import { supabase } from './supabase'
import logger from '../utils/logger'
import DOMPurify from 'dompurify'




export const getLatestNews = async (limit = 3) => {
  try {
    logger.db('Fetching latest news', { limit })

    const { data, error } = await supabase
      .from('news')
      .select('*, profiles(username, avatar_url, role)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching latest news:', error)
      return { data: null, error }
    }

    logger.success(`Fetched ${data.length} news articles`)
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching latest news:', error)
    return { data: null, error }
  }
}


export const getAllNews = async (page = 1, pageSize = 9, tag = null) => {
  try {
    logger.db('Fetching all news', { page, pageSize, tag })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('news')
      .select('*, profiles(username, avatar_url, role)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (tag) {
      query = query.eq('tag', tag)
    }

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching all news:', error)
      return { data: null, count: 0, error }
    }

    logger.success(`Fetched ${data.length} news articles (total: ${count})`)
    return { data, count, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching all news:', error)
    return { data: null, count: 0, error }
  }
}


export const getNewsById = async (id) => {
  try {
    logger.db('Fetching news by ID', { id })

    const { data, error } = await supabase
      .from('news')
      .select('*, profiles(username, avatar_url, role)')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching news:', error)
      return { data: null, error }
    }

    logger.success('Fetched news article', { id: data.id, title: data.title })
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching news:', error)
    return { data: null, error }
  }
}


export const createNews = async ({ title, content, cover_image_url, tag, author_id }) => {
  if (!title?.trim() || !content?.trim() || !author_id) {
    return { data: null, error: { message: 'Missing required fields' } }
  }
  try {
    logger.db('Creating news article', { title, tag })

    const sanitizedContent = DOMPurify.sanitize(content)
    const { data, error } = await supabase
      .from('news')
      .insert([{ title, content: sanitizedContent, cover_image_url, tag, author_id }])
      .select()
      .single()

    if (error) {
      logger.error('Error creating news:', error)
      return { data: null, error }
    }

    logger.success('News article created', { id: data.id })
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error creating news:', error)
    return { data: null, error }
  }
}


export const updateNews = async (id, updates) => {
  if (!id || !updates) {
    return { data: null, error: { message: 'Missing required fields' } }
  }
  try {
    logger.db('Updating news article', { id, updates: Object.keys(updates) })

    const sanitizedUpdates = updates.content
      ? { ...updates, content: DOMPurify.sanitize(updates.content) }
      : updates

    const { data, error } = await supabase
      .from('news')
      .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating news:', error)
      return { data: null, error }
    }

    logger.success('News article updated', { id })
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error updating news:', error)
    return { data: null, error }
  }
}


export const deleteNews = async (id) => {
  if (!id) return { error: { message: 'Missing article ID' } }
  try {
    logger.db('Deleting news article', { id })

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting news:', error)
      return { error }
    }

    logger.success('News article deleted', { id })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting news:', error)
    return { error }
  }
}


export const uploadNewsImage = async (file) => {
  try {
    logger.db('Uploading news image')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `covers/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(filePath, file)

    if (uploadError) {
      logger.error('Error uploading news image:', uploadError)
      return { data: null, error: uploadError }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(filePath)

    logger.success('News image uploaded', { publicUrl })
    return { data: publicUrl, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading news image:', error)
    return { data: null, error }
  }
}


export const deleteNewsImage = async (url) => {
  try {
    logger.db('Deleting news image')


    let path
    try {
      const urlObj = new URL(url)
      const idx = urlObj.pathname.indexOf('/news-images/')
      path = idx !== -1 ? urlObj.pathname.substring(idx + '/news-images/'.length) : null
    } catch {
      path = null
    }
    if (!path) {
      return { error: { message: 'Invalid image URL' } }
    }

    const { error } = await supabase.storage
      .from('news-images')
      .remove([path])

    if (error) {
      logger.error('Error deleting news image:', error)
      return { error }
    }

    logger.success('News image deleted')
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting news image:', error)
    return { error }
  }
}




export const getUserCharacters = async (userId) => {
  try {
    logger.db('Fetching characters for user', { userId })

    const { data, error } = await supabase
      .from('characters')
      .select('id, player_name, level, experience, health, max_health, mana, max_mana, gold, strength, vitality, current_world, body_color, created_at, last_played')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching characters:', error)
      return { data: null, error }
    }

    logger.success(`Fetched ${data.length} characters`)
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching characters:', error)
    return { data: null, error }
  }
}


export const deleteCharacter = async (characterId) => {
  if (!characterId) return { error: { message: 'Missing character ID' } }
  try {
    logger.db('Deleting character', { characterId })

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)

    if (error) {
      logger.error('Error deleting character:', error)
      return { error }
    }

    logger.success('Character deleted', { characterId })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting character:', error)
    return { error }
  }
}


export const getRanking = async (sortBy = 'gold') => {
  try {
    const column = sortBy === 'experience' ? 'experience' : 'gold'
    logger.db('Fetching ranking', { sortBy: column })

    const { data, error } = await supabase
      .rpc('get_ranking')

    if (error) {
      logger.error('Error fetching ranking:', error)
      return { data: null, error }
    }

    // Sort client-side since rpc doesn't support .order()
    const sorted = [...data].sort((a, b) => (b[column] ?? 0) - (a[column] ?? 0))

    logger.success(`Fetched ${sorted.length} characters for ranking`)
    return { data: sorted, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching ranking:', error)
    return { data: null, error }
  }
}


// Gallery

export const getGalleryImages = async (page = 1, pageSize = 12) => {
  try {
    logger.db('Fetching gallery images', { page, pageSize })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('gallery')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      logger.error('Error fetching gallery:', error)
      return { data: null, count: 0, error }
    }

    logger.success(`Fetched ${data.length} gallery images (total: ${count})`)
    return { data, count, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching gallery:', error)
    return { data: null, count: 0, error }
  }
}

export const uploadGalleryImage = async ({ file, title, description, authorId }) => {
  if (!file || !title?.trim() || !authorId) {
    return { data: null, error: { message: 'Missing required fields' } }
  }
  try {
    logger.db('Uploading gallery image', { title })

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file)

    if (uploadError) {
      logger.error('Error uploading gallery image:', uploadError)
      return { data: null, error: uploadError }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath)

    const { data, error } = await supabase
      .from('gallery')
      .insert([{ title, description, image_url: publicUrl, author_id: authorId }])
      .select()
      .single()

    if (error) {
      logger.error('Error saving gallery record:', error)
      return { data: null, error }
    }

    logger.success('Gallery image uploaded', { id: data.id })
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading gallery image:', error)
    return { data: null, error }
  }
}

export const deleteGalleryImage = async (id, imageUrl) => {
  if (!id) return { error: { message: 'Missing image ID' } }
  try {
    logger.db('Deleting gallery image', { id })

    if (imageUrl) {
      try {
        const urlObj = new URL(imageUrl)
        const idx = urlObj.pathname.indexOf('/gallery/')
        const path = idx !== -1 ? urlObj.pathname.substring(idx + '/gallery/'.length) : null
        if (path) {
          await supabase.storage.from('gallery').remove([path])
        }
      } catch (storageErr) {
        logger.warn('Could not delete gallery file from storage:', storageErr)
      }
    }

    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting gallery record:', error)
      return { error }
    }

    logger.success('Gallery image deleted', { id })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting gallery image:', error)
    return { error }
  }
}


// ============================================
// Forum Posts
// ============================================

export const getForumCategoryStats = async () => {
  try {
    logger.db('Fetching forum category stats')

    const { data, error } = await supabase
      .from('forum_posts')
      .select('category, created_at, id, title, profiles(username)')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching category stats:', error)
      return { data: null, error }
    }

    const stats = {}
    const seen = new Set()
    for (const post of data) {
      if (!stats[post.category]) {
        stats[post.category] = { count: 0, lastPost: null }
      }
      stats[post.category].count++
      if (!seen.has(post.category)) {
        seen.add(post.category)
        stats[post.category].lastPost = {
          id: post.id,
          title: post.title,
          created_at: post.created_at,
          author: post.profiles?.username || 'Unknown',
        }
      }
    }

    logger.success('Fetched forum category stats')
    return { data: stats, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching category stats:', error)
    return { data: null, error }
  }
}

export const getAllForumPosts = async (page = 1, pageSize = 12, category = null, search = null) => {
  try {
    logger.db('Fetching forum posts', { page, pageSize, category, search })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('forum_posts')
      .select('*, profiles(username, avatar_url, role), forum_comments(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching forum posts:', error)
      return { data: null, count: 0, error }
    }

    logger.success(`Fetched ${data.length} forum posts (total: ${count})`)
    return { data, count, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching forum posts:', error)
    return { data: null, count: 0, error }
  }
}

export const getForumPostById = async (id) => {
  try {
    logger.db('Fetching forum post by ID', { id })

    const { data, error } = await supabase
      .from('forum_posts')
      .select('*, profiles(username, avatar_url, role)')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching forum post:', error)
      return { data: null, error }
    }

    logger.success('Fetched forum post', { id: data.id, title: data.title })
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching forum post:', error)
    return { data: null, error }
  }
}

export const createForumPost = async ({ title, content, category, author_id }) => {
  if (!title?.trim() || !content?.trim() || !category || !author_id) {
    return { data: null, error: { message: 'Missing required fields' } }
  }
  try {
    logger.db('Creating forum post', { title, category })

    const sanitizedContent = DOMPurify.sanitize(content)
    const { data, error } = await supabase
      .from('forum_posts')
      .insert([{ title, content: sanitizedContent, category, author_id }])
      .select()
      .single()

    if (error) {
      logger.error('Error creating forum post:', error)
      return { data: null, error }
    }

    logger.success('Forum post created', { id: data.id })
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error creating forum post:', error)
    return { data: null, error }
  }
}

export const updateForumPost = async (id, updates) => {
  if (!id || !updates) {
    return { data: null, error: { message: 'Missing required fields' } }
  }
  try {
    logger.db('Updating forum post', { id, updates: Object.keys(updates) })

    const sanitizedUpdates = updates.content
      ? { ...updates, content: DOMPurify.sanitize(updates.content) }
      : updates

    const { data, error } = await supabase
      .from('forum_posts')
      .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating forum post:', error)
      return { data: null, error }
    }

    logger.success('Forum post updated', { id })
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error updating forum post:', error)
    return { data: null, error }
  }
}

export const deleteForumPost = async (id) => {
  if (!id) return { error: { message: 'Missing post ID' } }
  try {
    logger.db('Deleting forum post', { id })

    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting forum post:', error)
      return { error }
    }

    logger.success('Forum post deleted', { id })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting forum post:', error)
    return { error }
  }
}

export const uploadForumImage = async (file, userId) => {
  try {
    logger.db('Uploading forum image')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('forum-images')
      .upload(filePath, file)

    if (uploadError) {
      logger.error('Error uploading forum image:', uploadError)
      return { data: null, error: uploadError }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('forum-images')
      .getPublicUrl(filePath)

    logger.success('Forum image uploaded', { publicUrl })
    return { data: publicUrl, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading forum image:', error)
    return { data: null, error }
  }
}

export const deleteForumImage = async (url) => {
  try {
    logger.db('Deleting forum image')

    let path
    try {
      const urlObj = new URL(url)
      const idx = urlObj.pathname.indexOf('/forum-images/')
      path = idx !== -1 ? urlObj.pathname.substring(idx + '/forum-images/'.length) : null
    } catch {
      path = null
    }
    if (!path) {
      return { error: { message: 'Invalid image URL' } }
    }

    const { error } = await supabase.storage
      .from('forum-images')
      .remove([path])

    if (error) {
      logger.error('Error deleting forum image:', error)
      return { error }
    }

    logger.success('Forum image deleted')
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting forum image:', error)
    return { error }
  }
}


// ============================================
// Forum Comments
// ============================================

export const getCommentsByPostId = async (postId) => {
  try {
    logger.db('Fetching comments for post', { postId })

    const { data, error } = await supabase
      .from('forum_comments')
      .select('*, profiles(username, avatar_url, role)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching comments:', error)
      return { data: null, error }
    }

    logger.success(`Fetched ${data.length} comments`)
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching comments:', error)
    return { data: null, error }
  }
}

export const createComment = async ({ post_id, parent_comment_id, content, author_id }) => {
  if (!post_id || !content?.trim() || !author_id) {
    return { data: null, error: { message: 'Missing required fields' } }
  }
  try {
    logger.db('Creating comment', { post_id, parent_comment_id })

    const sanitizedContent = DOMPurify.sanitize(content)
    const { data, error } = await supabase
      .from('forum_comments')
      .insert([{ post_id, parent_comment_id: parent_comment_id || null, content: sanitizedContent, author_id }])
      .select('*, profiles(username, avatar_url, role)')
      .single()

    if (error) {
      logger.error('Error creating comment:', error)
      return { data: null, error }
    }

    logger.success('Comment created', { id: data.id })
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error creating comment:', error)
    return { data: null, error }
  }
}

export const updateComment = async (id, content) => {
  if (!id || !content?.trim()) {
    return { data: null, error: { message: 'Missing required fields' } }
  }
  try {
    logger.db('Updating comment', { id })

    const sanitizedContent = DOMPurify.sanitize(content)
    const { data, error } = await supabase
      .from('forum_comments')
      .update({ content: sanitizedContent, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, profiles(username, avatar_url, role)')
      .single()

    if (error) {
      logger.error('Error updating comment:', error)
      return { data: null, error }
    }

    logger.success('Comment updated', { id })
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error updating comment:', error)
    return { data: null, error }
  }
}

export const deleteComment = async (id) => {
  if (!id) return { error: { message: 'Missing comment ID' } }
  try {
    logger.db('Deleting comment', { id })

    const { error } = await supabase
      .from('forum_comments')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting comment:', error)
      return { error }
    }

    logger.success('Comment deleted', { id })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting comment:', error)
    return { error }
  }
}

export const tempBanUser = async (userId, days) => {
  try {
    logger.db('Temporarily banning user', { userId, days })

    const { error } = await supabase.rpc('ban_user_temporarily', {
      target_user_id: userId,
      ban_days: days,
    })

    if (error) {
      logger.error('Error banning user:', error)
      return { error }
    }

    logger.success('User banned temporarily', { userId, days })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error banning user:', error)
    return { error }
  }
}


// ============================================
// Notifications
// ============================================

export const getNotifications = async (userId, limit = 20) => {
  try {
    logger.db('Fetching notifications', { userId, limit })

    const { data, error } = await supabase
      .from('notifications')
      .select('*, profiles:actor_id(username, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching notifications:', error)
      return { data: null, error }
    }

    logger.success(`Fetched ${data.length} notifications`)
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching notifications:', error)
    return { data: null, error }
  }
}

export const getUnreadNotificationCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      logger.error('Error fetching unread count:', error)
      return { count: 0, error }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching unread count:', error)
    return { count: 0, error }
  }
}

export const markNotificationRead = async (id) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (error) {
      logger.error('Error marking notification read:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    logger.error('Unexpected error marking notification read:', error)
    return { error }
  }
}

export const markAllNotificationsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      logger.error('Error marking all notifications read:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    logger.error('Unexpected error marking all notifications read:', error)
    return { error }
  }
}

export const deleteNotification = async (id) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting notification:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting notification:', error)
    return { error }
  }
}


// ============================================
// Admin Panel
// ============================================

export const adminSearchUsers = async (query = '', limit = 50, offset = 0) => {
  try {
    logger.db('Admin searching users', { query, limit, offset })

    const { data, error } = await supabase.rpc('admin_search_users', {
      search_query: query,
      result_limit: limit,
      result_offset: offset,
    })

    if (error) {
      logger.error('Error searching users:', error)
      return { data: null, error }
    }

    logger.success(`Found ${data.length} users`)
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error searching users:', error)
    return { data: null, error }
  }
}

export const adminGetUserDetail = async (userId) => {
  try {
    logger.db('Admin fetching user detail', { userId })

    const { data, error } = await supabase.rpc('admin_get_user_detail', {
      target_user_id: userId,
    })

    if (error) {
      logger.error('Error fetching user detail:', { message: error.message, code: error.code, details: error.details, hint: error.hint })
      console.error('FULL RPC ERROR:', JSON.stringify(error, null, 2))
      return { data: null, error }
    }

    logger.success('Fetched user detail', { dataType: typeof data, data })
    // Supabase may return JSON as string for scalar RPC results
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return { data: parsed, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching user detail:', error)
    return { data: null, error }
  }
}

export const adminChangeRole = async (targetId, newRole) => {
  try {
    logger.db('Admin changing role', { targetId, newRole })

    const { error } = await supabase.rpc('admin_change_role', {
      target_id: targetId,
      new_role: newRole,
    })

    if (error) {
      logger.error('Error changing role:', error)
      return { error }
    }

    logger.success('Role changed', { targetId, newRole })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error changing role:', error)
    return { error }
  }
}

export const adminBanUser = async (targetId, days, reason = null) => {
  try {
    logger.db('Admin banning user', { targetId, days })

    const { error } = await supabase.rpc('admin_ban_user', {
      target_id: targetId,
      ban_days: days,
      reason,
    })

    if (error) {
      logger.error('Error banning user:', error)
      return { error }
    }

    logger.success('User banned', { targetId, days })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error banning user:', error)
    return { error }
  }
}

export const adminUnbanUser = async (targetId) => {
  try {
    logger.db('Admin unbanning user', { targetId })

    const { error } = await supabase.rpc('admin_unban_user', {
      target_id: targetId,
    })

    if (error) {
      logger.error('Error unbanning user:', error)
      return { error }
    }

    logger.success('User unbanned', { targetId })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error unbanning user:', error)
    return { error }
  }
}

export const adminRenameCharacter = async (charId, newName, reason = null) => {
  try {
    logger.db('Admin renaming character', { charId, newName })

    const { error } = await supabase.rpc('admin_rename_character', {
      char_id: charId,
      new_name: newName,
      reason,
    })

    if (error) {
      logger.error('Error renaming character:', error)
      return { error }
    }

    logger.success('Character renamed', { charId, newName })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error renaming character:', error)
    return { error }
  }
}

export const adminDeleteAccount = async (targetId) => {
  try {
    logger.db('Admin deleting account', { targetId })

    const { error } = await supabase.rpc('admin_delete_account', {
      target_id: targetId,
    })

    if (error) {
      logger.error('Error deleting account:', error)
      return { error }
    }

    logger.success('Account deleted', { targetId })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting account:', error)
    return { error }
  }
}

export const adminDeletePost = async (postId, reason = null) => {
  try {
    logger.db('Admin deleting post', { postId })

    const { error } = await supabase.rpc('admin_delete_post', {
      post_id: postId,
      reason,
    })

    if (error) {
      logger.error('Error deleting post:', error)
      return { error }
    }

    logger.success('Post deleted by admin', { postId })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting post:', error)
    return { error }
  }
}

export const adminDeleteComment = async (commentId, reason = null) => {
  try {
    logger.db('Admin deleting comment', { commentId })

    const { error } = await supabase.rpc('admin_delete_comment', {
      comment_id: commentId,
      reason,
    })

    if (error) {
      logger.error('Error deleting comment:', error)
      return { error }
    }

    logger.success('Comment deleted by admin', { commentId })
    return { error: null }
  } catch (error) {
    logger.error('Unexpected error deleting comment:', error)
    return { error }
  }
}

export const adminGetStats = async () => {
  try {
    logger.db('Fetching admin stats')

    const { data, error } = await supabase.rpc('admin_get_stats')

    if (error) {
      logger.error('Error fetching admin stats:', error)
      return { data: null, error }
    }

    logger.success('Fetched admin stats')
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching admin stats:', error)
    return { data: null, error }
  }
}

export const adminGetActionLog = async (filterAction = null, limit = 50, offset = 0) => {
  try {
    logger.db('Fetching admin action log', { filterAction, limit, offset })

    const { data, error } = await supabase.rpc('admin_get_action_log', {
      filter_action: filterAction,
      result_limit: limit,
      result_offset: offset,
    })

    if (error) {
      logger.error('Error fetching action log:', error)
      return { data: null, error }
    }

    logger.success(`Fetched ${data.length} log entries`)
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching action log:', error)
    return { data: null, error }
  }
}
