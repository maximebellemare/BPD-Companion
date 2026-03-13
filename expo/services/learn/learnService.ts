import { LESSONS } from '@/data/lessons';
import { LEARN_CATEGORIES } from '@/data/lessonCategories';
import { Lesson, LessonCategory, LessonProgress, LearnState } from '@/types/learn';
import { learnRepository } from '@/services/repositories';

export async function getLearnState(): Promise<LearnState> {
  return learnRepository.getState();
}

export async function saveLearnState(state: LearnState): Promise<void> {
  return learnRepository.saveState(state);
}

export function getCategories(): LessonCategory[] {
  return LEARN_CATEGORIES;
}

export function getCategoryById(categoryId: string): LessonCategory | undefined {
  return LEARN_CATEGORIES.find(c => c.id === categoryId);
}

export function getLessonsByCategory(categoryId: string): Lesson[] {
  return LESSONS.filter(l => l.categoryId === categoryId);
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return LESSONS.find(l => l.id === lessonId);
}

export function searchLessons(query: string): Lesson[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  return LESSONS.filter(
    l =>
      l.title.toLowerCase().includes(lower) ||
      l.description.toLowerCase().includes(lower) ||
      l.tags.some(t => t.toLowerCase().includes(lower))
  );
}

export function getRecentlyViewedLessons(state: LearnState): Lesson[] {
  return state.recentlyViewed
    .map(id => LESSONS.find(l => l.id === id))
    .filter((l): l is Lesson => l !== undefined)
    .slice(0, 5);
}

export function getBookmarkedLessons(state: LearnState): Lesson[] {
  return state.bookmarkedIds
    .map(id => LESSONS.find(l => l.id === id))
    .filter((l): l is Lesson => l !== undefined);
}

export function getCategoryProgress(categoryId: string, state: LearnState): { completed: number; total: number } {
  const lessons = getLessonsByCategory(categoryId);
  const completed = lessons.filter(l => state.progress[l.id]?.completed).length;
  return { completed, total: lessons.length };
}

export async function markLessonViewed(lessonId: string, state: LearnState): Promise<LearnState> {
  const recentlyViewed = [lessonId, ...state.recentlyViewed.filter(id => id !== lessonId)].slice(0, 10);
  const progress: Record<string, LessonProgress> = {
    ...state.progress,
    [lessonId]: {
      ...(state.progress[lessonId] || { lessonId, completed: false, bookmarked: false }),
      lessonId,
      lastReadAt: Date.now(),
    },
  };
  const newState = { ...state, recentlyViewed, progress };
  await learnRepository.saveState(newState);
  return newState;
}

export async function markLessonCompleted(lessonId: string, state: LearnState): Promise<LearnState> {
  const progress: Record<string, LessonProgress> = {
    ...state.progress,
    [lessonId]: {
      ...(state.progress[lessonId] || { lessonId, bookmarked: false }),
      lessonId,
      completed: true,
      lastReadAt: Date.now(),
    },
  };
  const newState = { ...state, progress };
  await learnRepository.saveState(newState);
  return newState;
}

export async function toggleBookmark(lessonId: string, state: LearnState): Promise<LearnState> {
  const isBookmarked = state.bookmarkedIds.includes(lessonId);
  const bookmarkedIds = isBookmarked
    ? state.bookmarkedIds.filter(id => id !== lessonId)
    : [...state.bookmarkedIds, lessonId];
  const progress: Record<string, LessonProgress> = {
    ...state.progress,
    [lessonId]: {
      ...(state.progress[lessonId] || { lessonId, completed: false, lastReadAt: 0 }),
      lessonId,
      bookmarked: !isBookmarked,
    },
  };
  const newState = { ...state, bookmarkedIds, progress };
  await learnRepository.saveState(newState);
  return newState;
}
