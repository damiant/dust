/**
 * Deliberately free of framework and Capacitor dependencies: this runs before
 * Angular bootstraps and must render on WebView versions too old to run the
 * app, so it is plain DOM only.
 */

/**
 * Angular's runtime calls `Object.hasOwn` (ES2022), which does not exist in
 * Android System WebView builds older than Chrome 93. On those devices the
 * app crashes during the first change detection pass of the intro page and
 * appears frozen.
 */
export function webViewTooOld(): boolean {
  if (!/Android/.test(navigator.userAgent)) {
    return false;
  }
  return typeof Object.hasOwn !== 'function';
}

/**
 * Renders a blocking, plain-DOM message telling the user to update Android
 * System WebView (the WebView provider on Android 10+) or Chrome (the
 * provider on Android 7-9) from the Play Store.
 */
export function showWebViewUpdateScreen(): void {
  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'alertdialog');
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:99999',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'padding:32px 24px',
    'box-sizing:border-box',
    'background:#1a1b1e',
    'color:#ffffff',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  ].join(';');

  const heading = document.createElement('h1');
  heading.textContent = 'Update required';
  heading.style.cssText = 'margin:0 0 16px;font-size:24px;text-align:center';

  const message = document.createElement('p');
  message.textContent = 'dust cannot run on this device because its Android System WebView is out of date.';
  message.style.cssText = 'margin:0 0 16px;max-width:420px;line-height:1.5;font-size:16px;text-align:center';

  const steps = document.createElement('ol');
  steps.style.cssText = 'margin:0;max-width:420px;line-height:2;font-size:16px;padding-left:24px';
  for (const step of [
    'Open the Play Store app.',
    'Search for "Android System WebView" (published by Google LLC).',
    'Tap Update. If no update is offered, update the Chrome app the same way.',
    'Reopen dust.',
  ]) {
    const item = document.createElement('li');
    item.textContent = step;
    steps.appendChild(item);
  }

  overlay.append(heading, message, steps);
  document.body.appendChild(overlay);
}
