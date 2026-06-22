import { communityRepository } from '@/services/repositories';
import {
  CommunityPost,
  PostReply,
  NewPostInput,
  NewReplyInput,
  PostCategory,
  ReportInput,
  BlockedUser,
  SupportCircle,
  CirclePost,
  CircleReply,
  CommunityChallenge,
  ChallengeProgress,
  SupportReaction,
} from '@/types/community';
import {
  DEV_SEEDED_CHALLENGES,
  DEV_SEEDED_CHALLENGE_PROGRESS,
  DEV_SEEDED_CIRCLE_POSTS,
} from '@/constants/community';
import { ensureCommunityProfile, getCommunityAuthor } from '@/services/community/communityProfileService';

export async function fetchPosts(category?: PostCategory | null, search?: string): Promise<CommunityPost[]> {
  return communityRepository.getPosts(category, search);
}

export async function fetchPost(postId: string): Promise<CommunityPost | null> {
  return communityRepository.getPost(postId);
}

export async function fetchReplies(postId: string): Promise<PostReply[]> {
  return communityRepository.getReplies(postId);
}

export async function createPost(input: NewPostInput): Promise<CommunityPost> {
  return communityRepository.createPost(input);
}

export async function createReply(input: NewReplyInput): Promise<PostReply> {
  return communityRepository.createReply(input);
}

export async function deletePost(postId: string): Promise<void> {
  return communityRepository.deletePost(postId);
}

export async function deleteReply(postId: string, replyId: string): Promise<void> {
  return communityRepository.deleteReply(postId, replyId);
}

export async function toggleReaction(
  postId: string,
  reactionType: string,
  replyId?: string
): Promise<void> {
  return communityRepository.toggleReaction(postId, reactionType, replyId);
}

export async function reportContent(input: ReportInput): Promise<void> {
  return communityRepository.reportContent(input);
}

export async function blockUser(userId: string): Promise<void> {
  return communityRepository.blockUser(userId);
}

export async function unblockUser(userId: string): Promise<void> {
  return communityRepository.unblockUser(userId);
}

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  return communityRepository.getBlockedUsers();
}

export async function fetchCircles(): Promise<SupportCircle[]> {
  return communityRepository.getCircles();
}

export async function joinCircle(circleId: string): Promise<void> {
  return communityRepository.joinCircle(circleId);
}

export async function leaveCircle(circleId: string): Promise<void> {
  return communityRepository.leaveCircle(circleId);
}

let challenges = JSON.parse(JSON.stringify(DEV_SEEDED_CHALLENGES)) as CommunityChallenge[];
let challengeProgress: Record<string, ChallengeProgress[]> = JSON.parse(JSON.stringify(DEV_SEEDED_CHALLENGE_PROGRESS));
let circlePosts: Record<string, CirclePost[]> = JSON.parse(JSON.stringify(DEV_SEEDED_CIRCLE_POSTS));

const DEFAULT_SUPPORT_REACTIONS: SupportReaction[] = [
  { type: 'understand', count: 0, userReacted: false },
  { type: 'experienced', count: 0, userReacted: false },
  { type: 'sending-support', count: 0, userReacted: false },
  { type: 'helped-me', count: 0, userReacted: false },
];

function cloneSupportReactions(overrides: Partial<Record<SupportReaction['type'], number>> = {}): SupportReaction[] {
  return DEFAULT_SUPPORT_REACTIONS.map((reaction) => ({
    ...reaction,
    count: overrides[reaction.type] ?? reaction.count,
  }));
}

let circleReplies: Record<string, CircleReply[]> = {
  cp1: [
    {
      id: 'cr_seed_1',
      circlePostId: 'cp1',
      body: 'That is a real win. Catching the spiral early can be hard, and naming it before it takes over matters.',
      author: { id: 'u8', displayName: 'gentle_mind', isAnonymous: false },
      createdAt: Date.now() - 95 * 60000,
      reactions: [{ type: 'heart', count: 3, userReacted: false }],
      supportReactions: cloneSupportReactions({ understand: 4, 'sending-support': 2 }),
    },
    {
      id: 'cr_seed_2',
      circlePostId: 'cp1',
      body: 'I needed to read this today. The self-compassion part is usually where I get stuck.',
      author: { id: 'u5', displayName: 'Anonymous', isAnonymous: true },
      createdAt: Date.now() - 52 * 60000,
      reactions: [{ type: 'heart', count: 2, userReacted: false }],
      supportReactions: cloneSupportReactions({ experienced: 3, 'helped-me': 1 }),
    },
  ],
  cp2: [
    {
      id: 'cr_seed_3',
      circlePostId: 'cp2',
      body: 'One thing that helps me is asking: did I do something I can repair, or am I deciding I am bad as a person?',
      author: { id: 'u1', displayName: 'healing_slowly', isAnonymous: false, isTrustedHelper: true, helpfulReplyCount: 47 },
      createdAt: Date.now() - 4 * 3600000,
      reactions: [{ type: 'heart', count: 5, userReacted: false }],
      supportReactions: cloneSupportReactions({ understand: 5, 'helped-me': 4 }),
    },
  ],
  cp3: [
    {
      id: 'cr_seed_4',
      circlePostId: 'cp3',
      body: 'Ice water is the fastest thing for me too. It does not solve the problem, but it gives me enough room to choose.',
      author: { id: 'u10', displayName: 'recovery_road', isAnonymous: false },
      createdAt: Date.now() - 2 * 3600000,
      reactions: [{ type: 'heart', count: 4, userReacted: false }],
      supportReactions: cloneSupportReactions({ experienced: 4, 'helped-me': 2 }),
    },
  ],
};

export async function fetchChallenges(): Promise<CommunityChallenge[]> {
  await new Promise((r) => setTimeout(r, 200));
  console.log('[CommunityService] Fetched', challenges.length, 'challenges');
  return [...challenges];
}

export async function joinChallenge(challengeId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  const challenge = challenges.find((c) => c.id === challengeId);
  if (challenge) {
    challenge.isJoined = true;
    challenge.participantCount += 1;
    if (!challengeProgress[challengeId]) {
      challengeProgress[challengeId] = [];
    }
    challengeProgress[challengeId].push({
      challengeId,
      userId: 'current_user',
      displayName: 'You',
      completedDays: 0,
      totalDays: challenge.durationDays,
      lastCheckedIn: 0,
      isCurrentUser: true,
    });
  }
  console.log('[CommunityService] Joined challenge:', challengeId);
}

export async function leaveChallenge(challengeId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  const challenge = challenges.find((c) => c.id === challengeId);
  if (challenge) {
    challenge.isJoined = false;
    challenge.participantCount = Math.max(0, challenge.participantCount - 1);
    if (challengeProgress[challengeId]) {
      challengeProgress[challengeId] = challengeProgress[challengeId].filter((p) => !p.isCurrentUser);
    }
  }
  console.log('[CommunityService] Left challenge:', challengeId);
}

export async function checkInChallenge(challengeId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  const progress = challengeProgress[challengeId];
  if (progress) {
    const userProgress = progress.find((p) => p.isCurrentUser);
    if (userProgress) {
      userProgress.completedDays += 1;
      userProgress.lastCheckedIn = Date.now();
    }
  }
  console.log('[CommunityService] Checked in challenge:', challengeId);
}

export async function fetchChallengeProgress(challengeId: string): Promise<ChallengeProgress[]> {
  await new Promise((r) => setTimeout(r, 150));
  return challengeProgress[challengeId] ?? [];
}

export async function fetchCirclePosts(circleId: string): Promise<CirclePost[]> {
  await new Promise((r) => setTimeout(r, 250));
  const posts = circlePosts[circleId] ?? [];
  console.log('[CommunityService] Fetched', posts.length, 'circle posts for', circleId);
  return posts;
}

export async function createCirclePost(circleId: string, title: string, body: string, type: CirclePost['type']): Promise<CirclePost> {
  await new Promise((r) => setTimeout(r, 300));
  const profile = await ensureCommunityProfile();
  const newPost: CirclePost = {
    id: `cp_${Date.now()}`,
    circleId,
    title,
    body,
    author: getCommunityAuthor(profile, false),
    createdAt: Date.now(),
    replyCount: 0,
    reactions: [{ type: 'heart', count: 0, userReacted: false }],
    supportReactions: [
      { type: 'understand', count: 0, userReacted: false },
      { type: 'experienced', count: 0, userReacted: false },
      { type: 'sending-support', count: 0, userReacted: false },
      { type: 'helped-me', count: 0, userReacted: false },
    ],
    type,
  };
  if (!circlePosts[circleId]) {
    circlePosts[circleId] = [];
  }
  circlePosts[circleId] = [newPost, ...circlePosts[circleId]];
  console.log('[CommunityService] Created circle post:', newPost.id);
  return newPost;
}

export async function fetchCirclePost(circleId: string, postId: string): Promise<CirclePost | null> {
  await new Promise((r) => setTimeout(r, 180));
  return (circlePosts[circleId] ?? []).find((post) => post.id === postId) ?? null;
}

export async function fetchCircleReplies(postId: string): Promise<CircleReply[]> {
  await new Promise((r) => setTimeout(r, 180));
  return circleReplies[postId] ?? [];
}

export async function createCircleReply(postId: string, body: string): Promise<CircleReply> {
  await new Promise((r) => setTimeout(r, 220));
  const profile = await ensureCommunityProfile();
  const reply: CircleReply = {
    id: `cr_${Date.now()}`,
    circlePostId: postId,
    body,
    author: getCommunityAuthor(profile, false),
    createdAt: Date.now(),
    reactions: [{ type: 'heart', count: 0, userReacted: false }],
    supportReactions: cloneSupportReactions(),
  };
  circleReplies[postId] = [...(circleReplies[postId] ?? []), reply];
  Object.values(circlePosts).forEach((posts) => {
    const post = posts.find((p) => p.id === postId);
    if (post) post.replyCount += 1;
  });
  return reply;
}

export async function deleteCircleReply(postId: string, replyId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 160));
  const reply = (circleReplies[postId] ?? []).find((r) => r.id === replyId);
  if (!reply || reply.author.id !== 'current_user') {
    throw new Error('You can only delete your own replies.');
  }
  circleReplies[postId] = (circleReplies[postId] ?? []).filter((r) => r.id !== replyId);
  Object.values(circlePosts).forEach((posts) => {
    const post = posts.find((p) => p.id === postId);
    if (post) post.replyCount = Math.max(0, post.replyCount - 1);
  });
}

export async function toggleCircleReaction(postId: string, reactionType: string, replyId?: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 140));
  if (replyId) {
    const reply = (circleReplies[postId] ?? []).find((r) => r.id === replyId);
    const reaction = reply?.supportReactions.find((r) => r.type === reactionType);
    if (reaction) {
      reaction.userReacted = !reaction.userReacted;
      reaction.count = Math.max(0, reaction.count + (reaction.userReacted ? 1 : -1));
    }
    return;
  }

  Object.values(circlePosts).forEach((posts) => {
    const post = posts.find((p) => p.id === postId);
    const reaction = post?.supportReactions.find((r) => r.type === reactionType);
    if (reaction) {
      reaction.userReacted = !reaction.userReacted;
      reaction.count = Math.max(0, reaction.count + (reaction.userReacted ? 1 : -1));
    }
  });
}
