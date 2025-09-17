import React, { useState, useMemo } from 'react';
import PostCard from '@/components/blog/card.jsx'; // 1. Impor komponen PostCard baru

// --- Sample Blog Post Data (dengan imageUrl) ---
const posts = [
  {
    id: 1,
    title: 'The Art of Minimalist Design',
    author: 'Alex Johnson',
    date: '2024-08-15',
    category: 'Design',
    imageUrl: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
  },
  {
    id: 2,
    title: 'A Deep Dive into React Hooks',
    author: 'Samantha Lee',
    date: '2024-07-22',
    category: 'React',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
  },
  {
    id: 3,
    title: 'Tailwind CSS for Modern Web Development',
    author: 'Alex Johnson',
    date: '2024-07-30',
    category: 'CSS',
    imageUrl: 'https://images.unsplash.com/photo-1617042375876-a13e36732a04?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
  },
  {
    id: 4,
    title: 'Understanding Asynchronous JavaScript',
    author: 'Maria Garcia',
    date: '2024-06-10',
    category: 'JavaScript',
    imageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
  },
  {
    id: 5,
    title: 'Building Accessible Web Applications',
    author: 'Samantha Lee',
    date: '2024-08-01',
    category: 'Web Development',
    imageUrl: 'https://images.unsplash.com/photo-1516116216624-53e69730b7c3?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
  },
  {
    id: 6,
    title: 'The Future of State Management in React',
    author: 'Alex Johnson',
    date: '2024-08-20',
    category: 'React',
    imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
  },
];

/**
 * A sleek filter component for the light theme.
 * @param {{ posts: object[], setFilters: function }} props
 */
const FilterControls = ({ posts, setFilters }) => {
  const authors = useMemo(() => [...new Set(posts.map(p => p.author))], [posts]);
  const categories = useMemo(() => [...new Set(posts.map(p => p.category))], [posts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const selectStyles = "bg-white border border-gray-300 text-gray-700 rounded-md p-2.5 w-full focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/50 focus:outline-none transition-all duration-300";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
      <select name="date" onChange={handleFilterChange} className={selectStyles}>
        <option value="">All Dates</option>
        <option value="2024-08">August 2024</option>
        <option value="2024-07">July 2024</option>
        <option value="2024-06">June 2024</option>
      </select>
      <select name="author" onChange={handleFilterChange} className={selectStyles}>
        <option value="">All Authors</option>
        {authors.map(author => <option key={author} value={author}>{author}</option>)}
      </select>
      <select name="category" onChange={handleFilterChange} className={selectStyles}>
        <option value="">All Categories</option>
        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
    </div>
  );
};

// --- Main BlogPage Component ---

function BlogPage() {
  const [filters, setFilters] = useState({
    date: '',
    author: '',
    category: '',
  });

  const filteredPosts = useMemo(() => {
    return posts
      .filter(post => {
        const authorMatch = filters.author ? post.author === filters.author : true;
        const categoryMatch = filters.category ? post.category === filters.category : true;
        const dateMatch = filters.date ? post.date.startsWith(filters.date) : true;
        return authorMatch && categoryMatch && dateMatch;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filters]);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-20">
        {/* Header Section */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-3">
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">The Artisan</span> Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">A curated collection of insights on modern design, development, and technology.</p>
        </header>

        {/* Filter Controls Section */}
        <FilterControls posts={posts} setFilters={setFilters} />
        
        {/* Blog Posts Grid Section */}
        <main>
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 3. Panggil komponen PostCard yang sudah diimpor */}
              {filteredPosts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          ) : (
            <div className="text-center py-24">
              <h2 className="text-2xl text-gray-500 font-semibold">No Posts Found</h2>
              <p className="text-gray-400 mt-2">Please adjust your filters or check back later.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default BlogPage;