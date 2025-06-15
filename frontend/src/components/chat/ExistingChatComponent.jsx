import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversationMessages, addMessageToConversation, getConversation } from '../../services/conversationsService';
import { toast } from 'react-toastify';
import { askQuestion } from '../../services/chatService';
import { EVENTS } from '../../services/events';
import EventBus from '../../services/EventBus';
import ReactMarkdown from 'react-markdown';

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
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-purple-800 mt-4 mb-2" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-purple-700 mt-3 mb-2" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-medium text-purple-600 mt-2 mb-1" {...props} />,
        p: ({node, ...props}) => <p className="mb-3" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-3" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-3" {...props} />,
        li: ({node, ...props}) => <li className="mb-2" {...props} />,
        code: ({node, inline, ...props}) => 
            inline ? 
            <code className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-sm font-mono" {...props} /> :
            <code className="block bg-gray-100 p-2 rounded my-2 font-mono overflow-x-auto" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold text-purple-900" {...props} />,
        em: ({node, ...props}) => <em className="text-italic" {...props} />,
    };

    return (
        // ————————————— Outer wrapper (o singură dată h-screen) —————————————
        <div className="w-full max-w-3xl flex flex-col rounded-2xl shadow-xl bg-purple-800/60 backdrop-blur-md border border-white/20 overflow-hidden m-auto h-[80vh] max-h-[800px]">

            {/* ——— 1) Header ——— */}
            <div className="px-6 py-4 text-lg font-semibold text-white border-b border-white/10">
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
                                    {msg.role === "assistant" ? (
                                        <div className="markdown-content">
                                            <ReactMarkdown components={markdownComponents}>
                                                {highlightSourceReferences(msg.content)}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
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
    )
}