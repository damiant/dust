
export interface CompassHeading {
    magneticHeading: number, 
    trueHeading: number, 
    headingAccuracy: number, 
    timestamp: number
}

export interface CompassError {
    code: any
}