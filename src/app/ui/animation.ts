import { animate, AnimationTriggerMetadata, state, style, transition, trigger } from '@angular/animations';

export function FadeOut(timingIn: number): AnimationTriggerMetadata {
  return trigger('fadeOut', [
    state('false', style({ opacity: 1, scale: 1.0, height: '*' })),
    state('true', style({ opacity: 0, scale: 0, height: 0 })),
    transition('false => true', animate(`${timingIn}ms`)),
  ]);
}

export function FadeIn(timingIn: number): AnimationTriggerMetadata {
  return trigger('fadeIn', [
    state('false', style({ opacity: 0 })),
    state('true', style({ opacity: 1 })),
    transition('false => true', animate(`${timingIn}ms`)),
  ]);
}
