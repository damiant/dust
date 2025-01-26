# Roadmap

- 🔥 Manage my burn needs to be reworked to use local token and local admin instance

💚 Quick Win
🩷 High Impact
🔥 Important
- 🔥 Events in search should be filtered to upcoming/soon
- 🔥 Show top 10 closest things including restrooms on search default page
- 🔥 Allow event to be added outside of event range for ticket sales (if admin) with auto-notification
 - 🟠🩷 Whiteout mode - button for whiteout - show huge compass with direction to camp / center camp / temple / 3 or 9

- 🔴 Dark mode keyboard for Android
- 🔴 Important: Clean up favorites as we may archive a particular year
- 🔴 Schedule send messages (eg for tickets available)

## Volunteeripate
- 🔴 Connect to get Tickets and Volunteer shifts
- 🔴 Sync with Volunteeripate to update UI (shift become reminders, ticket is QR Code)
- 🔴 POST api with API_KEY to send message for lost child alert

## Notifications
- 🔴 Background check messages on open (if after 1 hour). If new messages show badge
- 🔴 Clear message badge on opening messages page

## Accessibility / Navigation
- 🔴🩷 Dust Daka - Siri for "where am I": 8:30 and F. Maybe screen reader or voice control button.
- 🔴🩷 Siri - What is the closest camp, restroom, ice, medical etc?
- 🔴🩷 Simple - "Find X camp" > show your location and target only with distance and direction

- 🔴 If search is restrooms then auto go to restroom map
- 🔴 Show friends, private events, bike, other locations in search all
- 🔴 Show history of previously viewed items in the search all area
- 🟠 Say "Check In" which will store the event or camp in history

## Calendar Fixes
- 🔴 Possibly duplicating calendar entries on Android
- 🔴 Switch to using the Capacitor plugin  https://ebarooni.github.io/capacitor-calendar/
- 🔴 Sync calendar does not delete events you have removed from favorites

## Bugs
- 🔴💚 Search - if exact the show match - if fuzzy then do not show
- 🔴 If you closed app on events and were scrolled to a point then see if you can scroll back there
- 🔴 Verify filtered events dont save the filtered version
- 🔴 Verify if there are no events that it doesnt try to download them
- 🔴💚 If powered then give better GPS accuracy and update the map with centering
- 🔥 Test when firefox is the default browser on Android
- 🔥 If offline and unable to download an event then show message 'Unable to download data for [event]'
- 🔥 Unresponsive after a certain amount of use???
- 🔥 Nearby apparently did not work for some - even when location enabled
- 🔵 Add changelog to whatchanged text
- 🔴 Dark side of the mug has a 27 hour event
- 🟠 All day events for Burning Man are entered as 2 x12 hour. Need to clean these up
- 🔵 If you favorite an event and return to the event list it is not starred (maybe for recurring)
- 🔴💚 Add a timeout for the "getting location". Set to 10 seconds
- 🔵 iOS: The filter on the home page for "regionals" etc cannot be dismissed by clicking elsewhere (works on Android)
- 🔵 Images are in `webp` but you when you use the share plugin these image types dont appear (at least on iOS). Maybe convert to png?
- 🔵 Dark mode tooltips on the map need a visible border
- 🔵 Search keyboard hint should be "search" instead of "go"

## Map
- 🔥🩷💚 Bigger icon for your current location
- 🔴 Map should have toggles for art, restrooms, camps, infrastructure
- 🔴 Share a location via AirDrop
- 🟠 Show full camp names as you zoom into the map
- 🔵 Show a message when map is shown for the first time "Use 2 fingers or double tap to zoom into the map"
- 🟠 Now map needs music
- 🔵 Route planner: show from 1...x with lines between on map

## Intro
- 🔴🩷 Home page - if not all then show brief tooltip "Showing only past events"
- 🔵 Filter for burns by country

## Home
- 🟠🩷 Whats near me for favorites (near me on fav page)

## Friends
- 🔴 Add friend by camp name
- 🔴 Sort friends by location (maybe distance)
- 🔴 Add friends should be faster - camp name requested
- 🟠 Share events others are interested in (airdrop maybe)
- 🟠 Share/Collaborate with friends on your favorites list
- 🔵 Show QR Code for profile
- 🔵 Share profile

## Music
- 🔴 Music should have an "all" option.
- 🔴 Music search should work on all days
- 🔴 Sunrise/sunset label on music sets
- 🔴 line crossing over midnight.
- 🔴 Music by start time (column for location)
- 🔴 Music - events going over midnight appear on the next day. Need a way to make it better
- 🔵 Group multiple parties on music into the one card

## Events
- 🔴🩷 Ending soon tag on events with < 25% time left
- 🟠 Need to know if an event repeats (ie not as important)
- 🟠 Option to confirm/deny an event for those with connectivity
- 🟠 Ability to search for events between 2 times (eg 2 to 4pm)
- 🟠 Option to "Suggest a change" to an event - allows temporary change that can be approved by camp lead
- 🔴 Option to show reminder or not on events (some events are important and some are not)
- 🟠 Find similar events option
- 🔵 Timetable view (something like Google Calendar)
- 🔵 If an event has a long durations (>3hrs) then let user choose notification hour
- 🔵 "Not Interested" button for Events
- 🔵 Overlapping events are hard to see - Maybe some indicator of this
- 🔵 Reminder times configurable (Google App Reviewer)

## Camps
- 🔴 Art / Camps have visited tag
- 🔵 Email (contact camp)
- 🔵 Check In Button - For events, add to check in history on the more tab

## Burning Man Specific
- 🔴 Zendo, Ranger outposts
- 🟠 Shuttle stops, airport, burner express depot
- 🔴🩷 Center Camp is not listed as a camp (backend change)
- 🔴🩷 Temple is not listed as art (backend change)
- 🟠 When sharing camp information for Burning Man the static dataset does not include times (locations either but thats ok)
- 🔵 If day is burn night show animation of burn
- 🔵 Notification for gates open
- 🔵 Notification for week before (daily) ^these give chance to download data

## Favorites
- 🟠🩷 Some kind of priority on favorites (eg color, maybe long press?)
- 🟠 Print favorites only prints one page (Borderland feedback)
- 🟠 Print to pdf for favorited events
- 🔵 Show/collapse fav group

## Editing
- 🟠 Allow camp leads to interact with dust / event editing etc

## Art
- 🔵 Art tour audio
- 🔵 Next / Previous buttons for art like events

## Miscellaneous
- 🔵 Feature to highlight downloading an update in the week before the event if it was updated more than a week ago
- 🟠 Option to pre-download all content (images etc)
- 🔴 Like button instead of favorites?
- 🟠 Document what camp leads can do to add other camp leads and document the process
- 🟠 Document ways to disconnect and not use your phone

## First Run Offline
- 🩷 Copy current dataset into the app and load from it if unable to update

## Friends / Drop a Pin
- 🟠 Tracking friends
- 🔴 Use Capacitor share for image snap
- 🔴🩷 Save my camp location should ask for camp if not at event
- 🔴 Share map should include dust and title overlaid on the map
- 🔴 Share map should include link that opens dust to add friend
- 🟠 If pin is dropped and location is not on the map then give message
- 🟠 If pin dropped and location not on map then ask for street location and use that to guess
- 🟠 Share my location - have URL which includes location and camp name and person name. Use for facebook / media

## Notes
- 🔴 Ability to write notes for things
- 🔴 Multiple notes - eg packing list, friends, visited camps
- 🔴 Camps / Art / Events - mark as visited, thumbs up, thumbs down
- 🔵 Notes page with items as checkboxes (ie check list)
- 🔵 Add notes to an event (eg invite)

## Burner Map
- 🟠 Burner Map - Store your camp location and work out how to share
- In Camps use "I'm in this camp" which puts a home pin on the map
- Give option to share on social media with a link to add friend into dust

## RSS Feed
- 🔵 RSS Feed > App
- 🔵 Push Notifications backend to handle sending them out

## Lock Screen Image
- 🟠 Wallpaper background generator
- 🔵 Create lock screen image: use name, location, email, camp, emergency name, emergency phone. Save to photos

## Info
- Audio Guide https://soundcloud.com/burningman/sets/2023-art-audio-guide
- PWA to Microsoft store: https://www.pwabuilder.com/
