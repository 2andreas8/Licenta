import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConversations } from '../../services/conversationsService';
import { toast } from 'react-toastify';
import { deleteConversation, updateConversationTitle } from '../../services/conversationsService';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import EventBus from '../../services/EventBus';
import { EVENTS } from '../../services/events';
import { FixedSizeList as List } from 'react-window';

export default function SidebarComponent({ isOpen, onClose, setDocs }) {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [conversationToRename, setConversationToRename] = useState(null);
    const [newTitle, setNewTitle] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredConversations, setFilteredConversations] = useState([]);

    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }

        const unsubscribeDocDeleted = EventBus.subscribe(EVENTS.DOCUMENT_DELETED, () => {
            if (isOpen) {
                loadConversations();
            }
        });

        const unsubscribeConvDeleted = EventBus.subscribe(EVENTS.CONVERSATION_DELETED, () => {
            if (isOpen) {
                loadConversations();
            }
        });

        return () => {
            unsubscribeDocDeleted();
            unsubscribeConvDeleted();
        };
    }, [isOpen]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredConversations(conversations);
        } else {
            const lowercasedTerm = searchTerm.toLowerCase();
            const filtered = conversations.filter(conv =>
                (conv.title || "Untitled Conversation")
                    .toLowerCase()
                    .includes(lowercasedTerm)
            );
            setFilteredConversations(filtered);
        }
    }, [searchTerm, conversations]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const response = await fetchConversations();
            const sortedConversations = response.sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            });
            setConversations(sortedConversations);
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

    const handleNavigateToStats = () => {
        navigate("/statistics");
        onClose();
    }

    const confirmDelete = async () => {
        try {
            await deleteConversation(conversationToDelete);

            EventBus.publish(EVENTS.CONVERSATION_DELETED, {
                conversationId: conversationToDelete
            });
            EventBus.publish(EVENTS.DATA_REFRESH_NEEDED, {
                conversationId: conversationToDelete
            });
            toast.success("Conversation deleted successfully");
            loadConversations();
            setShowDeleteModal(false);
            onClose();
        } catch (error) {
            console.error("Failed to delete conversation: ", error);
            toast.error("Failed to delete conversation. Please try again later.");
        }
    };

    const handleRenameConversation = (e, conversation) => {
        e.stopPropagation();
        setConversationToRename(conversation);
        setNewTitle(conversation.title || "Untitled Conversation");
        setShowRenameModal(true);
    };

    const confirmRename = async () => {
        try {
            await updateConversationTitle(conversationToRename.id, newTitle);

            EventBus.publish(EVENTS.TITLE_UPDATED, {
                conversationId: conversationToRename.id,
                newTitle: newTitle
            });
            toast.success("Conversation renamed successfully");
            loadConversations();
            setShowRenameModal(false);
        } catch (error) {
            console.error("Failed to rename conversation: ", error);
            toast.error("Failed to rename conversation. Please try again later.");
        }
    };

    return (
        <>
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-neutral-800 shadow-lg border-r border-gray-200 dark:border-neutral-700 z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold dark:text-white flex items-center">
                        Menu
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-black p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="p-4 space-y-3 flex-shrink-0">
                    <button
                        className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                        onClick={handleNavigate}
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Chat
                    </button>

                    <div className="space-y-1.5">
                        <button
                            className="w-full flex items-center px-4 py-2 text-left rounded-md text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            onClick={handleDashboardNavigate}
                        >
                            <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                            </svg>
                            Dashboard
                        </button>

                        <button
                            className="w-full flex items-center px-4 py-2 text-left rounded-md text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            onClick={() => { setDocs(true); }}
                        >
                            <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A1 1 0 0110.195 4h3.61A1 1 0 0115 5.195v13.61A1 1 0 0113.805 20H6.195A1 1 0 015 18.805V10a1 1 0 01.293-.707l4-4z" />
                            </svg>
                            My Documents
                        </button>

                        <button
                            className="w-full flex items-center px-4 py-2 text-left rounded-md text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            onClick={handleNavigateToStats}
                        >
                            <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                            Statistics
                        </button>
                    </div>
                </nav>

                {/* Conversation list */}
                <div className='flex-1 overflow-y-auto'>
                    <div className='px-4 py-2'>
                        <h3 className='text-sm font-semibold text-purple-200 mb-2'>Recent Conversations</h3>
                        <div className="mb-3 relative flex items-center bg-purple-800/30 rounded-md border border-purple-500/30">
                            {/* Search icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 ml-3 text-purple-300"
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
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full bg-transparent border-0 outline-none px-2 py-2 text-white placeholder-purple-300 text-sm focus:outline-none focus:ring-0"
                            />

                            {/* Clear button */}
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="px-3 py-2 text-purple-300 hover:text-white"
                                    title="Clear search"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
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
                        {loading ? (
                            <div className='text-white text-sm'>Loading...</div>
                        ) : filteredConversations.length > 0 ? (
                            <div className='h-[calc(100vh-280px)]'>
                                <List
                                    height={Math.min(500, window.innerHeight - 280)}
                                    width="100%"
                                    itemCount={filteredConversations.length}
                                    itemSize={45} 
                                    className="custom-scrollbar"
                                >
                                    {({ index, style }) => {
                                        const conv = filteredConversations[index];
                                        return (
                                            <div style={style} key={conv.id} className='flex items-center group hover:bg-purple-700/59 rounded'>
                                                <button
                                                    onClick={() => {
                                                        navigate(`/chat/${conv.id}`);
                                                        onClose();
                                                    }}
                                                    className='w-full px-4 py-2 text-left hover:bg-purple-700/50 text-purple-100 text-sm truncate rounded'
                                                >
                                                    <span className="truncate flex-1">{conv.title || "Untitled Conversation"}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => handleRenameConversation(e, conv)}
                                                    className='px-2 py-2 text-purple-300 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity'
                                                >
                                                    <PencilIcon className='h-4 w-4' aria-hidden="true" />
                                                    <span className='sr-only'>Rename Conversation</span>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                                                    className='px-2 py-2 text-purple-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity'
                                                >
                                                    <TrashIcon className='h-4 w-4' aria-hidden="true" />
                                                    <span className='sr-only'>Delete Conversation</span>
                                                </button>
                                            </div>
                                        );
                                    }}
                                </List>
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
            {/* Rename Modal */}
            {showRenameModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4 dark:text-white">
                            Rename Conversation
                        </h3>
                        <div className='mb-4'>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="conversationTitle">
                                New Title:
                            </label>
                            <input
                                type="text"
                                id="conversationTitle"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full px-3 py-2 border dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowRenameModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRename}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                disabled={!newTitle.trim()}
                            >
                                Rename
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}