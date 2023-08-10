export interface Event {
  camp: string; // Calculated
  timeString: string; // Calculated
  start: Date; // Calculated
  location: string; // Calculated
  longTimeString: string; // Calculated
  old: boolean; // Calculated (whether the event has already passed)
  happening: boolean; // Calculated (whether the event is happening now)
  group?: string; // Calculated (grouping for favorites)
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
  Unavailable = 'Location Available Soon'
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

export interface Camp {
  contact_email?: string
  description?: string
  hometown?: string
  location: Location
  location_string?: string
  name: string
  uid: string
  url?: string
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
  events: string[];
  camps: string[];
  art: string[];
  friends: Friend[];
}

export interface Settings {
  dataset: string;
  eventTitle: string;
  lastDownload: string;
  locationEnabled: boolean;
}

export interface Dataset {
  name: string;
  title: string;
  year: string;
  start: string;
}

export interface TimeString {
  short: string;
  long: string;
}

export interface Pin {
  x: number;
  y: number;
}

export interface Friend {
  name: string;
  address: string;
  notes: string;
}

export interface MapPoint {
  street: string,
  clock: string,
  feet?: number,
  streetOffset?: string,
  clockOffset?: string,
  x?: number,
  y?: number,
  info?: MapInfo
}

export interface MapInfo {
  title: string;
  location: string;
  subtitle: string;
  imageUrl?: string;
}

export interface MapSet {
  title: string;
  description: string;
  points: MapPoint[];
}

export enum DataMethods {
  Populate = 'populate',
  GetDays = 'getDays',
  GetPotties = 'getPotties',
  GetMapPoints = 'getMapPoints',
  GetCategories = 'getCategories',
  SetDataset = 'setDataset',
  GetEvents = 'getEvents',
  GetEventList = 'getEventList',
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
  GetCamps = 'getCamps'
}