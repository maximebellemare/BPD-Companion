import { storageService } from '@/services/storage/storageService';

export type DBTAcademyTrack =
  | 'abandonment'
  | 'rejection'
  | 'anger'
  | 'shame'
  | 'relationships'
  | 'impulsivity'
  | 'emotional_regulation'
  | 'distress_tolerance'
  | 'mindfulness'
  | 'identity_self_image';
export type DBTAcademyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DBTAcademyChoice {
  id: string;
  text: string;
}

export interface DBTAcademyScenario {
  id: string;
  track: DBTAcademyTrack;
  level: DBTAcademyLevel;
  scenario: string;
  question: string;
  choices: DBTAcademyChoice[];
  correctChoiceId: string;
  skill: string;
  why: string;
  whatUsuallyHappens: string;
}

export interface DBTAcademyProgress {
  completedScenarioIds: string[];
  correctScenarioIds: string[];
  trackCompletions: Record<DBTAcademyTrack, number>;
  levelCompletions: Record<DBTAcademyLevel, number>;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  totalAttempts: number;
}

const STORAGE_KEY = 'bpd_companion_dbt_academy_progress';

export const TRACK_LABELS: Record<DBTAcademyTrack, string> = {
  abandonment: 'Abandonment',
  rejection: 'Rejection',
  anger: 'Anger',
  shame: 'Shame',
  relationships: 'Relationships',
  impulsivity: 'Impulsivity',
  emotional_regulation: 'Emotional Regulation',
  distress_tolerance: 'Distress Tolerance',
  mindfulness: 'Mindfulness',
  identity_self_image: 'Identity & Self-Image',
};

export const LEVEL_LABELS: Record<DBTAcademyLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const DEFAULT_DBT_ACADEMY_PROGRESS: DBTAcademyProgress = {
  completedScenarioIds: [],
  correctScenarioIds: [],
  trackCompletions: {
    abandonment: 0,
    rejection: 0,
    anger: 0,
    shame: 0,
    relationships: 0,
    impulsivity: 0,
    emotional_regulation: 0,
    distress_tolerance: 0,
    mindfulness: 0,
    identity_self_image: 0,
  },
  levelCompletions: {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  },
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  totalAttempts: 0,
};

interface DBTAcademySituation {
  id: string;
  text: string;
  urge: string;
  value: string;
}

const LEVEL_SKILLS: Record<DBTAcademyLevel, { skill: string; correct: string; question: string }> = {
  beginner: {
    skill: 'STOP + Name the Emotion',
    correct: 'Pause, name the emotion and urge, and wait before acting.',
    question: 'What is the most skillful first move?',
  },
  intermediate: {
    skill: 'Check the Facts + Wise Mind',
    correct: 'Check what is known, what is assumed, and what Wise Mind would do next.',
    question: 'What response best balances emotion and effectiveness?',
  },
  advanced: {
    skill: 'DEAR MAN / GIVE / FAST',
    correct: 'Wait until intensity drops, then communicate one clear need while protecting self-respect.',
    question: 'What is the strongest advanced DBT move?',
  },
};

const TRACK_SITUATIONS: Record<DBTAcademyTrack, DBTAcademySituation[]> = {
  abandonment: [
    { id: 'no_reply_partner', text: "Your partner hasn't answered for 6 hours.", urge: 'send repeated messages for reassurance', value: 'secure connection' },
    { id: 'seen_online', text: 'They are online but have not replied to you.', urge: 'accuse them of ignoring you', value: 'direct communication' },
    { id: 'plans_changed', text: 'Someone changes plans and you feel suddenly disposable.', urge: 'cancel the whole relationship before they can leave', value: 'steady closeness' },
    { id: 'short_goodnight', text: 'A goodnight text is shorter than usual.', urge: 'ask if they still love you until they prove it', value: 'trust with reality checks' },
    { id: 'friend_busy', text: 'Your friend says they are too busy to talk tonight.', urge: 'decide you are not important to them', value: 'mutual flexibility' },
    { id: 'partner_needs_space', text: 'Your partner says they need space after an argument.', urge: 'follow them emotionally until they reassure you', value: 'respectful repair' },
    { id: 'left_on_read', text: 'You are left on read after sharing something vulnerable.', urge: 'send a hurt message to make the pain visible', value: 'clear vulnerability' },
    { id: 'late_arrival', text: 'Someone is late and your body reads it as being abandoned.', urge: 'leave first so you are not the one left', value: 'staying grounded' },
    { id: 'weekend_without_you', text: 'They make weekend plans that do not include you.', urge: 'test whether they will choose you', value: 'asking directly' },
    { id: 'quiet_after_date', text: 'After a warm date, they become quiet the next day.', urge: 'search for evidence that the connection was fake', value: 'tolerating uncertainty' },
    { id: 'parent_no_call', text: 'A parent forgets to call when they said they would.', urge: 'tell yourself you never mattered', value: 'self-validation' },
    { id: 'friend_new_friend', text: 'A friend posts with someone new and you feel replaced.', urge: 'pull away before they replace you fully', value: 'stable friendship' },
    { id: 'boundary_space', text: 'Someone sets a boundary and your fear says it means rejection.', urge: 'push the boundary to check if they care', value: 'safe boundaries' },
    { id: 'reply_tone_shift', text: 'Their replies suddenly sound less affectionate.', urge: 'demand certainty immediately', value: 'calm clarification' },
    { id: 'cancelled_trip', text: 'A planned visit is postponed and you feel panic rise.', urge: 'threaten to end things', value: 'problem solving' },
    { id: 'therapy_gap', text: 'Your therapist is away for a week and you feel dropped.', urge: 'shut down and stop using skills', value: 'continuity of care' },
    { id: 'group_chat_silent', text: 'A group chat keeps going but nobody answers your message.', urge: 'send a sarcastic comment', value: 'belonging without chasing' },
    { id: 'partner_tired', text: 'Your partner is tired and less emotionally available tonight.', urge: 'make them prove they still want you', value: 'shared humanity' },
    { id: 'date_reschedule', text: 'Someone asks to reschedule a date for the second time.', urge: 'assume you were never wanted', value: 'facts before conclusions' },
    { id: 'goodbye_trigger', text: 'A normal goodbye suddenly feels final in your body.', urge: 'cling, plead, or create a crisis', value: 'internal safety' },
  ],
  rejection: [
    { id: 'cancelled_plans', text: 'A friend cancels plans at the last minute.', urge: 'assume they are tired of you', value: 'accurate interpretation' },
    { id: 'no_invite', text: 'You see photos from an event you were not invited to.', urge: 'decide everyone secretly dislikes you', value: 'checking assumptions' },
    { id: 'short_reply', text: 'Someone replies with "ok" and no warmth.', urge: 'ask what you did wrong repeatedly', value: 'steady self-worth' },
    { id: 'joke_lands_badly', text: 'A joke you made lands awkwardly and the room gets quiet.', urge: 'mentally replay it for hours', value: 'self-compassion' },
    { id: 'work_feedback', text: 'A manager gives brief corrective feedback.', urge: 'hear it as proof you are failing', value: 'learning without collapse' },
    { id: 'friend_delayed_response', text: 'A friend responds warmly but much later than expected.', urge: 'punish them with coldness', value: 'connection without scorekeeping' },
    { id: 'social_media_like', text: 'They liked someone else’s post but not yours.', urge: 'compare yourself until you feel worthless', value: 'attention flexibility' },
    { id: 'family_teasing', text: 'A family member teases you and it hits a painful spot.', urge: 'snap back or disappear', value: 'self-respect' },
    { id: 'partner_distracted', text: 'Your partner seems distracted while you are talking.', urge: 'conclude you are boring or unwanted', value: 'asking instead of assuming' },
    { id: 'left_out_lunch', text: 'Coworkers go to lunch without mentioning it.', urge: 'withdraw from everyone at work', value: 'balanced belonging' },
    { id: 'unmatched_app', text: 'Someone unmatched you after a good conversation.', urge: 'decide dating is proof you are unlovable', value: 'resilience' },
    { id: 'ignored_story', text: 'Nobody reacts to something personal you posted.', urge: 'delete it and shame yourself', value: 'nonjudgmental awareness' },
    { id: 'tone_misread', text: 'A neutral tone feels like disgust.', urge: 'defend yourself before anything happened', value: 'slowing interpretation' },
    { id: 'friend_busy_week', text: 'A friend has been busy all week.', urge: 'tell them not to bother anymore', value: 'repairable connection' },
    { id: 'sibling_preferred', text: 'Your sibling receives praise and you feel invisible.', urge: 'attack yourself or compete', value: 'separate worth' },
    { id: 'message_no_emoji', text: 'A message arrives with no emoji and feels cold.', urge: 'ask if they are mad', value: 'emotional accuracy' },
    { id: 'date_slow_reply', text: 'A date says they had a nice time but replies slowly.', urge: 'decide they are lying', value: 'patience' },
    { id: 'group_interrupt', text: 'You get interrupted in a group conversation.', urge: 'stop speaking for the rest of the night', value: 'taking space back' },
    { id: 'boundary_declined', text: 'Someone says no to a request you made.', urge: 'hear the no as rejection of you', value: 'respecting limits' },
    { id: 'forgotten_detail', text: 'Someone forgets a detail that mattered to you.', urge: 'think you do not matter to them at all', value: 'specific repair' },
  ],
  anger: [
    { id: 'cold_tone', text: 'Someone replies with a colder tone than usual.', urge: 'match their tone so they feel it too', value: 'de-escalation' },
    { id: 'unfair_criticism', text: 'You receive criticism that feels unfair and humiliating.', urge: 'list every mistake they have made', value: 'self-respect' },
    { id: 'interrupted', text: 'You are interrupted while explaining something important.', urge: 'raise your voice to regain control', value: 'being heard clearly' },
    { id: 'accused_wrongly', text: 'Someone accuses you of something you did not do.', urge: 'attack their character', value: 'truth without escalation' },
    { id: 'dismissed_feelings', text: 'A person says you are overreacting.', urge: 'prove how much they hurt you', value: 'validation and clarity' },
    { id: 'partner_late', text: 'Your partner is late again after promising they would not be.', urge: 'send a harsh message before they arrive', value: 'accountability' },
    { id: 'family_comment', text: 'A family member makes a comment about your choices.', urge: 'bring up years of resentment', value: 'present-moment boundary' },
    { id: 'friend_judges', text: 'A friend gives advice that sounds judgmental.', urge: 'tell them they are a bad friend', value: 'specific feedback' },
    { id: 'coworker_credit', text: 'A coworker takes credit for part of your work.', urge: 'embarrass them publicly', value: 'effective advocacy' },
    { id: 'ignored_boundary', text: 'Someone ignores a boundary you clearly stated.', urge: 'explode so they finally understand', value: 'firm consistency' },
    { id: 'jealousy_spike', text: 'Jealousy spikes when your partner mentions someone attractive.', urge: 'interrogate them', value: 'trust and honesty' },
    { id: 'rude_text', text: 'A text message sounds rude and dismissive.', urge: 'send a paragraph proving your point', value: 'clear repair' },
    { id: 'public_embarrassment', text: 'You feel embarrassed by something someone said in front of others.', urge: 'humiliate them back', value: 'dignity' },
    { id: 'broken_promise', text: 'Someone breaks a promise that mattered to you.', urge: 'declare that they never care', value: 'accountability without all-or-nothing thinking' },
    { id: 'noise_overload', text: 'Noise and stress build until a small comment makes you furious.', urge: 'snap at the nearest person', value: 'nervous system care' },
    { id: 'money_conflict', text: 'A money conversation turns tense.', urge: 'make accusations about selfishness', value: 'problem solving' },
    { id: 'slow_service', text: 'A frustrating service issue makes your body feel hot and activated.', urge: 'speak sharply to the worker', value: 'effectiveness' },
    { id: 'misunderstood', text: 'Someone misunderstands you after you tried hard to explain.', urge: 'keep arguing until they get it', value: 'being understood' },
    { id: 'sarcastic_reply', text: 'You receive a sarcastic reply during conflict.', urge: 'send something more cutting back', value: 'not feeding the spiral' },
    { id: 'boundary_tested', text: 'Someone tests your patience after a long day.', urge: 'make the response bigger than the moment', value: 'proportion' },
  ],
  shame: [
    { id: 'made_mistake', text: 'You made a mistake and feel like a terrible person.', urge: 'hide and replay everything you did wrong', value: 'repair without self-attack' },
    { id: 'overshared', text: 'You overshared and now feel exposed.', urge: 'apologize repeatedly or disappear', value: 'self-compassion' },
    { id: 'missed_deadline', text: 'You missed a deadline and feel worthless.', urge: 'avoid opening messages', value: 'responsibility without collapse' },
    { id: 'emotional_outburst', text: 'You cried or raised your voice and now feel ashamed.', urge: 'tell yourself you ruin everything', value: 'repair' },
    { id: 'body_comparison', text: 'You compare your body to someone else and feel defective.', urge: 'punish yourself or seek reassurance', value: 'body neutrality' },
    { id: 'messy_home', text: 'Your home is messy and you feel like a failure.', urge: 'give up because it is already bad', value: 'small effective action' },
    { id: 'forgot_birthday', text: 'You forgot something important to someone.', urge: 'over-apologize until they comfort you', value: 'accountable repair' },
    { id: 'therapy_setback', text: 'You used an old coping behavior and feel like progress is gone.', urge: 'quit trying', value: 'recommitment' },
    { id: 'social_regret', text: 'You replay something you said at a gathering.', urge: 'decide everyone thinks you are too much', value: 'balanced memory' },
    { id: 'money_spent', text: 'You spent money impulsively and feel disgusted with yourself.', urge: 'avoid looking at the account', value: 'honest reset' },
    { id: 'needs_support', text: 'You need support but feel ashamed for needing anything.', urge: 'pretend you are fine', value: 'healthy dependence' },
    { id: 'jealous_feeling', text: 'You feel jealous and judge yourself for it.', urge: 'hide the feeling or act controlling', value: 'emotion acceptance' },
    { id: 'work_error', text: 'A work error is pointed out in writing.', urge: 'read it as proof you are incompetent', value: 'learning' },
    { id: 'family_pattern', text: 'A family pattern gets activated and you act younger than you want to.', urge: 'hate yourself for reacting', value: 'understanding triggers' },
    { id: 'unanswered_need', text: 'You asked for reassurance and feel embarrassed afterward.', urge: 'take it back or apologize for existing', value: 'valid needs' },
    { id: 'comparison_success', text: 'Someone your age seems more successful.', urge: 'decide you are behind forever', value: 'values-based progress' },
    { id: 'crying_public', text: 'You tear up in public and feel exposed.', urge: 'leave and avoid everyone', value: 'gentle recovery' },
    { id: 'awkward_silence', text: 'An awkward silence makes you feel deeply flawed.', urge: 'fill the space frantically', value: 'tolerating discomfort' },
    { id: 'past_memory', text: 'A painful memory returns and shame floods your body.', urge: 'treat the memory like a current fact', value: 'grounded present' },
    { id: 'apology_not_accepted', text: 'Someone is not ready to accept your apology yet.', urge: 'beg until they forgive you', value: 'respecting repair timing' },
  ],
  relationships: [
    { id: 'need_reassurance', text: 'You need reassurance but worry asking will sound needy.', urge: 'hint and hope they notice', value: 'direct warmth' },
    { id: 'boundary_pushed', text: 'Someone keeps pushing a boundary after you explained it once.', urge: 'drop the boundary to keep peace', value: 'self-respect' },
    { id: 'hard_conversation', text: 'You need to bring up something sensitive.', urge: 'wait until you explode', value: 'timely honesty' },
    { id: 'partner_space', text: 'Your partner asks for alone time tonight.', urge: 'turn it into proof they do not want you', value: 'secure space' },
    { id: 'friend_conflict', text: 'A friend seems upset but says nothing is wrong.', urge: 'push until they admit it', value: 'respectful curiosity' },
    { id: 'family_boundary', text: 'A parent asks for something you cannot give.', urge: 'say yes then resent them', value: 'clear limits' },
    { id: 'jealous_question', text: 'You want to ask about someone you feel jealous of.', urge: 'interrogate for certainty', value: 'honest vulnerability' },
    { id: 'repair_after_snap', text: 'You snapped during conflict and want to repair.', urge: 'make a huge apology that asks them to reassure you', value: 'clean accountability' },
    { id: 'text_tone', text: 'Text tone is confusing and you feel yourself spiraling.', urge: 'solve the whole relationship by text', value: 'choosing the right medium' },
    { id: 'roommate_issue', text: 'A roommate keeps leaving shared space messy.', urge: 'store resentment until it bursts', value: 'specific request' },
    { id: 'coworker_boundary', text: 'A coworker messages after hours repeatedly.', urge: 'reply instantly then feel trapped', value: 'professional boundary' },
    { id: 'friend_needs_space', text: 'A friend says they need space after tension.', urge: 'send long explanations to close the gap', value: 'respectful pacing' },
    { id: 'date_expectations', text: 'You want more clarity from someone you are dating.', urge: 'test them instead of asking', value: 'directness' },
    { id: 'conflict_topic_shift', text: 'During conflict, the topic keeps shifting.', urge: 'follow every accusation', value: 'staying on one issue' },
    { id: 'support_request', text: 'You want emotional support but they are busy.', urge: 'make their busyness mean they do not care', value: 'flexible support' },
    { id: 'apology_needed', text: 'You need an apology but fear sounding demanding.', urge: 'act cold until they guess', value: 'clear request' },
    { id: 'boundary_guilt', text: 'You feel guilty after saying no.', urge: 'take the no back immediately', value: 'values-based boundaries' },
    { id: 'relationship_checkin', text: 'You want to ask where the relationship stands.', urge: 'ask in a panic at midnight', value: 'effective timing' },
    { id: 'different_needs', text: 'You and someone close need different amounts of contact.', urge: 'treat the difference as rejection', value: 'negotiation' },
    { id: 'post_conflict_silence', text: 'After conflict, silence feels unbearable.', urge: 'force a resolution immediately', value: 'repair with consent' },
  ],
  impulsivity: [
    { id: 'text_again', text: 'You want to text again even though you already sent three messages.', urge: 'send one more message for relief', value: 'long-term trust' },
    { id: 'spending_empty', text: 'You feel empty and suddenly want to buy something expensive.', urge: 'purchase fast before the feeling returns', value: 'financial stability' },
    { id: 'quit_job', text: 'After criticism, you want to quit your job immediately.', urge: 'resign before anyone rejects you', value: 'future options' },
    { id: 'delete_account', text: 'You feel exposed online and want to delete every account.', urge: 'erase yourself from view', value: 'thoughtful privacy' },
    { id: 'drive_to_them', text: 'You want to show up at someone’s place uninvited.', urge: 'get answers in person right now', value: 'respectful boundaries' },
    { id: 'substance_urge', text: 'A painful emotion brings an urge to drink or use substances.', urge: 'numb the feeling quickly', value: 'body safety' },
    { id: 'overshare_message', text: 'You want to send a huge confession while activated.', urge: 'empty everything out at once', value: 'paced vulnerability' },
    { id: 'block_unblock', text: 'You want to block someone, then hope they notice.', urge: 'create a reaction', value: 'clear communication' },
    { id: 'reckless_date', text: 'You feel rejected and want to meet someone unsafe for validation.', urge: 'prove you are wanted', value: 'safe connection' },
    { id: 'self_sabotage', text: 'A good thing starts to feel scary and you want to ruin it first.', urge: 'end it before it can hurt you', value: 'tolerating good' },
    { id: 'angry_post', text: 'You want to post publicly while furious.', urge: 'make everyone see your side', value: 'privacy and dignity' },
    { id: 'skip_appointment', text: 'Shame makes you want to skip an important appointment.', urge: 'avoid being seen', value: 'care continuity' },
    { id: 'over_apologize', text: 'You want to apologize ten times to stop someone being upset.', urge: 'flood them with repair', value: 'clean accountability' },
    { id: 'search_socials', text: 'You want to search their socials for clues for hours.', urge: 'reduce uncertainty by investigating', value: 'mental freedom' },
    { id: 'throw_item', text: 'Anger makes you want to throw something.', urge: 'release the pressure physically', value: 'safety' },
    { id: 'cancel_everything', text: 'One disappointment makes you want to cancel all your plans.', urge: 'withdraw completely', value: 'staying connected to life' },
    { id: 'start_fight', text: 'You feel distant from someone and want to start a fight to feel close.', urge: 'create intensity', value: 'secure closeness' },
    { id: 'impulsive_hair', text: 'You want to make a drastic appearance change during distress.', urge: 'become someone else right now', value: 'chosen self-expression' },
    { id: 'send_screenshot', text: 'You want to send screenshots to prove your point.', urge: 'win the argument', value: 'repair over proof' },
    { id: 'leave_event', text: 'You want to leave an event suddenly without telling anyone.', urge: 'escape before feelings show', value: 'safe exit plan' },
  ],
  emotional_regulation: [
    { id: 'mood_flip', text: 'Your mood shifts from calm to panicked in minutes.', urge: 'treat the new feeling as the whole truth', value: 'emotional steadiness' },
    { id: 'sleep_deprived', text: 'After poor sleep, everything feels more personal.', urge: 'make big conclusions today', value: 'body-informed choices' },
    { id: 'hunger_irritability', text: 'You are hungry and suddenly furious at small things.', urge: 'argue before caring for your body', value: 'PLEASE skills' },
    { id: 'emotion_name_hard', text: 'You feel bad but cannot tell if it is fear, anger, or sadness.', urge: 'act before naming it', value: 'emotional clarity' },
    { id: 'sadness_pull', text: 'Sadness tells you to stay in bed all day.', urge: 'cancel every supportive plan', value: 'opposite action' },
    { id: 'anxiety_rumination', text: 'Anxiety keeps replaying the same possible outcome.', urge: 'think until certainty appears', value: 'mindful refocus' },
    { id: 'jealousy_heat', text: 'Jealousy creates heat in your body and a story in your mind.', urge: 'treat the story as fact', value: 'checking facts' },
    { id: 'emptiness_evening', text: 'Evenings often bring emptiness and restlessness.', urge: 'fill the void with intensity', value: 'planned soothing' },
    { id: 'emotion_after_conflict', text: 'After conflict, the emotion keeps surging even when the conversation is over.', urge: 'restart the argument', value: 'letting waves pass' },
    { id: 'good_mood_fear', text: 'A good mood feels unsafe because you expect it to crash.', urge: 'scan for what will go wrong', value: 'allowing pleasant emotion' },
    { id: 'overwhelm_tasks', text: 'Too many tasks make your brain feel flooded.', urge: 'give up on all of them', value: 'one next step' },
    { id: 'criticism_spiral', text: 'A small correction turns into hours of self-attack.', urge: 'believe the attack will prevent mistakes', value: 'effective learning' },
    { id: 'lonely_night', text: 'Loneliness feels unbearable late at night.', urge: 'reach for anyone immediately', value: 'safe connection plan' },
    { id: 'emotion_contagion', text: 'Someone else’s stress quickly becomes your stress.', urge: 'absorb and fix it', value: 'emotional boundaries' },
    { id: 'morning_dread', text: 'You wake up with dread before anything happens.', urge: 'cancel the day', value: 'routine before conclusions' },
    { id: 'sudden_numbness', text: 'You go numb after feeling too much.', urge: 'force a dramatic feeling to prove you are real', value: 'gentle grounding' },
    { id: 'spiral_after_memory', text: 'A memory suddenly changes your whole emotional state.', urge: 'live from the memory', value: 'present orientation' },
    { id: 'envy_success', text: 'Someone else succeeds and you feel envy and panic.', urge: 'attack yourself', value: 'values action' },
    { id: 'fear_of_calm', text: 'Calm feels unfamiliar and suspicious.', urge: 'create a problem to feel normal', value: 'tolerating calm' },
    { id: 'emotion_label_shift', text: 'You realize anger might be covering fear.', urge: 'stay angry because it feels stronger', value: 'primary emotion awareness' },
  ],
  distress_tolerance: [
    { id: 'panic_waiting', text: 'You are waiting for a reply and panic is rising fast.', urge: 'do anything to end the waiting', value: 'surviving the wave' },
    { id: 'urge_peak', text: 'An urge feels like it will never end.', urge: 'act just to make it stop', value: 'urge surfing' },
    { id: 'after_argument', text: 'After an argument, your body is shaking.', urge: 'reopen the fight immediately', value: 'nervous system downshift' },
    { id: 'public_trigger', text: 'You get triggered in public and cannot leave right away.', urge: 'panic or shut down', value: 'portable grounding' },
    { id: 'night_crisis_feeling', text: 'At night, distress feels bigger and more permanent.', urge: 'make permanent decisions', value: 'temporary survival plan' },
    { id: 'bad_news', text: 'You receive upsetting news and your mind goes blank.', urge: 'react before orienting', value: 'crisis pause' },
    { id: 'body_activation', text: 'Your chest is tight and your hands are buzzing.', urge: 'interpret body alarm as danger', value: 'body-based regulation' },
    { id: 'cannot_fix_now', text: 'The problem cannot be fixed tonight.', urge: 'keep pushing until exhausted', value: 'radical acceptance' },
    { id: 'shame_wave', text: 'A shame wave makes you want to disappear.', urge: 'isolate completely', value: 'self-soothing' },
    { id: 'rejection_wave', text: 'A rejection trigger makes your body feel unsafe.', urge: 'seek immediate proof you matter', value: 'distress tolerance' },
    { id: 'conflict_pause', text: 'Someone asks to pause a conflict.', urge: 'refuse because the pause feels dangerous', value: 'tolerating delay' },
    { id: 'overstimulated', text: 'Noise, lights, and messages are too much at once.', urge: 'snap or shut down', value: 'sensory reduction' },
    { id: 'work_meltdown', text: 'You feel close to breaking down at work or school.', urge: 'abandon everything', value: 'short crisis plan' },
    { id: 'waiting_room', text: 'You are stuck waiting and your thoughts get louder.', urge: 'spiral through worst cases', value: 'moment anchoring' },
    { id: 'message_draft', text: 'A message draft is open and your finger hovers over send.', urge: 'send before you can think', value: 'delay' },
    { id: 'family_trigger', text: 'Family conflict activates old pain quickly.', urge: 'fight for validation right now', value: 'survive first, process later' },
    { id: 'lonely_weekend', text: 'A lonely weekend feels endless.', urge: 'choose any intensity over emptiness', value: 'planned comfort' },
    { id: 'therapy_gap_distress', text: 'You have to wait days before therapy and feel overwhelmed.', urge: 'decide you cannot cope', value: 'interim skills' },
    { id: 'uncertain_outcome', text: 'You cannot know the outcome yet.', urge: 'force certainty from someone', value: 'uncertainty tolerance' },
    { id: 'emotional_pain', text: 'Emotional pain feels physically unbearable.', urge: 'escape through any fast relief', value: 'safe crisis coping' },
  ],
  mindfulness: [
    { id: 'thought_as_fact', text: 'The thought "they hate me" feels completely true.', urge: 'react as if it is proven', value: 'observing thoughts' },
    { id: 'body_scan', text: 'You notice tension but keep arguing in your head.', urge: 'stay in the mental fight', value: 'body awareness' },
    { id: 'scrolling_numb', text: 'You scroll for an hour to avoid feeling.', urge: 'keep numbing', value: 'present choice' },
    { id: 'future_story', text: 'Your mind writes a painful future after one small cue.', urge: 'live inside the prediction', value: 'coming back to now' },
    { id: 'judgment_loop', text: 'You keep judging your emotion as dramatic.', urge: 'fight the feeling', value: 'nonjudgmental stance' },
    { id: 'conversation_replay', text: 'You replay a conversation and add harsher meanings each time.', urge: 'believe every replay', value: 'observe and describe' },
    { id: 'urge_observation', text: 'An urge rises and feels like a command.', urge: 'obey it automatically', value: 'urge as sensation' },
    { id: 'mindful_texting', text: 'You are about to text while your heart is racing.', urge: 'type faster than you can notice', value: 'mindful action' },
    { id: 'emotion_cloud', text: 'A mood takes over the whole day.', urge: 'forget it is temporary', value: 'impermanence' },
    { id: 'eating_unaware', text: 'Stress makes you eat without noticing taste or fullness.', urge: 'disconnect from the moment', value: 'one-mindfulness' },
    { id: 'listening_conflict', text: 'During conflict, you plan your defense while they talk.', urge: 'stop listening', value: 'mindful listening' },
    { id: 'self_story', text: 'The story "I am too much" appears again.', urge: 'merge with it', value: 'thought labeling' },
    { id: 'sensory_anchor', text: 'You feel unreal and disconnected.', urge: 'panic about the feeling', value: 'five-senses grounding' },
    { id: 'automatic_yes', text: 'You say yes before noticing you mean no.', urge: 'avoid discomfort', value: 'pause and notice' },
    { id: 'comparison_mind', text: 'Comparison thoughts hook your attention.', urge: 'keep measuring your worth', value: 'returning attention' },
    { id: 'anger_story', text: 'Anger creates a story where the other person is all bad.', urge: 'treat the story as complete', value: 'wise observation' },
    { id: 'sad_song_loop', text: 'A song or memory pulls you deeper into sadness.', urge: 'sink into it without choice', value: 'mindful choice' },
    { id: 'notification_trigger', text: 'A notification sound makes your body jump.', urge: 'check immediately', value: 'intentional attention' },
    { id: 'quiet_discomfort', text: 'Quiet moments feel uncomfortable.', urge: 'fill them instantly', value: 'being with the moment' },
    { id: 'emotion_words', text: 'You can only say "bad" for what you feel.', urge: 'stay vague and overwhelmed', value: 'describe skill' },
  ],
  identity_self_image: [
    { id: 'dont_know_self', text: 'You suddenly feel like you do not know who you are.', urge: 'copy someone else to feel solid', value: 'values clarity' },
    { id: 'relationship_identity', text: 'Your sense of self changes depending on who you are with.', urge: 'become whatever keeps them close', value: 'authentic connection' },
    { id: 'appearance_shift', text: 'You want to change your entire look after feeling rejected.', urge: 'erase the current version of you', value: 'chosen expression' },
    { id: 'all_bad_self', text: 'After a mistake, your self-image flips to all bad.', urge: 'treat one moment as your identity', value: 'integrated self-view' },
    { id: 'new_group', text: 'Around a new group, you feel pressure to perform a personality.', urge: 'abandon your preferences', value: 'belonging as yourself' },
    { id: 'values_conflict', text: 'You agree to something that goes against your values.', urge: 'ignore the discomfort to be liked', value: 'self-respect' },
    { id: 'empty_future', text: 'Thinking about the future feels blank.', urge: 'decide nothing matters', value: 'small values step' },
    { id: 'label_self', text: 'You label yourself as broken after a hard day.', urge: 'make the label your whole identity', value: 'nonjudgmental identity' },
    { id: 'social_comparison', text: 'You compare your life to someone online and feel unreal.', urge: 'reinvent yourself immediately', value: 'grounded self-definition' },
    { id: 'people_pleasing', text: 'You notice you are people-pleasing before you know what you want.', urge: 'keep pleasing to avoid abandonment', value: 'honest preference' },
    { id: 'hobby_shift', text: 'You want to drop a hobby because you were not instantly good at it.', urge: 'quit before feeling inadequate', value: 'consistent growth' },
    { id: 'mood_identity', text: 'A mood shift makes yesterday’s goals feel fake.', urge: 'throw away the plan', value: 'values beyond mood' },
    { id: 'criticism_identity', text: 'Criticism makes you question your entire personality.', urge: 'become someone no one can criticize', value: 'stable self-worth' },
    { id: 'relationship_end_self', text: 'A relationship ending makes you feel like you no longer exist.', urge: 'find someone fast to feel real', value: 'self-continuity' },
    { id: 'favorite_person_focus', text: 'One person’s opinion starts defining your whole day.', urge: 'organize your identity around them', value: 'internal anchor' },
    { id: 'values_unclear', text: 'You cannot tell what you want versus what others expect.', urge: 'choose whatever avoids conflict', value: 'wise mind values' },
    { id: 'past_versions', text: 'You feel ashamed of past versions of yourself.', urge: 'reject your history completely', value: 'self-integration' },
    { id: 'success_feels_fake', text: 'Success feels fake or undeserved.', urge: 'minimize it before someone else does', value: 'receiving good' },
    { id: 'identity_after_conflict', text: 'After conflict, you feel like you are either victim or villain.', urge: 'pick one extreme story', value: 'both-and self-view' },
    { id: 'alone_self', text: 'When alone, you feel uncertain what you like or need.', urge: 'reach outward before checking inward', value: 'self-connection' },
  ],
};

function buildScenario(track: DBTAcademyTrack, situation: DBTAcademySituation, level: DBTAcademyLevel, index: number): DBTAcademyScenario {
  const levelConfig = LEVEL_SKILLS[level];
  const trackLabel = TRACK_LABELS[track].toLowerCase();
  const levelPrefix = level === 'beginner'
    ? 'First, '
    : level === 'intermediate'
      ? 'Slow down and '
      : 'Choose timing, then ';
  const correctText = `${levelPrefix}${levelConfig.correct}`;
  const commonTrap = level === 'advanced'
    ? `Use the intensity to force an immediate resolution so the ${trackLabel} feeling stops.`
    : `Follow the urge to ${situation.urge}.`;
  const avoidanceTrap = level === 'beginner'
    ? 'Shut down, avoid the situation, and hope the feeling passes on its own.'
    : 'Pretend the feeling is not there, then act from resentment later.';

  return {
    id: `${track}_${level}_${String(index + 1).padStart(2, '0')}_${situation.id}`,
    track,
    level,
    scenario: situation.text,
    question: levelConfig.question,
    choices: [
      { id: 'skillful', text: correctText },
      { id: 'urge', text: commonTrap },
      { id: 'avoid', text: avoidanceTrap },
    ],
    correctChoiceId: 'skillful',
    skill: levelConfig.skill,
    why: `${levelConfig.skill} works here because the immediate urge is to ${situation.urge}, but the deeper value is ${situation.value}. The skill creates space between the trigger and the action.`,
    whatUsuallyHappens: `With practice, the emotion can still be valid without running the whole moment. You are more likely to protect ${situation.value} and less likely to repair damage later.`,
  };
}

export const DBT_ACADEMY_SCENARIOS: DBTAcademyScenario[] = Object.entries(TRACK_SITUATIONS).flatMap(
  ([track, situations]) =>
    (['beginner', 'intermediate', 'advanced'] as DBTAcademyLevel[]).flatMap(level =>
      situations.map((situation, index) => buildScenario(track as DBTAcademyTrack, situation, level, index)),
    ),
);

function todayKey(now = Date.now()): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function yesterdayKey(now = Date.now()): string {
  return todayKey(now - 24 * 60 * 60 * 1000);
}

function normalizeProgress(value: Partial<DBTAcademyProgress> | null | undefined): DBTAcademyProgress {
  return {
    ...DEFAULT_DBT_ACADEMY_PROGRESS,
    ...(value ?? {}),
    trackCompletions: {
      ...DEFAULT_DBT_ACADEMY_PROGRESS.trackCompletions,
      ...(value?.trackCompletions ?? {}),
    },
    levelCompletions: {
      ...DEFAULT_DBT_ACADEMY_PROGRESS.levelCompletions,
      ...(value?.levelCompletions ?? {}),
    },
    completedScenarioIds: value?.completedScenarioIds ?? [],
    correctScenarioIds: value?.correctScenarioIds ?? [],
  };
}

export async function getDBTAcademyProgress(): Promise<DBTAcademyProgress> {
  const stored = await storageService.get<Partial<DBTAcademyProgress>>(STORAGE_KEY);
  return normalizeProgress(stored);
}

export async function saveDBTAcademyProgress(progress: DBTAcademyProgress): Promise<void> {
  await storageService.set(STORAGE_KEY, progress);
}

export async function answerDBTAcademyScenario(
  scenario: DBTAcademyScenario,
  choiceId: string,
  progress: DBTAcademyProgress,
): Promise<{ isCorrect: boolean; progress: DBTAcademyProgress }> {
  const isCorrect = choiceId === scenario.correctChoiceId;
  const alreadyCompleted = progress.completedScenarioIds.includes(scenario.id);
  const completedScenarioIds = alreadyCompleted
    ? progress.completedScenarioIds
    : [...progress.completedScenarioIds, scenario.id];
  const correctScenarioIds = isCorrect && !progress.correctScenarioIds.includes(scenario.id)
    ? [...progress.correctScenarioIds, scenario.id]
    : progress.correctScenarioIds;

  const today = todayKey();
  const yesterday = yesterdayKey();
  const shouldAdvanceStreak = !alreadyCompleted && progress.lastCompletedDate !== today;
  const currentStreak = shouldAdvanceStreak
    ? progress.lastCompletedDate === yesterday
      ? progress.currentStreak + 1
      : 1
    : progress.currentStreak;

  const updated: DBTAcademyProgress = {
    ...progress,
    completedScenarioIds,
    correctScenarioIds,
    trackCompletions: {
      ...progress.trackCompletions,
      [scenario.track]: progress.trackCompletions[scenario.track] + (alreadyCompleted ? 0 : 1),
    },
    levelCompletions: {
      ...progress.levelCompletions,
      [scenario.level]: progress.levelCompletions[scenario.level] + (alreadyCompleted ? 0 : 1),
    },
    totalAttempts: progress.totalAttempts + 1,
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastCompletedDate: shouldAdvanceStreak ? today : progress.lastCompletedDate,
  };

  await saveDBTAcademyProgress(updated);
  return { isCorrect, progress: updated };
}

export function getScenarioCountForTrack(track: DBTAcademyTrack): number {
  return DBT_ACADEMY_SCENARIOS.filter(scenario => scenario.track === track).length;
}
