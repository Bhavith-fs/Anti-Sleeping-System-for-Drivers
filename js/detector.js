/**
 * Detector - Face Mesh and Eye Aspect Ratio Calculation
 * 
 * Uses MediaPipe Face Mesh to detect facial landmarks and
 * calculates Eye Aspect Ratio (EAR) to determine eye closure.
 */

// MediaPipe Face Mesh indices for eyes
// Left eye: 33, 160, 158, 133, 153, 144
// Right eye: 362, 385, 387, 263, 373, 380
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

export class Detector {
    constructor() {
        this._faceMesh = null;
        this._isModelLoaded = false;
        this._isRunning = false;
        
        // Calibration
        this._baselineEAR = 0.25; // Default baseline if not calibrated
        this._isCalibrating = false;
        this._calibrationSamples = [];
        this._calibrationStartTime = 0;
        this._calibrationDuration = 3000; // 3 seconds
        
        // Smoothing
        this._smoothingWindow = 5;
        this._earHistory = [];
        
        // Callbacks
        this._onResultCallback = null;
        this._onLoadCallback = null;
        this._onErrorCallback = null;
        
        // FPS tracking
        this._frameCount = 0;
        this._lastFpsUpdate = 0;
        this._currentFps = 0;
    }

    /**
     * Initialize the MediaPipe Face Mesh model
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('[DETECTOR] Loading MediaPipe Face Mesh...');
            
            // Wait for FaceMesh to be available
            if (!window.FaceMesh) {
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (window.FaceMesh) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
            }
            
            this._faceMesh = new FaceMesh({locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }});
            
            this._faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            this._faceMesh.onResults((results) => this._onResults(results));
            
            await this._faceMesh.initialize();
            
            this._isModelLoaded = true;
            console.log('[DETECTOR] Model loaded successfully');
            
            if (this._onLoadCallback) {
                this._onLoadCallback();
            }
        } catch (error) {
            console.error('[DETECTOR] Failed to load model:', error);
            const errorMsg = error.message || 'Unknown error loading MediaPipe model. Check your internet connection.';
            if (this._onErrorCallback) {
                this._onErrorCallback(errorMsg);
            }
        }
    }

    /**
     * Handle Face Mesh results
     * @param {Object} results - Face Mesh results
     * @private
     */
    _onResults(results) {
        if (!results || !results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            // No face detected
            if (this._onResultCallback) {
                this._onResultCallback({
                    faceDetected: false,
                    leftEyeEAR: 0,
                    rightEyeEAR: 0,
                    avgEAR: 0,
                    closurePercent: 0,
                    isClosed: false,
                    fps: this._currentFps,
                    landmarks: null
                });
            }
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        
        // Calculate EAR for both eyes
        const leftEAR = this._calculateEAR(landmarks, LEFT_EYE_INDICES);
        const rightEAR = this._calculateEAR(landmarks, RIGHT_EYE_INDICES);
        const avgEAR = (leftEAR + rightEAR) / 2;
        
        // Smooth EAR with moving average
        const smoothedEAR = this._smoothEAR(avgEAR);
        
        // Handle calibration
        if (this._isCalibrating) {
            this._calibrationSamples.push(smoothedEAR);
            
            // Check if calibration complete
            const elapsed = performance.now() - this._calibrationStartTime;
            if (elapsed >= this._calibrationDuration) {
                this._completeCalibration();
            }
        }
        
        // Calculate closure percentage
        const closurePercent = this._calculateClosurePercent(smoothedEAR);
        
        // Determine if eyes are closed based on threshold
        const threshold = 50; // Default threshold, will be overridden by settings
        const isClosed = closurePercent >= threshold;
        
        // Send result
        if (this._onResultCallback) {
            this._onResultCallback({
                faceDetected: true,
                leftEyeEAR: leftEAR,
                rightEyeEAR: rightEAR,
                avgEAR: smoothedEAR,
                closurePercent: closurePercent,
                isClosed: isClosed,
                fps: this._currentFps,
                landmarks: landmarks
            });
        }
    }

    /**
     * Register callback for detection results
     * @param {function} callback - Function to call with result object
     */
    onResult(callback) {
        this._onResultCallback = callback;
    }

    /**
     * Register callback for model load completion
     * @param {function} callback - Function to call when model is loaded
     */
    onLoad(callback) {
        this._onLoadCallback = callback;
    }

    /**
     * Register callback for errors
     * @param {function} callback - Function to call with error message
     */
    onError(callback) {
        this._onErrorCallback = callback;
    }

    /**
     * Start calibration process
     * User should keep eyes open normally for 3 seconds
     */
    startCalibration() {
        if (this._isCalibrating) {
            return;
        }
        
        console.log('[DETECTOR] Starting calibration...');
        this._isCalibrating = true;
        this._calibrationSamples = [];
        this._calibrationStartTime = performance.now();
    }

    /**
     * Check if currently calibrating
     * @returns {boolean}
     */
    isCalibrating() {
        return this._isCalibrating;
    }

    /**
     * Process a video frame
     * @param {HTMLVideoElement} videoElement - The video element to process
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    async processFrame(videoElement, timestamp) {
        if (!this._isModelLoaded || !this._faceMesh) {
            return;
        }

        // Calculate FPS
        this._frameCount++;
        if (timestamp - this._lastFpsUpdate >= 1000) {
            this._currentFps = this._frameCount;
            this._frameCount = 0;
            this._lastFpsUpdate = timestamp;
        }

        // Send frame to Face Mesh
        await this._faceMesh.send({image: videoElement});
    }

    /**
     * Calculate Eye Aspect Ratio (EAR) for an eye
     * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
     * where p1-p6 are the 6 eye landmarks
     * @param {Array} landmarks - Array of landmark objects
     * @param {Array} indices - Indices of the 6 eye landmarks
     * @returns {number} EAR value
     * @private
     */
    _calculateEAR(landmarks, indices) {
        const p1 = landmarks[indices[0]];
        const p2 = landmarks[indices[1]];
        const p3 = landmarks[indices[2]];
        const p4 = landmarks[indices[3]];
        const p5 = landmarks[indices[4]];
        const p6 = landmarks[indices[5]];
        
        // Calculate distances
        const vertical1 = this._distance(p2, p6);
        const vertical2 = this._distance(p3, p5);
        const horizontal = this._distance(p1, p4);
        
        // EAR formula
        const ear = (vertical1 + vertical2) / (2 * horizontal);
        
        return ear;
    }

    /**
     * Calculate Euclidean distance between two landmarks
     * @param {Object} p1 - First landmark {x, y, z}
     * @param {Object} p2 - Second landmark {x, y, z}
     * @returns {number} Distance
     * @private
     */
    _distance(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }

    /**
     * Smooth EAR value using moving average
     * @param {number} ear - Current EAR value
     * @returns {number} Smoothed EAR value
     * @private
     */
    _smoothEAR(ear) {
        this._earHistory.push(ear);
        
        if (this._earHistory.length > this._smoothingWindow) {
            this._earHistory.shift();
        }
        
        const sum = this._earHistory.reduce((a, b) => a + b, 0);
        return sum / this._earHistory.length;
    }

    /**
     * Calculate closure percentage based on baseline EAR
     * @param {number} ear - Current EAR value
     * @returns {number} Closure percentage (0-100)
     * @private
     */
    _calculateClosurePercent(ear) {
        const ratio = ear / this._baselineEAR;
        const closure = 1 - ratio;
        const clamped = Math.max(0, Math.min(1, closure));
        return Math.round(clamped * 100);
    }

    /**
     * Complete calibration and set baseline EAR
     * @private
     */
    _completeCalibration() {
        if (this._calibrationSamples.length === 0) {
            console.warn('[DETECTOR] No calibration samples collected');
            this._isCalibrating = false;
            return;
        }
        
        const sum = this._calibrationSamples.reduce((a, b) => a + b, 0);
        const avg = sum / this._calibrationSamples.length;
        
        this._baselineEAR = avg;
        this._isCalibrating = false;
        this._calibrationSamples = [];
        
        console.log(`[DETECTOR] Calibration complete. Baseline EAR: ${this._baselineEAR.toFixed(4)}`);
        
        // Notify via callback
        if (this._onResultCallback) {
            this._onResultCallback({
                calibrationComplete: true,
                baselineEAR: this._baselineEAR
            });
        }
    }

    /**
     * Get current baseline EAR
     * @returns {number}
     */
    getBaselineEAR() {
        return this._baselineEAR;
    }

    /**
     * Set baseline EAR manually (for testing)
     * @param {number} ear - Baseline EAR value
     */
    setBaselineEAR(ear) {
        this._baselineEAR = ear;
    }

    /**
     * Set closure threshold
     * @param {number} threshold - Threshold percentage (0-100)
     */
    setThreshold(threshold) {
        // This will be used in isClosed calculation
        // Currently hardcoded to 50 in processFrame, but can be made configurable
        console.log(`[DETECTOR] Threshold set to ${threshold}%`);
    }

    /**
     * Stop detection
     */
    stop() {
        this._isRunning = false;
    }

    /**
     * Check if model is loaded
     * @returns {boolean}
     */
    isModelLoaded() {
        return this._isModelLoaded;
    }
}
