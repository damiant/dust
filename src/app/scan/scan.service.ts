import { Injectable } from '@angular/core';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerOptions,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';

@Injectable({
  providedIn: 'root',
})
export class ScanService {
  public async prepare(): Promise<void> {}

  public async scan(): Promise<string | undefined> {
    try {
      this.hide();
      const options: CapacitorBarcodeScannerOptions = {
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      };
      const result = await CapacitorBarcodeScanner.scanBarcode(options);
      if (result.ScanResult) {
        this.show();
        return result.ScanResult;
      }
    } catch (error) {
      console.error(error);
    }
    this.show();
    return undefined;
  }

  private hide() {
    // The plugin handles the native scanner presentation.
  }

  private show() {
    // The plugin handles restoring the native scanner presentation.
  }
}
