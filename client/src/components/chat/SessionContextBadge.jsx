import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Tag, ShoppingBag, BookOpen } from 'lucide-react';

const SessionContextBadge = ({ session }) => {
  if (!session.context_type || session.context_type === 'general') return null;

  const getIcon = () => {
    switch (session.context_type) {
      case 'product': return <ShoppingBag className="w-3 h-3" />;
      case 'article': return <BookOpen className="w-3 h-3" />;
      default: return <Tag className="w-3 h-3" />;
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all hover:bg-orange-100">
        {getIcon()}
        <span className="uppercase tracking-wider">{session.context_type}:</span>
        <span className="truncate max-w-[150px]">{session.context_title || 'Unknown'}</span>
      </Badge>
      {session.context_url && (
        <a 
          href={session.context_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-orange-500 transition-colors"
          title="Buka Halaman"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};

export default SessionContextBadge;
