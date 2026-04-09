# Metawurks AI - Enterprise ChatGPT Clone

An enterprise-grade, production-ready ChatGPT clone built with **Next.js 14**, **Tailwind CSS v4**, and **TypeScript**. This application features a highly responsive UI, manual message submission flow, and a modular architecture.

## 🚀 Live Demo
**Link**: https://chat-ui-tau-liart.vercel.app/

## 🛠️ Features
- **Modern UI/UX**: Claude-inspired collapsible sidebar that transitions into a sleek icon-only toolbar.
- **Theme Support**: Seamless Light and Dark mode switching using `next-themes`.
- **Intelligent Chat**: Support for preset professional questions with smart text-matching.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop viewing.

## 🏃 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/varalakshmikr24/chat-ui.git
   ```
2. Navigate to the project directory:
   ```bash
   cd chat-ui
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧩 Challenges Faced and Solutions

### 1. Hydration Mismatches with Themes
**Challenge**: In Next.js, the server pre-renders HTML before it reaches the client. Since the server doesn't know the user's theme preference (stored in localStorage), it often renders "Light Mode" while the client immediately switches to "Dark Mode," causing a hydration mismatch error.
**Solution**: Implemented a `mounted` state using React's `useEffect` hook. By only rendering theme-specific elements (like the toggle icon) after the component has mounted on the client, we ensure the server and client HTML stay in sync. Added `suppressHydrationWarning` to the root layout as a secondary safeguard.

### 2. Complex Sidebar Transitions
**Challenge**: Implementing a "door-kind" sidebar that functions as both a full navigation bar and a minimized icon-toolbar required complex layout management to avoid content overlapping.
**Solution**: Utilized Tailwind's dynamic width classes and CSS `transition` properties. Created an adaptive layout where the main chat area's margin (`ml-[60px]` vs `ml-64`) changes dynamically based on the sidebar's state, providing a smooth "push" effect rather than an overlay.

### 3. Payload Optimization for Manual Submission
**Challenge**: Ensuring that the API request remains lightweight while maintaining a full chat history in the UI.
**Solution**: Refactored the submission logic to separate the UI state (full message history) from the API payload. The application now extracts and sends only the latest user message to the backend, reducing bandwidth and improving response times.

---
*Developed for the Metawurks Internship Assignment.*
