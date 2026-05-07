import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChatMessages } from '@/store/shop/chat-slice';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Calendar, Loader2 } from 'lucide-react';

const AdminChatLogs = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shop/chat/sessions`);
      setSessions(response.data.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchMessages = async (sessionId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shop/chat/messages/${sessionId}`);
      setMessages(response.data.data);
      setSelectedSession(sessionId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Chat History Logs</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> Recent Sessions
          </h2>
          <div className="space-y-2 overflow-y-auto max-h-[600px]">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => fetchMessages(session.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedSession === session.id ? 'bg-orange-600 text-white shadow-lg' : 'bg-white hover:bg-orange-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className={`w-8 h-8 p-1 rounded-full ${selectedSession === session.id ? 'bg-white/20' : 'bg-gray-100'}`} />
                  <div>
                    <p className="font-bold">{session.users?.userName || 'Anonymous Guest'}</p>
                    <p className={`text-[10px] ${selectedSession === session.id ? 'text-orange-100' : 'text-gray-400'}`}>
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedSession ? (
            <Card className="h-[700px] flex flex-col rounded-3xl border-none shadow-xl">
              <CardHeader className="border-b">
                <CardTitle>Session ID: {selectedSession}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-4 rounded-2xl max-w-[70%] ${msg.sender_role === 'admin' ? 'bg-gray-800 text-white' : 'bg-white shadow-sm border border-gray-100'}`}>
                        <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">{msg.sender_role}</p>
                        <p>{msg.message_text}</p>
                        <p className="text-[10px] mt-1 opacity-50">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-[700px] flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <MessageCircle className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-400">Select a session to view logs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatLogs;
