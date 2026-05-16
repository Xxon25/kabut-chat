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
      <div className="brandLogo">kabut<span>.</span></div>
      
      <div className="homeCard">
        <div style={{display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', background: '#050505', padding: '0.4rem', borderRadius: '12px'}}>
          <button className={`toggleBtn ${mode === 'create' ? 'active' : ''}`} onClick={() => setMode('create')} style={{flex:1, background: mode==='create'?'#3b82f6':'transparent', color: mode==='create'?'white':'#475569', border:'none', padding:'0.6rem', borderRadius:'8px', fontWeight:'700', cursor:'pointer'}}>Buat Room</button>
          <button className={`toggleBtn ${mode === 'join' ? 'active' : ''}`} onClick={() => setMode('join')} style={{flex:1, background: mode==='join'?'#3b82f6':'transparent', color: mode==='join'?'white':'#475569', border:'none', padding:'0.6rem', borderRadius:'8px', fontWeight:'700', cursor:'pointer'}}>Gabung Room</button>
        </div>

        <input className="homeInput" value={name} onChange={e => setName(e.target.value)} placeholder="Nama Samaran (E.g: Si Paling Anon)" maxLength={15} />
        {mode === 'join' && <input className="homeInput" style={{letterSpacing: '6px', textAlign: 'center', fontWeight: '700'}} value={code} onChange={e => setCode(e.target.value)} placeholder="KODE AKSES" maxLength={6} />}
        
        <button className="btnAction" onClick={handleStart} disabled={!name}>
          {mode === 'create' ? 'Gaskeun Obrolan →' : 'Masuk ke Room →'}
        </button>
      </div>

      <p style={{marginTop: '2rem', fontSize: '0.75rem', color: '#475569', textAlign: 'center', lineHeight: '1.5'}}>
        Identitasmu aman di balik kabut.<br/>Pesan akan lenyap saat kamu keluar.
      </p>
    </main>
  )
}

function ChatScreen({ roomCode, myName, onLeave }) {
  const [messages, setMessages] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recTime, setRecTime] = useState(0)
  
  const channelRef = useRef(null)
  const bottomRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    const channel = supabase.channel(`kabut:${roomCode}`, {
      config: { presence: { key: myName } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (newPresences[0].key !== myName) {
          setMessages(prev => [...prev, { id: Date.now(), type: 'sys', text: `${newPresences[0].key} baru saja masuk` }])
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setMessages(prev => [...prev, { id: Date.now(), type: 'sys', text: `${leftPresences[0].key} telah keluar` }])
      })
      .on('broadcast', { event: 'msg' }, ({ payload }) => {
        setMessages(prev => [...prev, payload])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() })
      })

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [roomCode, myName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMsg = async (content, type = 'text') => {
    if (!content && type === 'text') return
    const msg = {
      id: crypto.randomUUID(),
      sender: myName,
      text: content,
      type: type,
      ts: Date.now(),
      reply: replyTo ? { sender: replyTo.sender, text: replyTo.text } : null
    }
    setMessages(prev => [...prev, msg])
    await channelRef.current.send({ type: 'broadcast', event: 'msg', payload: msg })
    setInputValue('')
    setReplyTo(null)
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
      mediaRecorderRef.current.stream.getTracks().forEach(t => track.stop())
    }
  }

  const formatRecTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="chatWrap">
      <header className="chatHeader">
        <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <div style={{fontWeight:'900', fontSize:'1.5rem', letterSpacing:'-1px'}}>kabut<span>.</span></div>
          <div style={{height:'20px', width:'1px', background:'var(--border)'}}></div>
          <div className="roomCode" style={{fontWeight:'700', fontSize:'0.9rem', cursor:'pointer'}} onClick={() => {navigator.clipboard.writeText(`${window.location.origin}?join=${roomCode}`); alert('Link undangan disalin! Gaskeun sebar!');}}>{roomCode}</div>
        </div>
        <div className="headerRight" style={{display:'flex', alignItems:'center', gap:'1.5rem'}}>
          <div className="onlineBadge">
            <span className="onlineDot"></span>
            {onlineCount} ONLINE
          </div>
          <button onClick={onLeave} style={{background:'none', border:'none', color:'var(--text-dim)', fontSize:'0.7rem', fontWeight:'700', cursor:'pointer'}}>AKHIRI</button>
        </div>
      </header>

      <div className="messages">
        <div style={{textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px'}}>Jejakmu tersembunyi di balik kabut...</div>
        
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1]
          const isSameSender = prevMsg && prevMsg.sender === msg.sender && (msg.ts - prevMsg.ts < 60000)
          
          return (
            <div key={msg.id} className={`msgRow ${msg.sender === myName ? 'me' : 'them'} ${isSameSender ? 'sameSender' : ''}`} onDoubleClick={() => setReplyTo(msg)}>
              {msg.type === 'sys' ? (
                <div style={{alignSelf: 'center', fontSize: '0.65rem', color: 'var(--text-dim)', margin: '1rem 0'}}>{msg.text}</div>
              ) : (
                <>
                  {!isSameSender && <div className="msgSender">{msg.sender}</div>}
                  <div className={`bubble ${msg.sender === myName ? 'me' : 'them'}`}>
                    {msg.reply && (
                      <div className="replyPreviewChat">
                        <div style={{fontWeight:'700', fontSize:'0.7rem', color:'var(--primary)'}}>{msg.reply.sender}</div>
                        <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', opacity: 0.7}}>{msg.reply.text}</div>
                      </div>
                    )}
                    {msg.type === 'vn' ? <audio src={msg.text} controls className="audioItem" /> : msg.text}
                    <div style={{fontSize:'0.6rem', opacity:0.4, marginTop:'0.4rem', textAlign: msg.sender===myName?'right':'left'}}>{formatTime(msg.ts)}</div>
                  </div>
                </>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div style={{background: '#0e0e0e', padding: '0.8rem 2.5rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)'}}>
          <div style={{borderLeft: '2px solid var(--primary)', paddingLeft: '1rem'}}>
            <div style={{fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700'}}>Membalas {replyTo.sender}</div>
            <div style={{fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px'}}>{replyTo.text}</div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{background: 'none', border: 'none', color: '#475569', cursor: 'pointer'}}>✕</button>
        </div>
      )}

      <div className="inputContainer">
        {isRecording && <div className="recTimer">{formatRecTime(recTime)}</div>}
        <input 
          className="mainInput" 
          value={inputValue} 
          onChange={handleInputChange} 
          onKeyDown={e => e.key === 'Enter' && sendMsg(inputValue)} 
          placeholder={isRecording ? "Sedang merekam..." : "Tulis sesuatu..."} 
          disabled={isRecording}
        />
        
        {inputValue.trim() ? (
          <button className="circleBtn btnSend" onClick={() => sendMsg(inputValue)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        ) : (
          <button className={`circleBtn btnSend ${isRecording ? 'recording' : ''}`} onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function AnonChat() {
  const [room, setRoom] = useState(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinCode = params.get('join')
    if (joinCode) {
      const name = window.prompt('Siapa nama samaranmu?')
      if (name) setRoom({ code: joinCode.toUpperCase(), name })
      window.history.replaceState({}, '', '/')
    }
  }, [])
  if (!room) return <HomeScreen onEnter={(code, name) => setRoom({ code, name })} />
  return <ChatScreen roomCode={room.code} myName={room.name} onLeave={() => setRoom(null)} />
}
