export function setReferencePoints(coords: GpsCoord[], mapXY: Point[]) {
    gpsCoords = structuredClone(coords);
    bitmapPoints = structuredClone(mapXY);
    console.log('gpsCoords',gpsCoords);
    console.log('bitmapPoints',bitmapPoints);
}

export function gpsToMap(gps: GpsCoord): Point {
    const coefficients = solveForCoefficients(gpsCoords, bitmapPoints);    
    return transformGPStoBitmap(gps, coefficients);
}

export function mapToGps(point: Point): GpsCoord {
    let coefficients = solveForCoefficients(gpsCoords, bitmapPoints);
    return transformBitmapToGPS(point, coefficients);
}

// Sample data (not actually used)
let gpsCoords = [
    { lat: 40.7128, lng: -74.0060 },
    { lat: 34.0522, lng: -118.2437 },
    { lat: 51.5074, lng: -0.1278 }
];

// Sample data that matches gpsCoords (not actually used)
let bitmapPoints = [
    { x: 100, y: 50 },
    { x: 300, y: 150 },
    { x: 500, y: 250 }
];

function determinant3x3(matrix: any) {
    return matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1])
        - matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0])
        + matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);
}

function solveLinearSystem3x3(matrix: any, results: any) {
    let det = determinant3x3(matrix);

    let detX = determinant3x3([
        [results[0], matrix[0][1], matrix[0][2]],
        [results[1], matrix[1][1], matrix[1][2]],
        [results[2], matrix[2][1], matrix[2][2]]
    ]);

    let detY = determinant3x3([
        [matrix[0][0], results[0], matrix[0][2]],
        [matrix[1][0], results[1], matrix[1][2]],
        [matrix[2][0], results[2], matrix[2][2]]
    ]);

    let detZ = determinant3x3([
        [matrix[0][0], matrix[0][1], results[0]],
        [matrix[1][0], matrix[1][1], results[1]],
        [matrix[2][0], matrix[2][1], results[2]]
    ]);

    return {
        x: detX / det,
        y: detY / det,
        z: detZ / det
    };
}

export interface GpsCoord {
    lat: number,
    lng: number
}

export interface Point {
    x: number;
    y: number;
}

function solveForCoefficients(gpsCoords: GpsCoord[], bitmapPoints: Point[]) {
    // Solve for x coefficients
    let matrixX = [
        [gpsCoords[0].lat, gpsCoords[0].lng, 1],
        [gpsCoords[1].lat, gpsCoords[1].lng, 1],
        [gpsCoords[2].lat, gpsCoords[2].lng, 1]
    ];
    console.log('matrixX', matrixX);

    let resultsX = [bitmapPoints[0].x, bitmapPoints[1].x, bitmapPoints[2].x];
    console.log('resultsX', resultsX);

    let coefficientsX = solveLinearSystem3x3(matrixX, resultsX);
    console.log('coefficientsX', coefficientsX);

    // Solve for y coefficients
    let matrixY = matrixX;
    let resultsY = [bitmapPoints[0].y, bitmapPoints[1].y, bitmapPoints[2].y];

    let coefficientsY = solveLinearSystem3x3(matrixY, resultsY);

    return {
        a: coefficientsX.x,
        b: coefficientsX.y,
        c: coefficientsX.z,
        d: coefficientsY.x,
        e: coefficientsY.y,
        f: coefficientsY.z
    };
}

// Transform a GPS coordinate to a bitmap point
function transformGPStoBitmap(gpsCoord: GpsCoord, coefficients: any) {
    let x = coefficients.a * gpsCoord.lat + coefficients.b * gpsCoord.lng + coefficients.c;
    let y = coefficients.d * gpsCoord.lat + coefficients.e * gpsCoord.lng + coefficients.f;
    return { x: x, y: y };
}

function transformBitmapToGPS(bitmapCoord: Point, coefficients: any) {
    let denominator = coefficients.a * coefficients.e - coefficients.b * coefficients.d;

    if (denominator === 0) {
        throw new Error("Transformation is singular and cannot be inverted.");
    }

    let lat = (coefficients.e * bitmapCoord.x - coefficients.b * bitmapCoord.y
        + coefficients.b * coefficients.f - coefficients.c * coefficients.e) / denominator;
    let lng = (coefficients.d * bitmapCoord.x - coefficients.a * bitmapCoord.y
        + coefficients.c * coefficients.d - coefficients.a * coefficients.f) / denominator;

    return { lat: lat, lng: lng };
}


