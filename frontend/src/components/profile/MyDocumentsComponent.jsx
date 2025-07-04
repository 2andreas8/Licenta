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

    const [currentPage, setCurrentPage] = useState(1);
    const [docsPerPage] = useState(4);

    const [searchTerm, setSearchTerm] = useState("");

    const [sortBy, setSortBy] = useState("date"); // Default sort by date
    const [sortOrder, setSortOrder] = useState("asc");

    const filteredDocs = docs.filter(doc =>
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastDoc = currentPage * docsPerPage;
    const indexOfFirstDoc = indexOfLastDoc - docsPerPage;
    const currentDocs = filteredDocs.slice(indexOfFirstDoc, indexOfLastDoc);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
                <>
                    <div className="mb-4 relative flex items-center bg-slate-900 rounded-md border border-slate-700">
                        {/* Search icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 ml-3 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>

                        {/* Input field */}
                        <input
                            type="text"
                            placeholder="search box clear filter"
                            className="w-full bg-transparent border-0 outline-none px-3 py-2 text-white placeholder-gray-400 focus:ring-0"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />

                        {/* Clear button */}
                        {searchTerm && (
                            <button
                                className="px-3 py-2 text-gray-400 hover:text-white"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCurrentPage(1);
                                }}
                                title="Clear search"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Document list */}
                    <div className="max-h-[320px] overflow-y-auto mb-4">
                        <ul className="space-y-3">
                            {currentDocs.map(doc => (
                                <li key={doc.id} className="...">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        {/* Icon based on file type */}
                                        <span className="text-purple-300 flex-shrink-0">
                                            {doc.filename.endsWith('.pdf') ? (
                                                <span className="flex items-center">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"></path>
                                                        <path d="M3 8a2 2 0 012-2h2.5v10H5a2 2 0 01-2-2V8z"></path>
                                                    </svg>
                                                    <span className="text-xs bg-red-900/60 rounded-sm px-1 ml-1">PDF</span>
                                                </span>
                                            ) : doc.filename.endsWith('.txt') ? (
                                                <span className="flex items-center">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                                                    </svg>
                                                    <span className="text-xs bg-blue-900/60 rounded-sm px-1 ml-1">TXT</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path>
                                                    </svg>
                                                    <span className="text-xs bg-gray-900/60 rounded-sm px-1 ml-1">DOC</span>
                                                </span>
                                            )}
                                        </span>

                                        <span className="truncate text-gray-200">{doc.filename}</span>
                                    </div>

                                    <div className="flex space-x-1 flex-shrink-0">
                                        <SummaryButton
                                            documentId={doc.id}
                                            className="p-1 text-purple-300 hover:text-purple-100 transition"
                                        />
                                        <button
                                            onClick={() => setDocumentToDelete(doc)}
                                            className="p-1 text-red-400 hover:text-red-300 transition"
                                            title="Delete document"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Page control */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                        <span className="text-sm text-gray-400">
                            Showing {indexOfFirstDoc + 1}-{Math.min(indexOfLastDoc, filteredDocs.length)} of {filteredDocs.length}
                        </span>
                        <div className="flex items-center space-x-1">
                            {/* Previous button */}
                            <button
                                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`p-1 rounded ${currentPage === 1
                                        ? 'text-gray-500'
                                        : 'text-gray-300 hover:bg-slate-600'
                                    }`}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {/* Page number */}
                            <span className="px-3 py-1 bg-purple-600 text-white rounded text-xs">
                                {currentPage}
                            </span>

                            {/* Next button */}
                            <button
                                onClick={() => currentPage < Math.ceil(filteredDocs.length / docsPerPage) && paginate(currentPage + 1)}
                                disabled={currentPage >= Math.ceil(filteredDocs.length / docsPerPage)}
                                className={`p-1 rounded ${currentPage >= Math.ceil(filteredDocs.length / docsPerPage)
                                        ? 'text-gray-500'
                                        : 'text-gray-300 hover:bg-slate-600'
                                    }`}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Confirmation Modal */}
            {docToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4 border border-purple-800/30 shadow-2xl">
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