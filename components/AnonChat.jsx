'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const QUICK_SLANG = ['Gaskeun! 🚀', 'Santuy 🍵', 'Otw bross 🛵', 'Siapp 🫡', 'P', 'L', 'Cabut dulu 🌫️']

function BackgroundMist() {
  return (
    <div className="cloud-container">
      <div className="cloud" style={{top:'-10%', left:'-10%', background:'radial-gradient(circle, rgba(52, 211, 153, 0.05) 0%, transparent 70%)'}}></div>
      <div className="cloud" style={{bottom:'-10%', right:'-10%', background:'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)'}}></div>
    </div>
  )
}

function HomeScreen({ onEnter }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState('create')

  const handleStart = () => {
    if (!name.trim()) return
    // Pastikan kode Room selalu bersih dari spasi dan Uppercase
    const finalCode = mode === 'create' 
      ? Math.random().toString(36).substring(2, 8).toUpperCase() 
      : code.trim().toUpperCase()
    onEnter(finalCode, name.trim())
  }

  return (
    <main className="homeWrap">
      <BackgroundMist />
      <div style={{fontFamily:'Space Grotesk', fontSize:'4rem', fontWeight:'800', letterSpacing:'-4px', marginBottom:'1rem'}}>kabut<span>.</span></div>
      <div style={{textAlign:'center', marginBottom:'2.5rem', padding:'0 1rem'}}>
        <h2 style={{fontSize:'1.1rem', marginBottom:'0.4rem'}}>Chat Anonim Tanpa Jejak.</h2>
        <p style={{fontSize:'0.8rem', color:'var(--text-soft)'}}>Ngobrol bebas sesukamu. Pesan bakal hilang otomatis.</p>
      </div>
      <div className="homeCard">
        <div style={{display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '15px', marginBottom: '2rem'}}>
          <button onClick={() => setMode('create')} style={{flex:1, background: mode==='create'?'white':'transparent', color: mode==='create'?'black':'white', border:'none', padding:'0.7rem', borderRadius:'12px', fontWeight:'700'}}>Buat</button>
          <button onClick={() => setMode('join')} style={{flex:1, background: mode==='join'?'white':'transparent', color: mode==='join'?'black':'white', border:'none', padding:'0.7rem', borderRadius:'12px', fontWeight:'700'}}>Gabung</button>
        </div>
        <input className="homeInput" value={name} onChange={e => setName(e.target.value)} placeholder="Nama samaran..." maxLength={15} style={{width:'100%', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.05)', padding:'1rem', borderRadius:'15px', color:'white', marginBottom:'1rem', textAlign:'center', fontSize:'16px'}} />
        {mode === 'join' && <input className="homeInput" value={code} onChange={e => setCode(e.target.value)} placeholder="KODE ROOM" maxLength={8} style={{width:'100%', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.05)', padding:'1rem', borderRadius:'15px', color:'white', marginBottom:'1rem', textAlign:'center', fontSize:'16px', letterSpacing:'4px', fontWeight:'800'}} />}
        <button className="btnStart" onClick={handleStart} disabled={!name} style={{width:'100%', padding:'1rem', background:'white', color:'black', border:'none', borderRadius:'15px', fontWeight:'800', fontSize:'16px'}}>GAS CHATTING! 💬</button>
      </div>
    </main>
  )
}

function ChatScreen({ roomCode, myName, onLeave }) {
  const [messages, setMessages] = useState([])
  const [onlineCount, setOnlineCount] = useState(1)
  const [status, setStatus] = useState('connecting')
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [inputValue, setInputValue] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  
  const channelRef = useRef(null)
  const bottomRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    // Normalisasi roomCode satu kali lagi
    const cleanRoomCode = roomCode.trim().toUpperCase()
    const channel = supabase.channel(`room:${cleanRoomCode}`, {
      config: { presence: { key: myName }, broadcast: { self: false, ack: true } }
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
        setStatus(status)
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [roomCode, myName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const sendMsg = async (content) => {
    if (!content.trim()) return
    const msg = {
      id: `${Date.now()}-${Math.random()}`,
      sender: myName,
      text: content,
      ts: Date.now(),
      reply: replyTo ? { sender: replyTo.sender, text: replyTo.text } : null
    }
    setMessages(prev => [...prev, msg])
    await channelRef.current?.send({ type: 'broadcast', event: 'msg', payload: msg })
    setInputValue('')
    setReplyTo(null)
  }

  const copyRoom = () => {
    try {
      const el = document.createElement('textarea')
      el.value = roomCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      alert('Kode disalin: ' + roomCode)
    } catch (e) { alert('Kode: ' + roomCode) }
  }

  return (
    <div className="chatWrap">
      <BackgroundMist />
      <header className="chatHeader">
        <div>
          <div style={{fontWeight:'800', fontSize:'1.2rem'}}>kabut<span>.</span></div>
          <div style={{fontSize:'0.6rem', display:'flex', alignItems:'center', gap:'4px'}}>
             <div style={{width:'6px', height:'6px', borderRadius:'50%', background: status==='SUBSCRIBED'?'#34d399':'#fbbf24'}}></div>
             {status==='SUBSCRIBED' ? 'CONNECTED' : 'CONNECTING...'} • {onlineCount} ONLINE
          </div>
        </div>
        <div style={{display:'flex', gap:'0.6rem'}}>
          <button onClick={copyRoom} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'0.4rem 0.8rem', borderRadius:'10px', fontSize:'0.7rem', fontWeight:'700'}}>SALIN KODE</button>
          <button onClick={onLeave} style={{background:'rgba(239, 68, 68, 0.1)', border:'none', color:'#ef4444', padding:'0.4rem 0.8rem', borderRadius:'10px', fontSize:'0.7rem', fontWeight:'800'}}>CABUT</button>
        </div>
      </header>

      <div className="messages" onClick={() => setReplyTo(null)}>
        {messages.map((msg, idx) => {
          const isMe = msg.sender === myName
          const prevMsg = messages[idx - 1]
          const isSameSender = prevMsg && prevMsg.sender === msg.sender && (msg.ts - prevMsg.ts < 60000)
          return (
            <div key={msg.id} className={`msgRow ${isMe ? 'me' : 'them'}`} onDoubleClick={() => setReplyTo(msg)}>
              {!isSameSender && <div style={{fontSize: '0.7rem', fontWeight: '800', color: isMe?'var(--kabut-accent)':'white', marginBottom: '0.2rem', marginLeft: '0.4rem'}}>{msg.sender}</div>}
              <div className={`bubble ${isMe ? 'me' : 'them'}`}>
                {msg.reply && <div style={{fontSize:'0.7rem', opacity:0.6, borderLeft:'2px solid rgba(255,255,255,0.3)', paddingLeft:'0.5rem', marginBottom:'0.3rem'}}><strong>{msg.reply.sender}</strong>: {msg.reply.text.substring(0,30)}</div>}
                {msg.text}
                <div style={{fontSize: '0.55rem', opacity: 0.5, marginTop: '0.3rem', textAlign: 'right'}}>{formatTime(msg.ts)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{padding:'0.5rem 1rem', display:'flex', gap:'0.4rem', overflowX:'auto', scrollbarWidth:'none'}}>
        {QUICK_SLANG.map(s => <button key={s} onClick={() => sendMsg(s)} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', color:'white', padding:'0.4rem 0.8rem', borderRadius:'100px', fontSize:'0.7rem', whiteSpace:'nowrap'}}>{s}</button>)}
      </div>

      <div className="inputArea">
        <input className="inputField" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg(inputValue)} placeholder="Ketik pesan..." />
        <button className="btnSend" onClick={() => sendMsg(inputValue)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}

export default function AnonChat() {
  const [room, setRoom] = useState(null)
  return room ? <ChatScreen roomCode={room.code} myName={room.name} onLeave={() => setRoom(null)} /> : <HomeScreen onEnter={(code, name) => setRoom({ code, name })} />
}
