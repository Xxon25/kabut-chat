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
    const finalCode = mode === 'create' 
      ? Math.random().toString(36).substring(2, 8).toUpperCase() 
      : code.trim().toUpperCase()
    onEnter(finalCode, name.trim())
  }

  return (
    <main className="homeWrap" style={{height:'100dvh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'2rem'}}>
      <BackgroundMist />
      <div className="brand-text" style={{fontSize:'5rem', letterSpacing:'-5px', marginBottom:'0.5rem'}}>kabut<span>.</span></div>
      
      <div style={{textAlign:'center', marginBottom:'3rem', padding:'0 1rem'}}>
        <h2 style={{fontSize:'1.3rem', fontWeight:'800', marginBottom:'0.6rem', color:'white'}}>Obrolan Menguap Seperti Kabut.</h2>
        <p style={{fontSize:'0.85rem', color:'var(--text-soft)', lineHeight:'1.5'}}>
          Platform chat anonim paling privat di Nusantara. <br/>
          Tanpa jejak, tanpa riwayat, murni privasi bross!
        </p>
      </div>

      <div className="homeCard" style={{width:'100%', maxWidth:'400px', background:'rgba(255,255,255,0.02)', backdropFilter:'blur(30px)', padding:'2.5rem 2rem', borderRadius:'40px', border:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '15px', marginBottom: '2rem'}}>
          <button onClick={() => setMode('create')} style={{flex:1, background: mode==='create'?'white':'transparent', color: mode==='create'?'#0a121e':'white', border:'none', padding:'0.8rem', borderRadius:'12px', fontWeight:'800', cursor:'pointer', transition:'0.3s'}}>Buat Room</button>
          <button onClick={() => setMode('join')} style={{flex:1, background: mode==='join'?'white':'transparent', color: mode==='join'?'#0a121e':'white', border:'none', padding:'0.8rem', borderRadius:'12px', fontWeight:'800', cursor:'pointer', transition:'0.3s'}}>Gabung</button>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:'1rem', marginBottom:'1.5rem'}}>
          <input className="inputField" value={name} onChange={e => setName(e.target.value)} placeholder="Nama samaran kamu..." maxLength={15} style={{textAlign:'center'}} />
          {mode === 'join' && <input className="inputField" value={code} onChange={e => setCode(e.target.value)} placeholder="KODE ROOM" maxLength={8} style={{textAlign:'center', letterSpacing:'4px', fontWeight:'800'}} />}
        </div>
        
        <button className="btnSend" onClick={handleStart} disabled={!name} style={{width:'100%', borderRadius:'20px', fontWeight:'800', fontSize:'16px'}}>
          GAS CHATTING! 💬
        </button>
      </div>
      
      <div style={{marginTop:'2rem', fontSize:'0.7rem', color:'var(--text-soft)', textTransform:'uppercase', letterSpacing:'3px'}}>
        End-to-End Privacy
      </div>
    </main>
  )
}

function ChatScreen({ roomCode, myName, onLeave }) {
  const [messages, setMessages] = useState([])
  const [onlineCount, setOnlineCount] = useState(1)
  const [status, setStatus] = useState('connecting')
  const [inputValue, setInputValue] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  
  const channelRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    const cleanRoomCode = roomCode.trim().toUpperCase()
    const channel = supabase.channel(`kabut-room:${cleanRoomCode}`, {
      config: { presence: { key: myName }, broadcast: { self: false, ack: true } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length)
      })
      .on('broadcast', { event: 'msg' }, ({ payload }) => {
        setMessages(prev => [...prev, payload])
      })
      .subscribe(async (status) => {
        setStatus(status)
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() })
      })

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [roomCode, myName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      alert('Kode berhasil disalin! Gaskeun sebar ke temen: ' + roomCode)
    } catch (e) { alert('Kode Room: ' + roomCode) }
  }

  return (
    <div className="chatWrap">
      <BackgroundMist />
      <header className="chatHeader">
        <div>
          <div className="brand-text" style={{fontSize:'1.4rem', letterSpacing:'-1px'}}>kabut<span>.</span></div>
          <div style={{fontSize:'0.65rem', display:'flex', alignItems:'center', gap:'5px', marginTop:'2px'}}>
             <div style={{width:'6px', height:'6px', borderRadius:'50%', background: status==='SUBSCRIBED'?'#10b981':'#fbbf24'}}></div>
             {status==='SUBSCRIBED' ? 'TERKONEKSI' : 'MENGHUBUNGKAN...'} • {onlineCount} ONLINE
          </div>
        </div>
        <div style={{display:'flex', gap:'0.8rem'}}>
          <button onClick={copyRoom} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'0.5rem 1rem', borderRadius:'12px', fontSize:'0.7rem', fontWeight:'800'}}>SALIN KODE</button>
          <button onClick={onLeave} style={{background:'rgba(239, 68, 68, 0.1)', border:'none', color:'#ef4444', padding:'0.5rem 1rem', borderRadius:'12px', fontSize:'0.7rem', fontWeight:'800'}}>CABUT</button>
        </div>
      </header>

      <div className="messages" onClick={() => setReplyTo(null)}>
        <div style={{textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-soft)', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '4px'}}>
          Pesan akan menguap otomatis saat kamu keluar.
        </div>
        
        {messages.map((msg, idx) => {
          const isMe = msg.sender === myName
          const prevMsg = messages[idx - 1]
          const isSameSender = prevMsg && prevMsg.sender === msg.sender && (msg.ts - prevMsg.ts < 60000)
          return (
            <div key={msg.id} className={`msgRow ${isMe ? 'me' : 'them'}`} onDoubleClick={() => setReplyTo(msg)}>
              {!isSameSender && <div style={{fontSize: '0.75rem', fontWeight: '800', color: isMe?'var(--kabut-emerald)':'white', marginBottom: '0.3rem', marginLeft: '0.5rem'}}>{msg.sender}</div>}
              <div className={`bubble ${isMe ? 'me' : 'them'}`}>
                {msg.reply && (
                   <div style={{background:'rgba(0,0,0,0.1)', borderLeft:'3px solid rgba(255,255,255,0.3)', padding:'0.4rem 0.8rem', borderRadius:'6px', marginBottom:'0.6rem', fontSize:'0.8rem', opacity:0.8}}>
                     <strong>{msg.reply.sender}</strong>: {msg.reply.text.substring(0, 40)}...
                   </div>
                )}
                {msg.text}
                <div style={{fontSize: '0.6rem', opacity: 0.5, marginTop: '0.4rem', textAlign: 'right'}}>{formatTime(msg.ts)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div style={{background:'rgba(10, 18, 30, 0.95)', padding:'0.8rem 1.5rem', display:'flex', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.05)', backdropFilter:'blur(20px)'}}>
          <div style={{fontSize:'0.8rem', borderLeft:'3px solid var(--kabut-emerald)', paddingLeft:'1rem'}}>
            <div style={{fontWeight:'800', color:'var(--kabut-emerald)'}}>Membalas {replyTo.sender}</div>
            <div style={{color:'var(--text-soft)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'280px'}}>{replyTo.text}</div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{background:'none', border:'none', color:'white', fontSize:'1.2rem', cursor:'pointer'}}>✕</button>
        </div>
      )}

      <div style={{padding:'0.6rem 1rem', display:'flex', gap:'0.5rem', overflowX:'auto', scrollbarWidth:'none'}}>
        {QUICK_SLANG.map(s => <button key={s} onClick={() => sendMsg(s)} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', color:'white', padding:'0.5rem 1rem', borderRadius:'100px', fontSize:'0.75rem', whiteSpace:'nowrap', fontWeight:'600'}}>{s}</button>)}
      </div>

      <div className="inputArea">
        <input className="inputField" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg(inputValue)} placeholder="Bisikkan sesuatu..." />
        <button className="btnSend" onClick={() => sendMsg(inputValue)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}

export default function AnonChat() {
  const [room, setRoom] = useState(null)
  return room ? <ChatScreen roomCode={room.code} myName={room.name} onLeave={() => setRoom(null)} /> : <HomeScreen onEnter={(code, name) => setRoom({ code, name })} />
}
