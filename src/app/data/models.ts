import { GpsCoord } from "../map/geo.utils";

export interface Event {
  camp: string; // Calculated
  timeString: string; // Calculated
  start: Date; // Calculated
  location: string; // Calculated
  longTimeString: string; // Calculated
  old: boolean; // Calculated (whether the event has already passed)
  happening: boolean; // Calculated (whether the event is happening now)
  group?: string; // Calculated (grouping for favorites)
  distance: number; // Calculated
  distanceInfo: string; // Calculated
  gpsCoords: GpsCoord; // Calculated
  pin?: Pin; // Calculated if no gps
  all_day: any
  check_location?: number
  description: string
  event_id: number
  event_type: EventType
  hosted_by_camp?: string
  located_at_art?: string
  occurrence_set: OccurrenceSet[]
  other_location?: string
  print_description: string
  slug: string
  title: string
  uid: string
  url: any
  year: number
  contact?: string
}

export enum LocationName {
  Unavailable = 'Location Available Soon',
  Undefined = '',
  Unplaced = 'Unplaced'
}

export interface Revision {
  revision: number;
}

export interface EventType {
  abbr: string
  id: number
  label: string
}

export interface OccurrenceSet {
  end_time: string
  start_time: string
  old: boolean // Calculated
  happening: boolean; // Calculated (whether the event is happening now)
  longTimeString: string // Calculated
  star?: boolean;
}

export interface TimeRange {
  start: Date
  end: Date  
}

export interface Camp {
  contact_email?: string
  description?: string
  hometown?: string
  location: Location
  location_string?: string
  name: string
  uid: string
  url?: string
  gpsCoord: GpsCoord
  pin: Pin
  distance: number
  distanceInfo: string
  year: number
}

export interface Location {
  dimensions: any
  frontage?: string
  intersection?: string
  intersection_type?: string
  string?: string
}

export interface Day {
  name: string;
  date: Date;
  dayName: string;
  today?: boolean;
}

export interface Art {
  artist?: string
  category?: string
  contact_email?: string
  description: string
  distance: number; // Calculated
  distanceInfo: string; // Calculated
  gpsCoords: GpsCoord; // Calculated
  donation_link?: string
  guided_tours: number
  hometown: string
  images: Image[]
  location: ArtLocation
  location_string?: string
  name: string
  program: string
  self_guided_tour_map: number
  uid: string
  url?: string
  year: number
}

export interface Image {
  gallery_ref: any
  ready: boolean
  thumbnail_url?: string
}

export interface ArtLocation {
  category?: string
  distance?: number
  gps_latitude?: number
  gps_longitude?: number
  hour?: number
  minute?: number
  string?: string
}

export interface Favorites {
  events: string[]
  camps: string[]
  art: string[]
  friends: Friend[]
  rslEvents: string[]
  privateEvents: PrivateEvent[]
}

export enum LocationEnabledStatus {
  Unknown = 0,
  Enabled = 1,
  Disabled = 2
}

export interface Settings {
  datasetId: string;
  dataset: Dataset | undefined;
  eventTitle: string;
  lastDownload: string;
  mapUri: string;
  locationEnabled: LocationEnabledStatus;
  longEvents: boolean;
}

export interface Dataset {
  name: string; // Name
  title: string; // Title
  year: string; // Year name
  id: string; // Identifier for the remote dataset at data.dust.events
  start: string; // When it starts
  end: string; // When it ends
  lat: number; // Latitude (for directions)
  long: number; // Longitude (for directions)
}

export interface TimeString {
  short: string;
  long: string;
}

export interface Pin {
  x: number;
  y: number;
}

export interface PlacedPin {
  x: number;
  y: number;
  gps?: GpsCoord;
  label: string;
}

export interface Friend {
  name: string;
  address: string;
  notes: string;
}

export interface Link {
  uid: string;
  title: string;
  url: string;
}

export interface MapPoint {
  street: string,
  clock: string,
  feet?: number,
  streetOffset?: string,
  clockOffset?: string,
  x?: number,
  y?: number,
  gps?: GpsCoord, // Used as additional info when displaying the map
  info?: MapInfo
}

export interface MapInfo {
  title: string;
  location: string;
  subtitle: string;
  imageUrl?: string;
  href?: string;
}

export interface PrivateEvent {
  id: string;
  title: string;
  start: string;
  startDay?: string;
  startTime?: string;
  address: string;
  notes: string;
}

export interface MapSet {
  title: string;
  description: string;
  points: MapPoint[];
}

export interface GPSSet {
  title: string;
  description: string;
  points: GpsCoord[];
}

export interface RSLEvent {
  id: string;
  camp: string;
  title?: string;
  location: string;
  campUID?: string;
  day: string; // Format yyyy-mm-dd
  gpsCoords?: GpsCoord,
  wa: boolean; // Wheelchair accessible
  waNotes: string;
  distance: number,
  distanceInfo: string,
  artCar?: string;
  imageUrl?: string;
  occurrences: RSLOccurrence[];
}

export interface FullDataset {
  dataset: string;
  events: string;
  camps: string;
  art: string;
  pins: string;
  links: string;
  rsl: string;
  hideLocations: boolean
}

export interface RSLOccurrence {
  id: string;
  time: string; // Display format
  end?: string; // Display format for end time (if it exists)
  timeRange: string; // Calculated
  startTime: string; // Local format Date
  endTime: string; // Local format Date
  old?: boolean; // Calculated: has the event passed
  star?: boolean; // Calculated
  who: string;
}

export interface GeoRef {
  title: string;
  street: string;
  clock: string;
  coordinates: number[];
}

export enum DataMethods {
  Populate = 'populate',
  GetDays = 'getDays',
  GetPotties = 'getPotties',
  GetMapPoints = 'getMapPoints',
  GetGPSPoints = 'getGPSPoints',
  GetPins = 'getPins',
  GetCategories = 'getCategories',
  SetDataset = 'setDataset',
  GetEvents = 'getEvents',
  GetLinks = 'getLinks',
  GetEventList = 'getEventList',
  GetRSLEventList = 'getRSLEventList',
  GetCampList = 'getCampList',
  GetArtList = 'getArtList',
  FindArts = 'findArts',
  FindArt = 'findArt',
  CheckEvents = 'checkEvents',
  FindEvents = 'findEvents',
  FindCamps = 'findCamps',
  FindEvent = 'findEvent',
  FindCamp = 'findCamp',
  GetCampEvents = 'getCampEvents',
  GetCampRSLEvents = 'getCampRSLEvents',
  GetCamps = 'getCamps',
  GetGeoReferences = 'getGeoReferences',
  GpsToPoint = 'gpsToPoint',
  GetRSLEvents = 'getRSLEvents',
  SearchRSLEvents = 'searchRSLEvents',
  GetMapPointGPS = 'getMapPointGPS',
  SetMapPointsGPS = 'setMapPointsGPS'
}