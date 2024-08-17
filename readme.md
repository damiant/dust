# Dust

An offline guide for the events, theme camps & art of Burning Man. More info at [dust.events](https://dust.events)

<a href="https://apps.apple.com/us/app/dust-a-guide-for-burners/id6456943178?itsct=apps_box_badge&itscg=30200"><img src="https://dust.events/img/app-store.svg" style="height: 40px" /></a>
<a href="https://play.google.com/store/apps/details?id=nexus.concepts.dust"><img src="https://dust.events/img/google-play.svg" style="height: 40px" /></a>

## Features
- Find events by day, category, theme camp or search
- Find art by search or listing
- Find theme camps by search or listing
- Map locations for Art and Theme Camps
- Favorite events, Art and Theme Camps
- Show nearby events, Art and Theme Camps
- Get notified when your favorite event is about to start
- Find DJ sets from Rock Star Librarian
- Works offline

## Contributing

Dust uses [Bun](https://bun.sh/) for package management etc. You can install Bun with:
```bash
curl -fsSL https://bun.sh/install | bash
```

To run this project:
- `bun install`
- `bunx ng serve --open`

Dust uses [Capacitor](https://capacitorjs.com) for iOS and Android.

You can build and run for iOS with:
- `bunx ng build`
- `bunx cap copy ios`
- `bunx cap run ios`