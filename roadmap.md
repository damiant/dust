# Roadmap
- 🔴 Sync calendar does not delete events you have removed from favorites
- 🔴 Map button with just camps on it
- 🔴 Use Capacitor share for image snap
- 🔴 Save my camp location should ask for camp if not at event
- 🔴 Share map should include dust and title overlaid on the map
- 🔴 Share map should include link that opens dust to add friend
- 🔴 Dark side of the mug has a 27 hour event
- 🔴 All day events for Burning Man are entered as 2 x12 hour. Need to clean these up
- 🔴 Center Camp isnt listed as a camp (backend change)
- 🔴 Temple isnt listed as art (backend change)
- 🔴 Click camp name to switch to camps view and select camp
- 🔴 Like button instead of favorites?

- 🔴 Show friends, private events, bike, other locations in search all
- 🔴 Show history of previously viewed items in the search all area
- 🔴 If search is restrooms then auto go to restroom map
- 🔴 Music - events going over midnight appear on the next day. Need a way to make it better
- 🟠 Types for camps: sound camps, chill, other types
- 🟠 Option to "Suggest a change" to an event - allows temporary change that can be approved by camp lead
- 🔴 Option to show reminder or not on events (some events are important and some are not)
- 🟠 Allow camp leads to interact with dust / event editing etc
- 🟠 Show full camp names as you zoom into the map
- 🟠 Find similar events option
- 🟠 Print favorites only prints one page (Borderland feedback)
- 🟠 When sharing camp information for Burning Man the static dataset does not include times (locations either but thats ok)

- 🟠 Document what camp leads can do to add other camp leads and document the process
- 🟠 Document ways to disconnect and not use your phone

- 🟠 Now map needs music
- 🟠 Error: white screened the events page after a day had passed
- 🔵 If you favorite an event and return to the event list it is not starred

## Feedback: Requested Features

- 🔵 Feature to highlight downloading an update in the week before the event if it was updated more than a week ago
- 🔵 Timetable view (something like Google Calendar)
- 🟠 Share/Collaborate with friends on your favorites list
- 🟠 Notes - ability to write notes for things
- 🟠 Option to pre-download all content (images etc)

## Drop a Pin

- 🟠 If pin is dropped and location is not on the map then give message
- 🟠 If pin dropped and location not on map then ask for street location and use that to guess
- 🟠 Share my location - have URL which includes location and camp name and person name. Use for facebook / media

## Share Events
- Share button - shows a 6 digit PIN that you can share with other users (a stored device id)
- This will save your fav events to the server
- If you accept a share it will also add any favorites from others
- server will store data in R2 as JSON objects
- App will store your PIN, and shared PINs
- 

## Other Features

- 🟠 Print to pdf for favorited events
- 🔵 Favorites with 2 items fades one item
- 🔵 Dark mode tooltips on the map need a visible border
- 🔵 Show a message when map is shown for the first time "Use 2 fingers or double tap to zoom into the map"
- 🔵 Art tour audio
- 🔵 Group multiple parties on music into the one card
- 🔵 If an event has a long durations (>3hrs) then let user choose notification hour
- 🔵 Pressing the tab again should clear search
- 🔵 "Not Interested" button for Events
- 🔵 If day is burn night show animation of burn
- 🔵 Show/collapse fav group
- 🔵 Notification for gates open
- 🔵 Notification for week before (daily) ^these give chance to download data
- 🔵 Search keyboard hint should be "search" instead of "go"
- 🔵 When clicking back, highlight previous item that was viewed
- 🔵 Notes page with items as checkboxes (ie check list)
- 🔵 Censor toggle for "Mature Audiences"
- 🔵 Show QR Code for profile
- 🔵 Share profile
- 🔵 Route planner: show from 1...x with lines between on map
- 🔵 Email (contact camp)
- 🔵 Add notes to an event (eg invite)
- 🔵 Filter for burns by country
- 🔵 Overlapping events are hard to see - Maybe some indicator of this

## Bugs

- iOS: The filter on the home page for "regionals" etc cannot be dismissed by clicking elsewhere (works on Android)
- Images are in `webp` but you when you use the share plugin these image types dont appear (at least on iOS). Maybe convert to png?

## Feedback

- Reminder times configurable (Google App Reviewer)
- Camps filter by clock (eg Near 7:00 which would be 6:30-7:30) (Robin)
- Google nearby plugin - use for bluetooth chat feature

## Burner Map

- In Camps use "I'm in this camp" which puts a home pin on the map
- Give option to share on social media with a link to add friend into dust

## Check In

- Check In Button - For events, add to check in history on the more tab
- Only show check in if distance = near and event is between start and end
- Checked in events show with a tick next to them

## RSS Feed

- RSS Feed > App
- Push Notifications backend to handle sending them out

## Lock Screen Image

- Create lock screen image: use name, location, email, camp, emergency name, emergency phone. Save to photos

## Info

- Audio Guide https://soundcloud.com/burningman/sets/2023-art-audio-guide
- PWA to Microsoft store: https://tech.lgbt/@lilPWA/111711138018508269
