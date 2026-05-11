import { useLocation } from 'react-router-dom';

/**
 * Detects what the user is currently viewing and returns
 * a context payload for chat session creation.
 *
 * @param {Object} contextOverride Explicit context (e.g., from a product page)
 * @returns {{ type: string, id: string|null, title: string|null, url: string }}
 */
const useChatContext = (contextOverride = null) => {
  const location = useLocation();

  if (contextOverride) {
    return {
      type: contextOverride.type,
      id: contextOverride.id,
      title: contextOverride.title,
      url: location.pathname,
    };
  }

  // Auto-detect from URL pattern (fallback)
  if (location.pathname.startsWith('/shop/products/')) {
    return { type: 'product', id: null, title: 'Product Page', url: location.pathname };
  }
  if (location.pathname.startsWith('/shop/articles/')) {
    return { type: 'article', id: null, title: 'Article Page', url: location.pathname };
  }

  return { type: 'general', id: null, title: null, url: location.pathname };
};

export default useChatContext;
