

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  image_url?: string;
  created_at: string;
  category?: string;
}

export const fetchLatestPosts = async (perPage: number = 3): Promise<BlogPost[]> => {
  try {
    const response = await fetch(`/api/blog?per_page=${perPage}`);
    
    if (!response.ok) {
      console.warn(`WordPress Proxy error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data || []).map((post: any) => ({
      id: post.id,
      title: post.title.rendered,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 120).trim() + '...',
      content: post.content.rendered,
      created_at: post.date,
      image_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      category: post._embedded?.['wp:term']?.[0]?.[0]?.name || 'Blog'
    }));
  } catch (error) {
    console.error('Error fetching blog posts from WordPress:', error);
    // Silent fallback to empty array so UI doesn't crash
    return [];
  }
};
