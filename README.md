# WalkieTalkie

A Progressive Web App that uses AI and GPS to tell you about your surroundings. Simply tap "Discover This Area" and get interesting local information powered by OpenAI.

## Features

- **AI-Powered Discovery** - Get detailed information about your current location using GPT-4o
- **Interactive Map** - See your location on an OpenStreetMap-powered map
- **Extra Content** - Dive deeper with topics like Eating Out, Drinks, Shopping, History, and Activities
- **History Cards** - Horizontal carousel of your past discoveries with mini map tiles
- **Compass** - See your heading and nearby landmarks
- **Offline Support** - Service worker caching for offline use
- **Dark Mode** - Toggle between light and dark themes
- **Text Size** - Adjustable text size for accessibility

## Setup

1. Open the app in a browser
2. Tap the settings icon (gear) in the header
3. Enter your OpenAI API key
4. Tap "Discover This Area" to start exploring

## Changelog

### v1.5.2
- Fixed welcome panel layout - features now display horizontally
- Moved Discover button inside welcome panel (below features)
- Larger feature icons with proper centering

### v1.5.1
- Rainbow animation on location icon persists through entire discovery process (location + AI response)

### v1.5.0
- New welcome panel with animated globe icon and feature highlights
- Discover button hides after first successful discovery
- Tapping location icon now triggers fresh location + new AI discovery
- Cleaner initial UI flow

### v1.4.2
- Map and location card now both hidden on initial load
- Both animate in smoothly when location is first obtained

### v1.4.1
- Added README with changelog

### v1.4.0
- Discover button now visible immediately on app load
- Location card hidden until first discovery, then animates in smoothly
- Removed separate refresh button - tap the green location icon to refresh
- Rainbow gradient pulse animation on location icon while fetching location

### v1.3.0
- Replaced all emojis with modern SVG icons (Lucide-style)
- Extra content buttons now use clean icon designs
- Footer heart icon updated to SVG
- AI responses no longer start with filler words like "Absolutely"

### v1.2.0
- History section converted to horizontal snap-scrolling card carousel
- Each history card displays a static map tile from OpenStreetMap
- Long location names animate with marquee scroll effect
- Location title animates back-and-forth with fade edges when overflowing

### v1.1.0
- Added extra content buttons (Eating Out, Drinks, Shopping, History, Activities)
- Compass section with heading display and landmark directions
- Text size controls in header
- Dark mode toggle

### v1.0.0
- Initial release
- GPS-based location discovery
- OpenAI integration for area information
- PWA with offline support
- Settings modal for API key configuration

## Tech Stack

- Vanilla JavaScript (no frameworks)
- Leaflet.js for maps
- OpenStreetMap tiles
- OpenAI GPT-4o API
- Service Worker for offline caching

## License

Made with love whilst on the train into London.
