import { BooleanInput, coerceBooleanProperty, coerceNumberProperty, NumberInput } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
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
  standalone: true,
})
export class AlphabeticalScrollBarComponent implements AfterViewInit, DoCheck, OnDestroy {
  constructor(private _cdr: ChangeDetectorRef) {}

  @ViewChild('alphabetContainer', { static: true })
  alphabetContainer!: ElementRef;
  hiddenLetterValue = 'zz';

  get alphabet(): any {
    return this._alphabet;
  }
  //A custom alphabet to be used instead of the default alphabet. Default is 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  @Input() set alphabet(value: any) {
    if (typeof value === 'string') this._alphabet = [...value];
    else if (Array.isArray(value) && value.every((it) => typeof it === 'string')) this._alphabet = value;
    else throw new Error('alphabet must be a string or an array of strings');
    this.checkVisibleLetters(true);
    this.validLetters = this._alphabet;
  }
  private _alphabet: Array<string> = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

  get overflowDivider(): string | undefined | null {
    return this._overflowDivider;
  }
  //A custom overflow divider. Can be undefined or null if you don't want to use one. Defaults to '·'
  @Input() set overflowDivider(value: string | undefined | null) {
    if (typeof value === 'string' || value === undefined || value === null) this._overflowDivider = value!;
    else throw new Error('overflowDivider must be a string');
    this.checkVisibleLetters(true);
  }
  private _overflowDivider: string = '·';

  get validLetters(): string[] {
    return this._validLetters;
  }
  //Valid letters that are available for the user to select. default is all letters
  @Input() set validLetters(value: string[]) {
    this._validLetters = value;
    this.checkVisibleLetters(true);
  }
  private _validLetters: Array<string> = this._alphabet;

  get disableInvalidLetters(): BooleanInput {
    return this._disableInvalidLetters;
  }
  //Whether or invalid letters should be disabled (greyed out and do not magnify)
  @Input() set disableInvalidLetters(value: BooleanInput) {
    this._disableInvalidLetters = coerceBooleanProperty(value);
    this.checkVisibleLetters(true);
  }
  private _disableInvalidLetters = false;

  get prioritizeHidingInvalidLetters(): BooleanInput {
    return this._prioritizeHidingInvalidLetters;
  }
  //Whether or invalid letters should be disabled (greyed out and do not magnify)
  @Input() set prioritizeHidingInvalidLetters(value: BooleanInput) {
    this._prioritizeHidingInvalidLetters = coerceBooleanProperty(value);
    this.checkVisibleLetters(true);
  }
  private _prioritizeHidingInvalidLetters = false;

  get letterMagnification(): BooleanInput {
    return this._letterMagnification;
  }
  //Whether or not letters should be magnified
  @Input() set letterMagnification(value: BooleanInput) {
    this._letterMagnification = coerceBooleanProperty(value);
  }
  private _letterMagnification = true;

  get magnifyDividers(): BooleanInput {
    return this._magnifyDividers;
  }
  //Whether or not overflow diveders should be magnified
  @Input() set magnifyDividers(value: BooleanInput) {
    this._magnifyDividers = coerceBooleanProperty(value);
  }
  private _magnifyDividers = false;

  get magnificationMultiplier(): number {
    return this._magnificationMultiplier;
  }
  //The maximum that the magnification multiplier can be. Default is 3
  @Input() set magnificationMultiplier(value: number) {
    this._magnificationMultiplier = value;
    this.checkVisibleLetters(true);
  }
  private _magnificationMultiplier = 2;

  get magnificationCurve(): Array<number> {
    return this._magnificationCurve;
  }
  //Magnification curve accepts an array of numbers between 1 and 0 that represets the curve of magnification starting from magnificaiton multiplier to 1: defaults to [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]
  @Input() set magnificationCurve(value: Array<number>) {
    if (Array.isArray(value) && value.every((it) => typeof it === 'number' && it >= 0 && it <= 1))
      this._magnificationCurve = value;
    else throw new Error('magnificationCurve must be an array of numbers between 0 and 1');
  }

  private _magnificationCurve = [1, 0.7, 0.5, 0.3, 0.1];

  get exactX(): BooleanInput {
    return this._exactX;
  }
  //If the scrolling for touch screens in the x direction should be lenient. Default is false
  @Input() set exactX(value: BooleanInput) {
    this._exactX = coerceBooleanProperty(value);
  }
  private _exactX = false;

  get navigateOnHover(): BooleanInput {
    return this._navigateOnHover;
  }
  //Whether or not letter change event is emitted on mouse hover. Default is false
  @Input() set navigateOnHover(value: BooleanInput) {
    this._navigateOnHover = coerceBooleanProperty(value);
  }
  private _navigateOnHover = false;

  get letterSpacing(): number | string | null {
    return this._letterSpacing;
  }
  //Percentage or number in pixels of how far apart the letters are. Defaults to 1.75%
  @Input() set letterSpacing(value: number | string | null) {
    if (typeof value === 'string') {
      this._letterSpacing = this.stringToNumber(value);
      if (value.includes('%')) {
        this._letterSpacing = this._letterSpacing.toString() + '%';
      }
    } else {
      this._letterSpacing = coerceNumberProperty(value);
    }

    this.checkVisibleLetters(true);
  }
  private _letterSpacing: number | string | null = '1%';

  //Output event when a letter selected
  @Output() letterChange = new EventEmitter<string>();
  //Emitted when scrollbar is activated or deactivated
  @Output() isActive = new EventEmitter<boolean>();

  private _lastEmittedActive = false;
  private _isComponentActive = false;

  private readonly _cancellationToken$: Subject<void> = new Subject();

  get offsetSizeCheckInterval(): NumberInput {
    return this._offsetSizeCheckInterval;
  }
  //This interval can be used for fast, regular size-checks
  //Useful, if e.g. a splitter-component resizes the scroll-bar but not the window itself. Set in ms and defaults to 0 (disabled)
  @Input() set offsetSizeCheckInterval(value: NumberInput) {
    this._offsetSizeCheckIntervalSubscription?.unsubscribe();
    this._offsetSizeCheckInterval = coerceNumberProperty(value);
    this._offsetSizeCheckInterval &&
      (this._offsetSizeCheckIntervalSubscription = interval(this._offsetSizeCheckInterval)
        .pipe(takeUntil(this._cancellationToken$))
        .subscribe(() => this.checkVisibleLetters()));
  }
  private _offsetSizeCheckInterval = 0;
  private _offsetSizeCheckIntervalSubscription!: Subscription;

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
    let height = this.alphabetContainer.nativeElement.clientHeight;
    if (!force && height === this._lastHeight) {
      return;
    }

    this._lastHeight = height;

    let newAlphabet = this.alphabet;
    let letterSpacing = 0;
    let letterSize = this.stringToNumber(
      getComputedStyle(this.alphabetContainer.nativeElement).getPropertyValue('font-size'),
    );

    if (this.letterMagnification) {
      letterSize = letterSize * this.magnificationMultiplier;
    }

    //Calculate actual letter spacing
    if (typeof this.letterSpacing === 'number') {
      letterSpacing = this.letterSpacing;
    } else if (typeof this.letterSpacing === 'string') {
      letterSpacing = this.stringToNumber(this.letterSpacing);
      if (this.letterSpacing.endsWith('%')) {
        letterSpacing = height * (letterSpacing / 100);
      }
    }

    letterSize = letterSize + letterSpacing;

    //Remove invalid letters (if set and necessary)
    if (this.prioritizeHidingInvalidLetters && !!this.validLetters && height / letterSize < newAlphabet.length) {
      newAlphabet = this.validLetters;
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

      if (this.alphabet.length % 2 === 0 && this.overflowDivider) alphabet1.push(this.overflowDivider);
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
    return this.validLetters?.includes(letter) !== false || letter === this.overflowDivider;
  }

  getLetterStyle(index: number) {
    if (
      (this.magIndex === undefined && this.magIndex === null) ||
      (!this.magnifyDividers && this.visibleLetters[index] === this.overflowDivider) ||
      (this.disableInvalidLetters && !this.isValid(this.visibleLetters[index]))
    )
      return {};
    const lettersOnly = this.visibleLetters.filter((l) => l !== this.overflowDivider);

    const mappedIndex = Math.round((index / this.visibleLetters.length) * lettersOnly.length);
    const mappedMagIndex = Math.round((this.magIndex / this.visibleLetters.length) * lettersOnly.length);

    let relativeIndex = this.magnifyDividers ? Math.abs(this.magIndex - index) : Math.abs(mappedMagIndex - mappedIndex);

    const magnification =
      relativeIndex < this.magnificationCurve.length - 1
        ? this.magnificationCurve[relativeIndex] * (this.magnificationMultiplier - 1) + 1
        : 1;
    const style: any = {
      transform: `scale(${magnification})`,
      zIndex: this.magIndex === index ? 1 : 0,
    };
    return this._isComponentActive && this.letterMagnification ? style : {};
  }

  @HostListener('mousemove', ['$event', '$event.type'])
  @HostListener('mouseenter', ['$event', '$event.type'])
  @HostListener('touchmove', ['$event', '$event.type'])
  @HostListener('touchstart', ['$event', '$event.type'])
  @HostListener('click', ['$event', '$event.type'])
  focusEvent(event: MouseEvent & TouchEvent, type?: string): void {
    if (!this._lastEmittedActive) {
      this.isActive.emit((this._lastEmittedActive = true));
    }

    if (type == 'click') this._isComponentActive = false;
    else this._isComponentActive = true;

    this.setLetterFromCoordinates(
      event.touches?.[0].clientX ?? event.clientX,
      event.touches?.[0].clientY ?? event.clientY,
    );

    if (this._lastEmittedLetter !== this.letterSelected && (this.navigateOnHover || !type!.includes('mouse'))) {
      this.letterChange.emit((this._lastEmittedLetter = this.letterSelected));
      Haptics.impact({ style: ImpactStyle.Medium });
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
    if (this.exactX) {
      const rightX = this.alphabetContainer.nativeElement.getBoundingClientRect().right;
      const leftX = this.alphabetContainer.nativeElement.getBoundingClientRect().left;

      this._isComponentActive = x > leftX && x < rightX;
      if (!this._isComponentActive) {
        this.visualLetterIndex = this.visualLetterIndex = null;
        return;
      }
    }

    const height = this.alphabetContainer.nativeElement.clientHeight;
    //Letters drew outside the viewport or host padding may cause values outsize height boundries (Usage of min/max)
    const top = Math.min(Math.max(0, y - this.alphabetContainer.nativeElement.getBoundingClientRect().top), height);

    let topRelative = (top / height) * (this.visibleLetters.length - 1);
    const preferNext = Math.round(topRelative) < topRelative;
    topRelative = Math.round(topRelative);

    this.magIndex = topRelative;

    //Set visualLetterIndex to the closest valid letter
    this.visualLetterIndex = this.getClosestValidLetterIndex(this.visibleLetters, topRelative, preferNext);

    if (this._lettersShortened) {
      if (this.validLetters) {
        this.letterSelected = this.validLetters[Math.round((top / height) * (this.validLetters.length - 1))];
      } else {
        this.letterSelected = this.alphabet[this.getClosestValidLetterIndex(this.alphabet, topRelative, preferNext)];
      }
    } else {
      this.letterSelected = this.visibleLetters[this.visualLetterIndex];
    }
  }
  visualLetterIndex: number | null | undefined = undefined;
  letterSelected!: string;

  private getClosestValidLetterIndex(alphabet: string[], visualLetterIndex: number, preferNext: boolean): number {
    const lowercaseAlphabet = alphabet.map((l) => l.toLowerCase());
    const lowercaseValidLetters = this.validLetters.map((l) => l.toLowerCase());
    const validLettersAsNumbers = lowercaseValidLetters.map((l) => lowercaseAlphabet.indexOf(l));

    return validLettersAsNumbers.length > 0
      ? validLettersAsNumbers.reduce((prev, curr) =>
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
    const v = value.match(/[\.\d]+/);
    if (!v) return 0;
    return Number(v[0]);
  }
}
