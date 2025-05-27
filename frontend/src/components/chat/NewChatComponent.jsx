import { useState } from "react";
import { uploadDocument } from "../../services/documentService";
import { toast } from "react-toastify";

export default function NewChatComponent() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const [uploadedFile, setUploadedFile] = useState({
        id: "test-file-id-123",
        filename: "document.pdf"
    });
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a file first!");
            return;
        }
        // TODO: file upload logic here
        setLoading(true);
        try {
            const result = await uploadDocument(file);
            toast.success("File uploaded successfully!");
            // Redirect to chat page or update state as needed
            setUploadedFile(result);
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Upload failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setMessages([...messages, {role: "user", content: input }]);
        setInput("");
        // TODO: call backend to get response and add it to messages
    };

    return (
        <div className="flex flex-col flex-1 justify-end bg-gradient-to-b from-purple-800 to-purple-900 h-full">
            <div className="flex-1 flex flex-col justify-end items-center px-8 py-4">
                <div className="w-full max-w-3xl flex flex-col flex-1 rounded-2xl shadow-xl bg-purple-800/60 backdrop-blur-md border border-white/20 p-0 h-[90vh]">
                    {/* Chat Header */}
                    <div className="p-6 text-lg font-semibold text-white">
                        {uploadedFile 
                            ? <>Chat about: <span className="text-purple-200">{uploadedFile.filename}</span></>
                            : <>No file uploaded yet</>
                        }
                    </div>
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-8 pb-4">
                        {messages.length === 0 && (
                            <div className="text-gray-300 text-center">Start the conversation about your document!</div>
                        )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`px-5 py-3 rounded-xl max-w-xl ${msg.role === "user" ? "bg-purple-600 text-white" : "bg-white text-gray-900"}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    </div>
                    {/* Input Form */}
                    <form onSubmit={handleSend} className="flex gap-3 p-6 bg-purple-900/40 rounded-b-2xl">
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
                            disabled={!uploadedFile || !input.trim()}>
                                Send
                            </button>
                    </form>
                </div>
            </div>
        
            {/* Overlay Upload Form */}
            {!uploadedFile && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                <div className="relative bg-white rounded-lg shadow-2xl p-12 w-full max-w-lg flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Upload a file to start</h2>
                    <form 
                        onSubmit={handleSubmit}
                        className="w-full flex flex-col items-center"
                    >
                        <input 
                            type="file"
                            accept=".pdf,.docx,.txt" // filtrare extra, exista si in backend
                            onChange={handleFileChange}
                            className="mb-6"
                        />
                        <button
                            type="submit"
                            className="bg-purple-600 text-white px-6 py-3 w-full rounded hover:bg-purple-700 transition-colors"
                            disabled={loading}
                        >
                            {loading ? "Uploading..." : "Upload and Start Chat"}
                        </button>
                    </form>
                </div>
            </div>
            )}
        </div>
    )
}