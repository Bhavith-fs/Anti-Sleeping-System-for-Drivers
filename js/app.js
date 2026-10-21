/**
 * Main Application Entry Point
 * 
 * Coordinates all components: UI, Detector, State Machine, and Serial Service
 */

import { Detector } from './detector.js';
import { StateMachine, STATE } from './stateMachine.js';
import { serialService } from './serialService.js';
import { UIManager } from './ui.js';

class App {
    constructor() {
        this._ui = new UIManager();
        this._detector = new Detector();
        this._stateMachine = new StateMachine(serialService);
        
        this._isRunning = false;
        this._animationId = null;
        
        // Settings
        this._threshold = 50;
        this._closeHoldSeconds = 3.0;
        this._recoverHoldSeconds = 3.0;
        this._beepEnabled = false;
        
        // Calibration
        this._calibrationStartTime = 0;
        this._calibrationDuration = 3000;
        
        // Browser beep
        this._beepInterval = null;
        this._audioContext = null;
        
        // Load settings from localStorage
        this._loadSettings();
        
        this._setupCallbacks();
        this._initialize();
    }

    /**
     * Setup callbacks between components
     * @private
     */
    _setupCallbacks() {
        // UI callbacks
        this._ui.onStartCamera(() => this.startCamera());
        this._ui.onStopCamera(() => this.stopCamera());
        this._ui.onCalibrate(() => this.startCalibration());
        this._ui.onApplySettings(() => this.applySettings());
        this._ui.onSimulateAwake(() => this.simulateAwake());
        this._ui.onSimulateSleep(() => this.simulateSleep());
        this._ui.onConnectDevice(() => this.toggleDeviceConnection());
        this._ui.onSendA(() => this.sendManualByte('A'));
        this._ui.onSendS(() => this.sendManualByte('S'));
        
        // Detector callbacks
        this._detector.onResult((result) => this._onDetectionResult(result));
        this._detector.onLoad(() => this._onModelLoaded());
        this._detector.onError((error) => this._onModelError(error));
        
        // State machine callbacks
        this._stateMachine.onStateChange((state) => this._onStateChange(state));
        
        // Serial service callbacks
        serialService.onStatusChange((status) => {
            this._ui.updateDeviceStatus(status);
            if (status === 'connected') {
                this._ui.addLogEntry('Device connected');
            } else if (status === 'disconnected') {
                this._ui.addLogEntry('Device disconnected');
            } else if (status === 'error') {
                this._ui.addLogEntry('Device connection error');
            }
        });
        
        // Check Web Serial availability
        if (!serialService.isAvailable()) {
            this._ui.showCompatibilityBanner(true);
            this._ui.addLogEntry('WARNING: Web Serial API not available. Use Chrome or Edge.');
        }
        
        // Setup keyboard shortcuts
        this._setupKeyboardShortcuts();
    }

    /**
     * Initialize application
     * @private
     */
    async _initialize() {
        console.log('[APP] Initializing...');
        
        // Auto-transition from intro after 2.5 seconds
        setTimeout(() => {
            this._ui.showMonitorScreen();
        }, 2500);
        
        // Load MediaPipe model
        this._ui.setLoading(true);
        await this._detector.initialize();
        
        // Apply loaded settings to UI
        this._ui.setSettings({
            threshold: this._threshold,
            closeHoldSeconds: this._closeHoldSeconds,
            recoverHoldSeconds: this._recoverHoldSeconds,
            beepEnabled: this._beepEnabled
        });
    }

    /**
     * Called when MediaPipe model is loaded
     * @private
     */
    _onModelLoaded() {
        console.log('[APP] Model loaded');
        this._ui.setLoading(false);
        this._ui.setStartButtonEnabled(true);
        this._ui.addLogEntry('System ready. Click "Start Camera" to begin.');
        
        // Force hide loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Called when model fails to load
     * @private
     */
    _onModelError(error) {
        console.error('[APP] Model load error:', error);
        this._ui.setLoading(false);
        this._ui.showError(`Failed to load model: ${error}`);
        this._ui.addLogEntry(`ERROR: ${error}`);
    }

    /**
     * Start camera and detection
     */
    async startCamera() {
        try {
            console.log('[APP] Starting camera...');
            
            const videoElement = this._ui.getVideoElement();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            videoElement.srcObject = stream;
            await videoElement.play();
            
            this._isRunning = true;
            this._ui.setStartButtonEnabled(false);
            this._ui.setStopButtonEnabled(true);
            this._ui.setCalibrateButtonEnabled(true);
            this._ui.hideError();
            
            this._ui.addLogEntry('Camera started');
            
            // Start detection loop
            this._detectionLoop();
            
        } catch (error) {
            console.error('[APP] Camera error:', error);
            let message = 'Failed to access camera';
            
            if (error.name === 'NotAllowedError') {
                message = 'Camera permission denied. Please allow camera access.';
            } else if (error.name === 'NotFoundError') {
                message = 'No camera found on this device.';
            }
            
            this._ui.showError(message);
            this._ui.addLogEntry(`ERROR: ${message}`);
        }
    }

    /**
     * Stop camera and detection
     */
    stopCamera() {
        console.log('[APP] Stopping camera...');
        
        this._isRunning = false;
        
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        
        const videoElement = this._ui.getVideoElement();
        if (videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
        }
        
        // Clear overlay
        const ctx = this._ui.getOverlayCanvas().getContext('2d');
        ctx.clearRect(0, 0, this._ui.getOverlayCanvas().width, this._ui.getOverlayCanvas().height);
        
        this._ui.setStartButtonEnabled(true);
        this._ui.setStopButtonEnabled(false);
        this._ui.setCalibrateButtonEnabled(false);
        
        this._ui.addLogEntry('Camera stopped');
    }

    /**
     * Detection loop using requestAnimationFrame
     * @private
     */
    async _detectionLoop() {
        if (!this._isRunning) {
            return;
        }
        
        const timestamp = performance.now();
        const videoElement = this._ui.getVideoElement();
        
        // Process frame
        await this._detector.processFrame(videoElement, timestamp);
        
        // Handle calibration UI update
        if (this._detector.isCalibrating()) {
            const elapsed = timestamp - this._calibrationStartTime;
            const remaining = Math.max(0, this._calibrationDuration - elapsed);
            this._ui.updateCalibrateButton(remaining);
        }
        
        // Continue loop
        this._animationId = requestAnimationFrame(() => this._detectionLoop());
    }

    /**
     * Handle detection result from detector
     * @param {Object} result - Detection result object
     * @private
     */
    _onDetectionResult(result) {
        // Handle calibration completion
        if (result.calibrationComplete) {
            this._ui.resetCalibrateButton();
            this._ui.addLogEntry(`Calibration complete. Baseline EAR: ${result.baselineEAR.toFixed(4)}`);
            return;
        }
        
        // Update face detection status
        this._ui.updateFaceDetected(result.faceDetected);
        this._stateMachine.setFaceDetected(result.faceDetected);
        
        if (!result.faceDetected) {
            this._ui.drawLandmarks(null, false);
            return;
        }
        
        // Update eye info
        this._ui.updateEyeInfo(result.leftEyeEAR, result.rightEyeEAR);
        this._ui.updateFPS(result.fps);
        
        // Update closure meter
        this._ui.updateClosureMeter(result.closurePercent, this._threshold);
        
        // Draw landmarks
        this._ui.drawLandmarks(result.landmarks, result.isClosed);
        
        // Update state machine
        this._stateMachine.update(result.isClosed, performance.now());
        
        // Update timers display
        const timers = this._stateMachine.getTimers();
        this._ui.updateTimers(
            timers.closedTimer,
            timers.closedThreshold,
            timers.openTimer,
            timers.openThreshold
        );
    }

    /**
     * Handle state change from state machine
     * @param {string} newState - New state ('AWAKE' or 'SLEEP')
     * @private
     */
    _onStateChange(newState) {
        console.log(`[APP] State changed to ${newState}`);
        
        // Update UI
        this._ui.updateStatus(newState);
        this._ui.updateVideoPanelState(newState);
        this._ui.updateMonitorTheme(newState);
        
        // Update last change time
        const time = new Date().toLocaleTimeString();
        this._ui.updateLastChange(time);
        
        // Handle browser beep
        if (newState === STATE.SLEEP && this._beepEnabled) {
            this._startBeep();
        } else {
            this._stopBeep();
        }
        
        // Log event (serial service handles actual sending)
        const serialChar = newState === STATE.AWAKE ? 'A' : 'S';
        this._ui.addLogEntry(`STATE -> ${newState} (TX '${serialChar}' -> device)`);
        this._ui.updateLastByteSent(serialChar);
        this._ui.hideHardwareWarning();
    }

    /**
     * Start calibration
     */
    startCalibration() {
        console.log('[APP] Starting calibration...');
        this._calibrationStartTime = performance.now();
        this._detector.startCalibration();
        this._ui.addLogEntry('Calibration started - keep eyes open for 3 seconds');
    }

    /**
     * Apply settings from UI
     */
    applySettings() {
        const settings = this._ui.getSettings();
        
        this._threshold = settings.threshold;
        this._closeHoldSeconds = settings.closeHoldSeconds;
        this._recoverHoldSeconds = settings.recoverHoldSeconds;
        this._beepEnabled = settings.beepEnabled;
        
        // Update state machine configuration
        this._stateMachine.configure({
            closeHoldSeconds: this._closeHoldSeconds,
            recoverHoldSeconds: this._recoverHoldSeconds
        });
        
        // Save to localStorage
        this._saveSettings();
        
        this._ui.hideSettingsDrawer();
        this._ui.addLogEntry(`Settings applied: threshold=${this._threshold}%, close=${this._closeHoldSeconds}s, recover=${this._recoverHoldSeconds}s, beep=${this._beepEnabled}`);
        
        console.log('[APP] Settings applied:', settings);
    }

    /**
     * Simulate awake state (for testing)
     */
    simulateAwake() {
        console.log('[APP] Simulating AWAKE');
        this._stateMachine.forceState(STATE.AWAKE);
        this._ui.addLogEntry('TEST: Forced AWAKE state');
    }

    /**
     * Simulate sleep state (for testing)
     */
    simulateSleep() {
        console.log('[APP] Simulating SLEEP');
        this._stateMachine.forceState(STATE.SLEEP);
        this._ui.addLogEntry('TEST: Forced SLEEP state');
    }

    /**
     * Toggle device connection
     */
    async toggleDeviceConnection() {
        if (serialService.isConnected()) {
            await this.disconnectDevice();
        } else {
            await this.connectDevice();
        }
    }

    /**
     * Connect to serial device
     */
    async connectDevice() {
        try {
            const currentState = this._stateMachine.getCurrentState();
            const initialState = currentState === STATE.AWAKE ? 'A' : 'S';
            await serialService.connect(initialState);
        } catch (error) {
            console.error('[APP] Connect error:', error);
            this._ui.addLogEntry(`ERROR: ${error.message}`);
        }
    }

    /**
     * Disconnect from serial device
     */
    async disconnectDevice() {
        try {
            await serialService.disconnect();
        } catch (error) {
            console.error('[APP] Disconnect error:', error);
            this._ui.addLogEntry(`ERROR: ${error.message}`);
        }
    }

    /**
     * Send manual byte (for hardware testing)
     * @param {string} byte - Byte to send
     */
    async sendManualByte(byte) {
        if (!serialService.isConnected()) {
            this._ui.addLogEntry('ERROR: Not connected to device');
            return;
        }
        
        try {
            await serialService.send(byte);
            this._ui.updateLastByteSent(byte);
            this._ui.addLogEntry(`MANUAL: TX '${byte}' -> device`);
        } catch (error) {
            console.error('[APP] Send error:', error);
            this._ui.addLogEntry(`ERROR: ${error.message}`);
        }
    }

    /**
     * Start browser beep
     * @private
     */
    _startBeep() {
        if (this._beepInterval) {
            return;
        }
        
        try {
            if (!this._audioContext) {
                this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const beep = () => {
                const oscillator = this._audioContext.createOscillator();
                const gainNode = this._audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this._audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'square';
                gainNode.gain.value = 0.1;
                
                oscillator.start();
                oscillator.stop(this._audioContext.currentTime + 0.1);
            };
            
            beep(); // Immediate beep
            this._beepInterval = setInterval(beep, 1000); // Beep every second
            
        } catch (error) {
            console.error('[APP] Beep error:', error);
        }
    }

    /**
     * Stop browser beep
     * @private
     */
    _stopBeep() {
        if (this._beepInterval) {
            clearInterval(this._beepInterval);
            this._beepInterval = null;
        }
    }

    /**
     * Setup keyboard shortcuts
     * @private
     */
    _setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input field
            if (e.target.tagName === 'INPUT') {
                return;
            }
            
            switch (e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    this.toggleDeviceConnection();
                    break;
                case 'k':
                    e.preventDefault();
                    if (!this._btnCalibrate.disabled) {
                        this.startCalibration();
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    if (this._isRunning) {
                        this.stopCamera();
                    } else if (!this._btnStart.disabled) {
                        this.startCamera();
                    }
                    break;
            }
        });
    }

    /**
     * Load settings from localStorage
     * @private
     */
    _loadSettings() {
        try {
            const saved = localStorage.getItem('antiSleepSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this._threshold = settings.threshold || 50;
                this._closeHoldSeconds = settings.closeHoldSeconds || 3.0;
                this._recoverHoldSeconds = settings.recoverHoldSeconds || 3.0;
                this._beepEnabled = settings.beepEnabled || false;
                
                // Load calibration baseline if available
                if (settings.baselineEAR) {
                    this._detector.setBaselineEAR(settings.baselineEAR);
                }
                
                console.log('[APP] Settings loaded from localStorage');
            }
        } catch (error) {
            console.error('[APP] Failed to load settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     * @private
     */
    _saveSettings() {
        try {
            const settings = {
                threshold: this._threshold,
                closeHoldSeconds: this._closeHoldSeconds,
                recoverHoldSeconds: this._recoverHoldSeconds,
                beepEnabled: this._beepEnabled,
                baselineEAR: this._detector.getBaselineEAR()
            };
            localStorage.setItem('antiSleepSettings', JSON.stringify(settings));
            console.log('[APP] Settings saved to localStorage');
        } catch (error) {
            console.error('[APP] Failed to save settings:', error);
        }
    }

    /**
     * Get calibrate button element (for keyboard shortcut check)
     * @private
     */
    get _btnCalibrate() {
        return document.getElementById('btn-calibrate');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
