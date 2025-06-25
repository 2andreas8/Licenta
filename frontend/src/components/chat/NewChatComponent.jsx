import { useEffect, useState, useRef } from "react";
import { uploadDocument, checkDocumentStatus } from "../../services/documentService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();
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
            setLoading(true);

            const conversation = await createConversation(documentId, filename);

            if (!conversation || !conversation.id) {
                throw new Error("Invalid conversation response");
            }
            setCurrentConversation(conversation);
            setUploadedFile({ id: documentId, filename: filename });

            toast.success("Conversation created successfully!");

            setTimeout(() => {
                navigate(`/chat/${conversation.id}`);
            }, 100);

            return conversation;
        } catch (error) {
            console.error("Error creating conversation:", error);
            toast.error("Failed to start a new conversation. Please try again later.");
        } finally {
            setLoading(false);
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
            reader.onload = (e) => setPreview({
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a file first!");
            return;
        }

        setLoading(true);
        setUploadProgress(0);
        let documentId = null;

        try {
            const uploadProgressHandler = (progress) => {
                setUploadProgress(Math.min(progress, 90));
            };

            const result = await uploadDocument(file, uploadProgressHandler);
            documentId = result.id;

            let processingComplete = false;
            let attemps = 0;
            const maxAttempts = 30;

            const checkStatus = async () => {
                if (processingComplete || attemps >= maxAttempts) return;

                attemps++;
                try {
                    const statusResult = await checkDocumentStatus(documentId);

                    if (statusResult.processingComplete) {
                        processingComplete = true;
                        setUploadProgress(100);

                        await new Promise(resolve => setTimeout(resolve, 1000));

                        await startNewConversation(documentId, result.filename);
                        setUploadedFile(result);
                        toast.success("File uploaded and processed successfully!");
                    } else {
                        const processingProgress = 90 + Math.min(9, attemps);
                        setUploadProgress(processingProgress);
                        setTimeout(checkStatus, 1000);
                    }
                } catch (error) {
                    console.error("Error checking document status:", error);
                    toast.error("Error checking document processing status");
                    setUploadProgress(90);
                }
            };

            checkStatus();

            if (preview && preview.type === "pdf" && preview.url) {
                URL.revokeObjectURL(preview.url);
            }
            setPreview(null);
        } catch (error) {
            console.error("Upload error:", error);
            setLoading(false);
            toast.error(error?.response?.data?.detail || error.message || "Upload failed. Please try again.");
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: "user", content: input }]);
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

            const assistantMessage = { role: "assistant", content: res.answer };
            await addMessageToConversation(
                currentConversation.id,
                assistantMessage.content,
                assistantMessage.role
            );
            setMessages(prev => [...prev, { role: "assistant", content: res.answer }]);
            setWaitingForAnswer(false);
        } catch (error) {
            console.error("Error asking question:", error);
        } finally {
            setWaitingForAnswer(false);
        }
    };

    const onFileSelect = async () => {
        console.log("Selected file ID:", selectedFileId);
        console.log("Existing files:", existingFiles);
        if (!selectedFileId) return;
        const selected = existingFiles.find(file => String(file.id) === String(selectedFileId));
        if (selected) {
            try {
                setLoading(true);

                const conversation = await startNewConversation(selected.id, selected.filename);
                if (!conversation || !conversation.id) {
                    throw new Error("Invalid conversation response");
                }

                setCurrentConversation(conversation);
                setUploadedFile(selected);
                setShowOverlay(false);

                setTimeout(() => {
                    navigate(`/chat/${conversation.id}`);
                }, 100);
            } catch (error) {
                console.error("Error starting conversation with selected file:", error);
                toast.error("Failed to start conversation with selected file. Please try again.");
            } finally {
                setLoading(false);
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
                                                <ReactMarkdown components={markdownComponents}>
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
                                    <div className="px-5 py-3 rounded-xl max-w-xl bg-purple-600 text-white animate-pulse">
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
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40">
                    <div className="relative bg-slate-900 rounded-xl shadow-2xl p-8 w-full max-w-md border border-slate-700/50 text-white">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Start a new chat</h2>
                            <button
                                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800/80 transition-colors"
                                onClick={onClose}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* Upload Form with Preview */}
                        <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-4 mb-6">
                            <label className="font-medium text-slate-200 mb-1 w-full text-left">
                                Upload a new file
                            </label>

                            {/* File Drop Zone */}
                            <div className="w-full mb-2">
                                <label
                                    className="block w-full px-4 py-8 text-center border-2 border-dashed rounded-lg border-purple-500/40 hover:border-purple-400 cursor-pointer bg-slate-800/50 hover:bg-slate-800/80 transition-colors"
                                >
                                    <div className="flex flex-col items-center">
                                        <svg className="w-10 h-5 text-purple-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="text-purple-300 font-medium">Choose a file</span>
                                        <span className="text-slate-400 text-sm mt-1">.pdf, .docx, .txt</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {file && (
                                        <p className="mt-3 text-sm text-purple-200 bg-purple-900/30 py-1.5 px-3 rounded-lg inline-block">
                                            Selected: {file.name}
                                        </p>
                                    )}
                                </label>
                            </div>
                            {/* Document Preview */}
                            {preview && (
                                <div className="my-4 w-full border rounded-lg p-4 bg-slate-800/80 border-slate-700 max-h-64 overflow-auto custom-scrollbar">
                                    <h3 className="text-md font-semibold mb-2 text-purple-200">Preview:</h3>
                                    {preview.type === "text" && (
                                        <div className="whitespace-pre-wrap text-sm font-mono text-slate-300 bg-slate-800 p-3 rounded">
                                            {preview.content.slice(0, 500)}
                                            {preview.content.length > 500 && "..."}
                                        </div>
                                    )}
                                    {preview.type === 'pdf' && (
                                        <div className="text-center text-slate-400 bg-slate-800 p-3 rounded">
                                            <svg className="w-12 h-5 mx-auto mb-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p>Preview not available for PDF files</p>
                                        </div>
                                    )}
                                    {/*{preview.type === "pdf" && (
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
                                        </div>*/}
                                    {preview.type === 'docx' && (
                                        <div className="text-center text-slate-400 bg-slate-800 p-3 rounded">
                                            <svg className="w-12 h-5 mx-auto mb-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p>Preview not available for DOCX files</p>
                                            <p className="text-sm mt-1 text-purple-200">Selected: {preview.name}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Upload Progeress */}
                            {loading && (
                                <div className="w-full mt-2 mb-4">
                                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-purple-700 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-center mt-1.5 text-slate-300">
                                        {uploadProgress < 90
                                            ? `Uploading: ${uploadProgress}%`
                                            : uploadProgress < 100
                                                ? 'Processing document...'
                                                : 'Upload complete!'}
                                    </p>
                                </div>
                            )}
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 w-full rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors shadow-md font-medium"
                                disabled={loading || !file}
                            >
                                {loading ? "Uploading..." : "Upload and Start Chat"}
                            </button>
                        </form>
                        {/* Separator */}
                        <div className="flex items-center w-full my-6">
                            <div className="flex-grow border-t border-slate-700/70"></div>
                            <span className="mx-4 text-slate-400 font-medium text-sm">or</span>
                            <div className="flex-grow border-t border-slate-700/70"></div>
                        </div>
                        {/* Existing Files */}
                        {existingFiles.length > 0 && (
                            <div className="w-full flex flex-col">
                                <label className="font-medium text-slate-200 mb-2 w-full text-left">
                                    Select an existing file
                                </label>
                                <div className="flex w-full gap-2">
                                    <select
                                        className="border rounded-md px-3 py-2.5 flex-1 bg-slate-800 border-slate-600 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        value={selectedFileId || ""}
                                        onChange={e => setSelectedFileId(e.target.value)}
                                    >
                                        <option value="" className="text-slate-400">-- Select file --</option>
                                        {existingFiles.map(file => (
                                            <option key={file.id} value={file.id} className="text-white">
                                                {file.filename}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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