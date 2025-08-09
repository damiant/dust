export interface Environment {
    production: boolean;
    simulatedTime: Date | undefined;
    gps?: { lng: number; lat: number };
    latitudeOffset?: number;
    longitudeOffset?: number;
    overrideLocations?: boolean;
    offline?: boolean; // Whether the output of the app is all static assets
}