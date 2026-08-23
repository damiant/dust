import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockCapacitor, mockPlugin } = vi.hoisted(() => ({
  mockCapacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
  mockPlugin: {
    isWatchAppInstalled: vi.fn(),
    sendCamp: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: mockCapacitor,
  registerPlugin: () => mockPlugin,
}));

import { WatchService } from './watch.service';

describe('WatchService', () => {
  let service: WatchService;

  beforeEach(() => {
    service = new WatchService();
    vi.clearAllMocks();
  });

  describe('isWatchAvailable', () => {
    it('returns false on non-native platforms', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false);
      expect(await service.isWatchAvailable()).toBe(false);
      expect(mockPlugin.isWatchAppInstalled).not.toHaveBeenCalled();
    });

    it('returns false on non-iOS native platforms (Android)', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true);
      mockCapacitor.getPlatform.mockReturnValue('android');
      expect(await service.isWatchAvailable()).toBe(false);
    });

    it('returns true on iOS when the watch app is installed', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true);
      mockCapacitor.getPlatform.mockReturnValue('ios');
      mockPlugin.isWatchAppInstalled.mockResolvedValue({ installed: true });
      expect(await service.isWatchAvailable()).toBe(true);
    });

    it('returns false on iOS when the watch app is not installed', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true);
      mockCapacitor.getPlatform.mockReturnValue('ios');
      mockPlugin.isWatchAppInstalled.mockResolvedValue({ installed: false });
      expect(await service.isWatchAvailable()).toBe(false);
    });

    it('returns false when the native call throws', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true);
      mockCapacitor.getPlatform.mockReturnValue('ios');
      mockPlugin.isWatchAppInstalled.mockRejectedValue(new Error('nope'));
      expect(await service.isWatchAvailable()).toBe(false);
    });
  });

  describe('sendCamp', () => {
    it('returns a structured error on non-iOS platforms', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(false);
      const result = await service.sendCamp({ name: 'Camp', lat: 1, lng: 2 });
      expect(result.ok).toBe(false);
      expect(result.reachable).toBe(false);
      expect(result.error).toBeTruthy();
      expect(mockPlugin.sendCamp).not.toHaveBeenCalled();
    });

    it('returns ok on iOS when the native send succeeds', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true);
      mockCapacitor.getPlatform.mockReturnValue('ios');
      mockPlugin.sendCamp.mockResolvedValue({ success: true });
      const result = await service.sendCamp({ name: 'Camp', lat: 40.78, lng: -119.21 });
      expect(result.ok).toBe(true);
      expect(result.reachable).toBe(true);
      expect(mockPlugin.sendCamp).toHaveBeenCalledWith({ name: 'Camp', lat: 40.78, lng: -119.21 });
    });

    it('maps native errors into the result', async () => {
      mockCapacitor.isNativePlatform.mockReturnValue(true);
      mockCapacitor.getPlatform.mockReturnValue('ios');
      mockPlugin.sendCamp.mockResolvedValue({ success: false, error: 'Watch not installed' });
      const result = await service.sendCamp({ name: 'Camp', lat: 1, lng: 2 });
      expect(result.ok).toBe(false);
      expect(result.reachable).toBe(true);
      expect(result.error).toBe('Watch not installed');
    });
  });
});
