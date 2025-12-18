# Rosary Together

A mobile-first web app that connects Catholics worldwide for spontaneous, synchronized rosary prayer.

## Features

- **Prayer Queue System**: Join others in real-time to pray the rosary together
- **Multi-Language Support**: English, Spanish, Portuguese, and Tagalog
- **Offline Mode**: Pray offline and sync your progress when back online
- **Prayer Tracking**: Track your prayer streaks and history
- **All Mysteries**: Joyful, Sorrowful, Glorious, and Luminous mysteries
- **Full Prayer Content**: Complete prayers for the rosary in all supported languages

## Tech Stack

- **Frontend**: React Native with Expo (iOS, Android, Web)
- **Backend**: Firebase (Auth, Firestore, Realtime Database)
- **Navigation**: Expo Router
- **State Management**: React Context + hooks
- **Internationalization**: i18next
- **Offline Support**: AsyncStorage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd rosary-together
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Anonymous Auth, Google Auth, and Apple Auth
   - Create a Firestore database
   - Create a Realtime Database
   - Copy your config values

4. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Fill in your Firebase configuration in `.env`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   ```

### Development

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

### Building for Production

```bash
# Export for web
npx expo export --platform web

# Build for iOS/Android (requires EAS)
eas build --platform all
```

## Project Structure

```
rosary-together/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home/lobby screen
│   │   ├── pray.tsx       # Active prayer screen
│   │   ├── history.tsx    # Prayer history
│   │   └── settings.tsx   # User settings
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── prayer/           # Prayer-specific components
│   └── queue/            # Queue components
├── contexts/             # React contexts
│   ├── AuthContext.tsx
│   ├── PresenceContext.tsx
│   └── PrayerContext.tsx
├── hooks/                # Custom hooks
├── services/             # Firebase services
│   ├── firebase.ts
│   ├── auth.ts
│   ├── presence.ts
│   └── sessions.ts
├── content/              # Prayer content
│   ├── prayers/         # Prayer texts (en, es, pt, tl)
│   └── mysteries/       # Mystery content
├── i18n/                 # Internationalization
│   └── locales/         # Translation files
├── types/                # TypeScript types
├── constants/            # App constants
└── utils/                # Utility functions
```

## Firebase Structure

### Firestore Collections

- `users/` - User profiles and stats
- `sessions/` - Prayer sessions
- `intentions/` - Prayer intentions

### Realtime Database

- `presence/` - Real-time user presence and queue

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
