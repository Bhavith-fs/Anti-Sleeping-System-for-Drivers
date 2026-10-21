# Anti-Sleep Alarm System for Drivers

A computer vision-based driver drowsiness detection system that monitors eye closure through a webcam and triggers alerts when the driver may be falling asleep.

## Phase 2 Features

- **Real-time eye detection** using MediaPipe Face Landmarker (468+ landmarks)
- **Eye Aspect Ratio (EAR)** calculation for accurate closure detection
- **State machine** with hysteresis to prevent false triggers from normal blinks
- **Calibration mode** to set personalized baseline for open eyes
- **Live monitoring UI** with video feed, status indicators, and event logging
- **Real Web Serial API** communication with STM32F103C8T6 Blue Pill
- **Hardware test panel** for manual byte sending and verification
- **Browser beep** option for audio alert in SLEEP state
- **Settings persistence** via localStorage
- **Keyboard shortcuts** for quick control (C=Connect, K=Calibrate, Space=Start/Stop)
- **Smooth state transitions** with theme-aware background tints

## Technology Stack

- Vanilla HTML + CSS + JavaScript (ES modules)
- MediaPipe Face Landmarker via CDN
- Web Serial API (Chrome/Edge only)
- No build step required

## Hardware Setup

### Components

- STM32F103C8T6 Blue Pill microcontroller
- CP2102 USB-to-TTL module
- Green LED (for AWAKE state)
- Red LED (for SLEEP state)
- Buzzer (for SLEEP state)
- Resistors for LEDs (220Ω typical)
- Breadboard and jumper wires

### Wiring Diagram

```
CP2102 USB-to-TTL Module    →    STM32F103C8T6 Blue Pill
─────────────────────────────────────────────────────────
TXD (transmit)              →    PA10 (USART1_RX)
RXD (receive)               →    PA9  (USART1_TX)
GND                         →    GND
5V/3.3V                     →    3.3V (power from USB)

LEDs and Buzzer (connected to STM32 GPIO):
Green LED                   →    PC13 (or any GPIO with resistor)
Red LED                     →    PC14 (or any GPIO with resistor)
Buzzer                      →    PC15 (or any GPIO)
```

**Important Notes:**
- CP2102 TXD connects to STM32 RX (PA10)
- CP2102 RXD connects to STM32 TX (PA9)
- Cross TX/RX if communication doesn't work
- Ensure common ground between CP2102 and STM32
- STM32 USART1 should be configured for 9600 baud, 8N1

### STM32 Firmware Requirements

The STM32 should be programmed to:
- Initialize USART1 at 9600 baud, 8 data bits, no parity, 1 stop bit
- Listen for single-byte commands on USART1
- On receiving 'A': Turn green LED ON, red LED OFF, buzzer OFF
- On receiving 'S': Turn red LED ON, green LED OFF, buzzer ON
- Send no data back (receive-only)

## Installation & Setup

### Prerequisites

- **Google Chrome or Microsoft Edge** (required for Web Serial API)
- A webcam
- Python 3 (for HTTP server)
- CP2102 driver installed on your system
- STM32 with appropriate firmware

### Running the Application

1. Navigate to the project directory:
   ```bash
   cd anti-sleep-alarm
   ```

2. Start a local HTTP server (required for camera and serial access - needs secure context):
   ```bash
   python -m http.server 8000
   ```

3. Open Chrome or Edge and navigate to:
   ```
   http://localhost:8000
   ```

**Important:** The application must run on `localhost` or `https` to access the webcam and Web Serial API. Opening directly as a file (`file://`) will not work due to browser security restrictions.

### Connecting the Device

1. Connect the CP2102 module to your computer via USB
2. Click the **"Connect Device"** button in the header
3. Select the COM port from the browser's port picker
4. The device status will show "Connected" with a green glow
5. The current state ('A' or 'S') will be sent immediately upon connection

### Keyboard Shortcuts

- **C**: Connect/Disconnect device
- **K**: Start calibration (when camera is running)
- **Space**: Start/Stop camera

## How It Works

### Detection Logic

The system uses **Eye Aspect Ratio (EAR)** to detect eye closure:

1. **Landmark Detection**: MediaPipe detects 468 facial landmarks
2. **EAR Calculation**: For each eye, calculate the ratio of vertical to horizontal distances
   - Left eye landmarks: 33, 160, 158, 133, 153, 144
   - Right eye landmarks: 362, 385, 387, 263, 373, 380
   - Formula: `EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)`
3. **Closure Percentage**: `Closure % = clamp(1 - EAR / baselineEAR, 0, 1) * 100`
4. **Smoothing**: 5-frame moving average to reduce flicker

### Calibration

Click the **Calibrate** button and keep your eyes open normally for 3 seconds. The system will:
- Sample your EAR values during this period
- Calculate the average as your **baseline EAR**
- Use this baseline for more accurate closure detection

Without calibration, a sensible default baseline (0.25) is used.

### State Machine

The system has two states: **AWAKE** and **SLEEP**

#### Transitions:

- **AWAKE → SLEEP**: Eyes must be closed continuously for ≥ 3.0 seconds
  - Normal blinks (≤ 150ms) do not reset the closed timer
  - Only when eyes open beyond the grace period does the timer reset

- **SLEEP → AWAKE**: Eyes must be open continuously for ≥ 3.0 seconds
  - Any closed frame resets the open timer

- **No Face Detected**: 
  - Shows "No face detected" warning
  - Freezes timers (configurable)
  - Does not change state

#### Settings:

Adjust these in the Settings drawer:
- **Closure Threshold (%)**: Percentage at which eye is considered "closed" (default: 50%)
- **Close Hold (s)**: Time eyes must be closed to trigger SLEEP state (default: 3.0s)
- **Recover Hold (s)**: Time eyes must be open to recover to AWAKE state (default: 3.0s)
- **Browser beep**: Enable audio beep in SLEEP state (default: off)

### Serial Communication (Phase 2 - Real Implementation)

The system uses the **Web Serial API** to communicate with the STM32:

- **Protocol**: Single ASCII characters, no newline
- **'A'**: AWAKE state (green LED on, red LED and buzzer off)
- **'S'**: SLEEP state (red LED and buzzer on, green LED off)
- **Baud rate**: 9600
- **Configuration**: 8 data bits, no parity, 1 stop bit

**Behavior:**
- Byte sent on every state change
- Byte sent immediately upon device connection (current state)
- Byte sent before disconnection (always 'A' for safe state)
- Writes are queued to prevent overlapping
- Serial errors do not crash detection; system continues running

## UI Components

### Screen 1 - Intro (2.5 seconds)
- Animated title with glowing eye icon
- Auto-transitions to monitor screen
- Skip link available

### Screen 2 - Live Monitor

**Video Panel (Left)**
- Mirrored webcam feed
- Face mesh overlay (cyan dots)
- Eye contour highlights (green when open, red when closed)
- Border glow matches current state (green/red)

**Status Panel (Right)**
- **Status Banner**: Large indicator showing current state
- **Eye Closure Meter**: Percentage bar with threshold marker
- **Timers**: Shows closed/open duration vs thresholds
- **Info Cards**: Left eye EAR, Right eye EAR, FPS, Face detection, Last state change
- **Device Status**: Connection status (Not connected/Connecting/Connected/Error)

**Bottom Panel**
- **Connect Device**: Button to connect/disconnect serial device
- **Settings**: Adjust thresholds, timing, and beep option
- **Test Panel**: Simulate Awake/Sleep for testing
- **Hardware Test**: Manual Send A/S buttons with last byte sent display
- **Event Log**: Timestamped log of state changes and serial events

## Testing

### Test 1: Normal Blinking (Should NOT trigger)
1. Start the camera
2. Blink normally (quick open/close)
3. Verify: State remains AWAKE, timers reset after each blink
4. The 150ms grace period prevents normal blinks from triggering

### Test 2: Prolonged Eye Closure (Should trigger SLEEP)
1. Start the camera
2. Close your eyes and keep them closed for 3+ seconds
3. Verify: State changes to SLEEP after 3.0s
4. Status banner turns red with pulsing animation
5. Event log shows: `STATE -> SLEEP (TX 'S' -> device)`
6. If device connected: Red LED and buzzer turn on

### Test 3: Recovery (Should return to AWAKE)
1. From SLEEP state, open your eyes
2. Keep them open for 3+ seconds
3. Verify: State changes back to AWAKE after 3.0s
4. Status banner turns green
5. Event log shows: `STATE -> AWAKE (TX 'A' -> device)`
6. If device connected: Green LED turns on, red LED and buzzer turn off

### Test 4: Calibration
1. Click "Calibrate" button
2. Keep eyes open normally for 3 seconds
3. Verify: Button shows countdown during calibration
4. After completion, baseline EAR is logged
5. Detection should be more accurate with your personal baseline

### Test 5: Test Buttons
1. Click "Simulate Awake"
2. Verify: State immediately changes to AWAKE
3. Click "Simulate Sleep"
4. Verify: State immediately changes to SLEEP
5. Event log shows forced state changes

### Test 6: No Face Detection
1. Move out of camera view or cover camera
2. Verify: "Face: No" in info cards
3. Timers freeze (if freeze on no face is enabled)
4. State does not change

### Test 7: Settings Adjustment
1. Click "Settings" button
2. Change threshold to 30% (more sensitive)
3. Change Close Hold to 2.0s (faster trigger)
4. Enable "Browser beep" option
5. Click "Apply"
6. Verify: Settings applied, event log updated
7. Test with adjusted settings
8. Verify beep sounds when in SLEEP state

### Manual Hardware Test Checklist

**Test 1: Device Connection**
1. Connect CP2102 to USB
2. Click "Connect Device" button
3. Select COM port from browser picker
4. Verify: Device status shows "Connected" (green)
5. Verify: Green LED on STM32 turns on

**Test 2: Close Eyes → SLEEP State**
1. Start camera
2. Close eyes for 3+ seconds
3. Verify: State changes to SLEEP
4. Verify: Red LED and buzzer turn on
5. Verify: Green LED turns off
6. Verify: Event log shows `TX 'S' -> device`

**Test 3: Open Eyes → AWAKE State**
1. From SLEEP, open eyes for 3+ seconds
2. Verify: State changes to AWAKE
3. Verify: Green LED turns on
4. Verify: Red LED and buzzer turn off
5. Verify: Event log shows `TX 'A' -> device`

**Test 4: Manual Hardware Test Panel**
1. Click "Hardware Test" button
2. Click "Send A" button
3. Verify: Green LED turns on
4. Verify: "Last byte sent" shows 'A' with timestamp
5. Click "Send S" button
6. Verify: Red LED and buzzer turn on
7. Verify: "Last byte sent" shows 'S' with timestamp
8. Verify warning appears about manual sends being temporary

**Test 5: Disconnect Behavior**
1. With device connected, click "Disconnect"
2. Verify: Green LED turns on (safe state sent before disconnect)
3. Verify: Device status shows "Not connected"
4. Verify: Event log shows device disconnected

**Test 6: Cable Unplug Detection**
1. With device connected, physically unplug USB cable
2. Verify: Device status changes to "Not connected"
3. Verify: Event log shows device disconnected
4. Replug cable and click "Connect Device"
5. Verify: Device reconnects successfully

## Troubleshooting

### Camera not starting
- Ensure you've allowed camera permission in the browser
- Check that no other application is using the camera
- Try refreshing the page

### Model not loading
- Check internet connection (MediaPipe model downloads from CDN)
- Check browser console for errors
- Try a different browser

### Detection not working
- Ensure good lighting
- Face should be clearly visible in camera
- Try calibration for better accuracy
- Adjust threshold in settings

### Page not loading
- Ensure you're running via HTTP server, not opening as file
- Use `http://localhost:8000`, not `file://...`

### Serial device not connecting
- **Browser compatibility**: Must use Chrome or Edge (Web Serial API not supported in Firefox/Safari)
- **Driver issues**: Ensure CP2102 driver is installed (download from Silicon Labs website)
- **Port in use**: Close other applications that might be using the COM port (Arduino IDE, serial terminals, etc.)
- **Wrong baud rate**: Verify STM32 is configured for 9600 baud
- **TX/RX swapped**: Try swapping TX and RX wires between CP2102 and STM32
- **No common ground**: Ensure GND of CP2102 is connected to GND of STM32
- **Cable issue**: Try a different USB cable

### Device not responding to commands
- **Wrong firmware**: Verify STM32 is programmed with correct firmware
- **Wrong USART pins**: Ensure using PA9 (TX) and PA10 (RX) for USART1
- **Baud rate mismatch**: Both sides must be 9600 baud
- **STM32 not powered**: Ensure STM32 is receiving 3.3V power
- **LED/buzzer connections**: Check GPIO pin assignments and resistor values

### Device disconnects unexpectedly
- **Loose connections**: Check all wiring connections
- **USB power issue**: Try a different USB port or powered hub
- **STM32 reset**: STM32 may be resetting due to power instability

### Compatibility banner showing
- This means Web Serial API is not available
- Switch to Google Chrome or Microsoft Edge on desktop
- Ensure you're not in incognito/private mode (some browsers restrict APIs)

## File Structure

```
anti-sleep-alarm/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styling (navy theme with state transitions)
├── js/
│   ├── app.js          # Main entry point with localStorage & keyboard shortcuts
│   ├── detector.js     # MediaPipe & EAR calculation
│   ├── stateMachine.js # AWAKE/SLEEP state logic
│   ├── serialService.js # Web Serial API implementation
│   └── ui.js           # DOM manipulation & updates
└── README.md           # This file
```

## Browser Compatibility

- **Chrome/Edge**: Full support (required for Web Serial API)
- **Firefox**: Camera works, but Web Serial API not supported
- **Safari**: Camera may work with additional configuration, Web Serial API not supported

**Note:** Web Serial API is only available in Chrome and Edge on desktop. Other browsers will show a compatibility banner and the serial features will not work.

## Additional Features

### Settings Persistence
All settings (threshold, hold times, beep toggle, and calibration baseline) are automatically saved to localStorage. They persist across browser sessions and are loaded when the application starts.

### Browser Beep
When enabled in settings, the browser will play a short beep sound every second while in the SLEEP state. This provides an audio alert even without the hardware connected.

### Accessibility
- All buttons have aria-labels for screen readers
- Status information is conveyed through both color and text
- High contrast colors meet WCAG AA standards
- Keyboard shortcuts available for common actions
