import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConversations } from '../../services/conversationsService';
import { toast } from 'react-toastify';
import { deleteConversation } from '../../services/conversationsService';
import { TrashIcon } from '@heroicons/react/24/outline';

export default  function SidebarComponent({ isOpen, onClose, setDocs }) {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
    }, [isOpen]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const response = await fetchConversations();
            setConversations(response);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
            toast.error("Failed to load conversations. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = () => {
        navigate("/chat/new");
        onClose();
    }

    const handleDashboardNavigate = () => {
        navigate("/dashboard");
        onClose();
    }

    const handleDeleteConversation = async (e, conversationId) => {
        e.stopPropagation(); // prevent the click event from propagating to the button
        setConversationToDelete(conversationId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteConversation(conversationToDelete);
            toast.success("Conversation deleted successfully");
            loadConversations();
            setShowDeleteModal(false);
            navigate("/dashboard");
            onClose();
        } catch (error) {
            console.error("Failed to delete conversation: ", error);
            toast.error("Failed to delete conversation. Please try again later.");
        }
    };

    return (
        <>
        <aside 
            className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-neutral-800 shadow-lg border-r border-gray-200 dark:border-neutral-700 z-50 transform transition-transform duration-300 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold dark:text-white">Menu</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-black"
                    >
                        &times;
                    </button>
                </div>
                <nav className="p-4 flex flex-col space-y-3">
                    <button 
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2 px-4 rounded"
                    onClick={() => {
                        setDocs(true);
                    }}    
                    >
                        📄 My Documents
                    </button>
                    <button 
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2 px-4 rounded"
                    onClick={handleNavigate}    
                    >
                        + New chat
                    </button>
                    <button 
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2 px-4 rounded"
                    onClick={handleDashboardNavigate}    
                    >
                        Dashboard
                    </button>
                </nav>

                {/* Conversation list */}
                <div className='flex-1 overflow-y-auto'>
                    <div className='px-4 py-2'>
                        <h3 className='text-sm font-semibold text-purple-200 mb-2'>Recent Conversations</h3>
                        {loading ? (
                            <div className='text-white text-sm'>Loading...</div>
                        ) : conversations.length > 0 ? (
                            <div className='space-y-1'>
                            {conversations.map((conv) => (
                                <div 
                                    className='flex items-center group hover:bg-purple-700/59 rounded'
                                    key={conv.id}
                                >
                                    <button
                                        key={conv.id}
                                        onClick={() => {
                                            navigate(`/chat/${conv.id}`);
                                            onClose();
                                        }}
                                        className='w-full px-4 py-2 text-left hover:bg-purple-700/50 text-purple-100 text-sm truncate rounded' 
                                    >
                                        {conv.title || "Untitled Conversation"}
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                                        className='px-2 py-2 text-purple-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity'
                                    >
                                        <TrashIcon className='h-4 w-4' aria-hidden="true" />
                                        <span className='sr-only'>Delete Conversation</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        ) : (
                            <div className='text-purple-200 text-sm'>No conversations found.</div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4 dark:text-white">
                            Delete Conversation
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete this conversation? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}