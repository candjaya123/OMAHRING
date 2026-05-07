import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllArticles } from '@/store/admin/article-slice'; 
import PostCard from '@/components/blog/card.jsx';

/**
 * A sleek filter component for the light theme.
 * @param {{ posts: object[], setFilters: function }} props
 */
const FilterControls = ({ posts, setFilters }) => {
  const categoryCount = useMemo(() => {
    const cats = posts.map(p => p.category);
    return [...new Set(cats)];
  }, [posts]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const selectStyles = "bg-white border border-gray-300 text-gray-700 rounded-md p-2.5 w-full focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/50 focus:outline-none transition-all duration-300 font-medium";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16 max-w-2xl mx-auto">
      <select name="date" onChange={handleFilterChange} className={selectStyles}>
        <option value="">Semua Waktu</option>
        <option value="2024">Tahun 2024</option>
        <option value="2025">Tahun 2025</option>
        <option value="2026">Tahun 2026</option>
      </select>
      <select name="category" onChange={handleFilterChange} className={selectStyles}>
        <option value="">Semua Kategori</option>
        {categoryCount.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
    </div>
  );
};

// --- Main BlogPage Component ---

function BlogPage() {
  const [filters, setFilters] = useState({
    date: '',
    category: '',
  });

  const dispatch = useDispatch();
  const { articleList, isLoading } = useSelector((state) => state.adminArticle);

  useEffect(() => {
    dispatch(fetchAllArticles());
  }, [dispatch]);

  const mappedPosts = useMemo(() => {
    if (!articleList) return [];
    
    return articleList
      .filter(item => item.status === 'published')
      .map(item => ({
        id: item._id || item.id,
        title: item.title,
        author: 'Omahring', 
        date: item.created_at,
        category: item.category,
        imageUrl: item.image || 'https://placehold.co/600x400/f1f5f9/334155?text=No+Image',
      }));
  }, [articleList]);

  const filteredPosts = useMemo(() => {
    return mappedPosts
      .filter(post => {
        const categoryMatch = filters.category ? post.category === filters.category : true;
        const dateMatch = filters.date ? post.date && post.date.includes(filters.date) : true;
        return categoryMatch && dateMatch;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [mappedPosts, filters]);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-20 mt-10">
        {/* Header Section */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">Omahring</span> Edukasi
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">Temukan informasi, tips, dan panduan lengkap seputar dunia kicau.</p>
        </header>

        {/* Filter Controls Section */}
        <FilterControls posts={mappedPosts} setFilters={setFilters} />
        
        {/* Blog Posts Grid Section */}
        <main>
          {isLoading ? (
             <div className="text-center py-24">
               <h2 className="text-orange-500 animate-pulse font-bold">Memuat artikel berkualitas...</h2>
             </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          ) : (
            <div className="text-center py-24 border border-dashed border-gray-300 rounded-2xl bg-white max-w-xl mx-auto">
              <h2 className="text-xl text-gray-600 font-bold">Belum Ada Artikel</h2>
              <p className="text-gray-400 mt-2 text-sm font-medium">Artikel edukasi sedang kami siapkan untuk Anda.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default BlogPage;