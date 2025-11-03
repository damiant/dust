import { GpsCoord } from '../map/geo.utils';
import { PinColor } from '../map/map-model';

export interface ItemList {
  events: Event[];
  camps: Camp[];
  art: Art[];
  restrooms: MapSet;
  medical: MapSet;
  ice: MapSet;
}

export interface Event {
  camp: string; // Calculated
  timeString: string; // Calculated
  start: Date; // Calculated
  end: Date; // Calculated
  location: string; // Calculated
  facing?: string; // Calculated
  longTimeString: string; // Calculated
  old: boolean; // Calculated (whether the event has already passed)
  happening: boolean; // Calculated (whether the event is happening now)
  group?: string; // Calculated (grouping for favorites)
  distance: number; // Calculated
  distanceInfo: string; // Calculated
  gpsCoords: GpsCoord; // Calculated
  star?: boolean; // Calculated (whether the event is starred)
  showStar?: boolean; // Calculated (whether to show star icon on event list)
  showRecurring?: boolean; // Calculated (whether to show recurring icon on event list)
  pin?: Pin; // Calculated if no gps
  highlighted?: boolean; // Calculated (whether the event is highlighted)
  all_day: any;
  check_location?: number;
  description: string;
  event_id: number;
  event_type: EventType;
  hosted_by_camp?: string;
  located_at_art?: string;
  occurrence_set: OccurrenceSet[];
  other_location?: string;
  imageUrl?: string; // Added by dust
  slug: string;
  title: string;
  uid: string;
  url: any;
  year: number;
  contact?: string;
}

export enum LocationName {
  Unavailable = 'Location Available Soon',
  Undefined = '',
  Unplaced = 'Unplaced',
  Mobile = 'Out on the Playa'
}

export interface Revision {
  revision: number;
}

export interface MapData {
  filename: string;
  uri: string; // Generated based on when it is saved by dust
}

export interface EventType {
  abbr: string;
  id: number;
  label: string;
}

export interface OccurrenceSet {
  end_time: string;
  start_time: string;
  old: boolean; // Calculated
  happening: boolean; // Calculated (whether the event is happening now)
  longTimeString: string; // Calculated
  star?: boolean;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface Group {
  id: number;
  links: Link[];
}

export interface Thing {
  name: string;
  notes: string;
  gps?: GpsCoord;
  lastChanged?: number;
}

export interface Camp {
  contact_email?: string;
  description?: string;
  hometown?: string;
  location: Location;
  location_string?: string;
  name: string;
  uid: string;
  url?: string;
  imageUrl?: string; // Added by dust
  label?: string; // Added by dust
  gpsCoord: GpsCoord;
  landmark: string;
  facing: string;
  pin: Pin;
  camp_type?: string,
  distance: number;
  distanceInfo: string;
  year: number;
}

export interface Location {
  dimensions: any;
  frontage?: string;
  intersection?: string;
  intersection_type?: string;
  string?: string;
}

export interface Day {
  name: string;
  date: Date;
  dayName: string;
  today?: boolean;
}

export interface Art {
  artist?: string;
  audio?: string;
  category?: string;
  contact_email?: string;
  description: string;
  distance: number; // Calculated
  distanceInfo: string; // Calculated
  gpsCoords: GpsCoord; // Calculated
  donation_link?: string;
  guided_tours: number;
  hometown: string;
  images: Image[];
  location: ArtLocation;
  location_string?: string;
  pin?: Pin; // Calculated if no gps
  name: string;
  program: string;
  self_guided_tour_map: number;
  label?: string; // Added by dust
  uid: string;
  art_type?: string,
  url?: string;
  year: number;
}

export interface Image {
  gallery_ref: any;
  ready: boolean;
  thumbnail_url?: string;
}

export interface ArtLocation {
  category?: string;
  distance?: number;
  gps_latitude?: number;
  gps_longitude?: number;
  hour?: number;
  minute?: number;
  string?: string;
}

export interface Favorites {
  events: string[];
  camps: string[];
  art: string[];
  friends: Friend[];
  rslEvents: string[];
  privateEvents: Reminder[];
}

export enum LocationEnabledStatus {
  Unknown = 0,
  Enabled = 1,
  Disabled = 2,
}

export interface Settings {
  datasetId: string;
  dataset: Dataset | undefined;
  eventTitle: string;
  mapRotation: number;
  scrollLeft: number;
  locationEnabled: LocationEnabledStatus;
  datasetFilter: DatasetFilter;
  longEvents: boolean;
  preventAutoStart: boolean;
  offlineEvents: string[]; // List of all offline event ids
  lastGeoAlert: number | undefined; // Last geolocation permission request alert
  lastAboutAlert: number | undefined; // Last time the user got a message about the selected event
  lastLongEvents: number | undefined; // Last time the user got a message about long events
  list: boolean; // Display cards as a list
  lastDatasetId: string; // Remember the last dataset
}


/**
 * Way to filter datasets
 *
 * @export
 * @typedef {DatasetFilter}
 */
export type DatasetFilter = 'all' | 'regional' | 'bm' | 'past';

export interface Dataset {
  name: string; // Name
  title: string; // Title
  region: string; // City / State/Country
  website: string; // Website
  unknownDates: boolean; // Whether the dates are unknown
  year: string; // Year name
  id: string; // Identifier for the remote dataset at data.dust.events
  uid: number; // Unique numerical identifier
  start: string; // When it starts
  end: string; // When it ends
  lat: number; // Latitude (for directions)
  long: number; // Longitude (for directions)
  imageUrl: string; // Image
  timeZone: string; // Timezone
  dist?: number; // Estimated calculated distance to event
  mapDirection: number; // Compass rotation for North
  mastodonHandle: string; // Mastodon handle
  inboxEmail: string; // Has inbox email Y/N
  rssFeed: string; // RSS Feed
  directions: string | undefined; // Directions text
  pin: string;
  class?: string; // Animation
  active: boolean; // Displayed publicly
  volunteeripateSubdomain: string; // Volunteeripate Subdomain
  volunteeripateIdentifier: string; // Volunteeripate Identifier
  camp_registration: boolean;
  event_registration: boolean;
  pin_size_multiplier: number;
  subTitle: string; // Calculated
  theme: Theme | undefined;
}

export interface Theme {
  primaryColor: string;
}

export interface TimeString {
  start: Date;
  end: Date;
  short: string;
  long: string;
}

export interface LocationHidden {
  camps: boolean;
  art: boolean;
  campMessage: string;
  artMessage: string;
}

// Location object returned from the API
export interface WebLocation {
  city: string;
  latitude: string;
  longitude: string;
  postalcode: string;
  region: string;
  timezone: string;
}

export enum Names {
  festivals = 'festivals', // Get from the root path at https://data.dust.events/  
  datasets = 'datasets',
  events = 'events',
  art = 'art',
  camps = 'camps',
  rsl = 'rsl',
  revision = 'revision',
  messages = 'messages',
  emails = 'emails',
  version = 'version',
  pins = 'pins',
  links = 'links',
  map = 'map',
  location = 'location',
  live = 'locations', // Live locations
  geo = 'geo', // Burning Man only
  ice = 'ice', // Burning Man only
  medical = 'medical', // Burning Man only
  restrooms = 'restrooms', // Burning Man only
  summary = 'summary', // Event summary (DatasetResult)
  other = 'other' // Other pin types (Shuttle Stop etc)
}

export enum MapType {
  Restrooms = 'restrooms',
  Ice = 'ice',
  Now = 'now',
  Art = 'art',
  Medical = 'medical',
  Other = 'other',
  Things = 'things',
  Friends = 'friends',
  All = 'all'
}

export interface Pin {
  x: number;
  y: number;
}

export interface PlacedPin {
  x: number;
  y: number;
  gpsLat?: number;
  gpsLng?: number;
  label: string;
}

export interface Friend {
  name: string;
  address: string;
  camp?: string;
  notes: string;
}

export interface Link {
  uid: string;
  title: string;
  url: string;
}

export interface MapPoint {
  street: string;
  clock: string;
  feet?: number;
  streetShift?: number;
  clockShift?: number;
  streetOffset?: string;
  clockOffset?: string;
  x?: number;
  y?: number;
  gps?: GpsCoord; // Used as additional info when displaying the map
  info?: MapInfo;
  animated?: boolean;
}

export interface MapInfo {
  title: string;
  location: string;
  subtitle: string;
  imageUrl?: string;
  href?: string;
  bgColor?: PinColor;
  label?: string;
  id?: string; // Unique identifier for art/camp etc
}

export interface Reminder {
  id: string;
  title: string;
  start: string;
  startDay?: string;
  startTime?: string;
  address: string | undefined;
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
  uid: string;
  camp: string;
  title?: string;
  location: string;
  campId?: string;
  day: string; // Format yyyy-mm-dd
  gpsCoords?: GpsCoord;
  pin?: Pin; // Added by dust
  wa: boolean; // Wheelchair accessible
  lm?: boolean; // Live music
  rr?: boolean; // Rock Star Librarian Recommended
  waNotes: string;
  distance: number;
  distanceInfo: string;
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
  map: string;
  locationAvailable: LocationHidden;
  timezone: string;
}

export interface DatasetResult {
  events: number;
  camps: number;
  art: number;
  pins: number;
  links: number;
  rsl: number;
  revision: number;
  pinTypes: Record<string, number>;
}

export interface LiveLocation {
  festivalId: number;
  id: number;
  lng: number;
  lat: number;
  timestamp: string;
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
  GetMapPoints = 'getMapPoints',
  GetGPSPoints = 'getGPSPoints',
  GetPins = 'getPins',
  GetCategories = 'getCategories',
  GetCampTypes = 'getCampTypes',
  GetArtTypes = 'getArtTypes',
  SetDataset = 'setDataset',
  GetEvents = 'getEvents',
  GetLinks = 'getLinks',
  GetEventList = 'getEventList',
  FindEventByCamp = 'findEventByCamp',
  GetRSLEventList = 'getRSLEventList',
  GetCampList = 'getCampList',
  GetArtList = 'getArtList',
  FindArts = 'findArts',
  FindArt = 'findArt',
  CheckEvents = 'checkEvents',
  FindEvents = 'findEvents',
  FindCamps = 'findCamps',
  FindAll = 'findAll',
  FindEvent = 'findEvent',
  FindCamp = 'findCamp',
  GetCampEvents = 'getCampEvents',
  GetArtEvents = 'getArtEvents',
  GetCampRSLEvents = 'getCampRSLEvents',
  GetCamps = 'getCamps',
  GetGeoReferences = 'getGeoReferences',
  GpsToPoint = 'gpsToPoint',
  GetRSLEvents = 'getRSLEvents',
  SearchRSLEvents = 'searchRSLEvents',
  GetMapPointGPS = 'getMapPointGPS',
  SetMapPointsGPS = 'setMapPointsGPS',
  HasGeoPoints = 'hasGeoPoints',
  ConsoleLog = 'consoleLog',
  SetVersion = 'setVersion',
  Write = 'write',
  Fetch = 'fetch',
  ReadData = 'readData',
  WriteData = 'writeData',
  Clear = 'clear'
}
