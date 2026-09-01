import { ChatProvider } from '@/contexts/ChatContext';
import { ChatWidget } from '@/components/chat/chat-widget';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      {children}
      <ChatWidget />
    </ChatProvider>
  );
}
