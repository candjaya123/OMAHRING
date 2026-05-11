import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getAllSessions, 
  getChatMessages, 
  adminReplyMessage, 
  addMessage, 
  closeSession 
} from '@/store/shop/chat-slice';
import { supabase } from '@/config/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, User, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SessionContextBadge from './SessionContextBadge';

const ChatAdminPanel = ({ isReadOnly = false }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { allSessions, messages, isLoading } = useSelector((state) => state.shopChat);
  const { user } = useSelector((state) => state.auth);
  
  const [selectedSession, setSelectedSession] = useState(null);
  const [replyText, setReplyText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    dispatch(getAllSessions());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSession) {
      dispatch(getChatMessages(selectedSession.id));

      // Subscribe to real-time updates for this specific session
      const channel = supabase
        .channel(`admin_chat:${selectedSession.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${selectedSession.id}` },
          (payload) => {
            // Only add if it's from customer (admin messages added via thunk usually)
            if (payload.new.sender_role === 'customer') {
               dispatch(addMessage(payload.new));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedSession, dispatch]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession || isReadOnly) return;

    const replyData = {
      session_id: selectedSession.id,
      sender_id: user?.id,
      message_text: replyText,
    };

    dispatch(adminReplyMessage(replyData)).then((res) => {
      if (res.payload.success) {
        dispatch(addMessage(res.payload.data));
        setReplyText('');
      }
    });
  };

  const handleCloseSession = (id) => {
    if (window.confirm('Tutup sesi chat ini?')) {
      dispatch(closeSession(id)).then(() => dispatch(getAllSessions()));
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6 overflow-hidden">
      {/* Session List */}
      <Card className="w-80 flex flex-col rounded-3xl border-none shadow-xl">
        <CardHeader className="border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-500" />
            Sessions
          </CardTitle>
        </CardHeader>
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            {allSessions?.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  selectedSession?.id === session.id 
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                    : 'bg-white hover:bg-orange-50 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white/20">
                    <AvatarFallback className={selectedSession?.id === session.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}>
                      {session.users?.userName ? session.users.userName[0].toUpperCase() : 'G'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-bold truncate text-sm">{session.users?.userName || 'Guest'}</p>
                      {session.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                          {session.unread_count}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate opacity-70 ${selectedSession?.id === session.id ? 'text-orange-100' : 'text-gray-400'}`}>
                      {session.last_message || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Chat Thread */}
      <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-xl">
        {selectedSession ? (
          <>
            <CardHeader className="border-b py-4 px-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                    {selectedSession.users?.userName ? selectedSession.users.userName[0].toUpperCase() : 'G'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{selectedSession.users?.userName || 'Guest'}</CardTitle>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1">
                    {selectedSession.status === 'active' ? (
                      <span className="flex items-center gap-1 text-green-500"><Clock className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400"><CheckCircle2 className="w-3 h-3" /> Closed</span>
                    )}
                  </p>
                  <SessionContextBadge session={selectedSession} />
                </div>
              </div>
              {!isReadOnly && selectedSession.status === 'active' && (
                <Button variant="outline" size="sm" onClick={() => handleCloseSession(selectedSession.id)} className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50">
                  Tutup Sesi
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar">
              {messages?.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                      msg.sender_role === 'admin'
                        ? 'bg-gray-800 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">
                      {msg.sender_role}
                    </p>
                    {msg.message_text}
                    <p className="text-[10px] mt-2 opacity-40 text-right">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </CardContent>
            {!isReadOnly && selectedSession.status === 'active' && (
              <CardFooter className="p-4 border-t bg-white">
                <form onSubmit={handleSendReply} className="flex w-full gap-3">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tulis balasan..."
                    className="flex-1 rounded-xl bg-gray-100 border-none focus-visible:ring-orange-500"
                  />
                  <Button type="submit" disabled={!replyText.trim()} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </CardFooter>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <MessageCircle className="w-16 h-16 opacity-10" />
            <p className="font-medium">Pilih sesi untuk melihat percakapan</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatAdminPanel;
