import { useState, useEffect, useRef } from 'react'
import './App.css'
import type { Note, NoteDetail } from './types'

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<NoteDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const selectedNoteRef = useRef<NoteDetail | null>(null);

  const fetchNotes = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/notes')
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 600)
    }
  }

  const fetchNoteDetail = async (slug: string, pushToHistory = true) => {
    setLoading(true)
    setError(null)
    setIsSidebarOpen(false)
    try {
      const response = await fetch(`/api/notes/${slug}`)
      if (!response.ok) {
        if (response.status === 404) throw new Error('Note not found')
        throw new Error('Failed to load note')
      }
      const data = await response.json()
      setSelectedNote(data)
      selectedNoteRef.current = data;
      
      if (pushToHistory) {
        window.history.pushState({ slug }, '', `/${slug}`);
      }
      
      window.scrollTo(0, 0);
    } catch (err: any) {
      setSelectedNote(null)
      selectedNoteRef.current = null
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearSelection = (pushToHistory = true) => {
    setSelectedNote(null);
    selectedNoteRef.current = null;
    setError(null);
    if (pushToHistory) {
      window.history.pushState(null, '', '/');
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('wiki-link')) {
      const slug = target.getAttribute('data-slug');
      if (slug) fetchNoteDetail(slug);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchNotes();
      
      // Load note from URL on initial load
      const pathSlug = window.location.pathname.substring(1);
      if (pathSlug && pathSlug !== '') {
        fetchNoteDetail(pathSlug, false);
      }
    };
    init();

    // Listen for Browser Back/Forward buttons
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.slug) {
        fetchNoteDetail(e.state.slug, false);
      } else {
        clearSelection(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/notes/events");
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "refresh") {
        fetchNotes();
        if (selectedNoteRef.current) {
          fetchNoteDetail(selectedNoteRef.current.slug, false);
        }
      }
    };
    return () => eventSource.close();
  }, []);

  return (
    <>
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {isSidebarOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <path d="M3 12h18M3 6h18M3 18h18"/>}
        </svg>
      </button>

      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <header className="sidebar-header">
          <h1 onClick={() => clearSelection()} style={{cursor: 'pointer'}}>Noted.</h1>
          <button
            onClick={fetchNotes}
            className={`refresh-btn ${isRefreshing ? 'is-refreshing' : ''}`}
            disabled={isRefreshing}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </header>
        <nav className="notes-list">
          {notes.map((note) => (
            <div
              key={note.slug}
              className={`note-item ${selectedNote?.slug === note.slug ? 'active' : ''}`}
              onClick={() => fetchNoteDetail(note.slug)}
            >
              <div className="note-title">{note.title}</div>
              <div className="note-meta">
                {note.folder_name && <span className="folder-tag">{note.folder_name}</span>}
                <span className="date">{new Date(note.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        {loading && !selectedNote ? (
          <div className="placeholder"><div className="loading-spinner"></div></div>
        ) : error ? (
          <div className="error-view">
            <div className="error-code">404</div>
            <h2>{error}</h2>
            <p>The note you're looking for doesn't exist yet.</p>
            <button onClick={() => window.history.back()} className="secondary-btn">Go Back</button>
          </div>
        ) : selectedNote ? (
          <article className="note-detail">
            <header className="note-header">
              <div className="note-header-top">
                <button className="back-nav-btn" onClick={() => window.history.back()} title="Go Back">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
                {selectedNote.folder_name && <div className="note-eyebrow">{selectedNote.folder_name}</div>}
              </div>
              <h1>{selectedNote.title}</h1>
              <div className="note-metadata">
                <div className="tags">
                  {selectedNote.tags?.map(tag => <span key={tag} className="tag">#{tag}</span>)}
                </div>
              </div>
            </header>
            
            <div
              className="markdown-body"
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ __html: selectedNote.content_html || '' }}
            />

            {selectedNote.links && selectedNote.links.length > 0 && (
              <section className="links-section">
                <h3>Backlinks</h3>
                <div className="backlink-grid">
                  {selectedNote.links.map(link => (
                    <div key={link.slug} className="backlink-card" onClick={() => fetchNoteDetail(link.slug)}>
                      <div className="backlink-title">{link.title}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        ) : (
          <div className="placeholder">Select a note to begin.</div>
        )}
      </main>
    </>
  )
}

export default App
