import React, { useState, useEffect, useRef } from 'react'
import { Clock, Copy, Check, Bookmark, BookmarkCheck, ArrowDown, Search, Sparkles, Filter } from 'lucide-react'

export default function NotesFeed({ notes = [], sessionTitle = '', autoScrollEnabled = true, onToggleAutoScroll }) {
  const [copiedId, setCopiedId] = useState(null)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [filterQuery, setFilterQuery] = useState('')
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  
  // Auto-scroll manual override tracking
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false)
  const containerRef = useRef(null)
  const bottomAnchorRef = useRef(null)
  const prevNotesLengthRef = useRef(notes.length)

  // Detect user manual scroll up/down
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    // If user is more than 120px away from the bottom, pause auto-scroll
    if (distanceFromBottom > 120) {
      setUserHasScrolledUp(true)
    } else {
      setUserHasScrolledUp(false)
    }
  }

  // Smooth scroll to bottom when new notes arrive (unless user manually scrolled up)
  useEffect(() => {
    if (notes.length > prevNotesLengthRef.current) {
      if (!userHasScrolledUp && bottomAnchorRef.current) {
        bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth' })
      }
      prevNotesLengthRef.current = notes.length
    }
  }, [notes, userHasScrolledUp])

  const scrollToBottom = () => {
    setUserHasScrolledUp(false)
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyNoteSection = async (note) => {
    const bullets = Array.isArray(note.bullet_points)
      ? note.bullet_points.map((b) => `• ${b}`).join('\n')
      : `• ${note.bullet_points || ''}`
    const text = `${note.heading}\n${bullets}`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(note.id)
      setTimeout(() => setCopiedId(null), 1800)
    } catch (e) {
      console.error(e)
    }
  }

  // Filter notes by search query and bookmarks
  const filteredNotes = notes.filter((note) => {
    if (showBookmarksOnly && !bookmarkedIds.has(note.id)) return false
    if (!filterQuery.trim()) return true
    const q = filterQuery.toLowerCase()
    const inHeading = note.heading.toLowerCase().includes(q)
    const inBullets = note.bullet_points.some((b) => b.toLowerCase().includes(q))
    return inHeading || inBullets
  })

  return (
    <div className="relative flex flex-col h-full">
      {/* Feed Filter & Search Bar */}
      <div className="sticky top-0 z-20 pb-3 bg-gradient-to-b from-[#080c14] via-[#080c14]/95 to-transparent pt-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search concepts, metrics, speakers..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              showBookmarksOnly
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showBookmarksOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Bookmarks</span>
            {bookmarkedIds.size > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-mono">
                {bookmarkedIds.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Notes Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 pr-1 pb-16 scroll-smooth"
      >
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 glass-card rounded-2xl p-8 border border-slate-800/80">
            <Sparkles className="w-10 h-10 text-emerald-400/40 mb-3 animate-pulse" />
            <h4 className="text-sm font-semibold text-slate-300">
              {filterQuery ? 'No matching notes found' : 'Awaiting Live Audio Transcription'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {filterQuery
                ? 'Try searching for different keywords or clear the filter.'
                : 'When the podium speaker starts lecturing, structured bullet points will stream here in real time.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note, idx) => {
            const isBookmarked = bookmarkedIds.has(note.id)
            const isCopied = copiedId === note.id

            return (
              <article
                key={note.id || idx}
                id={`note-${note.id}`}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80 animate-note-enter"
              >
                {/* Emerald vertical accent on left border */}
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-emerald-500 to-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />

                {/* Card Header: Timestamp & Action Controls */}
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                      {idx + 1}
                    </span>
                    {note.timestamp_marker && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {note.timestamp_marker}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {/* Copy note section button */}
                    <button
                      onClick={() => copyNoteSection(note)}
                      title="Copy section"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Bookmark toggle */}
                    <button
                      onClick={() => toggleBookmark(note.id)}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark note'}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bold Section Heading */}
                <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-snug mb-3">
                  {note.heading}
                </h3>

                {/* Structured Bullet Points */}
                <ul className="space-y-2.5">
                  {Array.isArray(note.bullet_points) ? (
                    note.bullet_points.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-[0_0_6px_#10b981]" />
                        <span className="flex-1 select-text">{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span>{note.bullet_points}</span>
                    </li>
                  )}
                </ul>
              </article>
            )
          })
        )}
        <div ref={bottomAnchorRef} className="h-2" />
      </div>

      {/* Floating Manual Override Auto-Scroll Pill */}
      {userHasScrolledUp && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white font-medium text-xs shadow-xl shadow-emerald-950/80 hover:bg-emerald-500 transition-all animate-bounce"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>New notes streaming · Jump to newest</span>
        </button>
      )}
    </div>
  )
}
