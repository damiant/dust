import { Environment } from "./environment.model";

export const environment: Environment = {
  production: false,
  simulatedTime: new Date('Sat June 22 2024 22:18:00 GMT-0700'),
  gps: { lng: -113.3722705, lat: 41.5800984 },
  latitudeOffset: undefined,
  longitudeOffset: undefined,
  overrideLocations: true
};
