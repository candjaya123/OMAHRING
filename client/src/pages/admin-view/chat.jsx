import React from 'react';
import ChatAdminPanel from '@/components/chat/ChatAdminPanel';
import { useSelector } from 'react-redux';

const AdminChat = () => {
  const { user } = useSelector((state) => state.auth);
  
  // Jika role manager, panel bersifat readonly di chat logs, 
  // tapi di halaman ini admin bisa reply.
  // Manager mungkin butuh akses reply juga jika bertugas sebagai support.
  
  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Chat Support</h1>
          <p className="text-gray-500 mt-1">Balas pesan dari customer secara realtime.</p>
        </div>
      </div>
      
      <ChatAdminPanel isReadOnly={user?.role === 'manager' && false} /> 
      {/* Set ke false agar manager juga bisa balas jika perlu, atau sesuaikan policy */}
    </div>
  );
};

export default AdminChat;
