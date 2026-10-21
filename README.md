<h1 align="center">🚗 Anti-Sleep Alarm System for Drivers</h1>

<div align="center">

A computer vision-based driver drowsiness detection system that monitors eye closure through a webcam and triggers alerts when the driver may be falling asleep.

🎯 **Focus:** Detect • Monitor • Alert • Protect

🌐 **Live Demo:**  
👉 https://bhavith-fs.github.io/Anti-Sleeping-System-for-Drivers/

![Driver Safety](https://img.shields.io/badge/Driver%20Safety-Accident%20Prevention-blue?style=for-the-badge)
![Computer Vision](https://img.shields.io/badge/Computer%20Vision-MediaPipe-purple?style=for-the-badge)
![Embedded Systems](https://img.shields.io/badge/Embedded%20Systems-STM32-orange?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20JS-yellow?style=for-the-badge&logo=javascript&logoColor=black)
![Phase 2](https://img.shields.io/badge/Development-Phase%202-success?style=for-the-badge)

</div>

---

## 🎯 Overview

The **Anti-Sleep Alarm System for Drivers** is a computer vision-based driver safety project. It monitors the driver's eyes through a webcam to identify prolonged eye closure that may indicate drowsiness.

The system uses **MediaPipe Face Landmarker** to detect facial landmarks and calculate the Eye Aspect Ratio (EAR). A state machine evaluates eye closure duration to distinguish normal blinking from prolonged closure. When the system detects potential drowsiness, it can trigger browser audio alerts and communicate with an **STM32F103C8T6 Blue Pill microcontroller** to activate a buzzer and LED indicators.

The project combines computer vision, real-time browser monitoring, and embedded hardware to demonstrate a practical approach to driver drowsiness detection and road safety.

---

## ✨ Key Features

👁️ **Real-Time Eye Detection** using MediaPipe Face Landmarker and facial landmarks.

📊 **Eye Aspect Ratio (EAR)** calculation to estimate eye closure.

🧠 **State Machine with Hysteresis** to reduce false triggers caused by normal blinking.

🎯 **Personalized Calibration** to establish a baseline for naturally open eyes.

📹 **Live Monitoring Interface** with webcam feed, facial landmark overlay, status indicators, and event logs.

🚨 **Drowsiness Alerts** through browser audio and external hardware.

🔌 **STM32 Integration** using the Web Serial API for real-time device communication.

💡 **Hardware Indicators** using green and red LEDs, along with a buzzer.

🧪 **Hardware Test Panel** for manually sending commands and verifying device responses.

⚙️ **Configurable Settings** for closure thresholds, timing, and browser beep alerts.

💾 **Settings Persistence** using browser localStorage.

⌨️ **Keyboard Shortcuts** for quick access to common controls.

🎨 **Dynamic Interface** with smooth state transitions and theme-aware background effects.

---

## 🧠 How It Works

1. **Video Capture:** The webcam continuously captures the driver's face.

2. **Facial Landmark Detection:** MediaPipe identifies facial landmarks around the eyes.

3. **Eye Closure Analysis:** The system calculates the Eye Aspect Ratio (EAR) to estimate whether the eyes are open or closed.

4. **Signal Smoothing:** A five-frame moving average helps reduce flickering and unstable measurements.

5. **State Evaluation:** The state machine checks how long the eyes remain closed or open, avoiding unnecessary transitions caused by ordinary blinking.

6. **Drowsiness Alert:** If eye closure persists for the configured duration, the system transitions from `AWAKE` to `SLEEP`.

7. **Hardware Communication:** The browser sends the ASCII character `S` through the Web Serial API to activate the sleep-state indicators.

8. **Alert Activation:** The STM32 activates the red LED and buzzer while turning off the green LED.

9. **Recovery:** When the eyes remain open for the configured recovery duration, the system returns to `AWAKE` and sends `A` to restore the safe indicator state.

---

## 🔬 Eye Aspect Ratio (EAR)

The Eye Aspect Ratio is used to estimate eye openness by comparing vertical eye distances with horizontal eye width.

The formula is:

```text
EAR = (||p2 - p6|| + ||p3 - p5||) / (2 × ||p1 - p4||)
```

The system uses the following MediaPipe eye landmarks:

- **Left eye:** 33, 160, 158, 133, 153, 144
- **Right eye:** 362, 385, 387, 263, 373, 380

The measured EAR is compared against a baseline established during calibration. A normalized closure percentage is calculated as:

```text
Closure % = clamp(1 - EAR / baselineEAR, 0, 1) × 100
```

This percentage is compared against the configured closure threshold to determine whether the eyes are considered closed.

### Calibration

The user can start calibration and keep their eyes naturally open for approximately three seconds. The system samples EAR values and calculates an average baseline.

A default baseline of `0.25` is used when calibration has not been performed.

Calibration helps personalize detection, although lighting, camera position, and individual facial characteristics can still affect accuracy.

---

## ⚙️ State Machine

The application uses two primary states:

- 🟢 **AWAKE:** The eyes are considered open, and the green LED is activated when the hardware is connected.
- 🔴 **SLEEP:** Prolonged eye closure is detected, and the red LED and buzzer are activated when the hardware is connected.

### State Transitions

| Condition | System Behaviour |
|---|---|
| Eyes closed for 3 seconds | Transition from AWAKE to SLEEP |
| Eyes open for 3 seconds | Transition from SLEEP to AWAKE |
| Normal blink | Avoid unnecessary state changes |
| No face detected | Display a warning and freeze timers when configured |
| Device connected | Send the current state to the STM32 |

A 150 ms blink grace period helps prevent ordinary blinks from being treated as prolonged eye closure. The configurable hold durations and hysteresis help reduce false triggers.

**Default settings:**
- Closure threshold: 50%
- Close hold duration: 3 seconds
- Recovery hold duration: 3 seconds
- Browser beep: Disabled by default
- Serial baud rate: 9600

---

## 🛠 Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **JavaScript Architecture:** ES modules
- **Computer Vision:** MediaPipe Face Landmarker
- **Detection Algorithm:** Eye Aspect Ratio (EAR)
- **Browser Communication:** Web Serial API
- **Settings Storage:** Browser localStorage
- **Microcontroller:** STM32F103C8T6 Blue Pill
- **USB-to-Serial Interface:** CP2102 USB-to-TTL module
- **Hardware Outputs:** Green LED, red LED, buzzer
- **Development Server:** Python HTTP server
- **Supported Serial Browsers:** Google Chrome and Microsoft Edge on desktop

**Build requirements:** No bundler or build step is required. MediaPipe is loaded through a CDN.

---

## 🔌 Hardware Setup

### Required Components

- STM32F103C8T6 Blue Pill microcontroller
- CP2102 USB-to-TTL module
- Green LED for the AWAKE state
- Red LED for the SLEEP state
- Buzzer for the SLEEP state
- 220Ω resistors for LEDs, as appropriate
- Breadboard and jumper wires
- Webcam
- USB cables and a suitable power source

### Wiring Diagram

```text
CP2102 USB-to-TTL       STM32F103C8T6 Blue Pill
------------------------------------------------
TXD                     PA10 (USART1_RX)
RXD                     PA9  (USART1_TX)
GND                     GND
3.3V                    3.3V (if suitable for the setup)

STM32 GPIO              Output
------------------------------------------------
PC13                    Green LED
PC14                    Red LED
PC15                    Buzzer
```

**Important wiring notes:**

- Connect CP2102 TXD to STM32 RX (PA10).
- Connect CP2102 RXD to STM32 TX (PA9).
- Ensure both devices share a common ground.
- Configure USART1 for 9600 baud, 8 data bits, no parity, and one stop bit (8N1).
- Verify the specific board's pinout, LED polarity, GPIO capabilities, and buzzer requirements before connecting components.
- Do not connect a 5V signal directly to STM32 GPIO or serial pins unless the particular interface is confirmed to be 5V tolerant. Use compatible 3.3V logic levels.
- Confirm the correct power supply and wiring before powering the circuit.

### STM32 Firmware Requirements

The microcontroller firmware should:

- Initialize USART1 at 9600 baud using 8N1 serial configuration.
- Listen for single-byte ASCII commands.
- Receive `A` to activate the green LED and turn off the red LED and buzzer.
- Receive `S` to activate the red LED and buzzer and turn off the green LED.
- Operate as a receive-only device for this protocol.

**Note:** The browser application communicates with the STM32 through the CP2102 USB-to-TTL interface. The microcontroller must have compatible firmware installed for the hardware alerts to work.

---

## 🚀 Installation & Setup

### Prerequisites

- Google Chrome or Microsoft Edge on desktop
- A working webcam
- Python 3
- CP2102 driver installed, if required by the operating system
- STM32 board with compatible firmware for hardware integration
- Internet connection to load MediaPipe assets from the CDN

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd anti-sleep-alarm
```

Replace `<your-repository-url>` with the actual repository URL.

### 2. Start a Local HTTP Server

```bash
python -m http.server 8000
```

### 3. Open the Application

Navigate to:

```text
http://localhost:8000
```

The application should be served through `localhost` or a suitable HTTPS origin. Opening `index.html` directly through `file://` will not provide the required browser API access.

### 4. Start Monitoring

1. Allow webcam permission when prompted.
2. Start the camera from the monitoring interface.
3. Position your face clearly in the camera view.
4. Optionally calibrate your normal open-eye baseline.
5. Monitor eye closure, state changes, and event logs.

### 5. Connect the Hardware

1. Connect the CP2102 module to the computer through USB.
2. Connect the CP2102 to the STM32 using the correct TX, RX, and GND connections.
3. Click **Connect Device** in the application.
4. Select the appropriate serial port in the browser prompt.
5. Verify that the interface shows the connected state.
6. Test the hardware using the manual `A` and `S` command buttons.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `C` | Connect or disconnect the device |
| `K` | Start calibration when the camera is running |
| `Space` | Start or stop the camera |

---

## 🖥️ User Interface

### Intro Screen

- Animated project title and eye icon
- Short introductory screen
- Automatic transition to the monitoring interface
- Option to skip the introduction

### Live Monitor

**Video Panel**
- Mirrored webcam feed
- Facial landmark overlay
- Eye contour highlights
- Green or red visual indicators corresponding to the current state

**Status Panel**
- Current AWAKE or SLEEP state
- Eye closure percentage and threshold marker
- Eye closure and recovery timers
- Left and right eye EAR values
- Frames per second (FPS)
- Face detection status
- Last state change
- Serial device connection status

**Control Panel**
- Device connection controls
- Settings drawer
- Simulate Awake and Simulate Sleep buttons
- Manual hardware test panel
- Last transmitted byte and timestamp
- Timestamped event log

---

## 🧪 Testing

### Test 1: Normal Blinking

1. Start the camera.
2. Blink normally.
3. Verify that the system remains in the AWAKE state.
4. Confirm that normal blinks do not trigger a sleep alert.

### Test 2: Prolonged Eye Closure

1. Start the camera.
2. Close your eyes for at least three seconds.
3. Verify that the system transitions to SLEEP.
4. Check that the status indicator turns red.
5. If the hardware is connected, verify that the red LED and buzzer activate.

### Test 3: Recovery

1. From SLEEP, open your eyes.
2. Keep them open for at least three seconds.
3. Verify that the system returns to AWAKE.
4. Confirm that the green LED turns on and the red LED and buzzer turn off.

### Test 4: Calibration

1. Start the camera.
2. Click Calibrate.
3. Keep your eyes naturally open for three seconds.
4. Verify that calibration completes and the baseline EAR is recorded.

### Test 5: Simulated State Changes

1. Click Simulate Awake.
2. Verify the AWAKE state.
3. Click Simulate Sleep.
4. Verify the SLEEP state and corresponding event log entry.

### Test 6: Face Detection

1. Move out of the camera's view.
2. Verify that the interface reports that no face is detected.
3. Confirm that timers behave according to the configured no-face handling.

### Test 7: Settings

1. Open Settings.
2. Adjust the closure threshold and hold durations.
3. Enable the browser beep.
4. Apply the changes.
5. Verify that the updated settings affect monitoring.

### Test 8: Hardware Communication

1. Connect the STM32 through the CP2102 interface.
2. Send `A` using the hardware test panel and check the green LED.
3. Send `S` and check the red LED and buzzer.
4. Verify the last-byte display and event log.
5. Disconnect the device and verify the application reports the disconnection.

---

## 🛡️ Safety & Reliability Considerations

- The system estimates drowsiness from visual eye-closure indicators; it does not medically diagnose fatigue.
- Detection can be affected by lighting, camera position, occlusions, glasses, and individual facial characteristics.
- A webcam or serial connection failure can prevent the corresponding detection or hardware alert from working.
- Browser audio may require user interaction before playback is permitted.
- The application is a prototype and should not be treated as a replacement for adequate rest, safe driving practices, or certified driver safety systems.
- Drivers should stop in a safe location when tired rather than relying on an alarm to remain awake.

---

## 🔧 Troubleshooting

### Camera Not Starting

- Check that webcam permission has been granted.
- Close other applications that may be using the camera.
- Refresh the application and try again.
- Ensure the page is running on `localhost` or HTTPS.

### MediaPipe Model Not Loading

- Check your internet connection.
- Confirm that CDN resources are accessible.
- Check the browser console for loading errors.

### Detection Is Inaccurate

- Improve the lighting.
- Keep your face clearly visible.
- Adjust your camera position.
- Run calibration.
- Review the closure threshold and hold-duration settings.

### Serial Device Not Connecting

- Use desktop Chrome or Edge.
- Check the CP2102 driver.
- Close other programs using the serial port.
- Verify the TX/RX crossover and common ground.
- Confirm that the STM32 and browser use the same baud rate.

### Hardware Not Responding

- Confirm that compatible firmware is installed.
- Verify USART1 pin assignments.
- Check power and wiring.
- Inspect LED polarity, resistors, and buzzer connections.
- Verify that the firmware recognizes the ASCII commands `A` and `S`.

### Browser Beep Not Working

- Enable the browser beep in Settings.
- Check the device's audio volume.
- Interact with the page if the browser requires user activation before playing audio.
- Confirm that the system is in the SLEEP state.

---

## 📁 Project Structure

```text
anti-sleep-alarm/
├── index.html           # Main HTML file
├── css/
│   └── style.css        # Styling and state transitions
├── js/
│   ├── app.js           # Application entry point and settings
│   ├── detector.js      # MediaPipe integration and EAR calculation
│   ├── stateMachine.js  # AWAKE/SLEEP state logic
│   ├── serialService.js # Web Serial API communication
│   └── ui.js            # User interface updates
└── README.md            # Project documentation
```

---

## 🎓 Learning Outcomes

🧠 Understanding computer vision-based drowsiness detection  
👁️ Applying facial landmarks and Eye Aspect Ratio calculations  
⚙️ Exploring STM32 microcontroller integration  
🔌 Learning serial communication between browser software and hardware  
💻 Building interactive applications with HTML, CSS, and JavaScript  
🧪 Implementing state machines, calibration, and signal smoothing  
🔧 Understanding hardware-software integration and circuit connections  
🚗 Applying engineering concepts to real-world road safety challenges  

---

## 🚀 Future Enhancements

🤖 Improved drowsiness detection using advanced computer vision models  
📊 Monitoring history, statistics, and event reports  
🔊 Adaptive alerts based on the duration and severity of detected drowsiness  
📱 Responsive monitoring interface for different screen sizes  
🚘 Integration with additional driver safety systems  
🧠 Enhanced detection under varying lighting and camera conditions  
🔔 Additional alert mechanisms and configurable notification patterns  

---

## 👤 Creator

**Bhavith Madhav**    
Cybersecurity & Network Security Enthusiast

---

<div align="center">

**Designed and created by Bhavith Madhav**

*Making driving safer through intelligent monitoring and timely alerts.*

</div>
