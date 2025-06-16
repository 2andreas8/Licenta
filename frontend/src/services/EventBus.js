/* communication service for frontend components */

class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event.
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to be called when the event is triggered
     * @returns {Function} Unsubscribe function
     */
    
    subscribe(event, callback) {
        if(!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => {
            const arr = this.listeners.get(event).filter(cb => cb !== callback);
            this.listeners.set(event, arr);
        };
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event - Event name
     * @param {Function} [callback] - Optional callback to remove. If not provided, removes all listeners.
     */
    unsubscribe(event, callback = null) {
        if (!this.listeners.has(event)) {
            return;
        }
        
        if (callback === null) {
            // Remove all listeners for this event
            this.listeners.delete(event);
        } else {
            // Remove specific callback
            const filteredCallbacks = this.listeners.get(event).filter(cb => cb !== callback);
            this.listeners.set(event, filteredCallbacks);
        }
    }

    publish(event, data) {
        (this.listeners.get(event) || []).slice().forEach(cb => cb(data));
    }
    
    once(event, callback) {
        const off = this.subscribe(event, data => {
            off();
            callback(data);
        });
        return off;
    }
}

export default new EventBus();