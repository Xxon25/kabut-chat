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
        <h2>Chat Anonim Tanpa Jejak & Tanpa Riwayat.</h2>
        <p>Ngobrol bebas sesukamu. Semua pesan bakal hilang otomatis saat sesi berakhir atau saat kamu keluar.</p>
      </div>
      <div className="homeCard">
        <div style={{display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '15px', marginBottom: '2rem'}}>
          <button onClick={() => setMode('create')} style={{flex:1, background: mode==='create'?'white':'transparent', color: mode==='create'?'black':'white', border:'none', padding:'0.7rem', borderRadius:'12px', fontWeight:'700', cursor:'pointer'}}>Buat Room</button>
          <button onClick={() => setMode('join')} style={{flex:1, background: mode==='join'?'white':'transparent', color: mode==='join'?'black':'white', border:'none', padding:'0.7rem', borderRadius:'12px', fontWeight:'700', cursor:'pointer'}}>Gabung</button>
        </div>
        <input className="homeInput" value={name} onChange={e => setName(e.target.value)} placeholder="Siapa namamu?" maxLength={15} />
        {mode === 'join' && <input className="homeInput" style={{letterSpacing:'6px', fontWeight:'800'}} value={code} onChange={e => setCode(e.target.value)} placeholder="KODE ROOM" maxLength={6} />}
        <button className="btnStart" onClick={handleStart} disabled={!name}>GAS CHATTING! 💬</button>
      </div>
    </main>
  )
}

function ChatScreen({ roomCode, myName, onLeave }) {
  const [messages, setMessages] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [inputValue, setInputValue] = useState('')
  const [activeReaction, setActiveReaction] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recTime, setRecTime] = useState(0)
  
  const channelRef = useRef(null)
  const bottomRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const channel = supabase.channel(`kabut_v3_${roomCode}`, {
      config: { presence: { key: myName } }
    })

    channel
      .on('presence', { event: 'sync' }, () => setOnlineCount(Object.keys(channel.presenceState()).length))
      .on('broadcast', { event: 'msg' }, ({ payload }) => setMessages(prev => [...prev, payload]))
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
    return () => { supabase.removeChannel(channel) }
  }, [roomCode, myName])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typingUsers])

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

  const sendReaction = (msgId, emoji) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, react: emoji } : m))
    channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: { msgId, emoji } })
    setActiveReaction(null)
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
        await supabase.storage.from('chat-assets').upload(path, blob)
        const { data: { publicUrl } } = supabase.storage.from('chat-assets').getPublicUrl(path)
        sendMsg(publicUrl, 'vn')
        clearInterval(timerRef.current)
        setRecTime(0)
      }
      mr.start(); setIsRecording(true)
      timerRef.current = setInterval(() => setRecTime(prev => prev + 1), 1000)
    } catch (e) { alert('Mic diblokir.') }
  }

  const stopRec = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const path = `img/${roomCode}/${Date.now()}-${file.name}`
    await supabase.storage.from('chat-assets').upload(path, file)
    const { data: { publicUrl } } = supabase.storage.from('chat-assets').getPublicUrl(path)
    sendMsg(publicUrl, 'image')
  }

  return (
    <div className="chatWrap">
      <BackgroundMist />
      <header className="chatHeader">
        <div style={{fontWeight:'800', fontSize:'1.4rem'}}>kabut<span>.</span></div>
        <div style={{display:'flex', gap:'1rem'}}>
          <div style={{fontSize:'0.7rem', color:'var(--kabut-accent)', fontWeight:'800'}}>{onlineCount} ONLINE</div>
          <button style={{background:'none', border:'none', color:'white', fontSize:'0.7rem', cursor:'pointer'}} onClick={() => {navigator.clipboard.writeText(roomCode); alert('Kode Room disalin!');}}>KODE: {roomCode}</button>
          <button style={{background:'none', border:'none', color:'#ef4444', fontSize:'0.7rem', cursor:'pointer'}} onClick={onLeave}>KELUAR</button>
        </div>
      </header>

      <div className="messages" onClick={() => setActiveReaction(null)}>
        {messages.map((msg, idx) => {
          const isMe = msg.sender === myName
          const prevMsg = messages[idx - 1]
          const isSameSender = prevMsg && prevMsg.sender === msg.sender && (msg.ts - prevMsg.ts < 60000)
          return (
            <div key={msg.id} className={`msgRow ${isMe ? 'me' : 'them'}`}>
              {!isSameSender && <div style={{fontSize: '0.75rem', fontWeight: '800', color: isMe?'var(--kabut-accent)':'white', marginBottom: '0.2rem', marginLeft: '0.4rem'}}>{msg.sender}</div>}
              <div className={`bubble ${isMe ? 'me' : 'them'}`} onClick={(e) => { e.stopPropagation(); setActiveReaction(msg.id === activeReaction ? null : msg.id); }}>
                {msg.type === 'image' ? <img src={msg.text} alt="Shared" /> : msg.type === 'vn' ? <audio src={msg.text} controls className="audioItem" /> : msg.text}
                {msg.react && <div className="reactBadge">{msg.react}</div>}
                {activeReaction === msg.id && (
                  <div className="reactionBar" onClick={e => e.stopPropagation()}>
                    {['🔥','😂','❤️','👍','😮','🙏'].map(emoji => (
                      <button key={emoji} className="reactionBtn" onClick={() => sendReaction(msg.id, emoji)}>{emoji}</button>
                    ))}
                  </div>
                )}
                <div className="msgMeta">
                  {formatTime(msg.ts)} {isMe && ' ✓✓'}
                </div>
              </div>
            </div>
          )
        })}
        {Array.from(typingUsers).map(user => <div key={user} style={{fontSize: '0.7rem', color: 'var(--text-soft)', marginLeft: '1rem', fontStyle: 'italic'}}>...{user} lagi ngetik</div>)}
        <div ref={bottomRef} />
      </div>

      <div style={{padding:'0 1.5rem', display:'flex', gap:'0.4rem', overflowX:'auto', scrollbarWidth:'none'}}>
        {QUICK_SLANG.map(s => <button key={s} onClick={() => sendMsg(s)} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', color:'white', padding:'0.4rem 1rem', borderRadius:'100px', fontSize:'0.7rem', whiteSpace:'nowrap', cursor:'pointer'}}>{s}</button>)}
      </div>

      <div className="inputArea">
        <label className="iconBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          <input type="file" hidden accept="image/*" onChange={handleFile} />
        </label>
        <input className="inputField" value={inputValue} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && sendMsg(inputValue)} placeholder={isRecording ? `Merekam... ${recTime}s` : "Ketik pesan..."} disabled={isRecording} />
        {inputValue.trim() ? (
          <button className="iconBtn btnSend" onClick={() => sendMsg(inputValue)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        ) : (
          <button className="iconBtn" onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec} style={{background: isRecording?'#ef4444':'none', color: isRecording?'white':'var(--text-soft)'}}>
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
