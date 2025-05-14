# Windows XP Task Manager

A retro-styled task management application with Windows XP aesthetics, featuring task tracking, meetings, reminders, and time tracking capabilities.

## Features

- Windows XP themed UI with classic Bliss wallpaper and interface elements
- Task management with timer tracking
- Meeting scheduling with participant support
- Reminders with complex recurring patterns (daily, weekly, monthly)
- MongoDB backend with Netlify Functions

## Tech Stack

- Frontend: React.js with styled-components
- Backend: Netlify Functions (serverless)
- Database: MongoDB
- Deployment: Netlify

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory (see `env.example` for required variables)
4. Start the development server:
   ```
   npm run dev
   ```

## Backend Development

The application uses Netlify Functions for the backend API. These are serverless functions that run on-demand.

- All database models are in `netlify/functions/models/`
- API endpoints are in `netlify/functions/`
- Database connection is managed in `netlify/functions/utils/db.js`

## Deploying to Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure the following environment variables in Netlify:
   - `REACT_APP_MONGODB_URI`: Your MongoDB connection URI
   - `NODE_ENV`: Set to `production` for production deployment
4. Deploy with the following settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

## License

MIT

## Credits

- 98.css for the retro Windows 98 styling
- All other dependencies used in this project
