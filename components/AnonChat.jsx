'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const formatTime = (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const QUICK_SLANG = ['Gaskeun! 🚀', 'Santuy 🍵', 'Otw bross 🛵', 'Siapp 🫡', 'P', 'L', 'Cabut dulu 🌫️']

function BackgroundMist() {
  return (
    <div className="cloud-container">
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
    </div>
  )
}

function HomeScreen({ onEnter }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState('create')

  const handleStart = () => {
    if (!name.trim()) return
    const roomCode = mode === 'create' ? Math.random().toString(36).substring(2, 8).toUpperCase() : code.toUpperCase()
    onEnter(roomCode, name.trim())
  }

  return (
    <main className="homeWrap">
      <BackgroundMist />
      
      <div className="brandLogo">kabut<span>.</span></div>
      
      <div className="introBox">
        <h2>Bisik-bisik paling aman di Nusantara.</h2>
        <p>
          Selamat datang di Kabut. Tempat nongkrong digital dimana obrolanmu 
          menguap seketika tanpa sisa. Tanpa database, tanpa riwayat, murni privasi.
        </p>
      </div>
      
      <div className="homeCard">
        <div style={{display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '15px', marginBottom: '2.5rem'}}>
          <button onClick={() => setMode('create')} style={{flex:1, background: mode==='create'?'white':'transparent', color: mode==='create'?'black':'white', border:'none', padding:'0.7rem', borderRadius:'12px', fontWeight:'700', cursor:'pointer', transition:'0.3s'}}>Buat Room</button>
          <button onClick={() => setMode('join')} style={{flex:1, background: mode==='join'?'white':'transparent', color: mode==='join'?'black':'white', border:'none', padding:'0.7rem', borderRadius:'12px', fontWeight:'700', cursor:'pointer', transition:'0.3s'}}>Gabung</button>
        </div>

        <div className="inputGroup">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama samaran kamu..." maxLength={15} />
          {mode === 'join' && <input style={{letterSpacing:'6px', fontWeight:'800'}} value={code} onChange={e => setCode(e.target.value)} placeholder="KODE ROOM" maxLength={6} />}
        </div>
        
        <button className="btnStart" onClick={handleStart} disabled={!name}>
          MULAI NONGKRONG →
        </button>
      </div>

      <div style={{marginTop:'2rem', fontSize:'0.7rem', color:'var(--text-soft)', textTransform:'uppercase', letterSpacing:'2px'}}>
        Privacy is a Choice.
      </div>
    </main>
  )
}

function ChatScreen({ roomCode, myName, onLeave }) {
  const [messages, setMessages] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [inputValue, setInputValue] = useState('')
  
  const channelRef = useRef(null)
  const bottomRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const channel = supabase.channel(`kabut_final_${roomCode}`, {
      config: { presence: { key: myName } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length)
      })
      .on('broadcast', { event: 'msg' }, ({ payload }) => {
        setMessages(prev => [...prev, payload])
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers(prev => {
          const next = new Set(prev)
          if (payload.typing) next.add(payload.user)
          else next.delete(payload.user)
          return next
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() })
      })

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [roomCode, myName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const sendMsg = async (content, type = 'text') => {
    if (!content && type === 'text') return
    const msg = {
      id: crypto.randomUUID(),
      sender: myName,
      text: content,
      type: type,
      ts: Date.now()
    }
    setMessages(prev => [...prev, msg])
    await channelRef.current?.send({ type: 'broadcast', event: 'msg', payload: msg })
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user: myName, typing: false } })
    setInputValue('')
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user: myName, typing: true } })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user: myName, typing: false } })
    }, 2000)
  }

  return (
    <div className="chatWrap">
      <BackgroundMist />
      
      <header className="chatHeader">
        <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{fontWeight:'800', fontSize:'1.4rem', letterSpacing:'-1px'}}>kabut<span>.</span></div>
          <div style={{background:'rgba(52,211,153,0.1)', color:'var(--kabut-accent)', padding:'0.3rem 0.8rem', borderRadius:'100px', fontSize:'0.7rem', fontWeight:'800'}}>
            {onlineCount} ONLINE
          </div>
        </div>
        <div style={{display:'flex', gap:'0.8rem'}}>
          <button style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'0.5rem 1rem', borderRadius:'10px', fontSize:'0.75rem', fontWeight:'700', cursor:'pointer'}} onClick={() => {navigator.clipboard.writeText(roomCode); alert('Kode Room disalin!');}}>
            KODE: {roomCode}
          </button>
          <button style={{background:'rgba(239, 68, 68, 0.1)', border:'1px solid rgba(239, 68, 68, 0.2)', color:'#ef4444', padding:'0.5rem 1rem', borderRadius:'10px', fontSize:'0.75rem', fontWeight:'700', cursor:'pointer'}} onClick={onLeave}>
            CABUT
          </button>
        </div>
      </header>

      <div className="messages">
        <div style={{textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-soft)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '4px'}}>Pesan bakal hilang setelah sesi berakhir...</div>
        
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1]
          const isSameSender = prevMsg && prevMsg.sender === msg.sender && (msg.ts - prevMsg.ts < 60000)
          return (
            <div key={msg.id} className={`msgRow ${msg.sender === myName ? 'me' : 'them'}`}>
              {!isSameSender && <div style={{fontSize: '0.7rem', fontWeight: '800', color: msg.sender===myName?'var(--kabut-accent)':'white', marginBottom: '0.2rem', marginLeft: '0.5rem'}}>{msg.sender}</div>}
              <div className={`bubble ${msg.sender === myName ? 'me' : 'them'}`}>
                {msg.text}
                <div style={{fontSize: '0.55rem', opacity: 0.5, marginTop: '0.3rem', textAlign: 'right'}}>{formatTime(msg.ts)}</div>
              </div>
            </div>
          )
        })}
        {Array.from(typingUsers).map(user => (
          <div key={user} style={{fontSize: '0.7rem', color: 'var(--text-soft)', marginLeft: '1rem', marginBottom:'1rem'}}>...{user} lagi ngetik</div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{padding:'0.5rem 1.5rem', display:'flex', gap:'0.5rem', overflowX:'auto', scrollbarWidth:'none'}}>
        {QUICK_SLANG.map(s => (
          <button key={s} onClick={() => sendMsg(s)} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', color:'white', padding:'0.4rem 1rem', borderRadius:'100px', fontSize:'0.7rem', whiteSpace:'nowrap', cursor:'pointer'}}>{s}</button>
        ))}
      </div>

      <div className="inputArea">
        <input 
          className="mainInput" 
          value={inputValue} 
          onChange={handleInputChange} 
          onKeyDown={e => e.key === 'Enter' && sendMsg(inputValue)} 
          placeholder="Bisikkan sesuatu di sini..." 
        />
        <button className="btnSend" onClick={() => sendMsg(inputValue)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}

export default function AnonChat() {
  const [room, setRoom] = useState(null)
  if (!room) return <HomeScreen onEnter={(code, name) => setRoom({ code, name })} />
  return <ChatScreen roomCode={room.code} myName={room.name} onLeave={() => setRoom(null)} />
}
