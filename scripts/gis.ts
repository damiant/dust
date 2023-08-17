export interface GISSet {
    type: string
    features: Feature[]
  }
  
  export interface Feature {
    type: string
    id: number
    geometry: Geometry
    properties: Properties
  }
  
  export interface Geometry {
    type: string
    coordinates: number[][][]
  }
  
  export interface Properties {
    FID: number
    Id: number
  }