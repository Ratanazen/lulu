# Behavior, Needs & Mood Engine

## 1. Decision Pipeline

Lulu's autonomous behavior follows a structured decision pipeline:
```
Observe State -> Update Needs Decay -> Evaluate Possible Actions -> Score Actions -> Apply Personality & Mode Modifiers -> Apply Cooldowns -> Select Best Action -> Execute -> Record Result
```

## 2. Needs Matrix

Lulu tracks 8 vital metrics (0–100):
- **Energy**: Consumed by movement and play; restored by sleep.
- **Happiness**: Overall emotional wellbeing influenced by positive care.
- **Fun**: Boosted by mini-games and playful interactions.
- **Hunger**: Satiated with starlight berries.
- **Cleanliness**: Maintained via grooming brushes.
- **Attention**: Nurtured by direct user clicks and dialogue.
- **Social**: Long-term companionship bond.
- **Health**: Sustained vitality as long as core needs stay above 25%.

Decay rates are intentionally designed to be gentle and non-intrusive (a few points per hour) to ensure Lulu remains a cheerful companion rather than an annoying chore.

## 3. Dynamic Mood Derivation

Mood is derived continuously based on needs, personality traits, and recent events:
- `sleepy`: Energy < 15.
- `tired`: Energy < 30.
- `worried`: Hunger < 20 or Cleanliness < 20.
- `sad`: Happiness < 25.
- `playful`: Fun > 70, Energy > 60, and high playfulness trait.
- `curious`: Energy > 50 and high curiosity trait.
- `loving`: High attention, social, and happiness.
- `excited`: Triggered by winning mini-games or unlocking achievements.
- `calm`: Default balanced state.

## 4. Behavior Modes

- `NORMAL`: Balanced wandering, idle observation, and occasional interactions.
- `PLAYFUL`: High frequency of wanderings and game invitations.
- `CALM`: Gentle, relaxed motions with low speed.
- `FOCUSED`: Sits quietly beside you as a study/work partner with minimal movement.
- `QUIET`: Mutes spontaneous speech bubbles and keeps animations subtle.
