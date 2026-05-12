import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/axios';

/**
 * Hook to consume CMS page content with fallback support.
 * @param {string} pageSlug - The slug of the page (e.g., 'homepage')
 */
export const usePageContent = (pageSlug) => {
  const [content, setContent] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/page-contents/${pageSlug}`);
      if (response.data.success) {
        const contentMap = {};
        response.data.data.forEach(item => {
          contentMap[item.section_key] = item;
        });
        setContent(contentMap);
      }
    } catch (err) {
      console.error(`[usePageContent] Error fetching ${pageSlug}:`, err.message);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [pageSlug]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  /**
   * Get text content with fallback.
   */
  const getText = (key, fallback = '') => {
    return content[key]?.content_value || fallback;
  };

  /**
   * Get image URL with fallback.
   */
  const getImage = (key, fallback = '') => {
    return content[key]?.content_value || fallback;
  };

  return { content, isLoading, error, getText, getImage, refresh: fetchContent };
};
