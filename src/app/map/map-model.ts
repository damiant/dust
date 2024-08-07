export interface MapModel {
    image: string;
    width: number;
    height: number;
    defaultPinSize: number;
    pins: MapPin[];
    compass: MapPin | undefined;

    // When a user clicks a pin this signal emits the uuid
    pinClicked: (pinUUID: string, event: PointerEvent) => void;
}

export interface ScrollResult {
    deltaX: number;
    deltaY: number;
}

export interface MapResult {
    rotateCompass: (rotation: number) => void;
    myPosition: (x: number, y: number) => void;
    setNearest: (nearest: string) => void;
    scrolled: (result: ScrollResult) => void;
    dispose: () => void;
    currentHex?: any;
    currentObject?: any;
}

export type PinColor = 'primary' | 'secondary' | 'tertiary' | 'compass' | 'warning';

export interface MapPin {
    uuid: string;
    x: number;
    z: number;
    color: PinColor;
    size: number;
    label: string;
    animated?: boolean;
}