# Dust

An offline guide for the events, theme camps & art of Burning Man.

## Contributing

Install and run for the web with the following:
- `npm install`
- `npx ionic serve`

Dust uses [Capacitor](https://capacitorjs.com) for iOS and Android.

You can build and run for iOS with:
- `npx ionic build`
- `npx cap copy ios`
- `npx cap run ios`

## Geo Referencing
In `assets/ttitd-2023/geo.json` is 3 data points like below:
```json
    {
        "title": "9 & G Plaza from https://bm-innovate.s3.amazonaws.com/2023/GIS/CPNs.json",
        "clock": "9:00",
        "street": "G",
        "coordinates": [
            -119.21598911904059,
            40.795840024963383
        ]
    }
```

These are taken from [Burning Man datasets](https://innovate.burningman.org/datasets-page/) and are real locations in Burning Man with lat and long for `coordinates`.

The `clock` and `street` are for the clock dial and streets (A-K, Esplanade).

The algorithm uses 3 GPS points and 3 X,Y coordinates on the SVG map (the app can take the center point, street, and clock and calculate X,Y).

Using the 3 GPS points and their known X,Y coordinates it can:
- Triangulate the X,Y point for any GPS (`mapToGps` in `map.utils.ts`)
- Triangulate the GPS to any X,Y (`gpsToMap` in `map.utils.ts`)
