import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getUserCharacters, deleteCharacter } from '../../lib/database'
import Modal from '../Modal/Modal'
import logger from '../../utils/logger'
import './Chars.css'

const Chars = () => {
  const { user } = useAuthContext()
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null, variant: 'default' })

  const loadCharacters = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await getUserCharacters(user.id)
      
      if (error) {
        logger.error('Error loading characters:', error)
      } else {
        setCharacters(data || [])
      }
    } catch (error) {
      logger.error('Unexpected error loading characters:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load characters on component mount
  useEffect(() => {
    if (user) {
      loadCharacters()
    }
  }, [user, loadCharacters])

  const handleDelete = async (characterId) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Character',
      message: 'Are you sure you want to delete this character?',
      variant: 'danger',
      onConfirm: () => confirmDelete(characterId)
    })
  }

  const confirmDelete = async (characterId) => {
    setModal(m => ({ ...m, isOpen: false }))

    try {
      const { error } = await deleteCharacter(characterId)
      
      if (error) {
        logger.error('Error deleting character:', error)
        setModal({ isOpen: true, type: 'alert', title: 'Error', message: 'Error deleting character. Please try again.', variant: 'danger', onConfirm: null })
      } else {
        setCharacters(prev => prev.filter(char => char.id !== characterId))
      }
    } catch (error) {
      logger.error('Unexpected error deleting character:', error)
      setModal({ isOpen: true, type: 'alert', title: 'Error', message: 'Unexpected error while deleting character.', variant: 'danger', onConfirm: null })
    }
  }

  if (loading) {
    return (
      <div className="chars-container">
        <div className="chars-content">
          <div className="loading-state">
            <p>Loading characters...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chars-container">

      <div className="chars-content">
        {characters.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any characters yet. Create your first character in the game.</p>
          </div>
        ) : (
          <>
            <p>Your characters ({characters.length}/5)</p>
            <div className="characters-grid">
              {characters.map((character) => (
                <div key={character.id} className="character-card">
                  <div className="character-info">
                    <h3>{character.player_name}</h3>
                    <p className="character-level">Level {character.level}</p>
                  </div>
                  <div className="character-actions">
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(character.id)}
                      title="Delete character"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(m => ({ ...m, isOpen: false }))}
        onConfirm={modal.onConfirm || (() => setModal(m => ({ ...m, isOpen: false })))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        variant={modal.variant}
        confirmText={modal.type === 'alert' ? 'OK' : 'Delete'}
      />
    </div>
  )
}

export default Chars
