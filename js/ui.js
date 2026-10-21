/**
 * UI Manager - DOM Manipulation and Updates
 * 
 * Handles all UI updates, event listeners, and visual feedback
 */

export class UIManager {
    constructor() {
        // DOM elements
        this._introScreen = document.getElementById('intro-screen');
        this._monitorScreen = document.getElementById('monitor-screen');
        this._monitorContainer = document.querySelector('.monitor-container');
        this._skipIntro = document.getElementById('skip-intro');
        
        this._webcam = document.getElementById('webcam');
        this._overlay = document.getElementById('overlay');
        this._loadingOverlay = document.getElementById('loading-overlay');
        this._errorOverlay = document.getElementById('error-overlay');
        this._errorMessage = document.getElementById('errorMessage');
        
        this._btnStart = document.getElementById('btn-start');
        this._btnStop = document.getElementById('btn-stop');
        this._btnCalibrate = document.getElementById('btn-calibrate');
        
        this._statusBanner = document.getElementById('status-banner');
        this._statusText = document.getElementById('status-text');
        
        this._closureBar = document.getElementById('closure-bar');
        this._thresholdMarker = document.getElementById('threshold-marker');
        this._closureValue = document.getElementById('closure-value');
        
        this._closedTimer = document.getElementById('closed-timer');
        this._openTimer = document.getElementById('open-timer');
        
        this._leftEye = document.getElementById('left-eye');
        this._rightEye = document.getElementById('right-eye');
        this._fps = document.getElementById('fps');
        this._faceDetected = document.getElementById('face-detected');
        this._lastChange = document.getElementById('last-change');
        
        this._deviceStatus = document.getElementById('device-status');
        
        this._btnConnect = document.getElementById('btn-connect');
        this._compatibilityBanner = document.getElementById('compatibility-banner');
        
        this._btnSettings = document.getElementById('btn-settings');
        this._settingsDrawer = document.getElementById('settings-drawer');
        this._thresholdInput = document.getElementById('threshold-input');
        this._closeHoldInput = document.getElementById('close-hold-input');
        this._recoverHoldInput = document.getElementById('recover-hold-input');
        this._beepToggle = document.getElementById('beep-toggle');
        this._btnApplySettings = document.getElementById('btn-apply-settings');
        
        this._btnSimAwake = document.getElementById('btn-sim-awake');
        this._btnSimSleep = document.getElementById('btn-sim-sleep');
        
        this._btnHardwareTest = document.getElementById('btn-hardware-test');
        this._hardwareTestDrawer = document.getElementById('hardware-test-drawer');
        this._btnSendA = document.getElementById('btn-send-a');
        this._btnSendS = document.getElementById('btn-send-s');
        this._hardwareWarning = document.getElementById('hardware-warning');
        this._lastByteSent = document.getElementById('last-byte-sent');
        this._lastByteTime = document.getElementById('last-byte-time');
        
        this._eventLog = document.getElementById('event-log');
        
        // Event callbacks
        this._onStartCamera = null;
        this._onStopCamera = null;
        this._onCalibrate = null;
        this._onApplySettings = null;
        this._onSimulateAwake = null;
        this._onSimulateSleep = null;
        this._onConnectDevice = null;
        this._onSendA = null;
        this._onSendS = null;
        
        // Event log entries
        this._logEntries = [];
        this._maxLogEntries = 20;
        
        this._setupEventListeners();
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        this._skipIntro.addEventListener('click', (e) => {
            e.preventDefault();
            this.showMonitorScreen();
        });
        
        this._btnStart.addEventListener('click', () => {
            if (this._onStartCamera) {
                this._onStartCamera();
            }
        });
        
        this._btnStop.addEventListener('click', () => {
            if (this._onStopCamera) {
                this._onStopCamera();
            }
        });
        
        this._btnCalibrate.addEventListener('click', () => {
            if (this._onCalibrate) {
                this._onCalibrate();
            }
        });
        
        this._btnSettings.addEventListener('click', () => {
            this._settingsDrawer.classList.toggle('hidden');
        });
        
        this._btnApplySettings.addEventListener('click', () => {
            if (this._onApplySettings) {
                this._onApplySettings();
            }
        });
        
        this._btnSimAwake.addEventListener('click', () => {
            if (this._onSimulateAwake) {
                this._onSimulateAwake();
            }
        });
        
        this._btnSimSleep.addEventListener('click', () => {
            if (this._onSimulateSleep) {
                this._onSimulateSleep();
            }
        });
        
        this._btnConnect.addEventListener('click', () => {
            if (this._onConnectDevice) {
                this._onConnectDevice();
            }
        });
        
        this._btnHardwareTest.addEventListener('click', () => {
            this._hardwareTestDrawer.classList.toggle('hidden');
        });
        
        this._btnSendA.addEventListener('click', () => {
            if (this._onSendA) {
                this._onSendA();
            }
            this._hardwareWarning.classList.remove('hidden');
        });
        
        this._btnSendS.addEventListener('click', () => {
            if (this._onSendS) {
                this._onSendS();
            }
            this._hardwareWarning.classList.remove('hidden');
        });
    }

    /**
     * Register callback for start camera button
     */
    onStartCamera(callback) {
        this._onStartCamera = callback;
    }

    /**
     * Register callback for stop camera button
     */
    onStopCamera(callback) {
        this._onStopCamera = callback;
    }

    /**
     * Register callback for calibrate button
     */
    onCalibrate(callback) {
        this._onCalibrate = callback;
    }

    /**
     * Register callback for apply settings button
     */
    onApplySettings(callback) {
        this._onApplySettings = callback;
    }

    /**
     * Register callback for simulate awake button
     */
    onSimulateAwake(callback) {
        this._onSimulateAwake = callback;
    }

    /**
     * Register callback for simulate sleep button
     */
    onSimulateSleep(callback) {
        this._onSimulateSleep = callback;
    }

    /**
     * Register callback for connect device button
     */
    onConnectDevice(callback) {
        this._onConnectDevice = callback;
    }

    /**
     * Register callback for send A button
     */
    onSendA(callback) {
        this._onSendA = callback;
    }

    /**
     * Register callback for send S button
     */
    onSendS(callback) {
        this._onSendS = callback;
    }

    /**
     * Show intro screen
     */
    showIntroScreen() {
        this._introScreen.classList.remove('hidden');
        this._monitorScreen.classList.add('hidden');
    }

    /**
     * Show monitor screen
     */
    showMonitorScreen() {
        this._introScreen.classList.add('hidden');
        this._monitorScreen.classList.remove('hidden');
    }

    /**
     * Update loading state
     * @param {boolean} loading - Whether loading is in progress
     */
    setLoading(loading) {
        const overlay = this._loadingOverlay || document.getElementById('loading-overlay');
        if (overlay) {
            if (loading) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this._errorMessage.textContent = message;
        this._errorOverlay.classList.remove('hidden');
    }

    /**
     * Hide error message
     */
    hideError() {
        this._errorOverlay.classList.add('hidden');
    }

    /**
     * Enable/disable start button
     * @param {boolean} enabled
     */
    setStartButtonEnabled(enabled) {
        this._btnStart.disabled = !enabled;
    }

    /**
     * Enable/disable stop button
     * @param {boolean} enabled
     */
    setStopButtonEnabled(enabled) {
        this._btnStop.disabled = !enabled;
    }

    /**
     * Enable/disable calibrate button
     * @param {boolean} enabled
     */
    setCalibrateButtonEnabled(enabled) {
        this._btnCalibrate.disabled = !enabled;
    }

    /**
     * Update status banner
     * @param {string} state - 'AWAKE' or 'SLEEP'
     */
    updateStatus(state) {
        this._statusBanner.classList.remove('awake', 'sleep');
        
        if (state === 'AWAKE') {
            this._statusBanner.classList.add('awake');
            this._statusText.textContent = 'Driver is Normal / Awake';
        } else if (state === 'SLEEP') {
            this._statusBanner.classList.add('sleep');
            this._statusText.textContent = 'Possible Sleep State';
        }
    }

    /**
     * Update video panel border glow based on state
     * @param {string} state - 'AWAKE' or 'SLEEP'
     */
    updateVideoPanelState(state) {
        const videoPanel = document.querySelector('.video-panel');
        videoPanel.classList.remove('awake', 'sleep');
        
        if (state === 'AWAKE') {
            videoPanel.classList.add('awake');
        } else if (state === 'SLEEP') {
            videoPanel.classList.add('sleep');
        }
    }

    /**
     * Update monitor container theme
     * @param {string} state - 'AWAKE' or 'SLEEP'
     */
    updateMonitorTheme(state) {
        this._monitorContainer.classList.remove('awake-theme', 'sleep-theme');
        
        if (state === 'AWAKE') {
            this._monitorContainer.classList.add('awake-theme');
        } else if (state === 'SLEEP') {
            this._monitorContainer.classList.add('sleep-theme');
        }
    }

    /**
     * Update closure meter
     * @param {number} percent - Closure percentage (0-100)
     * @param {number} threshold - Threshold percentage
     */
    updateClosureMeter(percent, threshold) {
        this._closureBar.style.width = `${percent}%`;
        this._thresholdMarker.style.left = `${threshold}%`;
        this._closureValue.textContent = `${percent}%`;
    }

    /**
     * Update timers
     * @param {number} closedTime - Current closed time in seconds
     * @param {number} closedThreshold - Closed threshold in seconds
     * @param {number} openTime - Current open time in seconds
     * @param {number} openThreshold - Open threshold in seconds
     */
    updateTimers(closedTime, closedThreshold, openTime, openThreshold) {
        this._closedTimer.textContent = `${closedTime.toFixed(1)} / ${closedThreshold.toFixed(1)} s`;
        this._openTimer.textContent = `${openTime.toFixed(1)} / ${openThreshold.toFixed(1)} s`;
    }

    /**
     * Update eye info cards
     * @param {number} leftEAR - Left eye EAR
     * @param {number} rightEAR - Right eye EAR
     */
    updateEyeInfo(leftEAR, rightEAR) {
        this._leftEye.textContent = leftEAR.toFixed(3);
        this._rightEye.textContent = rightEAR.toFixed(3);
    }

    /**
     * Update FPS display
     * @param {number} fps - Current FPS
     */
    updateFPS(fps) {
        this._fps.textContent = fps;
    }

    /**
     * Update face detection status
     * @param {boolean} detected - Whether face is detected
     */
    updateFaceDetected(detected) {
        this._faceDetected.textContent = detected ? 'Yes' : 'No';
        this._faceDetected.style.color = detected ? '#2ECC71' : '#E63946';
    }

    /**
     * Update last state change time
     * @param {string} time - Time string to display
     */
    updateLastChange(time) {
        this._lastChange.textContent = time;
    }

    /**
     * Update device connection status
     * @param {string} status - Status string ('disconnected', 'connecting', 'connected', 'error')
     */
    updateDeviceStatus(status) {
        this._deviceStatus.classList.remove('disconnected', 'connecting', 'connected', 'error');
        this._deviceStatus.classList.add(status);
        
        switch (status) {
            case 'disconnected':
                this._deviceStatus.textContent = 'Not connected';
                this._deviceStatus.style.color = '#9FB3C8';
                this._btnConnect.textContent = 'Connect Device';
                this._btnConnect.disabled = false;
                break;
            case 'connecting':
                this._deviceStatus.textContent = 'Connecting...';
                this._deviceStatus.style.color = '#00B4D8';
                this._btnConnect.textContent = 'Connecting...';
                this._btnConnect.disabled = true;
                break;
            case 'connected':
                this._deviceStatus.textContent = 'Connected';
                this._deviceStatus.style.color = '#2ECC71';
                this._btnConnect.textContent = 'Disconnect';
                this._btnConnect.disabled = false;
                break;
            case 'error':
                this._deviceStatus.textContent = 'Error';
                this._deviceStatus.style.color = '#E63946';
                this._btnConnect.textContent = 'Connect Device';
                this._btnConnect.disabled = false;
                break;
        }
    }

    /**
     * Show compatibility banner
     * @param {boolean} show - Whether to show the banner
     */
    showCompatibilityBanner(show) {
        if (show) {
            this._compatibilityBanner.classList.remove('hidden');
        } else {
            this._compatibilityBanner.classList.add('hidden');
        }
    }

    /**
     * Update last byte sent display
     * @param {string} byte - Byte character sent
     */
    updateLastByteSent(byte) {
        this._lastByteSent.textContent = byte;
        this._lastByteTime.textContent = new Date().toLocaleTimeString();
    }

    /**
     * Hide hardware test warning
     */
    hideHardwareWarning() {
        this._hardwareWarning.classList.add('hidden');
    }

    /**
     * Get beep toggle state
     * @returns {boolean}
     */
    getBeepEnabled() {
        return this._beepToggle.checked;
    }

    /**
     * Set beep toggle state
     * @param {boolean} enabled
     */
    setBeepEnabled(enabled) {
        this._beepToggle.checked = enabled;
    }

    /**
     * Draw face landmarks on overlay canvas
     * @param {Array} landmarks - MediaPipe landmarks array
     * @param {boolean} isClosed - Whether eyes are closed
     */
    drawLandmarks(landmarks, isClosed) {
        const ctx = this._overlay.getContext('2d');
        const width = this._overlay.width;
        const height = this._overlay.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (!landmarks) {
            return;
        }
        
        // Set canvas size to match video
        this._overlay.width = this._webcam.videoWidth;
        this._overlay.height = this._webcam.videoHeight;
        
        // Draw all face landmarks as small cyan dots
        ctx.fillStyle = '#00B4D8';
        for (const landmark of landmarks) {
            const x = landmark.x * width;
            const y = landmark.y * height;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Highlight eye contours
        const eyeColor = isClosed ? '#E63946' : '#2ECC71';
        ctx.fillStyle = eyeColor;
        
        // Left eye
        for (const idx of [33, 160, 158, 133, 153, 144]) {
            const landmark = landmarks[idx];
            const x = landmark.x * width;
            const y = landmark.y * height;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Right eye
        for (const idx of [362, 385, 387, 263, 373, 380]) {
            const landmark = landmarks[idx];
            const x = landmark.x * width;
            const y = landmark.y * height;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    /**
     * Add entry to event log
     * @param {string} message - Log message
     */
    addLogEntry(message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = { timestamp, message };
        
        this._logEntries.push(entry);
        
        if (this._logEntries.length > this._maxLogEntries) {
            this._logEntries.shift();
        }
        
        this._renderLog();
    }

    /**
     * Render event log
     * @private
     */
    _renderLog() {
        this._eventLog.innerHTML = '';
        
        for (const entry of this._logEntries) {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.innerHTML = `<span class="timestamp">[${entry.timestamp}]</span> ${entry.message}`;
            this._eventLog.appendChild(div);
        }
        
        // Scroll to bottom
        this._eventLog.scrollTop = this._eventLog.scrollHeight;
    }

    /**
     * Get current settings values
     * @returns {Object} Settings object
     */
    getSettings() {
        return {
            threshold: parseInt(this._thresholdInput.value),
            closeHoldSeconds: parseFloat(this._closeHoldInput.value),
            recoverHoldSeconds: parseFloat(this._recoverHoldInput.value),
            beepEnabled: this._beepToggle.checked
        };
    }

    /**
     * Set settings values
     * @param {Object} settings - Settings object
     */
    setSettings(settings) {
        if (settings.threshold !== undefined) {
            this._thresholdInput.value = settings.threshold;
        }
        if (settings.closeHoldSeconds !== undefined) {
            this._closeHoldInput.value = settings.closeHoldSeconds;
        }
        if (settings.recoverHoldSeconds !== undefined) {
            this._recoverHoldInput.value = settings.recoverHoldSeconds;
        }
        if (settings.beepEnabled !== undefined) {
            this._beepToggle.checked = settings.beepEnabled;
        }
    }

    /**
     * Hide settings drawer
     */
    hideSettingsDrawer() {
        this._settingsDrawer.classList.add('hidden');
    }

    /**
     * Update calibrate button text during calibration
     * @param {number} remainingMs - Remaining calibration time in ms
     */
    updateCalibrateButton(remainingMs) {
        const remainingSec = Math.ceil(remainingMs / 1000);
        this._btnCalibrate.textContent = `Calibrating... ${remainingSec}s`;
        this._btnCalibrate.disabled = true;
    }

    /**
     * Reset calibrate button
     */
    resetCalibrateButton() {
        this._btnCalibrate.textContent = 'Calibrate';
        this._btnCalibrate.disabled = false;
    }

    /**
     * Get video element
     * @returns {HTMLVideoElement}
     */
    getVideoElement() {
        return this._webcam;
    }

    /**
     * Get overlay canvas
     * @returns {HTMLCanvasElement}
     */
    getOverlayCanvas() {
        return this._overlay;
    }
}
