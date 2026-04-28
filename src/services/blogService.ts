
export interface BlogPost {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  link: string;
  date: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
    'wp:term'?: Array<Array<{
      name: string;
      taxonomy: string;
    }>>;
  };
}

export const fetchLatestPosts = async (perPage: number = 3): Promise<BlogPost[]> => {
  try {
    const response = await fetch(`/api/blog-posts?per_page=${perPage}`);
    if (!response.ok) {
      throw new Error('Failed to fetch posts via proxy');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
};
