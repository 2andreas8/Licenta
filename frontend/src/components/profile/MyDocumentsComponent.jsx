import { useState, useEffect } from "react";
import { fetchUserDocuments, deleteDocument } from "../../services/documentService";
import { toast } from "react-toastify";
import { TrashIcon } from '@heroicons/react/24/outline';

export default function MyDocumentsComponent({ onClose, onDocumentDeleted }) {
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

    const handleDeleteDocument = async (docId) => {
        try {
            await deleteDocument(docId);
            const updateDocs = await fetchUserDocuments();
            setDocs(updateDocs);

            if (onDocumentDeleted) {
                onDocumentDeleted(docId);
            }
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
                            className="flex items-center justify-between px-2 py-2 rounded hover:bg-slate-700 transition group"
                        >
                            <span className="truncate">{doc.filename}</span>
                            {/* Delete */}
                            <button
                                onClick={(e) => setDocumentToDelete(doc)}
                                className='px-2 py-2 text-purple-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity'
                            >
                                <TrashIcon className='h-4 w-4' aria-hidden="true" />
                                <span className='sr-only'>Delete Document</span>
                            </button>
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