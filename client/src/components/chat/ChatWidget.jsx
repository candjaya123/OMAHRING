import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { startChatSession, sendMessage, getChatMessages, addMessage } from '@/store/shop/chat-slice';
import { supabase } from '@/config/supabase';
import { useTranslation } from 'react-i18next';

const ChatWidget = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sessionId, messages, isLoading, allSessions, sessionContext } = useSelector((state) => state.shopChat);
  const scrollRef = useRef(null);

  // Check if current session is closed
  const currentSession = allSessions?.find(s => s.id === sessionId);
  const isClosed = currentSession?.status === 'closed';

  useEffect(() => {
    if (isOpen && !sessionId) {
      dispatch(startChatSession({
        customer_id: user?.id || null,
        session_token: localStorage.getItem('chat_token') || undefined,
        context: sessionContext || undefined
      }));
    }
  }, [isOpen, sessionId, user?.id, sessionContext, dispatch]);

  useEffect(() => {
    if (sessionId) {
      dispatch(getChatMessages(sessionId));

      // Subscribe to real-time updates
      const channel = supabase
        .channel(`chat_messages:session_id=eq.${sessionId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
          (payload) => {
            dispatch(addMessage(payload.new));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [sessionId, dispatch]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionId || isClosed) return;

    const messageData = {
      session_id: sessionId,
      sender_id: user?.id,
      sender_role: user?.role || 'customer',
      message_text: inputMessage,
    };

    dispatch(sendMessage(messageData));
    setInputMessage('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl bg-orange-600 hover:bg-orange-700 text-white p-0 flex items-center justify-center transition-transform hover:scale-110"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      ) : (
        <Card className="w-[350px] md:w-[400px] h-[500px] flex flex-col shadow-2xl rounded-3xl border-none overflow-hidden animate-in slide-in-from-bottom-10">
          <CardHeader className="bg-orange-600 text-white p-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">{t('chat.title')}</CardTitle>
                <p className="text-[10px] text-orange-200 uppercase font-black tracking-widest">
                   {isClosed ? t('chat.closed') : t('chat.online')}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
            {messages?.length > 0 ? messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex ${msg.sender_role === 'customer' || msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.sender_role === 'customer' || msg.sender_id === user?.id
                      ? 'bg-orange-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}
                >
                  {msg.message_text}
                  <div className={`text-[10px] mt-1 opacity-50 ${msg.sender_role === 'customer' || msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                <MessageCircle className="w-12 h-12 opacity-20" />
                <p className="text-xs font-medium">{t('chat.no_messages')}</p>
              </div>
            )}
            <div ref={scrollRef} />
          </CardContent>

          <CardFooter className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                value={inputMessage}
                disabled={isClosed}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isClosed ? t('chat.closed') : t('chat.placeholder')}
                className="rounded-xl bg-gray-100 border-none focus-visible:ring-orange-500"
              />
              <Button type="submit" disabled={!inputMessage.trim() || isLoading || isClosed} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ChatWidget;
