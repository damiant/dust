import { AddPinResult } from "./map";

export interface MapModel {
    image: string;
    width: number;
    height: number;
    defaultPinSize: number;
    pins: MapPin[];
    pinSizeMultiplier: number;
    backgroundColor: number;
    compass: MapPin | undefined;

    // When a user clicks a pin this signal emits the uuid
    pinClicked: (indexes: number[], event: PointerEvent) => void;
}

export interface LivePoint {
    idx: number;
    x: number;
    y: number;
}

export interface ScrollResult {
    deltaX: number;
    deltaY: number;
}

export interface MapResult {
    rotateCompass: (rotation: number) => void;
    myPosition: (x: number, y: number) => void;
    setNearest: (nearest: string) => void;
    capture: () => Promise<string | undefined>;

    scrolled: (result: ScrollResult) => void;
    // When a user searches for a pin and one is found
    pinSelected: (pinUUID: string) => void;
    pinUnselected: () => void;
    liveUpdated: (locations: LivePoint[]) => void;
    pinData: { [key: string]: AddPinResult; },
    dispose: () => void;
    currentHex?: any;
    currentObject?: any;
}

export type PinColor = 'primary' | 'secondary' | 'tertiary' | 'compass' | 'medical' | 'warning' | 'accent' | 'live';

export interface MapPin {
    uuid: string;
    x: number;
    z: number;
    color: PinColor;
    size: number;
    label: string;
    animated?: boolean;
}