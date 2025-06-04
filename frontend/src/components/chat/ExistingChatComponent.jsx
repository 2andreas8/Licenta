import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversationMessages, addMessageToConversation, getConversation } from '../../services/conversationsService';
import { toast } from 'react-toastify';
import { askQuestion } from '../../services/chatService';

export default function ExistingChatComponent({ conversationId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploadedFile, setUploadedFile] = useState([]);
    const [waitingForAnswer, setWaitingForAnswer] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadConversation();
    }, [conversationId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, waitingForAnswer]);

    const loadConversation = async () => {
        try {
            const conversation = await getConversation(conversationId);
            const message = await getConversationMessages(conversationId);
            setUploadedFile({ id: conversation.document_id, title: conversation.title });
            setMessages(message);
        } catch (error) {
            toast.error("Could not load conversation");
            navigate("/chat/new");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setWaitingForAnswer(true);

        try {
            await addMessageToConversation(conversationId, userMessage.content, userMessage.role);
            const response = await askQuestion({
                question: userMessage.content,
                fileId: uploadedFile.id
            });

            const assistantMessage = { role: 'assistant', content: response.answer };
            await addMessageToConversation(conversationId, assistantMessage.content, assistantMessage.role);

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            toast.error("Failed to send message");
            console.error("Error sending message:", error);
        } finally {
            setWaitingForAnswer(false);
        }
    };

    return (
        // ————————————— Outer wrapper (o singură dată h-screen) —————————————
        <div className="h-full w-full bg-gradient-to-b from-purple-800 to-purple-900 flex items-center justify-center">
            {/* ————————— Chat-card fix, 90vh înălțime ————————— */}
            <div className="w-full max-w-3xl h-[85vh] flex flex-col rounded-2xl shadow-xl bg-purple-800/60 backdrop-blur-md border border-white/20 overflow-hidden">
                {/* ——— 1) Header ——— */}
                <div className="px-6 py-4 text-lg font-semibold text-white">
                    {uploadedFile
                        ? <>Chat about: <span className="text-purple-200">{uploadedFile.title}</span></>
                        : <>No file uploaded yet</>
                    }
                </div>

                {/* ——— 2) Mesaje + footer ——— */}
                <div className="flex flex-1 flex-col min-h-0">
                    {/* — 2a) Zona de mesaje cu scroll intern — */}
                    <div className="flex-1 overflow-y-auto px-8 pt-2 pb-4 min-h-0">
                        {messages.length === 0 && (
                            <div className="text-gray-300 text-center mt-8">
                                Start the conversation about your document!
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className="flex items-end gap-2">
                                    {msg.role === "assistant" && <span className="text-2xl">🤖</span>}
                                    <div className={`px-5 py-3 rounded-xl max-w-xl ${msg.role === "user" ? "bg-purple-600 text-white" : "bg-white text-gray-900"
                                        }`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === "user" && <span className="text-2xl">🙂</span>}
                                </div>
                            </div>
                        ))}
                        {waitingForAnswer && (
                            <div className="mb-3 flex justify-start">
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl">🤖</span>
                                    <div className="px-5 py-3 rounded-xl max-w-xl bg-purple-800 text-white animate-pulse">
                                        Thinking...
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* — 2b) Footer-ul cu input și buton — */}
                    <form onSubmit={handleSend} className="bg-purple-900/40 px-6 py-4 flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            className="flex-1 border border-purple-400 rounded-lg px-4 py-3 bg-white/80 text-gray-900"
                            placeholder={uploadedFile ? "Type your question..." : "Upload a file to start chatting..."}
                            disabled={!uploadedFile}
                        />
                        <button
                            type="submit"
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
                            disabled={!uploadedFile || !input.trim()}
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}