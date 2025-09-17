import React from 'react';

/**
 * An elegant post card with an image, designed for a light theme.
 * @param {{ post: object }} props
 */
const PostCard = ({ post }) => {
  return (
    <div className="group bg-white rounded-lg border border-gray-200/80 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={post.imageUrl} 
          alt={post.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/f1f5f9/334155?text=Image+Not+Found'; }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
      </div>

      {/* Content Container */}
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-3">
            <span className="text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">{post.category}</span>
            <p className="text-sm text-gray-500">
              {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors duration-300">{post.title}</h3>
          <p className="text-gray-500 text-sm">By <span className="font-medium text-gray-700">{post.author}</span></p>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200/80">
          <a href="#" className="font-semibold text-sm text-orange-600 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Read More
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
