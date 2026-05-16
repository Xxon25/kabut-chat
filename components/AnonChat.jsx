'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const formatTime = (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

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
      <div className="brandCircle">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="black"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zM12.04 20.13c-1.55 0-3.07-.42-4.39-1.21l-.31-.19-3.26.86.87-3.18-.2-.32c-.86-1.37-1.32-2.96-1.32-4.59 0-4.7 3.82-8.51 8.51-8.51 4.7 0 8.51 3.81 8.51 8.51 0 4.7-3.81 8.51-8.51 8.51z"/></svg>
      </div>
      <h1 className="brandName">kabut.</h1>
      
      <div className="homeCard">
        <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#2a3942', padding: '0.3rem', borderRadius: '8px'}}>
          <button onClick={() => setMode('create')} style={{flex:1, background: mode==='create'?'#00a884':'transparent', color: mode==='create'?'#0c141a':'white', border:'none', padding:'0.6rem', borderRadius:'6px', fontWeight:'700', cursor:'pointer'}}>Buat Obrolan</button>
          <button onClick={() => setMode('join')} style={{flex:1, background: mode==='join'?'#00a884':'transparent', color: mode==='join'?'#0c141a':'white', border:'none', padding:'0.6rem', borderRadius:'6px', fontWeight:'700', cursor:'pointer'}}>Gabung Room</button>
        </div>

        <input className="waInput" value={name} onChange={e => setName(e.target.value)} placeholder="Siapa namamu?" maxLength={15} />
        {mode === 'join' && <input className="waInput" style={{letterSpacing: '6px', textAlign: 'center', fontWeight: '700'}} value={code} onChange={e => setCode(e.target.value)} placeholder="KODE ROOM" maxLength={6} />}
        
        <button className="waBtn" onClick={handleStart} disabled={!name}>
          MULAI CHAT →
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
  const [recTime, setRecTime] = useState(0)
  
  const channelRef = useRef(null)
  const bottomRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const channel = supabase.channel(`proper:${roomCode}`, {
      config: { presence: { key: myName } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length)
      })
      .on('broadcast', { event: 'msg' }, ({ payload }) => {
        setMessages(prev => [...prev, payload])
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        setMessages(prev => prev.map(m => m.id === payload.msgId ? { ...m, react: payload.emoji } : m))
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
    return () => { 
      supabase.removeChannel(channel)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
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
      ts: Date.now(),
      react: null
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

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const path = `vn/${roomCode}/${Date.now()}.webm`
        const { error } = await supabase.storage.from('chat-assets').upload(path, blob)
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('chat-assets').getPublicUrl(path)
          sendMsg(publicUrl, 'vn')
        }
        clearInterval(timerRef.current)
        setRecTime(0)
      }
      mr.start()
      setIsRecording(true)
      timerRef.current = setInterval(() => setRecTime(prev => prev + 1), 1000)
    } catch (e) { alert('Mic diblokir.') }
  }

  const stopRec = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
    }
  }

  return (
    <div className="chatWrap">
      <header className="chatHeader">
        <div className="avatar">{roomCode[0]}</div>
        <div className="headerInfo">
          <div className="headerName">Room: {roomCode}</div>
          <div className="headerStatus">{onlineCount} anggota sedang online</div>
        </div>
        <div style={{display:'flex', gap:'1rem'}}>
          <button style={{background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer'}} onClick={() => {navigator.clipboard.writeText(roomCode); alert('Kode disalin!');}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}} onClick={onLeave}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      <div className="messages">
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1]
          const isSameSender = prevMsg && prevMsg.sender === msg.sender && (msg.ts - prevMsg.ts < 60000)
          return (
            <div key={msg.id} className={`msgRow ${msg.sender === myName ? 'me' : 'them'}`}>
              {!isSameSender && <div style={{fontSize: '0.75rem', fontWeight: '600', color: msg.sender===myName?'#00a884':'#34b7f1', marginBottom: '0.1rem', marginLeft: '0.4rem'}}>{msg.sender}</div>}
              <div className={`bubble ${msg.sender === myName ? 'me' : 'them'}`}>
                {msg.type === 'vn' ? <audio src={msg.text} controls className="audioItem" /> : msg.text}
                <div className="msgMeta">
                  <span>{formatTime(msg.ts)}</span>
                  {msg.sender === myName && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#53bdeb" strokeWidth="2.5"><polyline points="7 12 12 17 22 7"/><polyline points="2 12 7 17 12 12"/></svg>}
                </div>
              </div>
            </div>
          )
        })}
        {Array.from(typingUsers).map(user => (
          <div key={user} className="typingIndicator">{user} sedang mengetik...</div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="inputArea">
        <label style={{cursor: 'pointer', display: 'flex'}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          <input type="file" hidden accept="image/*" onChange={e => {
            const file = e.target.files[0];
            if (!file) return;
            const path = `img/${roomCode}/${Date.now()}-${file.name}`;
            supabase.storage.from('chat-assets').upload(path, file).then(({error}) => {
              if (error) return alert('Gagal kirim gambar.');
              const { data: { publicUrl } } = supabase.storage.from('chat-assets').getPublicUrl(path);
              sendMsg(publicUrl, 'image');
            });
          }} />
        </label>
        
        <div className="fieldWrap">
          <input value={inputValue} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && sendMsg(inputValue)} placeholder="Ketik pesan" />
        </div>

        {inputValue.trim() ? (
          <button className="circleBtn" onClick={() => sendMsg(inputValue)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        ) : (
          <button className="circleBtn" onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec} style={{background: isRecording?'#ef4444':'var(--wa-primary)'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function AnonChat() {
  const [room, setRoom] = useState(null)
  if (!room) return <HomeScreen onEnter={(code, name) => setRoom({ code, name })} />
  return <ChatScreen roomCode={room.code} myName={room.name} onLeave={() => setRoom(null)} />
}
