import React, { useState } from 'react';

export default  function SidebarComponent({ isOpen, onClose }) {
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
                <nav className="p-4">
                    <button className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2 px-4 rounded">
                        New chat
                    </button>
                </nav>
            </aside>
        </>
    )
}