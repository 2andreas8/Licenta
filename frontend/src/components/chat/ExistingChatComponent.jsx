import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversationMessages, addMessageToConversation, getConversation } from '../../services/conversationsService';
import { toast } from 'react-toastify';
import { askQuestion } from '../../services/chatService';
import { EVENTS } from '../../services/events';
import EventBus from '../../services/EventBus';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
        if (!uploadedFile?.id) return;

        const unsubscribeDoc = EventBus.subscribe(EVENTS.DOCUMENT_DELETED, (data) => {
            if (data.documentId === uploadedFile.id) {
                toast.info("The document associated with this conversation has been deleted.");
                navigate("/chat/new");
            }
        });

        const unsubscribeConv = EventBus.subscribe(EVENTS.CONVERSATION_DELETED, (data) => {
            if (data.conversationId === parseInt(conversationId)) {
                toast.info("This conversation has been deleted.");
                navigate("/chat/new");
            }
        });

        const unsubscribeTitleUpdate = EventBus.subscribe(EVENTS.TITLE_UPDATED, (data) => {
            const currentConvId = Number(conversationId);
            const updatedConvId = Number(data.conversationId);
            if (updatedConvId === currentConvId) {
                setUploadedFile((prev) => ({ ...prev, title: data.newTitle }));
            }
        });

        return () => {
            unsubscribeDoc();
            unsubscribeConv();
            unsubscribeTitleUpdate();
        };
    }, [conversationId, uploadedFile?.id, navigate]);

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
                fileId: uploadedFile.id,
                conversationId: conversationId
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

    const highlightSourceReferences = (content) => {
        return content.replace(/\[Fragment (\d+)(?:,\s*Page (\d+))?\]/g, '**[Fragment $1, Page $2]**');
    };

    const markdownComponents = {
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-purple-800 mt-4 mb-2" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-purple-700 mt-3 mb-2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-purple-600 mt-2 mb-1" {...props} />,
        p: ({ node, ...props }) => <p className="mb-3" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-3" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-3" {...props} />,
        li: ({ node, ...props }) => <li className="mb-2" {...props} />,
        code: ({ node, inline, ...props }) =>
            inline ?
                <code className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-sm font-mono" {...props} /> :
                <code className="block bg-gray-100 p-2 rounded my-2 font-mono overflow-x-auto" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold text-purple-900" {...props} />,
        em: ({ node, ...props }) => <em className="text-italic" {...props} />,
    };

    return (
        // ————————————— Outer wrapper —————————————
        <div className="w-full max-w-3xl flex flex-col rounded-2xl shadow-2xl bg-gradient-to-br from-purple-800/60 to-purple-900/70 backdrop-blur-md border border-white/20 overflow-hidden m-auto h-[80vh] max-h-[800px]">

            {/* ——— 1) Header ——— */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-900 to-purple-700 text-white border-b border-white/20 flex items-center justify-between">
                <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    <div>
                        <div className="text-lg font-semibold">Chat about:</div>
                        <div className="text-purple-200 truncate max-w-sm">
                            {uploadedFile?.title || "No file uploaded yet"}
                        </div>
                    </div>
                </div>
            </div>

            {/* ——— 2) Mesaje + footer ——— */}
            <div className="flex flex-1 flex-col min-h-0">
                {/* — 2a) Zona de mesaje cu scroll intern — */}
                <div className="flex-1 overflow-y-auto px-8 pt-2 pb-4 min-h-0 custom-scrollbar">
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
                                {msg.role === "assistant" &&
                                    <span className="text-2xl transition-transform group-hover:scale-110">🤖</span>
                                }
                                <div
                                    className={`px-5 py-3 rounded-xl max-w-xl shadow-md transition-all ${msg.role === "user"
                                        ? "bg-gradient-to-br from-purple-500 to-purple-700 text-white"
                                        : "bg-white/95 text-gray-900 ring-1 ring-purple-200/50"
                                        }`}
                                >
                                    {msg.role === "assistant" ? (
                                        <div className="markdown-content">
                                            <ReactMarkdown
                                                components={markdownComponents}
                                            >
                                                {highlightSourceReferences(msg.content)}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                                {msg.role === "user" &&
                                    <span className="text-2xl transition-transform group-hover:scale-110">🙂</span>
                                }
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
                <form onSubmit={handleSend} className="bg-gradient-to-r from-purple-900/70 to-purple-800/70 px-6 py-4 flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            className="w-full border border-purple-400/50 rounded-lg px-4 py-3 bg-white/90 text-gray-900 transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder={uploadedFile ? "Type your question..." : "Upload a file to start chatting..."}
                            disabled={!uploadedFile}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!uploadedFile || !input.trim()}
                    >
                        <span>Send</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    )
}