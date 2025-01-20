# Playful Project Forge

A modern AI chat interface built with React and TypeScript, featuring real-time messaging, development tools, and a beautiful dark-mode UI.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **AI Integration**: LangChain for AI processing
- **Backend & Auth**: Supabase (PostgreSQL + Real-time subscriptions)
- **UI Components**: shadcn/ui (Built on Radix UI)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

## Features

- 🤖 AI-powered chat interface
- 🔄 Real-time message updates
- 🎨 Modern dark theme UI
- 🔒 Authentication with Supabase
- 📊 Development metrics and status indicators
- ⚡️ Fast and responsive design
- 💻 Code syntax highlighting
- 🌐 Real-time connection status
- ⌨️ Typing indicators

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account
- OpenAI API key

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/ashayden/playful-project-forge.git
cd playful-project-forge
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your environment variables:
```env
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Start the development server:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/     # React components
├── contexts/       # React contexts
├── hooks/         # Custom hooks
├── lib/           # Utility functions
├── pages/         # Page components
├── services/      # Service integrations
├── styles/        # Global styles
└── types/         # TypeScript types
```

## Development Features

- Real-time connection status monitoring
- Message latency tracking
- Development environment indicators
- Type-safe components and hooks
- Comprehensive error boundaries
- Automated testing setup

## Deployment

The project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and add the required environment variables in your project settings.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - feel free to use this project for your own purposes.

