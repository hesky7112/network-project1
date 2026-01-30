import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/layout'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  MessageCircle,
  Send,
  Users,
  MapPin,
  CheckCheck,
  AlertCircle,
  Hash,
  Zap,
} from 'lucide-react'
import { GlassWrapper, StaggerList, StaggerItem } from '@/components/ui/motion-container'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  room_id: string
  user_id: number
  username: string
  message: string
  type: string
  timestamp: string
  read_by?: number[]
}

interface ChatRoom {
  id: string
  name: string
  type: string
  unread_count: number
  last_message?: Message
}

interface OnlineUser {
  id: string
  username: string
  role: string
  location?: {
    site: string
    building: string
    floor: string
  }
}

export default function Chat() {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<string>('general')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch chat rooms
  const { data: rooms } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => apiClient.get('/chat/rooms'),
  })

  // Initialize WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token')
    const host = process.env.NEXT_PUBLIC_WS_HOST || 'localhost:8080'
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const socket = new WebSocket(`${protocol}${host}/api/v1/chat/ws?token=${token}`)

    socket.onopen = () => {
      console.log('WebSocket connected')
      // Join general room
      socket.send(JSON.stringify({
        type: 'join_room',
        room_id: 'general'
      }))
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'online_users') {
        setOnlineUsers(data.users)
      } else if (data.room_id === selectedRoom) {
        setMessages(prev => [...prev, data])
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    socket.onclose = () => {
      console.log('WebSocket disconnected')
    }

    setWs(socket)

    return () => {
      socket.close()
    }
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load message history when room changes
  useEffect(() => {
    if (selectedRoom) {
      loadMessageHistory(selectedRoom)

      // Join new room via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'join_room',
          room_id: selectedRoom
        }))
      }
    }
  }, [selectedRoom, ws])

  const loadMessageHistory = async (roomId: string) => {
    try {
      const history = await apiClient.get(`/chat/rooms/${roomId}/messages?limit=50`)
      setMessages(history || [])
    } catch (error) {
      console.error('Failed to load message history:', error)
    }
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(JSON.stringify({
      type: 'chat',
      room_id: selectedRoom,
      message: inputMessage
    }))

    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'device':
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case 'location':
        return <MapPin className="h-5 w-5 text-green-500" />
      default:
        return <MessageCircle className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <Layout title="Neural_Comm_Link">
      <div className="h-[calc(100vh-8rem)] bg-[#050505] text-slate-300 flex gap-6 relative overflow-hidden p-6">
        {/* Background Visual Flair */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stardust-violet/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-earth-green/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Rooms Sidebar */}
        <GlassWrapper className="w-80 bg-[#0a0a0c] border-white/5 flex flex-col rounded-sm overflow-hidden relative">
          <div className="p-6 border-b border-white/5 relative bg-white/[0.02]">
            <div className="absolute top-0 left-0 w-[1px] h-10 bg-stardust-violet shadow-[0_0_10px_#6366f1]" />
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center">
              <Zap className="h-4 w-4 mr-2 text-stardust-violet" />
              COMM_CHANNELS
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <StaggerList className="p-2 space-y-1">
              {rooms?.map((room: ChatRoom) => (
                <StaggerItem key={room.id}>
                  <div
                    onClick={() => setSelectedRoom(room.id)}
                    className={cn(
                      "p-4 rounded-sm cursor-pointer transition-all border group relative overflow-hidden",
                      selectedRoom === room.id
                        ? 'bg-stardust-violet/10 border-stardust-violet/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                        : 'border-transparent hover:bg-white/[0.03] hover:border-white/10'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "p-1.5 border rounded-sm transition-colors",
                          selectedRoom === room.id ? "bg-stardust-violet/20 border-stardust-violet/30 text-white" : "bg-white/5 border-white/10 text-slate-500"
                        )}>
                          {getRoomIcon(room.type)}
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest italic transition-colors",
                          selectedRoom === room.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        )}>{room.name.replace(/ /g, '_')}</span>
                      </div>
                      {room.unread_count > 0 && (
                        <div className="bg-cosmic-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-[0_0_10px_#ef444466] animate-pulse">
                          {room.unread_count}_NEW
                        </div>
                      )}
                    </div>
                    {room.last_message && (
                      <p className="text-[9px] font-medium text-slate-500 truncate uppercase tracking-widest pl-10 relative z-10 group-hover:text-slate-400 italic">
                        <span className="text-stardust-violet/60 font-black">{room.last_message.username}</span>: {room.last_message.message}
                      </p>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>

          {/* Online Nodes */}
          <div className="border-t border-white/5 p-6 bg-white/[0.01]">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-4 w-4 text-earth-green" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Nodes_Active:_{onlineUsers.length}
              </span>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-1.5 bg-earth-green rounded-full shadow-[0_0_8px_#00ff41]" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">{user.username}</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-600 uppercase italic">[{user.role}]</span>
                </div>
              ))}
            </div>
          </div>
        </GlassWrapper>

        {/* Chat Area */}
        <GlassWrapper className="flex-1 bg-[#0a0a0c] border-white/5 flex flex-col rounded-sm overflow-hidden relative">
          {/* Chat Header */}
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-stardust-violet/10 border border-stardust-violet/20 rounded-sm">
                <Hash className="h-5 w-5 text-stardust-violet" />
              </div>
              <div>
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic leading-none">
                  CHANNEL_{rooms?.find((r: ChatRoom) => r.id === selectedRoom)?.name?.replace(/ /g, '_') || 'GENERAL'}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1 h-1 bg-earth-green rounded-full animate-pulse" />
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Live_Encryption_Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar relative">
            <div className="absolute inset-0 bg-stardust-violet/[0.01] pointer-events-none" />

            <StaggerList className="space-y-6">
              {messages.map((message) => (
                <StaggerItem key={message.id}>
                  <div className={cn(
                    "flex flex-col",
                    message.type === 'system' ? 'items-center' : 'items-start'
                  )}>
                    {message.type === 'system' ? (
                      <div className="bg-white/5 border border-white/10 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-sm italic">
                        PROTOCOL_UPDATE:_{message.message.replace(/ /g, '_')}
                      </div>
                    ) : (
                      <div className="max-w-2xl group/msg">
                        <div className="flex items-center gap-3 mb-2 px-1">
                          <span className="text-[10px] font-black text-stardust-violet uppercase tracking-wider italic">
                            {message.username}
                          </span>
                          <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                            {formatTime(message.timestamp)} // NODE_ID:_{message.user_id}
                          </span>
                        </div>
                        <GlassWrapper className={cn(
                          "px-5 py-4 rounded-sm border relative overflow-hidden transition-all duration-300",
                          message.username === 'admin' // Just a guess for self identification if not available
                            ? "bg-stardust-violet/10 border-stardust-violet/20"
                            : "bg-white/[0.02] border-white/10 group-hover/msg:border-white/20"
                        )}>
                          <p className="text-[11px] text-slate-300 font-medium leading-relaxed uppercase tracking-wide">
                            {message.message}
                          </p>

                          {message.read_by && message.read_by.length > 0 && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                              <CheckCheck className="h-3 w-3 text-earth-green" />
                              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">
                                ACKNOWLEDGED_BY:_{message.read_by.length}_NODES
                              </span>
                            </div>
                          )}
                        </GlassWrapper>
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-white/5 bg-white/[0.02] relative z-10">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Transmit_Direct_Signal..."
                  className="w-full bg-[#050505] border border-white/10 text-white text-[11px] font-black uppercase tracking-widest px-6 py-4 focus:border-stardust-violet/40 focus:outline-none transition-all rounded-sm placeholder:text-slate-800"
                />
                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-stardust-violet transition-all duration-500 group-focus-within:w-full shadow-[0_0_10px_#6366f1]" />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="bg-stardust-violet/80 hover:bg-stardust-violet text-white h-14 w-14 p-0 rounded-sm shadow-[0_0_15px_rgba(139,92,246,0.2)] flex items-center justify-center transition-all group active:scale-95"
              >
                <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </div>
          </div>
        </GlassWrapper>
      </div>
    </Layout>
  )
}
