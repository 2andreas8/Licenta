import { useState, useEffect } from "react";
import { fetchUserDocuments, deleteDocument } from "../../services/documentService";
import { toast } from "react-toastify";
import { TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import EventBus from "../../services/EventBus";
import { EVENTS } from "../../services/events";
import SummaryButton from "../summary/SummaryButton";

export default function MyDocumentsComponent({ onClose }) {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [docToDelete, setDocumentToDelete] = useState(null);

    useEffect(() => {
        fetchUserDocuments()
            .then(setDocs)
            .catch(err => {
                console.error("Error loading documents: ", err);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSummarize = (docId) => {
        EventBus.publish(EVENTS.SUMMARY_REQUEST, { documentId: docId });
    };

    const handleDeleteDocument = async (docId) => {
        try {
            await deleteDocument(docId);
            const updateDocs = await fetchUserDocuments();
            setDocs(updateDocs);

            EventBus.publish(EVENTS.DOCUMENT_DELETED, {
                documentId: docId
            });

            EventBus.publish(EVENTS.DATA_REFRESH_NEEDED, {
                documentId: docId
            });

            toast.success("Document deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete document: " + (error.response?.data?.detail || error.message));
        }
        setDocumentToDelete(null);
    }

    return (
        <div className="relative p-8 bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-auto border-b border-gray-600 text-white">
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold transition"
                aria-label="Close"
            >
                &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-purple-400">📄</span> My Documents
            </h2>
            <hr className="border-slate-600 mb-6" />
            {loading ? (
                <div className="text-center text-purple-300 py-8">Loading...</div>
            ) : docs.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No documents uploaded yet.</div>
            ) : (
                <ul className="space-y-3">
                    {docs.map(doc => (
                        <li
                            key={doc.id}
                            className="flex items-center justify-between px-4 py-3 rounded hover:bg-slate-700/60 transition group border border-transparent hover:border-slate-600/50"
                        >
                            {/* Document Name */}
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <span className="text-purple-300 flex-shrink-0">
                                    {doc.filename.endsWith('.pdf') ?
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"></path><path d="M3 8a2 2 0 012-2h2.5v10H5a2 2 0 01-2-2V8z"></path></svg> :
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                                    }
                                </span>
                                <span className="truncate text-gray-200">{doc.filename}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 ml-2">
                                <SummaryButton
                                    documentId={doc.id}
                                    className="p-1.5 rounded hover:bg-white-900/50 text-purple-300 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-all ease-in-out duration-200 flex items-center gap-1"
                                >
                                    <SparklesIcon className="h-4 w-4" />
                                    <span className="text-sm">Summarize</span>
                                </SummaryButton>

                                <button
                                    onClick={() => setDocumentToDelete(doc)}
                                    className="p-1.5 rounded hover:bg-red-900/40 text-purple-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ease-in-out duration-200"
                                    title="Delete Document"
                                >
                                    <TrashIcon className='h-4 w-4' />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Confirmation Modal */}
            {docToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4 dark:text-white">
                            Delete Document
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete "{docToDelete.filename}"?
                            This will also delete all conversations related to this document.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDocumentToDelete(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteDocument(docToDelete.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}