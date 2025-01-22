# Playful Project Forge

A modern AI chat interface built with React and TypeScript, featuring real-time messaging and a beautiful dark-mode UI powered by OpenAI's GPT models.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **AI Integration**: OpenAI API with streaming responses
- **Backend & Auth**: Supabase (PostgreSQL + Authentication)
- **UI Components**: shadcn/ui (Built on Radix UI)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Routing**: React Router
- **Form Handling**: React Hook Form + Zod

## Features

- 🤖 AI-powered chat interface with streaming responses
- 🔄 Real-time message updates
- 🎨 Modern dark theme UI
- 🔒 GitHub authentication with Supabase
- 📊 Performance monitoring and metrics
- ⚡️ Fast and responsive design
- 💻 Code syntax highlighting
- ⌨️ Typing indicators
- 🚀 Optimized for Vercel deployment

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

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Fill in your environment variables in `.env.local`:
     - **Supabase Configuration**
       - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
       - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
       - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
     - **OpenAI Configuration**
       - `OPENAI_API_KEY`: Your OpenAI API key
       - `VITE_OPENAI_MODEL`: OpenAI model to use (default: gpt-4o)
       - `VITE_OPENAI_TEMPERATURE`: Model temperature (default: 0.7)
       - `VITE_OPENAI_MAX_TOKENS`: Maximum tokens per response (default: 4096)
       - Other optional OpenAI parameters can be configured as needed

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
├── api/           # API routes
├── app/           # App pages and layouts
├── components/    # React components
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── lib/           # Utility functions
├── services/      # Service integrations
└── types/         # TypeScript types
```

## Development Features

- Streaming chat responses
- Performance monitoring
- Type-safe components and hooks
- Comprehensive error boundaries
- GitHub authentication
- Message persistence with Supabase

## Deployment

The project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add the required environment variables in your project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
3. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - feel free to use this project for your own purposes.

