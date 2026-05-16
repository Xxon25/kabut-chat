'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function HomeScreen({ onEnter }) {
  const [mode, setMode] = useState('create')
  const [nameInput, setNameInput] = useState('')
  const [joinInput, setJoinInput] = useState('')

  const isValid = nameInput.trim() && (mode === 'create' || joinInput.trim().length === 6)

  function handleStart() {
    if (!isValid) return
    const name = nameInput.trim()
    const code = mode === 'create' ? generateRoomCode() : joinInput.trim().toUpperCase()
    onEnter(code, name)
  }

  return (
    <main className="homeWrap">
      <div className="brand">
        <h1 className="brandName"><span className="brandMono">anon</span>chat</h1>
        <p className="brandSub">Ngobrol anonim · Tanpa akun · Pesan hilang saat keluar</p>
      </div>

      <div className="toggle">
        {['create', 'join'].map(m => (
          <button key={m} className={`toggleBtn ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
            {m === 'create' ? 'Buat Room' : 'Gabung Room'}
          </button>
        ))}
      </div>

      <label htmlFor="name">Nama kamu</label>
      <input
        id="name"
        value={nameInput}
        onChange={e => setNameInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleStart()}
        placeholder="Masukkan nama..."
        autoFocus
      />

      {mode === 'join' && (
        <>
          <label htmlFor="code">Kode room</label>
          <input
            id="code"
            className="monoInput"
            value={joinInput}
            onChange={e => setJoinInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="Contoh: A3X7K2"
            maxLength={6}
          />
        </>
      )}

      <button className="btnMain" onClick={handleStart} disabled={!isValid}>
        {mode === 'create' ? 'Buat Room Baru →' : 'Masuk ke Room →'}
      </button>

      <p className="hint">
        Tidak ada akun. Tidak ada riwayat.<br />
        Semua pesan dihapus saat kamu menutup tab.
      </p>
    </main>
  )
}

function ChatScreen({ roomCode, myName, onLeave }) {
  const [messages, setMessages] = useState([])
  const [members, setMembers] = useState(new Set([myName]))
  const [inputValue, setInputValue] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const channelRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    const channel = supabase.channel(`anonchat:${roomCode}`, {
      config: { broadcast: { self: false } }
    })

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages(prev => [...prev, { ...payload, type: 'msg' }])
      })
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        setMembers(prev => new Set([...prev, payload.name]))
        setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'sys', text: `${payload.name} bergabung` }])
        channel.send({ type: 'broadcast', event: 'pong', payload: { name: myName } })
      })
      .on('broadcast', { event: 'pong' }, ({ payload }) => {
        setMembers(prev => new Set([...prev, payload.name]))
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        setMembers(prev => {
          const next = new Set(prev)
          next.delete(payload.name)
          return next
        })
        setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'sys', text: `${payload.name} meninggalkan room` }])
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return
        try {
          await channel.send({ type: 'broadcast', event: 'join', payload: { name: myName } })
        } catch (err) {
          console.error('Failed to announce join:', err)
          setError('Gagal terhubung ke room. Coba lagi.')
        }
      })

    channelRef.current = channel

    return () => {
      channel.send({ type: 'broadcast', event: 'leave', payload: { name: myName } })
      supabase.removeChannel(channel)
    }
  }, [roomCode, myName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || !channelRef.current) return

    const msg = { id: crypto.randomUUID(), sender: myName, text: inputValue.trim(), ts: Date.now() }

    setInputValue('')
    setMessages(prev => [...prev, { ...msg, type: 'msg' }])

    try {
      await channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg })
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Pesan gagal terkirim.')
    }
  }, [inputValue, myName])

  async function handleLeave() {
    try {
      await channelRef.current?.send({ type: 'broadcast', event: 'leave', payload: { name: myName } })
    } catch (err) {
      console.error('Failed to send leave event:', err)
    } finally {
      supabase.removeChannel(channelRef.current)
      onLeave()
    }
  }

  async function copyRoomLink() {
    const link = `${window.location.origin}?join=${roomCode}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      await navigator.clipboard.writeText(roomCode)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="chatWrap">
      <header className="chatHeader">
        <div>
          <div className="codeLabel">Kode Room</div>
          <button className="codeDisplay" onClick={copyRoomLink}>
            {roomCode}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            {copied && <span className="copiedBadge">Disalin!</span>}
          </button>
        </div>
        <div className="headerRight">
          <span className="onlineBadge">
            <span className="onlineDot" />
            {members.size} online
          </span>
          <button className="leaveBtn" onClick={handleLeave}>Keluar</button>
        </div>
      </header>

      <div className="messages">
        <div className="sysMsg">Room aktif · Pesan hilang saat keluar</div>

        {error && <div className="errorMsg">{error}</div>}

        {messages.map(msg => {
          if (msg.type === 'sys') return <div key={msg.id} className="sysMsg">{msg.text}</div>

          const isMe = msg.sender === myName
          return (
            <div key={msg.id} className={`msgRow ${isMe ? 'me' : ''}`}>
              <div className="bubbleWrap">
                {!isMe && <div className="msgSender">{msg.sender}</div>}
                <div className={`bubble ${isMe ? 'me' : 'them'}`}>{msg.text}</div>
                <div className={`msgTime ${isMe ? 'me' : ''}`}>{formatTime(msg.ts)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="inputRow">
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Tulis pesan..."
          autoFocus
        />
        <button className="sendBtn" onClick={sendMessage} disabled={!inputValue.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Kirim">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function AnonChat() {
  const [room, setRoom] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinCode = params.get('join')
    if (!joinCode) return

    const name = window.prompt('Masukkan nama kamu:')?.trim()
    if (name) setRoom({ code: joinCode.toUpperCase(), name })
    window.history.replaceState({}, '', '/')
  }, [])

  if (!room) return <HomeScreen onEnter={(code, name) => setRoom({ code, name })} />

  return <ChatScreen roomCode={room.code} myName={room.name} onLeave={() => setRoom(null)} />
}
