/**
 * State Machine - Driver Drowsiness Detection
 * 
 * Manages AWAKE and SLEEP states with hysteresis to prevent
 * false triggers from normal blinks.
 * 
 * States:
 * - AWAKE: Initial state, driver is alert
 * - SLEEP: Driver may be drowsy (eyes closed continuously for threshold time)
 */

export const STATE = {
    AWAKE: 'AWAKE',
    SLEEP: 'SLEEP'
};

export class StateMachine {
    constructor(serialService) {
        this._currentState = STATE.AWAKE;
        this._serialService = serialService;
        this._stateChangeCallback = null;
        
        // Timing configuration
        this._closeHoldSeconds = 3.0;
        this._recoverHoldSeconds = 3.0;
        this._gracePeriodMs = 150; // Grace period for blinks
        
        // Timers
        this._closedTimer = 0; // Time eyes have been closed continuously
        this._openTimer = 0;   // Time eyes have been open continuously
        this._lastUpdateTime = 0;
        
        // Face detection flag
        this._faceDetected = true;
        this._freezeTimersOnNoFace = true;
    }

    /**
     * Configure timing thresholds
     * @param {Object} config - Configuration object
     */
    configure(config) {
        if (config.closeHoldSeconds !== undefined) {
            this._closeHoldSeconds = config.closeHoldSeconds;
        }
        if (config.recoverHoldSeconds !== undefined) {
            this._recoverHoldSeconds = config.recoverHoldSeconds;
        }
        if (config.freezeTimersOnNoFace !== undefined) {
            this._freezeTimersOnNoFace = config.freezeTimersOnNoFace;
        }
    }

    /**
     * Register callback for state changes
     * @param {function} callback - Function to call with new state
     */
    onStateChange(callback) {
        this._stateChangeCallback = callback;
    }

    /**
     * Get current state
     * @returns {string}
     */
    getCurrentState() {
        return this._currentState;
    }

    /**
     * Set face detection status
     * @param {boolean} detected - Whether a face is detected
     */
    setFaceDetected(detected) {
        this._faceDetected = detected;
    }

    /**
     * Update state machine with current eye status
     * @param {boolean} eyesClosed - Whether eyes are currently closed
     * @param {number} timestamp - Current timestamp from performance.now()
     */
    update(eyesClosed, timestamp) {
        // Calculate delta time
        if (this._lastUpdateTime === 0) {
            this._lastUpdateTime = timestamp;
            return;
        }
        
        const deltaTime = timestamp - this._lastUpdateTime;
        this._lastUpdateTime = timestamp;

        // If no face detected and freeze is enabled, don't update timers
        if (!this._faceDetected && this._freezeTimersOnNoFace) {
            return;
        }

        // Update timers based on eye state
        if (eyesClosed) {
            // Eyes are closed
            this._closedTimer += deltaTime;
            this._openTimer = 0; // Reset open timer
        } else {
            // Eyes are open
            this._openTimer += deltaTime;
            // Only reset closed timer if beyond grace period
            // This allows brief blinks without resetting the closed timer
            if (this._openTimer > this._gracePeriodMs) {
                this._closedTimer = 0;
            }
        }

        // State transitions
        this._checkTransitions();
    }

    /**
     * Check and execute state transitions
     * @private
     */
    _checkTransitions() {
        const closedSeconds = this._closedTimer / 1000;
        const openSeconds = this._openTimer / 1000;

        switch (this._currentState) {
            case STATE.AWAKE:
                // Transition to SLEEP if eyes closed for threshold time
                if (closedSeconds >= this._closeHoldSeconds) {
                    this._transitionTo(STATE.SLEEP);
                }
                break;

            case STATE.SLEEP:
                // Transition to AWAKE if eyes open for threshold time
                if (openSeconds >= this._recoverHoldSeconds) {
                    this._transitionTo(STATE.AWAKE);
                }
                break;
        }
    }

    /**
     * Transition to a new state
     * @param {string} newState - The state to transition to
     * @private
     */
    _transitionTo(newState) {
        if (this._currentState === newState) {
            return;
        }

        console.log(`[STATE MACHINE] ${this._currentState} -> ${newState}`);
        
        this._currentState = newState;
        
        // Send to serial service
        const char = newState === STATE.AWAKE ? 'A' : 'S';
        this._serialService.send(char);

        // Notify callback
        if (this._stateChangeCallback) {
            this._stateChangeCallback(newState);
        }
    }

    /**
     * Get current timer values (for UI display)
     * @returns {Object} Object with closedTimer and openTimer in seconds
     */
    getTimers() {
        return {
            closedTimer: this._closedTimer / 1000,
            openTimer: this._openTimer / 1000,
            closedThreshold: this._closeHoldSeconds,
            openThreshold: this._recoverHoldSeconds
        };
    }

    /**
     * Reset timers (useful for calibration or manual state changes)
     */
    resetTimers() {
        this._closedTimer = 0;
        this._openTimer = 0;
    }

    /**
     * Manually force a state transition (for testing)
     * @param {string} state - The state to force
     */
    forceState(state) {
        this._transitionTo(state);
        this.resetTimers();
    }
}
