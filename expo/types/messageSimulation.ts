export type ResponsePath =
  | 'urgent'
  | 'avoidant'
  | 'soft'
  | 'boundary'
  | 'secure';

export interface ResponsePathSimulation {
  path: ResponsePath;
  label: string;
  emoji: string;
  color: string;
  exampleMessage: string;
  shortTermEffect: string;
  relationshipEffect: string;
  regretRisk: 'low' | 'moderate' | 'high';
  dignityProtection: 'low' | 'moderate' | 'high';
  clarityLevel: 'low' | 'moderate' | 'high';
  isRecommended: boolean;
}

export const RESPONSE_PATH_META: Record<ResponsePath, { label: string; emoji: string; color: string }> = {
  urgent: { label: 'Urgent', emoji: '⚡', color: '#E17055' },
  avoidant: { label: 'Avoidant', emoji: '🧊', color: '#7FB3D3' },
  soft: { label: 'Soft', emoji: '🪶', color: '#E8A87C' },
  boundary: { label: 'Boundary', emoji: '🛡️', color: '#5B8FB9' },
  secure: { label: 'Secure', emoji: '🌿', color: '#6B9080' },
};
