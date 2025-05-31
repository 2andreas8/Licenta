import { useEffect, useState } from "react";
import { uploadDocument } from "../../services/documentService";
import { toast } from "react-toastify";
import { fetchUserDocuments } from "../../services/documentService";

export default function NewChatComponent() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    const [uploadedFile, setUploadedFile] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const [existingFiles, setExistingFiles] = useState([]);
    const [selectedFileId, setSelectedFileId] = useState(null);

    useEffect(() => {
        fetchUserDocuments().then(setExistingFiles).catch(err => {
            console.error("Error loading documents: ", err);
            toast.error("Failed to load your documents. Please try again later.");
        });
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const onClose = () => {
        setShowOverlay(false);
    }

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

    const onFileSelect = () => {
        console.log("Selected file ID:", selectedFileId);
        console.log("Existing files:", existingFiles);
        if(!selectedFileId) return;
        const selected = existingFiles.find(file => String(file.id) === String(selectedFileId));
        if (selected) {
            setUploadedFile(selected);
            setShowOverlay(false);
        }
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
                    {!uploadedFile && !showOverlay && (
                    <div className="text-center mt-4">
                        <button
                        className="text-purple-300 underline hover:text-purple-100 transition"
                        onClick={() => setShowOverlay(true)}
                        >
                        Upload file
                        </button>
                    </div>
                    )}
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
            {!uploadedFile && showOverlay && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40">
                <div className="relative bg-white rounded-lg shadow-2xl p-10 w-full max-w-md flex flex-col items-center">
                    <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Start a new chat</h2>
                    {/* Upload Form */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center mb-6">
                    <label className="font-semibold text-gray-700 mb-2 w-full text-left">Upload a new file</label>
                    <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="mb-4 w-full" />
                    <button type="submit" className="bg-purple-600 text-white px-6 py-3 w-full rounded hover:bg-purple-700 transition-colors" disabled={loading}>
                        {loading ? "Uploading..." : "Upload and Start Chat"}
                    </button>
                    </form>
                    {/* Separator */}
                    <div className="flex items-center w-full my-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 text-gray-400 font-semibold">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                    </div>
                    {/* Existing Files Section */}
                    {existingFiles.length > 0 && ( 
                    <div className="w-full flex flex-col items-center">
                        <label className="font-semibold text-gray-700 mb-2 w-full text-left">Select an existing file</label>
                        <div className="flex w-full gap-2">
                        <select className="border rounded px-3 py-2 flex-1" value={selectedFileId || ""} onChange={e => setSelectedFileId(e.target.value)}>
                            <option value="">-- Select file --</option>
                            {existingFiles.map(file => (
                            <option key={file.id} value={file.id}>{file.filename}</option>
                            ))}
                        </select>
                        <button 
                            type="button"
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors" 
                            disabled={!selectedFileId}
                            onClick={onFileSelect}    
                        >
                            Start Chat
                        </button>
                        </div>
                    </div>
                    )}
                </div>
            </div>
            )}
        </div>
    )
}