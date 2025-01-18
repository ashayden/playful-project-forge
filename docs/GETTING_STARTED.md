# Getting Started with Playful Project Forge

Welcome! This guide will help you get up and running with the project, even if you're new to React or TypeScript.

## 🚀 Quick Start

### Step 1: Setting Up Your Development Environment

1. **Install Node.js**
   - Go to [nodejs.org](https://nodejs.org)
   - Download and install the "LTS" (Long Term Support) version
   - Verify installation by opening a terminal and typing:
     ```bash
     node --version
     npm --version
     ```

2. **Install Git**
   - Go to [git-scm.com](https://git-scm.com)
   - Download and install Git
   - Verify installation:
     ```bash
     git --version
     ```

### Step 2: Getting the Project

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ashayden/playful-project-forge.git
   cd playful-project-forge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

### Step 3: Setting Up Environment Variables

1. Create a new file called `.env.local` in the project root
2. Copy the contents from `.env.example`
3. Fill in your API keys:
   ```env
   VITE_OPENAI_API_KEY=your_openai_key_here
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

Where to get the keys:
- **OpenAI API Key**: [OpenAI API Keys](https://platform.openai.com/account/api-keys)
- **Supabase Keys**: [Supabase Dashboard](https://app.supabase.com) → Project Settings → API

### Step 4: Running the Project

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   This will start the app at `http://localhost:5173`

2. **View in Browser**
   - Open your browser
   - Go to `http://localhost:5173`
   - You should see the login screen

## 📚 Understanding the Project

### Key Features
- AI Chat Interface: Talk with an AI using OpenAI's GPT models
- Real-time Updates: Messages appear instantly using Supabase's real-time features
- Authentication: Secure login system
- Development Tools: Built-in status monitoring and debugging features

### Project Structure Explained
```
src/
├── components/     # UI components (buttons, inputs, etc.)
├── contexts/       # React contexts for state management
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── pages/         # Main page components
├── services/      # External service integrations
└── types/         # TypeScript type definitions
```

### Key Technologies Used
- **React**: UI library
- **TypeScript**: Adds type safety to JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built UI components
- **Supabase**: Backend and authentication
- **LangChain**: AI integration framework

## 🔧 Common Tasks

### Creating a New Component
1. Create a new file in `src/components`
2. Use this basic structure:
   ```tsx
   interface MyComponentProps {
     // Define your props here
   }

   export function MyComponent({ ...props }: MyComponentProps) {
     return (
       // Your JSX here
     );
   }
   ```

### Adding a New Page
1. Create a new file in `src/pages`
2. Add the route in `App.tsx`

### Working with Styles
- Use Tailwind CSS classes for styling
- Example:
  ```tsx
  <div className="flex items-center justify-center p-4 bg-zinc-900">
    <h1 className="text-2xl font-bold text-white">Hello World</h1>
  </div>
  ```

## 🐛 Troubleshooting

### Common Issues and Solutions

1. **"Module not found" errors**
   - Run `npm install`
   - Check import paths (they should start with @/)

2. **Environment Variable Issues**
   - Make sure `.env.local` exists
   - Check for typos in variable names
   - Restart the development server

3. **Build Errors**
   - Run `npm run build` to see detailed errors
   - Check TypeScript errors with `npm run typecheck`

### Getting Help
- Check the [GitHub Issues](https://github.com/ashayden/playful-project-forge/issues)
- Review the [README.md](../README.md) for additional information
- Join our community (coming soon)

## 🚀 Next Steps

1. Try modifying the chat interface
2. Add new features to the development tools
3. Explore the AI integration
4. Contribute to the project

Remember: The best way to learn is by doing. Don't be afraid to experiment and make changes! 