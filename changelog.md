## Changes

## 2.35
- Fix for private event adding on Android
- Add landmarks for Burning Man camps
- Use Km or metres when phone is set to non-US

## 2.34
- Fix when visiting events on the now map

## 2.33

- Allow scroll up on event and camp page with the map
- Improve centering on map
- Add option to drop pin
- Map shows location down to feet and whether it is left, right, ahead or behind you

## 2.32

- Handle memory leak

## 2.31

- New Map!
- Remember filter for events

## 2.30

- Fix GPS for map

## 2.29

- Move Map URI from localStorage to IndexedDB to get around 5mb limit
- Fix issue with name of day when used in a different timezone
- Fix issue with favorite star showing on music on the camp page
- Search for art now works via description or location

## 2.28

- Fix for burns with a PIN to download data before the PIN entry

## 2.27

- Fix for events ending at midnight for Burning Man
- Fix for labelling of all day events
- FIx for showing all day events on the now page

## 2.26

- Fix sorting for all day events
- Favorite events from the events page

## 2.25

- Show events that are at art
- Map for 2024 for Burning Man
- Icon for events in open camping is no longer clickable
- Handling of all day events
- Handle bad network on startup
- Easier to click on map when clicking a music item
- Extra space for time ranges on Music tab
- Extra space for more menu
- Fix for hiding the compass when geolocation is disabled
- Fix to show soft geolocation request on first use
- Fix to prevent geolocation on maps with no GPS points

## 2.24

- Support for text based directions

## 2.23

- Fix for the map showing events happening now
- Support PIN locked events
- Enable swipe back on most routes (unless the map is shown)
- Fix gray border under art images
- Fix for calendar sync on Android permission error on first try
- Fix Intro page loading container
- Fix dust font on main page
- Fix to show geolocation dialog before native geolocation dialog
- Fix for when you have never opened an event but it has started and you are on cellular
- Fix for startup when the network is giving 100% errors
- Fix for sorting events to show Burning Man first
- Fix when no network connection on first startup

## 2.22

- Fix to event page to show favorite button
- Fix day counter until event

## 2.21

- Option to download update added to the more menu
- Fix missing add to favorites for art
- Show Burning Man first in the list if it starts earlier than the closest regional burn
- Geolocation check improvements for skipping location and enabling location

## 2.20

- Prevent downloading updates when the event has started and cell network is used

## 2.19

- Fix for order of items on the home page
- Fix for displaying events at art on the now page
- Fix events ending at midnight to prevent wrong day
- Feature to show past events
- Move more button to swipe

## 2.18

- Show times in the events timezone
- Fix to prevent repeated messaging about geolocation when user denies access
- Put time into the event title rather than after the description

## 2.17

- Lock orientation to portrait
- Handle multiple event types

## 2.16

- Zoom level for map fixed

## 2.15

- Print option for favorites
- Fix for error when trying to download maps that are > 5mb
- Move event images to bottom of popover so you can access information
- Fix for private event editing which was previously blank
- Fix for music times overlapping text
- Labels fo the map
- Search for the map

## 2.14

- Fix performance of first opening of the map (dont wait on GPS)
- Fix overflowing text on events page
- Show drop down for sorting by distance rather than compass icon

## 2.13

- Map icon to show all camps, art and points on the map
- Hide artist line if blank
- Hide unnecessary background color on camp image
- Art and camps can be clicked on the map

## 2.12

- Show past events
- Show number of days until the event

## 2.11

- Update to test privacy manifest requirements

## 2.09

- Fix for favorites art map not launching
- Fix for art images shown or hidden
- Larger pins for art

## 2.07

- Filter for regionals or burn
- Show closest event first
- Fix the feedback link

## 2.06

- Fix for previews

## 2.05

- For now events on map show correct time range
- Fix for resuming when memory is wiped

## 2.04

- Fix camp click from the music page
- Favorites page was not always updating
- Fix historical view for music

## 2.03

- Fix to slow networks when opening the app
- Fix on startup if state is bad causing app to not start
- Fix iPad size layouts
- Check version numbers and suggest updates

## 2.02

- Fix for favorited events

## 2.01

- Fix for timezones (use timezone of event)

## 2.0

- Use new datasets

## 1.41

- Update dependencies
- Fix click of year on events page to go home
- Offline fixes

## 1.40

- Check for Play Integrity

## 1.39

- Category selection does not update
- Add logging for the worker thread
- Add spinner for map when waiting on GPS
- fixes for offline startup
- fix for Adding private events fails with specify name
- Fix for music showing all "concluded"
- Fix for incorrect time used for "now"
- More changed to Home
- Fix listing historical events in favorites and music
- Fix height on favorite items
- Fix clicking a location also drills down

## 1.38

- Change to use standalone components

## 1.37

- Support for music

## 1.36

- Fix to set status bar color when appearance changed in background
- Improve speed when downloading dataset files for event
- Fix descriptions now render carriage returns

### 1.35

- Images for camps and events

### 1.34

- Cache bust so that updates go out quicker
- Fix tel and mailto links

### 1.33

- Added links to profile
- Better error handling

### 1.30

- Support for regional events
- Fix for when locations are hidden or unplaced
- Show placed camps (with or without GPS)

### 1.23

- Fixed issue with art button
- Fixed timeout with slow networks

### 1.22

- Unplaced theme camps have been removed

### 1.21

- Fix for android push notification sound

### 1.20

- Update for data

### 1.19

- Private events added

### 1.18

- Search for RSL events will find matching events on other days
- Art map shown when locations revealed
- Events happening now map
- Deduplicate events
- Live load datasets

### 1.17

- Fix imported Rock Star Librarian events - shift by 2 hours
- Fix issue when pausing the app while the keyboard is showing which causes the tab bar to appear when resumed

### 1.16

- Fix for art search

### 1.15

- Performance improvements on art and RSL lists

### 1.14

- RockStar Librarian events added
- Editting a friend was not showing the right address
- Feature to Rate app
- Added about page
- Reminders are now 15 minutes before event
- Filter added for long events

### 1.13

- Images are now offline and optimized in webp format
- Fixes for missing data for previous years
- Optimization of data format
- Links for art added
- Links open in browser
- Show if outside of BRC

### 1.12

- Added "now" to events to show events starting in the next hour (or running for up to 20 mins)
- Use GPS coords for restrooms
- Use GPS coordinates for Art rather than radial location

### 1.11

- Show compass direction on map
- Fix for searching when capitals or whitespace are in search terms
- Haptics when favoriting

### 1.10

- Alphabetic Camp selection
- Fix for locations of Medical

### 1.9

- Fix search for camp names in events
- Fix search for locations in events
- Fix search in description for camps
- Descriptions of art, events, and camps are now copyable

### 1.8

- Camps near me added
- Events near me added
- Art near me added
- Fix timezone used when device timezone is not event timezone
- Fix map for Ice and Medical

### 1.7

- Show your current location on the map
- Fix background on the more page for dark mode
- Fix description on map in dark mode
- Fix for calculation of event start date
- Fix for selected day
- Fix for timezones other than PST

### 1.6

- Share Art
- Share Event
- Share Theme Camp
- Friends feature
- Map for Medical
- Map for Ice
- Fix padding near year label
- Fix navigation bar being hidden on Android 12
- Fix page title animation

### 1.5

- Fix for region with non-US date formats
- Fix for scrolling on Events and Camps page
- Fix for Android navigation bar

### 1.3

- Map of Restrooms added
- fix for status bar color on ios in darkmode
- Art images are loaded if on wifi
- Map points show location information and are clickable

### 1.2

- Favorite filter added for events, art, camps, all
- Add elipsis to event time listing to prevent overflow of text
- Favorites are now grouped by the day they happen and are split based on occurrence
- Fix for event showing the first occurrence not the favorited one
- Display badge for "now" when an event is happening now
- Favorite events that have passed do not show in the list
- Fix to correctly choose todays day if its available in events
- Search now has a "go" button
- Map of Favorite Art, Events and Camps
- Show events that are happening now
- Better message when no events match
- Favorites can be searched
- Events that happened will disappear
- Share app feature added

### 1.1 - August 2, 2023

- Submitted to the App Store
