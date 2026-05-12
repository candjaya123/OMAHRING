import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArticleById } from '@/store/admin/article-slice';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, User, Tag } from 'lucide-react';
import { setChatContext } from '@/store/shop/chat-slice';

function ArticleDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentArticle, isLoading } = useSelector((state) => state.adminArticle);

  useEffect(() => {
    if (id) {
      dispatch(fetchArticleById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (currentArticle) {
      dispatch(setChatContext({
        type: 'article',
        id: currentArticle.id || currentArticle.id,
        title: currentArticle.title,
        url: window.location.pathname
      }));
    }
    return () => {
      dispatch(setChatContext(null));
    };
  }, [currentArticle, dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-orange-500 font-bold text-xl">Memuat Artikel...</div>
      </div>
    );
  }

  if (!currentArticle) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Artikel Tidak Ditemukan</h2>
        <Button onClick={() => navigate('/shop/blog')} className="bg-orange-500">Kembali ke Blog</Button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/shop/blog')}
          className="mb-8 text-gray-500 hover:text-orange-600 gap-2 pl-0"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Edukasi
        </Button>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-orange-100">
              {currentArticle.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            {currentArticle.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <span>Omahring Author</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>{new Date(currentArticle.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {currentArticle.image && (
          <div className="rounded-3xl overflow-hidden mb-12 shadow-2xl shadow-gray-200 aspect-video">
            <img 
              src={currentArticle.image} 
              alt={currentArticle.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <article className="prose prose-orange prose-lg max-w-none text-gray-700 leading-relaxed mb-20">
           <div dangerouslySetInnerHTML={{ __html: currentArticle.content }} />
        </article>
      </div>
    </div>
  );
}

export default ArticleDetailPage;
