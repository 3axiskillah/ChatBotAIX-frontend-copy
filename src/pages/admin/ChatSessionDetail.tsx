import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "../../utils/api";

type Message = {
  id: number;
  is_user: boolean;
  content: string;
  image_url?: string;
};

export default function ChatSessionDetail() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    apiFetch(`/api/chat/admin/chat-sessions/${sessionId}/messages/`)
      .then((data) => setMessages(data))
      .catch((err) => console.error("Failed to load messages", err));
  }, [sessionId]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#D1A75D] mb-4">Session #{sessionId} Messages</h2>
      <Link to="/admin/sessions" className="text-[#D1A75D] hover:underline mb-4 block">← Back to sessions</Link>

      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg p-4 ${
              msg.is_user ? "bg-[#E7D8C1] text-[#4B1F1F]" : "bg-[#D1A75D] text-[#4B1F1F]"
            }`}
          >
            <p className="mb-2">{msg.content}</p>
            {msg.image_url && (
              <img
                src={msg.image_url.startsWith("http") ? msg.image_url : `${import.meta.env.VITE_API_BASE_URL}${msg.image_url}`}
                alt="Chat image"
                className="rounded max-w-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
