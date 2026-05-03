
import { supabase } from '../lib/supabase';

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
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(perPage);

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Table "posts" not found. Using mock data instead.');
        return [
          {
            id: 1,
            title: 'Novidades no Cardumy: Novo Deckbuilder!',
            excerpt: 'Confira as novas funcionalidades do nosso construtor de baralhos.',
            created_at: new Date().toISOString(),
            category: 'Update'
          },
          {
            id: 2,
            title: 'Guia de Início: Como começar no Pokémon TCG',
            excerpt: 'Tudo o que você precisa saber para entrar no mundo competitivo.',
            created_at: new Date().toISOString(),
            category: 'Guia'
          },
          {
            id: 3,
            title: 'Top 10 cartas raras do mês',
            excerpt: 'Veja quais cartas estão valorizando no mercado atual.',
            created_at: new Date().toISOString(),
            category: 'Mercado'
          }
        ];
      }
      throw error;
    }

    return (data || []).map(post => ({
      ...post,
      title: post.title,
      excerpt: post.excerpt,
    }));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
};
