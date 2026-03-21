import { supabase } from './supabase'
import logger from '../utils/logger'




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

    const { data, error } = await supabase
      .from('news')
      .insert([{ title, content, cover_image_url, tag, author_id }])
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

    const { data, error } = await supabase
      .from('news')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
      .from('ranking_view')
      .select('player_name, level, gold, experience')
      .order(column, { ascending: false, nullsFirst: false })

    if (error) {
      logger.error('Error fetching ranking:', error)
      return { data: null, error }
    }

    logger.success(`Fetched ${data.length} characters for ranking`)
    return { data, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching ranking:', error)
    return { data: null, error }
  }
}
