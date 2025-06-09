import { useEffect, useState, useRef } from "react";
import { uploadDocument } from "../../services/documentService";
import { toast } from "react-toastify";
import { fetchUserDocuments } from "../../services/documentService";
import { askQuestion } from "../../services/chatService";
import { createConversation, addMessageToConversation } from "../../services/conversationsService";
import { Document, Page, pdfjs } from "react-pdf";
// local worker for PDF.js
//pdfjs.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.min.js`;
// Adaugă acest cod temporar pentru a afla versiunea exactă necesară
console.log("PDF.js version needed:", pdfjs.version);

pdfjs.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.min.js`;

export default function NewChatComponent() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    const [uploadedFile, setUploadedFile] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const [existingFiles, setExistingFiles] = useState([]);
    const [selectedFileId, setSelectedFileId] = useState(null);

    const [waitingForAnswer, setWaitingForAnswer] = useState(false);
    const messagesEndRef = useRef(null);

    const [currentConversation, setCurrentConversation] = useState(null);

    // states for previewing pdf
    const [preview, setPreview] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    }, [messages, waitingForAnswer]);

    useEffect(() => {
        fetchUserDocuments().then(setExistingFiles).catch(err => {
            console.error("Error loading documents: ", err);
            toast.error("Failed to load your documents. Please try again later.");
        });
    }, []);

    const startNewConversation = async (documentId, filename) => {
        try {
            const conversation = await createConversation(documentId, filename);
            setCurrentConversation(conversation);
        } catch (error) {
            console.error("Error creating conversation:", error);
            toast.error("Failed to start a new conversation. Please try again later.");
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        if (!selectedFile) {
            setPreview(null);
            return;
        }

        if (selectedFile.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e)  => setPreview({
                type: "text",
                content: e.target.result
            });
            reader.readAsText(selectedFile);
        }
        else if (selectedFile.type === "application/pdf") {
            const url = URL.createObjectURL(selectedFile);
            setPreview({
                type: "pdf",
                url: url
            });
        }
        else if (selectedFile.type.includes("word") || selectedFile.type.endsWith("docx")) {
            setPreview({
                type: "docx",
                name: selectedFile.name
            });
        }
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
        
        setLoading(true);
        setUploadProgress(0);

        const uploadWithProgress = async () => {
            try {
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 300);

                const result = await uploadDocument(file);
                clearInterval(progressInterval);
                setUploadProgress(100);

                await startNewConversation(result.id, result.filename);
                toast.success("File uploaded successfully!");
                setUploadedFile(result);

                if (preview && preview.type === "pdf" && preview.url) {
                    URL.revokeObjectURL(preview.url);
                }
                setPreview(null);

            } catch (error) {
                toast.error(error?.response?.data?.detail || "Upload failed. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        uploadWithProgress();
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages(prev => [...prev, {role: "user", content: input}]);
        const userInput = input;
        setInput("");
        setWaitingForAnswer(true);
        
        try {
            await addMessageToConversation(
                currentConversation.id,
                userInput,
                "user"
            );

            const res = await askQuestion({ 
                question: userInput, 
                fileId: uploadedFile.id, 
                conversationId: currentConversation.id
            });

            const assistantMessage = {role: "assistant", content: res.answer};
            await addMessageToConversation(
                currentConversation.id,
                assistantMessage.content,
                assistantMessage.role
            );

            setTimeout(() => {
                setMessages(prev => [...prev, {role: "assistant", content: res.answer}]);
                setWaitingForAnswer(false);
            }, 500)
        } catch (error) {
            console.error("Error asking question:", error);
        }
        // } finally {
        //     setWaitingForAnswer(false);
        // }
    };

    const onFileSelect = async () => {
        console.log("Selected file ID:", selectedFileId);
        console.log("Existing files:", existingFiles);
        if(!selectedFileId) return;
        const selected = existingFiles.find(file => String(file.id) === String(selectedFileId));
        if (selected) {
            try {
                await startNewConversation(selected.id, selected.filename);
                setUploadedFile(selected);
                setShowOverlay(false);
            } catch (error) {
                console.error("Error starting conversation with selected file:", error);
                toast.error("Failed to start conversation with selected file. Please try again.");
            }
        }
    };

    return (
    <>
        {/* ————————— Chat-card ————————— */}
        <div className="w-full max-w-3xl flex flex-col rounded-2xl shadow-xl bg-purple-800/60 backdrop-blur-md border border-white/20 overflow-hidden m-auto">
        {/* ——— Header ——— */}
        <div className="px-6 py-4 text-lg font-semibold text-white">
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
                    <div className={`px-5 py-3 rounded-xl max-w-xl ${
                    msg.role === "user" ? "bg-purple-600 text-white" : "bg-white text-gray-900"
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

        {/* ————————— Overlay Upload Form (rămâne la fel) ————————— */}
        {!uploadedFile && showOverlay && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40">
            <div className="relative bg-white rounded-lg shadow-2xl p-10 w-full max-w-md flex flex-col items-center">
            <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={onClose}
            >
                &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Start a new chat</h2>
            {/* Upload Form with Preview */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center mb-6">
                <label className="font-semibold text-gray-700 mb-2 w-full text-left">
                Upload a new file
                </label>
                {/* File Input */}
                <div className="w-full mb-4">
                    <label 
                        className="block w-full px-4 py-3 text-center border-2 border-dashed rounded-lg border-purple-300 hover:border-purple-500 cursor-pointer bg-purple-50 transition"
                    >
                        <span className="text-purple-600">Choose a file or drag & drop</span>
                        <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {file && (
                            <p className="mt-2 text-sm text-gray-600 truncate">
                                Selected: {file.name}
                            </p>
                        )}
                    </label>
                </div>
                {/* Document Preview */}
                {preview && (
                    <div className="my-4 w-full border rounded-lg p-4 bg-gray-50 max-h-64 overflow-auto">
                        <h3 className="text-md font-semibold mb-2 text-gray-700">Preview:</h3>
                        {preview.type === "text" && (
                            <div className="whitespace-pre-wrap text-sm font-mono text-gray-700">
                                {preview.content.slice(0, 500)}
                                {preview.content.length > 500 && "..."}
                            </div>
                        )}
                        {preview.type === "pdf" && (
                            <div className="flex flex-col items-center">
                                <Document
                                    file={preview.url}
                                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                    className="w-full"
                                >
                                    <Page pageNumber={pageNumber} width={300} />
                                </Document>

                                {numPages > 1 && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                                            className="px-2 py-1 bg-purple-600 text-white rounded disabled:bg-gray-400"
                                            disabled={pageNumber <= 1}
                                        >
                                            ◀
                                        </button>
                                        <span className="text-sm">
                                            Page {pageNumber} of {numPages}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                                            className="px-2 py-1 bg-purple-600 text-white rounded disabled:bg-gray-400"
                                            disabled={pageNumber >= numPages}
                                        >
                                            ▶
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {preview.type === 'docx' && (
                            <div className="text-center text-gray-600">
                                <p>Preview not available for DOCX files</p>
                                <p className="text-sm mt-1">Selected: {preview.name}</p>
                            </div>
                        )}
                    </div>
                )}
                {/* Upload Progeress */}
                {loading && (
                    <div className="w-full mt-2 mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                            className="bg-purple-600 h-2.5 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-center mt-1 text-gray-600">
                            {uploadProgress < 100 ? `Uploading: ${uploadProgress}%` : 'Processing...'}
                        </p>
                    </div>
                )}
                <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-3 w-full rounded hover:bg-purple-700 transition-colors"
                disabled={loading || !file}
                >
                {loading ? "Uploading..." : "Upload and Start Chat"}
                </button>
            </form>
            {/* Separator */}
            <div className="flex items-center w-full my-4">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-400 font-semibold">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>
            {/* Existing Files */}
            {existingFiles.length > 0 && (
                <div className="w-full flex flex-col items-center">
                <label className="font-semibold text-gray-700 mb-2 w-full text-left">
                    Select an existing file
                </label>
                <div className="flex w-full gap-2">
                    <select
                    className="border rounded px-3 py-2 flex-1"
                    value={selectedFileId || ""}
                    onChange={e => setSelectedFileId(e.target.value)}
                    >
                    <option value="">-- Select file --</option>
                    {existingFiles.map(file => (
                        <option key={file.id} value={file.id}>
                        {file.filename}
                        </option>
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
    </>
    )
}