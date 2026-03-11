import { create } from 'zustand';
import type { CloudArticle } from '../api/client';

interface ArticleState {
  cloudArticles: CloudArticle[];
  isLoaded: boolean;
  setCloudArticles: (articles: CloudArticle[]) => void;
}

export const useArticleStore = create<ArticleState>((set) => ({
  cloudArticles: [],
  isLoaded: false,
  setCloudArticles: (cloudArticles) => set({ cloudArticles, isLoaded: true }),
}));
