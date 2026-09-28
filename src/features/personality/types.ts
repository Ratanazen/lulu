// Personality Subsystem Types

export type PersonalityArchetype =
  | 'friendly'
  | 'calm'
  | 'playful'
  | 'focused'
  | 'cute'
  | 'professional'
  | 'funny'
  | 'energetic'
  | 'study_buddy'
  | 'coding_buddy'
  | 'minimal'
  | 'custom';

export interface PersonalityProfile {
  id: PersonalityArchetype;
  name: string;
  description: string;
  systemPrompt: string;
  traits: string[];
  responseStyle: string;
  icon: string;
}
