import { animate, AnimationTriggerMetadata, state, style, transition, trigger } from "@angular/animations";
import { scale } from "ionicons/icons";

export function FadeOut(timingIn: number): AnimationTriggerMetadata  {
    return trigger('fadeOut', [
        state('false', style({ opacity: 1, scale: 1.0, height: '*' })),
        state('true', style({ opacity: 0, scale: 0, height: 0 })),
        transition('false => true', animate(`${timingIn}ms`))
      ]);
  }