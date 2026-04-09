import { NextResponse } from 'next/server';

// Question ID Mapping (Requirement 2)
const QUESTION_MAP: Record<string, string> = {
  'chat_q1': "The Next.js App Router (introduced in version 13) uses React Server Components to simplify data fetching and improve performance by reducing the amount of JavaScript sent to the client.",
  'chat_q2': "In this application, we use React's `useState` for local message state and `next-themes` for global theme management. For larger apps, tools like Zustand or Redux are often preferred.",
  'chat_q3': "TypeScript provides static type checking, which catches errors early in development, improves IDE autocompletion, and makes the codebase much easier to refactor and maintain.",
  'chat_q4': "This project follows a modular Next.js App Router structure. Components are stored in `/components`, pages in `/app`, and API logic in `/app/api` for clear separation of concerns.",
  'chat_q5': "To deploy to Vercel, push your code to GitHub, connect your repository in the Vercel dashboard, and it will automatically build and deploy your application with every push.",
  'chat_q6': "Tailwind CSS v4 introduces a new 'high-performance' engine, zero-config setup, and first-class support for modern CSS features like CSS variables and container queries.",
  'chat_q7': "Manual dark mode is implemented using the `dark:` utility classes in Tailwind. The `next-themes` library handles the logic of adding the `.dark` class to the HTML element.",
  'chat_q8': "API Route Handlers in Next.js allow you to create RESTful endpoints. They run on the server, meaning you can safely handle secret keys and database connections away from the client.",
  'chat_q9': "React Server Components (RSC) allow components to be rendered on the server. This results in faster page loads as the initial HTML is generated and sent before the JavaScript hydrates.",
  'chat_q10': "Optimization techniques in Next.js include using the `<Image />` component for automatic optimization, implementing dynamic imports, and leveraging Incremental Static Regeneration (ISR).",
};

export async function POST(req: Request) {
  try {
    const { questionId, messages } = await req.json();
    
    // Requirement 2: 1.5-second logic-first delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Determine the response based on questionId or fallback to text content
    let responseContent = "";

    if (questionId && QUESTION_MAP[questionId]) {
      responseContent = QUESTION_MAP[questionId];
    } else {
      // Professional fallback response for standard text input
      responseContent = "That's an interesting question. I'm currently set up to provide detailed answers to preset professional questions, but I can tell you that Metawurks AI is designed for enterprise-grade performance and scalability.";
    }

    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: responseContent,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
