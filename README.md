# Alerta Rua

## About
Alerta Rua is a collaborative platform for monitoring and reporting urban problems related to public maintenance. The main objective of the project is to allow citizens to register occurrences, such as potholes on public roads, unlit streetlights, irregular waste accumulation, and water leaks. This information is centralized and made available on an interactive map, making it easier for both the community and competent authorities to visualize the problems.

## Features
- Interactive Map: Visualization of registered occurrences in real-time using the Google Maps API.
- Occurrence Reporting: Dedicated form to describe problems, select the failure type, and accurately indicate the location on the map.
- Status Tracking: Occurrence lifecycle structured in "Open", "In Progress", and "Resolved" states, with associated visual indicators.
- Search and Filter: Search mechanism to find occurrences by title or address directly in the sidebar.

## Tech Stack
- Frontend: Vue.js 3 and React
- Build and Bundling: Vite
- Styling: Tailwind CSS
- Maps: Google Maps JavaScript API
- Database and Backend: Firebase Firestore and Express
- Icons: Lucide
- Containerization: Docker and Docker Compose

## Getting Started
The project is structured with Docker, simplifying the development environment setup. It is also possible to run it using native Node.js scripts.

### Prerequisites
1. Node.js and npm (or pnpm/yarn) installed.
2. Docker and Docker Compose installed on the system (optional, for container execution).
3. Valid Google Maps API key.

### Docker Execution
1. Clone the repository and navigate to the project directory.
2. Create or configure the necessary environment variables (such as Firebase and Google Maps keys) in the `.env` file.
3. Start the containers using Docker Compose.
4. The application will be available on the configured local address.

### Native Execution
1. Install dependencies by running `npm install`.
2. Configure the `.env` file with the necessary keys.
3. Start the development server with `npm run dev`.

## Project Structure
- `src/`: Contains the application source code (components, routes, and styles).
- `Dockerfile` and `docker-compose.yml`: Configuration files for container orchestration.
- `firestore.rules`: Security rules for Firebase Firestore data access.
- `server.ts` and `vite.config.ts`: Server and bundler configurations.

## Contributing
Contributions are welcome. To contribute, create a fork of this repository, implement improvements in a new branch, and submit a Pull Request detailing the changes.