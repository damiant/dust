/**
 * Ionic/Angular 21 compatibility fix
 * Resolves: TS2320: Interface 'HTMLIonInputElement' cannot simultaneously extend types 'IonInput' and 'HTMLStencilElement'
 * This is a known issue with Ionic Core types and Angular 21
 */

declare module '@ionic/core/dist/types/components' {
  interface IonInput {
    autocorrect?: string | undefined;
  }
}
