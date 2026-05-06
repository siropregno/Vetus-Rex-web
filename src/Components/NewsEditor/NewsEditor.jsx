import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor, EditorContent } from '@tiptap/react'
import Modal from '../Modal/Modal'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify } from '@fortawesome/free-solid-svg-icons'
import './NewsEditor.css'

const MenuBar = ({ editor, uploadImage }) => {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')

  const handleImageFile = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    setUploading(true)
    const { data: url, error } = await uploadImage(file)
    if (error) {
      setAlertMsg(error.message || 'Error uploading image.')
    } else if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
    setUploading(false)
    e.target.value = ''
  }, [editor, uploadImage])

  const addImageByUrl = useCallback(() => {
    if (!editor) return
    const url = window.prompt(t('newsCreate.imageUrlPrompt'))
    if (url) {
      try {
        const urlObj = new URL(url)
        if (!['https:'].includes(urlObj.protocol)) {
          setAlertMsg('Only HTTPS URLs are allowed.')
          return
        }
      } catch {
        setAlertMsg('Invalid URL.')
        return
      }
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor, t])

  const addLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt(t('newsCreate.urlPrompt'), previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    try {
      const urlObj = new URL(url)
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        setAlertMsg('Invalid URL protocol.')
        return
      }
    } catch {
      setAlertMsg('Invalid URL.')
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor, t])

  const addYoutube = useCallback(() => {
    if (!editor) return
    const url = window.prompt('YouTube URL:')
    if (url) {
      try {
        const urlObj = new URL(url)
        if (!['www.youtube.com', 'youtube.com', 'youtu.be'].includes(urlObj.hostname)) {
          setAlertMsg('Only YouTube URLs are allowed.')
          return
        }
      } catch {
        setAlertMsg('Invalid URL.')
        return
      }
      editor.commands.setYoutubeVideo({ src: url })
    }
  }, [editor])

  if (!editor) return null

  return (
    <>
    <Modal
      isOpen={Boolean(alertMsg)}
      onClose={() => setAlertMsg('')}
      title="Error"
      message={alertMsg}
      type="alert"
    />
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Align Left"
        >
          <FontAwesomeIcon icon={faAlignLeft} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Align Center"
        >
          <FontAwesomeIcon icon={faAlignCenter} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Align Right"
        >
          <FontAwesomeIcon icon={faAlignRight} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Justify"
        >
          <FontAwesomeIcon icon={faAlignJustify} />
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Ordered List"
        >
          1. List
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Quote"
        >
          ❝
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="toolbar-btn"
          title="Horizontal Rule"
        >
          ―
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={addLink}
          className={editor.isActive('link') ? 'toolbar-btn active' : 'toolbar-btn'}
          title="Link"
        >
          🔗
        </button>

        {uploadImage ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleImageFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="toolbar-btn"
              title="Upload Image"
              disabled={uploading}
            >
              {uploading ? '···' : '🖼'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={addImageByUrl}
            className="toolbar-btn"
            title="Image URL"
          >
            🖼
          </button>
        )}

        <button
          type="button"
          onClick={addYoutube}
          className="toolbar-btn"
          title="YouTube"
        >
          ▶
        </button>
      </div>
    </div>
    </>
  )
}

const NewsEditor = ({ content = '', onChange, uploadImage }) => {
  const { t } = useTranslation()
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: 'editor-image' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Placeholder.configure({
        placeholder: t('newsCreate.editorPlaceholder'),
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  return (
    <div className="news-editor">
      <MenuBar editor={editor} uploadImage={uploadImage} />
      <EditorContent editor={editor} className="editor-content" />
    </div>
  )
}

export default NewsEditor
