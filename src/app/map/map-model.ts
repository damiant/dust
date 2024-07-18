export interface MapModel {
    image: string;
    width: number;
    height: number;
    defaultPinSize: number;
    pins: MapPin[];
    compass: MapPin | undefined;

    // When a user clicks a pin this signal emits the uuid
    pinClicked: (pinUUID: string) => void;
}

export interface MapResult {
    rotateCompass: (rotation: number) => void;
    setNearest: (nearest: string) => void;
}

export type PinColor = 'primary' | 'secondary' | 'tertiary' | 'compass';
export interface MapPin {
    uuid: string;
    x: number;
    z: number;
    color: PinColor;
    size: number;
    label: string;
    animated?: boolean;
}