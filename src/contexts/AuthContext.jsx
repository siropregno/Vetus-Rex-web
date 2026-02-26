import React, { createContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    logger.auth('Initializing AuthContext')
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        logger.auth('Getting initial session')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error('Error getting session:', error)
        } else {
          logger.auth('Initial session result', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email
          })
          
          setSession(session)
          setUser(session?.user ?? null)
          
          // If there's a user, load profile without blocking
          if (session?.user) {
            loadUserProfile(session.user.id) // Without await
          }
        }
      } catch (error) {
        logger.error('Error in getInitialSession:', error)
      } finally {
        logger.auth('Initial loading complete, setting loading to false')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.auth('Auth state changed', { event, userEmail: session?.user?.email })
        
        setSession(session)
        setUser(session?.user ?? null)

        // Set loading to false IMMEDIATELY
        logger.auth('Setting loading to false immediately')
        setLoading(false)

        // Load profile in parallel without blocking
        if (session?.user) {
          loadUserProfile(session.user.id) // Without await to avoid blocking
        } else {
          setProfile(null)
        }

        logger.auth('Auth state change processing complete')
      }
    )

    return () => {
      logger.auth('Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [])

  // Separate function to load profile
  const loadUserProfile = async (userId) => {
    try {
      logger.db('Loading profile for user', { userId })
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Profile not found (404) - Table may not exist or no profile created')
        } else {
          logger.error('Error loading profile:', error)
        }
        setProfile(null)
      } else {
        logger.success('Profile loaded successfully')
        setProfile(data)
      }
    } catch (error) {
      logger.error('Exception loading profile:', error)
      setProfile(null)
    }
    
    logger.db('loadUserProfile completed')
  }

  // Register new user
  const signUp = async (email, password, userData = {}) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.username || '',
            username: userData.username || '',
            avatar_url: userData.avatarUrl || ''
          }
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      logger.error('Error in signUp:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign in (accepts email or username)
  const signIn = async (identifier, password) => {
    setLoading(true)
    try {
      let email = identifier

      // If it doesn't look like an email, look up the email by username in profiles
      if (!identifier.includes('@')) {
        const { data: profileData, error: lookupError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .single()

        if (lookupError || !profileData) {
          throw new Error('User not found')
        }
        email = profileData.email
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      logger.error('Error in signIn:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    logger.auth('Starting signOut process')
    setLoading(true)
    
    try {
      setUser(null)
      setSession(null)
      setProfile(null)
      
      localStorage.clear()
      sessionStorage.clear()
      
      await supabase.auth.signOut()
      logger.success('SignOut completed successfully')
      
    } catch (error) {
      logger.error('Error in signOut:', error)
    } finally {
      setLoading(false)
    }
    
    return { error: null }
  }

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return { data: null, error: new Error('No authenticated user') }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      
      // Sync username/full_name to auth metadata and display_name
      if (updates.username || updates.full_name) {
        const displayName = updates.username || updates.full_name
        await supabase.auth.updateUser({
          data: {
            ...(updates.username && { username: updates.username }),
            ...(updates.full_name && { full_name: updates.full_name }),
            display_name: displayName
          }
        })
      }

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      logger.error('Error updating profile:', error)
      return { data: null, error }
    }
  }

  // Upload avatar - simplified version
  const uploadAvatar = async (file) => {
    if (!user) {
      return { data: null, error: new Error('No authenticated user') }
    }
    
    try {
      logger.info('Uploading avatar', { fileName: file.name, size: file.size })
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl
      })
      
      if (updateError) throw updateError
      
      logger.success('Avatar uploaded successfully')
      return { data: publicUrl, error: null }
    } catch (error) {
      logger.error('Error uploading avatar:', error)
      return { data: null, error }
    }
  }

  // Eliminar avatar
  const deleteAvatar = async () => {
    if (!user || !profile?.avatar_url) return { error: null }
    
    try {
      const { error } = await updateProfile({ avatar_url: null })
      if (error) throw error
      return { error: null }
    } catch (error) {
      logger.error('Error deleting avatar:', error)
      return { error }
    }
  }

  // Delete account
  const deleteAccount = async () => {
    if (!user) {
      return { error: new Error('No authenticated user') }
    }

    try {
      logger.warn('Starting account deletion process')
      
      // First delete profile from database
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        logger.error('Error deleting profile:', profileError)
        // Don't return here because we still want to try deleting the auth account
      }

      // Delete avatar from storage if it exists
      if (profile?.avatar_url) {
        try {
          const fileName = profile.avatar_url.split('/').pop()
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${fileName}`])
        } catch (storageError) {
          logger.error('Error deleting avatar from storage:', storageError)
          // Not critical, continue
        }
      }

      // Finally delete the auth account
      const { error: authError } = await supabase.rpc('delete_user')

      if (authError) {
        throw authError
      }

      // Clean up local state
      setUser(null)
      setSession(null)
      setProfile(null)
      
      localStorage.clear()
      sessionStorage.clear()

      logger.success('Account deleted successfully')
      return { error: null }
    } catch (error) {
      logger.error('Error deleting account:', error)
      return { error }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    deleteAccount,
    isAuthenticated: !!user,
    loadUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext