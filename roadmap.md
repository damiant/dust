# Roadmap

- 🔴 Print favorites only prints one page (Borderland feedback)
- 🔴 Multiple pins in the one location should allow flipping between the items
- 🟠 Now map needs music

- 🟠 On todays favorite events show bold for happening now, grey if completed
- 🟠 As the time changes, update todays events
- 🟠 Error: white screened the events page after a day had passed

# Feedback: Requested Features

- 🔵 Feature to highlight downloading an update in the week before the event if it was updated more than a week ago
- 🔵 Timetable view (something like Google Calendar)
- 🟠 Share/Collaborate with friends on your favorites list
- 🟠 Notes - ability to write notes for things
- 🟠 Option to predownload all content (images etc)

# Drop a Pin

- 🟠 If pin is dropped and location is not on the map then give message
- 🟠 If pin dropped and location not on map then ask for street location and use that to guess
- 🟠 Share my location - have URL which includes location and camp name and person name. Use for facebook / media

# Share Events
- Share button - shows a 6 digit PIN that you can share with other users (a stored device id)
- This will save your fav events to the server
- If you accept a share it will also add any favorites from others
- server will store data in R2 as JSON objects
- App will store your PIN, and shared PINs
- 

## Other Features

- 🟠 Print to pdf for favorited events
- 🔵 Favorites with 2 items fades one item
- search on home page to search all events, camps, art, and music
- 🔵 Dark mode tooltips on the map need a visible border
- 🔵 Show a message when map is shown for the first time "Use 2 fingers or double tap to zoom into the map"
- 🔵 Art tour audio
- 🔵 Group multiple parties on music into the one card
- 🔵 After adding a favorite show the badge count on the fav tab increase (and disappear after opening it)
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

# Difficult to solve

- Overlapping events are hard to see - Maybe some indicator of this

# Bugs

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
