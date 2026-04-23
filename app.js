import { ThemeProvider } from "./ThemeContext";
import Login from './app/(tabs)/login';

export default function App() {
  return (
    <ThemeProvider>
      <Login />
    </ThemeProvider>
  );
}