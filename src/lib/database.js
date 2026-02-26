import { supabase } from './supabase'
import logger from '../utils/logger'

// ─── News ────────────────────────────────────────────────

/**
 * Obtener las últimas noticias (para Home)
 */
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

/**
 * Obtener todas las noticias con paginación y filtro por tag
 */
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

/**
 * Obtener una noticia por ID
 */
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

/**
 * Crear una noticia
 */
export const createNews = async ({ title, content, cover_image_url, tag, author_id }) => {
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

/**
 * Actualizar una noticia
 */
export const updateNews = async (id, updates) => {
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

/**
 * Eliminar una noticia
 */
export const deleteNews = async (id) => {
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

/**
 * Subir imagen de portada de noticia
 */
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

/**
 * Eliminar imagen de portada de noticia
 */
export const deleteNewsImage = async (url) => {
  try {
    logger.db('Deleting news image')

    // Extract path from the public URL
    const path = url.split('/news-images/')[1]
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

// ─── Characters ──────────────────────────────────────────

/**
 * Obtener todos los personajes de un usuario
 */
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

/**
 * Eliminar un personaje
 */
export const deleteCharacter = async (characterId) => {
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
