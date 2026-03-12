import { DBT_SKILLS, DBT_MODULES } from '@/data/dbtSkills';
import { DBTSkill, DBTModuleInfo, DBTModule, DBTProgress, DBTRecommendation, DEFAULT_DBT_PROGRESS } from '@/types/dbt';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dbt_progress';

export async function getDBTProgress(): Promise<DBTProgress> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_DBT_PROGRESS;
  } catch (error) {
    console.log('Error loading DBT progress:', error);
    return DEFAULT_DBT_PROGRESS;
  }
}

export async function saveDBTProgress(progress: DBTProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.log('Error saving DBT progress:', error);
  }
}

export function getModules(): DBTModuleInfo[] {
  return DBT_MODULES;
}

export function getModuleById(moduleId: DBTModule): DBTModuleInfo | undefined {
  return DBT_MODULES.find(m => m.id === moduleId);
}

export function getSkillsByModule(moduleId: DBTModule): DBTSkill[] {
  return DBT_SKILLS.filter(s => s.moduleId === moduleId);
}

export function getSkillById(skillId: string): DBTSkill | undefined {
  return DBT_SKILLS.find(s => s.id === skillId);
}

export function getAllSkills(): DBTSkill[] {
  return DBT_SKILLS;
}

export function searchSkills(query: string): DBTSkill[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  return DBT_SKILLS.filter(
    s =>
      s.title.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower) ||
      s.tags.some(t => t.toLowerCase().includes(lower))
  );
}

export async function markSkillPracticed(skillId: string, progress: DBTProgress): Promise<DBTProgress> {
  const updated: DBTProgress = {
    ...progress,
    completedSkills: {
      ...progress.completedSkills,
      [skillId]: (progress.completedSkills[skillId] || 0) + 1,
    },
    lastPracticedAt: {
      ...progress.lastPracticedAt,
      [skillId]: Date.now(),
    },
    totalPractices: progress.totalPractices + 1,
  };
  await saveDBTProgress(updated);
  return updated;
}

export async function toggleFavoriteSkill(skillId: string, progress: DBTProgress): Promise<DBTProgress> {
  const isFavorite = progress.favoriteSkills.includes(skillId);
  const updated: DBTProgress = {
    ...progress,
    favoriteSkills: isFavorite
      ? progress.favoriteSkills.filter(id => id !== skillId)
      : [...progress.favoriteSkills, skillId],
  };
  await saveDBTProgress(updated);
  return updated;
}

export function getRecommendedSkills(
  recentTriggers: string[],
  recentEmotions: string[],
  recentUrges: string[],
  distressIntensity: number,
): DBTRecommendation[] {
  const recommendations: DBTRecommendation[] = [];

  if (distressIntensity >= 7) {
    recommendations.push({
      skillId: 'dt-tip',
      reason: 'Your distress is high — TIP skills can help reduce intensity quickly.',
      priority: 10,
    });
    recommendations.push({
      skillId: 'dt-stop',
      reason: 'STOP can help prevent impulsive reactions during intense moments.',
      priority: 9,
    });
  }

  const hasAbandonmentTriggers = recentTriggers.some(t =>
    t.toLowerCase().includes('abandon') || t.toLowerCase().includes('reject') || t.toLowerCase().includes('ignored')
  );
  if (hasAbandonmentTriggers) {
    recommendations.push({
      skillId: 'er-check-facts',
      reason: 'Abandonment fears often involve mind reading — checking facts can help.',
      priority: 8,
    });
    recommendations.push({
      skillId: 'ie-validation',
      reason: 'Validating your own feelings of abandonment can reduce their intensity.',
      priority: 7,
    });
  }

  const hasRelationshipTriggers = recentTriggers.some(t =>
    t.toLowerCase().includes('conflict') || t.toLowerCase().includes('relationship') || t.toLowerCase().includes('partner')
  );
  if (hasRelationshipTriggers) {
    recommendations.push({
      skillId: 'ie-dear-man',
      reason: 'DEAR MAN can help you communicate your needs clearly in relationships.',
      priority: 8,
    });
    recommendations.push({
      skillId: 'ie-give',
      reason: 'GIVE skills help maintain the relationship while expressing needs.',
      priority: 7,
    });
  }

  const hasAngerEmotions = recentEmotions.some(e =>
    e.toLowerCase().includes('angry') || e.toLowerCase().includes('rage') || e.toLowerCase().includes('frustrated')
  );
  if (hasAngerEmotions) {
    recommendations.push({
      skillId: 'er-opposite-action',
      reason: 'Opposite action is especially effective for managing anger urges.',
      priority: 8,
    });
  }

  const hasSadness = recentEmotions.some(e =>
    e.toLowerCase().includes('sad') || e.toLowerCase().includes('empty') || e.toLowerCase().includes('numb')
  );
  if (hasSadness) {
    recommendations.push({
      skillId: 'dt-self-soothe',
      reason: 'Self-soothing through senses can provide comfort during sadness.',
      priority: 7,
    });
    recommendations.push({
      skillId: 'er-abc-please',
      reason: 'Building positive experiences can help counter persistent sadness.',
      priority: 6,
    });
  }

  const hasImpulsiveUrges = recentUrges.some(u =>
    u.toLowerCase().includes('text') || u.toLowerCase().includes('send') || u.toLowerCase().includes('lash')
  );
  if (hasImpulsiveUrges) {
    recommendations.push({
      skillId: 'dt-stop',
      reason: 'STOP can create space between your urge and your action.',
      priority: 9,
    });
    recommendations.push({
      skillId: 'dt-pros-cons',
      reason: 'Weighing pros and cons helps engage your rational mind before acting.',
      priority: 7,
    });
  }

  const hasAnxiety = recentEmotions.some(e =>
    e.toLowerCase().includes('anxious') || e.toLowerCase().includes('afraid') || e.toLowerCase().includes('worried')
  );
  if (hasAnxiety) {
    recommendations.push({
      skillId: 'mf-wise-mind',
      reason: 'Wise mind helps balance anxious thoughts with grounded wisdom.',
      priority: 7,
    });
    recommendations.push({
      skillId: 'mf-one-mindfully',
      reason: 'One-mindfully practice helps calm racing thoughts and anxiety.',
      priority: 6,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      skillId: 'mf-observe',
      reason: 'A great daily practice for building emotional awareness.',
      priority: 5,
    });
    recommendations.push({
      skillId: 'mf-wise-mind',
      reason: 'Wise mind practice helps you stay centered and balanced.',
      priority: 4,
    });
  }

  const uniqueMap = new Map<string, DBTRecommendation>();
  recommendations.forEach(r => {
    const existing = uniqueMap.get(r.skillId);
    if (!existing || existing.priority < r.priority) {
      uniqueMap.set(r.skillId, r);
    }
  });

  return Array.from(uniqueMap.values())
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

export function getModuleProgress(moduleId: DBTModule, progress: DBTProgress): { practiced: number; total: number } {
  const skills = getSkillsByModule(moduleId);
  const practiced = skills.filter(s => (progress.completedSkills[s.id] || 0) > 0).length;
  return { practiced, total: skills.length };
}
