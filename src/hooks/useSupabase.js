import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Funciones de autenticación
  const signUp = async (email, password, userData = {}) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!user
  }
}

export const useSupabase = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const executeQuery = async (queryFn) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await queryFn()
      setLoading(false)
      return result
    } catch (err) {
      setError(err)
      setLoading(false)
      throw err
    }
  }

  // Funciones para manejar perfiles de usuario
  const getUserProfile = async (userId) => {
    return executeQuery(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data
    })
  }

  const updateUserProfile = async (userId, updates) => {
    return executeQuery(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  }

  const createUserProfile = async (profile) => {
    return executeQuery(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single()
      
      if (error) throw error
      return data
    })
  }

  // Función genérica para cualquier consulta
  const query = async (table) => {
    return {
      select: (columns = '*') => ({
        eq: (column, value) => executeQuery(async () => {
          const { data, error } = await supabase
            .from(table)
            .select(columns)
            .eq(column, value)
          
          if (error) throw error
          return data
        }),
        
        single: () => executeQuery(async () => {
          const { data, error } = await supabase
            .from(table)
            .select(columns)
            .single()
          
          if (error) throw error
          return data
        }),
        
        execute: () => executeQuery(async () => {
          const { data, error } = await supabase
            .from(table)
            .select(columns)
          
          if (error) throw error
          return data
        })
      }),
      
      insert: (values) => ({
        execute: () => executeQuery(async () => {
          const { data, error } = await supabase
            .from(table)
            .insert(values)
            .select()
          
          if (error) throw error
          return data
        })
      }),
      
      update: (values) => ({
        eq: (column, value) => ({
          execute: () => executeQuery(async () => {
            const { data, error } = await supabase
              .from(table)
              .update(values)
              .eq(column, value)
              .select()
            
            if (error) throw error
            return data
          })
        })
      }),
      
      delete: () => ({
        eq: (column, value) => ({
          execute: () => executeQuery(async () => {
            const { data, error } = await supabase
              .from(table)
              .delete()
              .eq(column, value)
            
            if (error) throw error
            return data
          })
        })
      })
    }
  }

  return {
    loading,
    error,
    getUserProfile,
    updateUserProfile,
    createUserProfile,
    query,
    supabase
  }
}