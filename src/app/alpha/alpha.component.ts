import { BooleanInput, coerceBooleanProperty, coerceNumberProperty, NumberInput } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DoCheck,
  ElementRef,
  HostListener,
  input,
  OnDestroy,
  output,
  viewChild,
  inject,
  effect,
} from '@angular/core';
import { fromEvent, interval, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-alphabetical-scroll-bar',
  templateUrl: './alpha.component.html',
  styleUrls: ['./alpha.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AlphabeticalScrollBarComponent implements AfterViewInit, DoCheck, OnDestroy {
  private _cdr = inject(ChangeDetectorRef);
  alphabetContainer = viewChild.required<ElementRef>('alphabetContainer');
  hiddenLetterValue = 'zz';

  //A custom alphabet to be used instead of the default alphabet. Default is 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  alphabet = input<any>([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']);

  // Computed signal that normalizes alphabet to always be an array
  private alphabetArray = computed(() => {
    const value = this.alphabet();
    if (typeof value === 'string') return [...value];
    else if (Array.isArray(value) && value.every((it) => typeof it === 'string')) return value;
    else throw new Error('alphabet must be a string or an array of strings');
  });

  //A custom overflow divider. Can be undefined or null if you don't want to use one. Defaults to '·'
  overflowDivider = input<string | undefined | null>('·');

  //Valid letters that are available for the user to select. default is all letters
  validLetters = input<string[]>([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']);

  //Whether or invalid letters should be disabled (greyed out and do not magnify)
  disableInvalidLetters = input<BooleanInput>(false);

  //Whether or invalid letters should be disabled (greyed out and do not magnify)
  prioritizeHidingInvalidLetters = input<BooleanInput>(false);

  //Whether or not letters should be magnified
  letterMagnification = input<BooleanInput>(true);

  //Whether or not overflow diveders should be magnified
  magnifyDividers = input<BooleanInput>(false);

  //The maximum that the magnification multiplier can be. Default is 3
  magnificationMultiplier = input<number>(2);

  //Magnification curve accepts an array of numbers between 1 and 0 that represets the curve of magnification starting from magnificaiton multiplier to 1: defaults to [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]
  magnificationCurve = input<Array<number>>([1, 0.7, 0.5, 0.3, 0.1]);

  //If the scrolling for touch screens in the x direction should be lenient. Default is false
  exactX = input<BooleanInput>(false);

  //Whether or not letter change event is emitted on mouse hover. Default is false
  navigateOnHover = input<BooleanInput>(false);

  //Percentage or number in pixels of how far apart the letters are. Defaults to 1.75%
  letterSpacing = input<number | string | null>('1%');

  //Output event when a letter selected
  letterChange = output<string>();
  //Emitted when scrollbar is activated or deactivated
  isActive = output<boolean>();

  //This interval can be used for fast, regular size-checks
  //Useful, if e.g. a splitter-component resizes the scroll-bar but not the window itself. Set in ms and defaults to 0 (disabled)
  offsetSizeCheckInterval = input<NumberInput>(0);

  private _lastEmittedActive = false;
  private _isComponentActive = false;
  private _offsetSizeCheckIntervalSubscription!: Subscription;

  private readonly _cancellationToken$: Subject<void> = new Subject();

  constructor() {
    effect(() => {
      this._offsetSizeCheckIntervalSubscription?.unsubscribe();
      const intervalValue = coerceNumberProperty(this.offsetSizeCheckInterval());
      if (intervalValue) {
        this._offsetSizeCheckIntervalSubscription = interval(intervalValue)
          .pipe(takeUntil(this._cancellationToken$))
          .subscribe(() => this.checkVisibleLetters());
      }
    });

    effect(() => {
      this.alphabet();
      this.overflowDivider();
      this.validLetters();
      this.disableInvalidLetters();
      this.prioritizeHidingInvalidLetters();
      this.magnificationMultiplier();
      this.letterSpacing();
      this.checkVisibleLetters(true);
    });
  }

  ngAfterViewInit(): void {
    fromEvent(window, 'resize')
      .pipe(takeUntil(this._cancellationToken$))
      .subscribe(() => this.checkVisibleLetters());
  }
  ngDoCheck(): void {
    this.checkVisibleLetters();
  }
  ngOnDestroy() {
    this._cancellationToken$.next();
    this._cancellationToken$.complete();
  }

  checkVisibleLetters(force?: boolean): void {
    const height = this.alphabetContainer().nativeElement.clientHeight;
    if (!force && height === this._lastHeight) {
      return;
    }

    this._lastHeight = height;

    let newAlphabet = this.alphabetArray();
    let letterSpacing = 0;
    let letterSize = this.stringToNumber(
      getComputedStyle(this.alphabetContainer().nativeElement).getPropertyValue('font-size'),
    );

    if (coerceBooleanProperty(this.letterMagnification())) {
      letterSize = letterSize * this.magnificationMultiplier();
    }

    //Calculate actual letter spacing
    const spacing = this.letterSpacing();
    if (typeof spacing === 'number') {
      letterSpacing = spacing;
    } else if (typeof spacing === 'string') {
      letterSpacing = this.stringToNumber(spacing);
      if (spacing.endsWith('%')) {
        letterSpacing = height * (letterSpacing / 100);
      }
    }

    letterSize = letterSize + letterSpacing;

    //Remove invalid letters (if set and necessary)
    const validLetters = this.validLetters();
    if (coerceBooleanProperty(this.prioritizeHidingInvalidLetters()) && !!validLetters && height / letterSize < newAlphabet.length) {
      newAlphabet = validLetters;
    }

    //Check if there is enough free space for letters
    this._lettersShortened = height / letterSize < newAlphabet.length;
    if (this._lettersShortened) {
      const numHiddenLetters = newAlphabet.length - Math.floor(height / letterSize);
      if (numHiddenLetters === newAlphabet.length) newAlphabet = [];

      //determine how many letters to hide
      const hiddenHalves = this.getNumHiddenHalves(numHiddenLetters, newAlphabet.length) + 1;
      // (this.magnifyDividers || numHiddenLetters > newAlphabet.length - 2 ? 1 : 0);

      //split alphabet into two halves
      let alphabet1 = newAlphabet.slice(0, Math.ceil(newAlphabet.length / 2));
      let alphabet2 = newAlphabet.slice(Math.floor(newAlphabet.length / 2)).reverse();

      for (let i = 0; i < hiddenHalves; i++) {
        alphabet1 = alphabet1.filter((l: any, i: any) => i % 2 === 0);
        alphabet2 = alphabet2.filter((l: any, i: any) => i % 2 === 0);
      }

      //insert dots between letters
      alphabet1 = alphabet1.reduce((prev: any, curr: any, i: any) => {
        if (i > 0) {
          if (this.overflowDivider) prev.push(this.overflowDivider);
        }
        prev.push(curr);
        return prev;
      }, []);
      alphabet2 = alphabet2.reduce((prev: any, curr: any, i: any) => {
        if (i > 0) {
          if (this.overflowDivider) prev.push(this.overflowDivider);
        }
        prev.push(curr);
        return prev;
      }, []);

      const overflowDiv = this.overflowDivider();
      if (this.alphabetArray().length % 2 === 0 && overflowDiv) alphabet1.push(overflowDiv);
      newAlphabet = alphabet1.concat(alphabet2.reverse());
    }

    this._cdr.markForCheck();
    this.visibleLetters = newAlphabet;
  }
  private _lastHeight!: number;
  visibleLetters!: Array<string>;
  //Flag for determining letter under pointer
  private _lettersShortened = false;

  getNumHiddenHalves(numHiddenLetters: number, total: number): number {
    if (numHiddenLetters > total / 2) {
      return 1 + this.getNumHiddenHalves(numHiddenLetters % (total / 2), Math.ceil(total / 2));
    }
    return 0;
  }

  isValid(letter: string): boolean {
    const validLetters = this.validLetters();
    const overflowDiv = this.overflowDivider();
    return validLetters?.includes(letter) !== false || letter === overflowDiv;
  }

  getLetterStyle(index: number) {
    const magnifyDiv = coerceBooleanProperty(this.magnifyDividers());
    const disableInvalid = coerceBooleanProperty(this.disableInvalidLetters());
    const overflowDiv = this.overflowDivider();
    if (
      (this.magIndex === undefined && this.magIndex === null) ||
      (!magnifyDiv && this.visibleLetters[index] === overflowDiv) ||
      (disableInvalid && !this.isValid(this.visibleLetters[index]))
    )
      return {};
    const lettersOnly = this.visibleLetters.filter((l) => l !== overflowDiv);

    const mappedIndex = Math.round((index / this.visibleLetters.length) * lettersOnly.length);
    const mappedMagIndex = Math.round((this.magIndex / this.visibleLetters.length) * lettersOnly.length);

    const relativeIndex = magnifyDiv
      ? Math.abs(this.magIndex - index)
      : Math.abs(mappedMagIndex - mappedIndex);

    const magnificationCurve = this.magnificationCurve();
    const magnificationMult = this.magnificationMultiplier();
    const magnification =
      relativeIndex < magnificationCurve.length - 1
        ? magnificationCurve[relativeIndex] * (magnificationMult - 1) + 1
        : 1;
    const style: any = {
      transform: `scale(${magnification})`,
      zIndex: this.magIndex === index ? 1 : 0,
    };
    return this._isComponentActive && coerceBooleanProperty(this.letterMagnification()) ? style : {};
  }

  @HostListener('touchmove', ['$event', '$event.type'])
  @HostListener('touchstart', ['$event', '$event.type'])
  @HostListener('click', ['$event', '$event.type'])
  focusEvent(event: MouseEvent | TouchEvent, type?: string): void {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    if (type === 'click') {
      this._isComponentActive = true;
      this.isActive.emit((this._lastEmittedActive = true));
    }

    // Only update letter selection if component is active or this is a touch/click event
    if (this._isComponentActive || type?.includes('touch') || type === 'click') {
      this.setLetterFromCoordinates(clientX, clientY);

      if (this._lastEmittedLetter !== this.letterSelected && (coerceBooleanProperty(this.navigateOnHover()) || !type!.includes('mouse'))) {
        this.letterChange.emit((this._lastEmittedLetter = this.letterSelected));
        Haptics.impact({ style: ImpactStyle.Medium });
      }
    }
  }
  private _lastEmittedLetter!: string;

  @HostListener('mouseleave')
  @HostListener('touchend')
  focusEnd(): void {
    this.isActive.emit((this._isComponentActive = this._lastEmittedActive = false));
  }

  magIndex!: number;

  private setLetterFromCoordinates(x: number, y: number): void {
    if (coerceBooleanProperty(this.exactX())) {
      const rightX = this.alphabetContainer().nativeElement.getBoundingClientRect().right;
      const leftX = this.alphabetContainer().nativeElement.getBoundingClientRect().left;

      this._isComponentActive = x > leftX && x < rightX;
      if (!this._isComponentActive) {
        this.visualLetterIndex = this.visualLetterIndex = null;
        return;
      }
    }

    const height = this.alphabetContainer().nativeElement.clientHeight;
    //Letters drew outside the viewport or host padding may cause values outsize height boundries (Usage of min/max)
    const top = Math.min(Math.max(0, y - this.alphabetContainer().nativeElement.getBoundingClientRect().top), height);

    let topRelative = (top / height) * (this.visibleLetters.length - 1);
    const preferNext = Math.round(topRelative) < topRelative;
    topRelative = Math.round(topRelative);

    this.magIndex = topRelative;

    //Set visualLetterIndex to the closest valid letter
    this.visualLetterIndex = this.getClosestValidLetterIndex(this.visibleLetters, topRelative, preferNext);

    if (this._lettersShortened) {
      const validLetters = this.validLetters();
      if (validLetters) {
        this.letterSelected = validLetters[Math.round((top / height) * (validLetters.length - 1))];
      } else {
        const alphaArray = this.alphabetArray();
        this.letterSelected = alphaArray[this.getClosestValidLetterIndex(alphaArray, topRelative, preferNext)];
      }
    } else {
      this.letterSelected = this.visibleLetters[this.visualLetterIndex];
    }
  }
  visualLetterIndex: number | null | undefined = undefined;
  letterSelected!: string;

  private getClosestValidLetterIndex(alphabet: string[], visualLetterIndex: number, preferNext: boolean): number {
    const lowercaseAlphabet = alphabet.map((l) => l.toLowerCase());
    const validLetters = this.validLetters();
    const lowercaseValidLetters = validLetters.map((l: string) => l.toLowerCase());
    const validLettersAsNumbers = lowercaseValidLetters.map((l: string) => lowercaseAlphabet.indexOf(l));

    return validLettersAsNumbers.length > 0
      ? validLettersAsNumbers.reduce((prev: number, curr: number) =>
          preferNext
            ? Math.abs(curr - visualLetterIndex) > Math.abs(prev - visualLetterIndex)
              ? prev
              : curr
            : Math.abs(curr - visualLetterIndex) < Math.abs(prev - visualLetterIndex)
              ? curr
              : prev,
        )
      : 0;
  }

  private stringToNumber(value?: string): number {
    if (value == null) return 0;
    const v = value.match(/[.\d]+/);
    if (!v) return 0;
    return Number(v[0]);
  }
}
