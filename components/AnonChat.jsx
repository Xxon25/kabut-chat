'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const formatTime = (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const QUICK_SLANG = ['Gaskeun! 🚀', 'Santuy 🍵', 'Otw bross 🛵', 'Siapp 🫡', 'P', 'L', 'Cabut dulu 🌫️']

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
    <main className="homeWrap" style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', maxWidth:'450px', margin:'0 auto'}}>
      <div className="brandLogo">kabut<span>.</span></div>
      <div style={{color:'var(--kabut-dim)', fontSize:'0.9rem', marginBottom:'3rem', textAlign:'center'}}>Jejakmu bakal ilang di balik kabut.</div>
      
      <div style={{width:'100%', background:'var(--kabut-surface)', backdropFilter:'blur(20px)', border:'1px solid var(--glass-border)', padding:'3rem 2rem', borderRadius:'32px'}}>
        <div style={{display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '15px', marginBottom: '2.5rem'}}>
          <button onClick={() => setMode('create')} style={{flex:1, background: mode==='create'?'var(--kabut-accent)':'transparent', color: mode==='create'?'#050608':'white', border:'none', padding:'0.7rem', borderRadius:'12px', fontWeight:'700', cursor:'pointer', transition:'0.3s'}}>Buat Room</button>
          <button onClick={() => setMode('join')} style={{flex:1, background: mode==='join'?'var(--kabut-accent)':'transparent', color: mode==='join'?'#050608':'white', border:'none', padding:'0.7rem', borderRadius:'12px', fontWeight:'700', cursor:'pointer', transition:'0.3s'}}>Gabung</button>
        </div>

        <input 
          style={{width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', padding:'1.2rem', borderRadius:'18px', color:'white', marginBottom:'1.5rem', textAlign:'center'}}
          value={name} onChange={e => setName(e.target.value)} placeholder="Nama samaran kamu..." maxLength={15} 
        />
        
        {mode === 'join' && (
          <input 
            style={{width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', padding:'1.2rem', borderRadius:'18px', color:'white', marginBottom:'1.5rem', textAlign:'center', letterSpacing:'6px', fontWeight:'700'}}
            value={code} onChange={e => setCode(e.target.value)} placeholder="KODE AKSES" maxLength={6} 
          />
        )}
        
        <button 
          style={{width:'100%', padding:'1.2rem', background:'white', color:'black', border:'none', borderRadius:'18px', fontWeight:'800', cursor:'pointer'}}
          onClick={handleStart} disabled={!name}
        >
          {mode === 'create' ? 'MASUK KABUT →' : 'GABUNG ROOM →'}
        </button>
      </div>
    </main>
  )
}

function ChatScreen({ roomCode, myName, onLeave }) {
  const [messages, setMessages] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [inputValue, setInputValue] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  
  const channelRef = useRef(null)
  const bottomRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const channel = supabase.channel(`sig:${roomCode}`, {
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
      <header className="chatHeader">
        <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{fontWeight:'800', fontSize:'1.4rem', letterSpacing:'-1px'}}>kabut<span>.</span></div>
          <div className="onlineBadge">
            <div style={{width: '6px', height: '6px', background: 'var(--kabut-accent)', borderRadius: '50%'}}></div>
            {onlineCount} ONLINE
          </div>
        </div>
        <div style={{display:'flex', gap:'0.8rem'}}>
          <button style={{background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', color:'white', padding:'0.5rem 1rem', borderRadius:'10px', fontSize:'0.75rem', fontWeight:'700', cursor:'pointer'}} onClick={() => {navigator.clipboard.writeText(roomCode); alert('Kode Room disalin!');}}>
            KODE: {roomCode}
          </button>
          <button style={{background:'rgba(239, 68, 68, 0.1)', border:'1px solid rgba(239, 68, 68, 0.2)', color:'#ef4444', padding:'0.5rem 1rem', borderRadius:'10px', fontSize:'0.75rem', fontWeight:'700', cursor:'pointer'}} onClick={onLeave}>
            KELUAR
          </button>
        </div>
      </header>

      <div className="messages">
        <div style={{textAlign: 'center', fontSize: '0.7rem', color: 'var(--kabut-dim)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px'}}>Obrolanmu bakal ilang tanpa jejak...</div>
        
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1]
          const isSameSender = prevMsg && prevMsg.sender === msg.sender && (msg.ts - prevMsg.ts < 60000)
          return (
            <div key={msg.id} className={`msgRow ${msg.sender === myName ? 'me' : 'them'}`}>
              {!isSameSender && <div style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--kabut-accent)', marginBottom: '0.3rem', marginLeft: '0.5rem'}}>{msg.sender}</div>}
              <div className={`bubble ${msg.sender === myName ? 'me' : 'them'}`}>
                {msg.type === 'vn' ? <audio src={msg.text} controls style={{filter:'invert(1)', height:'35px'}} /> : msg.text}
                <div style={{fontSize: '0.6rem', color: 'var(--kabut-dim)', marginTop: '0.4rem', textAlign: msg.sender===myName?'right':'left'}}>{formatTime(msg.ts)}</div>
              </div>
            </div>
          )
        })}
        {Array.from(typingUsers).map(user => (
          <div key={user} style={{fontSize: '0.7rem', color: 'var(--kabut-dim)', marginLeft: '1rem', fontStyle: 'italic'}}>...{user} lagi ngetik</div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="slangBar">
        {QUICK_SLANG.map(s => (
          <button key={s} className="slangBtn" onClick={() => sendMsg(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="inputArea">
        <input 
          className="mainInput" 
          value={inputValue} 
          onChange={handleInputChange} 
          onKeyDown={e => e.key === 'Enter' && sendMsg(inputValue)} 
          placeholder="Bisikkan sesuatu..." 
        />
        
        <button className="actionBtn" onClick={() => sendMsg(inputValue)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
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
