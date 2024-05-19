# Neo Pong

A twist on the game of Pong where random buffs or nerfs are thrown
to one or both players at a regular intervals, creating a fast-pace
game which challenges players' skills to react and adapt quickly.

## Gameplay

### General
Player moves a paddle up or down with the keyboard and aims to bounce the ball off 
in the opponent's direction. A player wins if the ball reaches the opponent's end of
the wall. 

### Random Effects
At a set interval, a random effect will be choosen and be applied to either
one player or both players for that interval. The list of possible effects that are
available includes the following.

#### Buffs:
- Extended Paddle: increase the length of the paddle
- Dampening Field: decrease the ball's velocity when it is within a radius of the paddle
- Spin shots: causes the ball to travel in a curve when reflected

#### Nerfs:
- Shot in the dark: the player's halve will flicker periodically
- Shortened Paddle: decrease the length of the paddle
- Hallucination: the ball splits into multiple balls everytime the opponent's paddle hit the ball

#### Field:
- Reduced friction: Pressing on the keyboard keys will apply an acceleration to the player's paddle and releasing the key will apply a deceleration

