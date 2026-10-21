/**
 * Serial Service - Real Web Serial API Implementation (Phase 2)
 * 
 * Communicates with STM32F103C8T6 Blue Pill via CP2102 USB-to-TTL module.
 * Protocol: Send 'A' for Awake (green LED on), 'S' for Sleep (red LED + buzzer on).
 * Baud rate: 9600, 8 data bits, no parity, 1 stop bit.
 */

export class SerialService {
    constructor() {
        this._port = null;
        this._writer = null;
        this._encoder = new TextEncoder();
        this._connected = false;
        this._statusChangeCallback = null;
        this._writeQueue = Promise.resolve();
        this._currentState = 'A'; // Track current state to send on connect
        this._isWebSerialAvailable = 'serial' in navigator;
    }

    /**
     * Check if Web Serial API is available
     * @returns {boolean}
     */
    isAvailable() {
        return this._isWebSerialAvailable;
    }

    /**
     * Connect to a serial device
     * Must be called from user gesture (click event)
     * @param {string} initialState - Initial state character ('A' or 'S')
     * @returns {Promise<void>}
     */
    async connect(initialState = 'A') {
        if (!this._isWebSerialAvailable) {
            throw new Error('Web Serial API not available. Please use Chrome or Edge on desktop.');
        }

        if (this._connected) {
            console.warn('[SERIAL] Already connected');
            return;
        }

        try {
            console.log('[SERIAL] Requesting port...');
            this._notifyStatusChange('connecting');

            // Request port from user
            this._port = await navigator.serial.requestPort();

            // Open port with STM32 configuration
            await this._port.open({
                baudRate: 9600,
                dataBits: 8,
                parity: 'none',
                stopBits: 1
            });

            // Get writer
            this._writer = this._port.writable.getWriter();
            this._connected = true;
            this._currentState = initialState;

            console.log('[SERIAL] Port opened successfully');

            // Send current state immediately
            await this.send(initialState);

            this._notifyStatusChange('connected');

            // Listen for disconnect events
            this._port.addEventListener('disconnect', () => {
                this._handleDisconnect();
            });

        } catch (error) {
            console.error('[SERIAL] Connection failed:', error);
            this._connected = false;
            this._port = null;
            this._writer = null;
            this._notifyStatusChange('error');
            throw error;
        }
    }

    /**
     * Disconnect from serial device
     * Sends 'A' before disconnecting to return to safe state
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (!this._connected || !this._port) {
            console.warn('[SERIAL] Not connected');
            return;
        }

        try {
            console.log('[SERIAL] Disconnecting...');

            // Send 'A' to return to safe state
            await this.send('A');

            // Release writer
            if (this._writer) {
                await this._writer.close();
                this._writer = null;
            }

            // Close port
            await this._port.close();
            this._port = null;
            this._connected = false;

            this._notifyStatusChange('disconnected');
            console.log('[SERIAL] Disconnected');

        } catch (error) {
            console.error('[SERIAL] Disconnect error:', error);
            // Force cleanup even on error
            this._port = null;
            this._writer = null;
            this._connected = false;
            this._notifyStatusChange('error');
        }
    }

    /**
     * Send a character to the serial device
     * Queues writes to prevent overlapping
     * @param {string} char - Single character to send ('A' for awake, 'S' for sleep)
     * @returns {Promise<void>}
     */
    async send(char) {
        if (!this._connected || !this._writer) {
            console.warn('[SERIAL] Cannot send - not connected');
            return;
        }

        // Update current state
        this._currentState = char;

        // Queue the write to prevent overlapping
        this._writeQueue = this._writeQueue.then(async () => {
            try {
                const data = this._encoder.encode(char);
                await this._writer.write(data);
                console.log(`[SERIAL] TX '${char}' -> device`);
            } catch (error) {
                console.error('[SERIAL] Send error:', error);
                // Don't throw - let detection continue
            }
        });

        return this._writeQueue;
    }

    /**
     * Check if currently connected
     * @returns {boolean}
     */
    isConnected() {
        return this._connected;
    }

    /**
     * Get current state character
     * @returns {string}
     */
    getCurrentState() {
        return this._currentState;
    }

    /**
     * Register a callback for status changes
     * @param {function} callback - Function to call with status string
     */
    onStatusChange(callback) {
        this._statusChangeCallback = callback;
    }

    /**
     * Internal method to notify status change
     * @param {string} status - Status string ('connecting', 'connected', 'disconnected', 'error')
     * @private
     */
    _notifyStatusChange(status) {
        if (this._statusChangeCallback) {
            this._statusChangeCallback(status);
        }
    }

    /**
     * Handle unexpected disconnect
     * @private
     */
    _handleDisconnect() {
        console.log('[SERIAL] Device disconnected unexpectedly');
        this._connected = false;
        this._port = null;
        this._writer = null;
        this._notifyStatusChange('disconnected');
    }
}

// Export singleton instance
export const serialService = new SerialService();
