// Performance optimization flags
const USE_OPTIMIZED_MATH = true;        // Use fast approximations when possible
const RENDER_OBJECTS_ONLY_WHEN_NEEDED = true; // Only render when values change
const ADAPTIVE_RENDERING = true;        // Reduce render quality when moving fast


// ***************************   Connect UI elements ************************************
const connectBtn = document.getElementById('connectBtn');
const calibrateBtn = document.getElementById('calibrateBtn');
const smoothingCheckbox = document.getElementById('smoothingCheckbox');
const gridCheckbox = document.getElementById('gridCheckbox');
const modelCheckbox = document.getElementById('modelCheckbox');
const rollStat = document.getElementById('rollStat');
const pitchStat = document.getElementById('pitchStat');
const yawStat = document.getElementById('yawStat');
        
// Convert degrees to radians - optimized
const DEG_TO_RAD = Math.PI / 180;
function degToRad(degrees) {
    return degrees * DEG_TO_RAD;
}
// ----------------------------------------------------------------------------------------------------


// *****************************  Setup Three.js Scene with optimizations *****************************
        const scene = new THREE.Scene();
	const loader = new THREE.GLTFLoader();
        scene.background = new THREE.Color(0x222222);
        
	// Rotate the entire scene
	scene.rotation.x = Math.PI / 2;  // Swap Y and Z axes

        // Camera setup with better perspective
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Adjust camera position after rotation
	camera.position.set(0, 2, 5);  // Adjust the camera position to match
	camera.lookAt(0, 0, 0);  // Make sure the camera looks at the center of the scene
        
        // Renderer with performance optimizations
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            precision: "highp"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
        document.body.appendChild(renderer.domElement);
        
        // Add lights for better visualization
        const ambientLight = new THREE.AmbientLight(0x606060);
        scene.add(ambientLight);

	// Add lighting (optional)
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(10, 10, 10);
	scene.add(directionalLight);
        
        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-1, 1, -1);
        scene.add(backLight);

        // Add a grid for reference
        const gridHelper = new THREE.GridHelper(15, 15, 0x555555, 0x333333);
	// Flip the Y-axis (rotate 180 degrees)
	//gridHelper.rotation.y = Math.PI;  // Flip around Y-axis

	// Flip the Z-axis (rotate 180 degrees)
	//gridHelper.rotation.z = Math.PI;  // Flip around Z-axis

	// Rotate to position on the X-Y plane
	gridHelper.rotation.x = Math.PI / 2;  // Rotate 90 degrees around X-axis to make it lie on the X-Y plane

	// Add to the scene
	scene.add(gridHelper);
        
        // Handle window resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }, 100);
        });
//----------------------------------------------------------------------------------------------------------------------------------------------
     

// *********************  Create enhanced 3D object to represent IMU  *************************
// Global variables
let imuObject;
let currentModel = null;


function createIMUObject() {
    const group = new THREE.Group();
    
    // Create a loading manager to track progress
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function(item, loaded, total) {
        console.log(item, loaded, total);
    };

    return group;
}  

function loadModel(parentGroup) {
     // Clear any existing model
     while(parentGroup.children.length > 0) {
         const child = parentGroup.children[0];
         parentGroup.remove(child);
     }

     // Attach DracoLoader
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');  // Correct path
    loader.setDRACOLoader(dracoLoader);
	
    if (modelCheckbox.checked) {
        loader.load(
            //Available models: 
	    '3d_models/Saturn V.glb',
	    //'3d_models/Explorer Jupiter-C Rocket.glb',
	    //'3d_models/International Space Station.glb',
	    //'3d_models/Deep Space 1.glb',
	    //'3d_models/Advanced Crew Escape Suit.glb',  
    
        function(gltf) {
                // Success callback
                const rocket = gltf.scene;

                 // Scale the rocket appropriately (adjust values as needed)
                 rocket.scale.set(0.2, 0.2, 0.2);         // Saturn V
                
                // Center the rocket if needed
                rocket.position.set(0, -0.15, 0.5);
		rocket.rotation.set(-Math.PI/2, 0, 0); // Example rotation if needed
                
                // Add the rocket to the group
                parentGroup.add(rocket);
                
                console.log('Rocket model loaded successfully');
             },
            function(xhr) {
                // Progress callback
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                // Error callback
                console.error('An error occurred loading the model:', error);
                createCube(parentGroup);    // Fallback to cube
            }
        );
    } else {
        // Create a cube directly
        createCube(parentGroup);
    }

// Add arrows to represent axes (thicker and more visible)
    const arrowLength = 1.8;
    const headLength = 0.3;
    const headWidth = 0.15;
    
    // X-axis (red) - Roll
    const xArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        arrowLength,
        0xff0000,
        headLength,
        headWidth
    );
    parentGroup.add(xArrow);
    
    // Y-axis (green) - Pitch
    const yArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        arrowLength,
        0x00ff00,
        headLength,
        headWidth
    );
    parentGroup.add(yArrow);
    
    // Z-axis (blue) - Yaw
    const zArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        arrowLength,
        0x0088ff,
        headLength,
        headWidth
    );
    parentGroup.add(zArrow);
}


 // Fallback to the original box if loading fails
function createCube(parentGroup) {
        const geometry = new THREE.BoxGeometry(2, 0.5, 2);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x00a2ff,
            specular: 0x444444,
            shininess: 60,
            flatShading: false
        });
        const box = new THREE.Mesh(geometry, material);
            
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 1 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        box.add(edges);
        box.rotation.set(Math.PI/2, 0, 0); // Example rotation if needed

        parentGroup.add(box);
        console.warn('Falling back to cube due to model loading error');
}

// Initialize
imuObject = createIMUObject();
scene.add(imuObject);

// Load initial model based on checkbox state
loadModel(imuObject);

// Add checkbox event listener
modelCheckbox.addEventListener('change', function() {
    loadModel(imuObject);
});
//----------------------------------------------------------------------------------------------------------------------------------------------
               
        
//****************************************    Web Serial API for connecting to the IMU device  *********************************************************
let port;
let reader;
let running = false;
    
// Serial connection
connectBtn.addEventListener('click', async () => {

    if (!('serial' in navigator)) {
        alert('Web Serial API not supported in your browser. Try Chrome or Edge.');
        return;
    }
        
    try {
        if (!port) {
            // Request port and open connection
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 }); // Default Arduino baud rate
                   
            // Update UI
            connectBtn.textContent = "Connected";
 	    connectBtn.disabled = true;
            calibrateBtn.disabled = false;
               
            // Start reading data
            startReading();
         }
         else {
            // Disconnect
            stopReading();
            await port.close();
            port = null;
                
            // Update UI
            connectBtn.textContent = "Connect to Serial Port";
            calibrateBtn.disabled = true;
        }
    } 
    catch (error) {
         console.error('Serial connection error:', error);
         alert('Failed to connect: ' + error.message);
    }
});
       
// Improved serial reading with buffer handling
async function startReading() {
    if (!port) return;    
    reader = port.readable.getReader();
    running = true;           
    const decoder = new TextDecoder();
    let buffer = '';
            
    try {
        while (running) {
            const { value, done } = await reader.read();
            if (done) break;
                    
            // Add new data to buffer
            buffer += decoder.decode(value, { stream: true });
                
            // Process complete lines
            let lineEnd;
            while ((lineEnd = buffer.indexOf('\n')) !== -1) {
                const line = buffer.substring(0, lineEnd).trim();
                buffer = buffer.substring(lineEnd + 1);
                        
                if (line.length > 0) {
                    processIMUData(line);
                }
            }
                    
           // Prevent buffer from growing too large
            if (buffer.length > 1000) {
                buffer = buffer.substring(buffer.length - 1000);
            }
        }
    }
 
    catch (error) {
        console.error('Error reading from device:', error);
    }
    finally {
        if (reader) {
            reader.releaseLock();
            reader = null;
        }
    }
}
        
function stopReading() {
    running = false;
    if (reader) {
        reader.cancel();
    }
}
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// ******************************************************** Using Kalman Filter *****************************************************************
class KalmanFilter {
    constructor(q = 0.01, r = 0.1, p = 1, initial_value = 0) {
        this.q = q; // Process noise covariance
        this.r = r; // Measurement noise covariance
        this.p = p; // Estimation error covariance
        this.x = initial_value; // Estimated state
        this.k = 0; // Kalman gain
    }

    update(measurement) {
        // Prediction update
        this.p += this.q;

        // Measurement update
        this.k = this.p / (this.p + this.r);
        this.x += this.k * (measurement - this.x);
        this.p *= (1 - this.k);

        return this.x;
    }
}

// Initialize Kalman filters for roll, pitch, and yaw
// Kalman filters for smoothing
const rollFilter = new KalmanFilter(0.05, 0.1);  // More responsive
const pitchFilter = new KalmanFilter(0.05, 0.1);
const yawFilter = new KalmanFilter(0.01, 0.1);

// **************************************** IMU Data Processing ******************************************************************* 
// Global variables for orientation
let roll = 0, pitch = 0, yaw = 0;
let targetRoll = 0, targetPitch = 0, targetYaw = 0;
let currentRoll = 0, currentPitch = 0, currentYaw = 0;
let yawOffset = 0;
let lastUpdateTime = Date.now();

// Dynamic smoothing for better responsiveness
let baseSmoothingFactor = 0.3;
let adaptiveSmoothingFactor = baseSmoothingFactor;
let lastOrientationChange = 0;
let isMoving = false;
       
function processIMUData(data) {
    try {
        const imuData = JSON.parse(data);

        if ('ax' in imuData && 'ay' in imuData && 'az' in imuData && 'gx' in imuData && 'gy' in imuData && 'gz' in imuData) {
            const now = Date.now();
            const dt = (now - lastUpdateTime) / 1000.0;  
            lastUpdateTime = now;

	   const GYRO_SCALE = 1;  // Scale factor for visible cube movement
	   const ALPHA = 0.9;  // Complementary filter constant (higher = trust gyro more)

            // Compute roll and pitch from accelerometer data
            const pitchAcc = Math.atan2(-imuData.ax, Math.sqrt(imuData.ay ** 2 + imuData.az ** 2)) * (180 / Math.PI);
            const rollAcc = Math.atan2(imuData.ay, imuData.az) * (180 / Math.PI);

            // If first reading, initialize roll, pitch, yaw using accelerometer (to prevent jumps)
            if (roll === 0 && pitch === 0 && yaw === 0) {
                roll = rollAcc;
                pitch = pitchAcc;
                yaw = 0;  // Initialize yaw at 0 (or use imuData.gz if you have a reference)
                
                // Also initialize target and current values
                targetRoll = roll;
                targetPitch = pitch;
                targetYaw = yaw;
                currentRoll = roll;
                currentPitch = pitch;
                currentYaw = yaw;
            }

            // Yaw integration from gyro (with scaling)
            yaw += imuData.gz * dt * GYRO_SCALE;

            // Complementary filter: combine gyro & accelerometer data
            roll = ALPHA * (roll + imuData.gx * dt * GYRO_SCALE) + (1 - ALPHA) * rollAcc;
            pitch = ALPHA * (pitch + imuData.gy * dt * GYRO_SCALE) + (1 - ALPHA) * pitchAcc;

           // Apply Kalman filter to smooth the results
            targetRoll = rollFilter.update(roll);
            targetPitch = pitchFilter.update(pitch);
            targetYaw = yawFilter.update(yaw);

            updateOrientation();  	 
        }
    } catch (e) {
        console.error('Error parsing IMU data:', e);
    }
}


// ******************************************  Orientation data and improved adaptive Smoothing ************************************************
                
// Calculate movement magnitude to adjust smoothing dynamically
function calculateMovementMagnitude(newRoll, newPitch, newYaw) {
    const rollDiff = Math.abs(newRoll - targetRoll);
    const pitchDiff = Math.abs(newPitch - targetPitch);
    const yawDiff = Math.abs(newYaw - targetYaw);
    return Math.max(rollDiff, pitchDiff, yawDiff);
}
       
// Update smoothing based on movement
function updateAdaptiveSmoothing(movementMagnitude) {
    // Less smoothing for fast movements, more for slow precise movements
    if (movementMagnitude > 10) {
        adaptiveSmoothingFactor = Math.min(0.8, baseSmoothingFactor * 2);
        isMoving = true;
        lastOrientationChange = performance.now();
    } else if (movementMagnitude > 5) {
        adaptiveSmoothingFactor = baseSmoothingFactor * 1.5;
        isMoving = true;
        lastOrientationChange = performance.now();
    } else {
        // Gradually return to base smoothing when motion slows
        adaptiveSmoothingFactor = baseSmoothingFactor;
              
        // Check if we've been still for a while
        if (performance.now() - lastOrientationChange > 500) {
            isMoving = false;
        }
    }
}
        
   //********************************************************* Quaternion-based rotation implementation *****************************************************************
    function updateOrientation() {
    	// Get movement magnitude for adaptive smoothing
    	const movementMagnitude = calculateMovementMagnitude(targetRoll, targetPitch, targetYaw);
    	updateAdaptiveSmoothing(movementMagnitude);

    	if (smoothingCheckbox.checked) {
        	// Apply adaptive smoothing only if needed
        	currentRoll += adaptiveSmoothingFactor * (targetRoll - currentRoll);
        	currentPitch += adaptiveSmoothingFactor * (targetPitch - currentPitch);
        	currentYaw += adaptiveSmoothingFactor * (targetYaw - currentYaw);
    	} else {
        	// Direct update without smoothing
        	currentRoll = targetRoll;
        	currentPitch = targetPitch;
        	currentYaw = targetYaw;
    	}

    	// Apply yaw offset BEFORE converting to radians
    	const adjustedYaw = currentYaw - yawOffset;
   
   	 // Convert degrees to radians
    	const rollRad = THREE.MathUtils.degToRad(currentRoll);
        const pitchRad = THREE.MathUtils.degToRad(currentPitch);
        const yawRad = THREE.MathUtils.degToRad(adjustedYaw);
	
         // IMPORTANT CHANGE: Create a single Euler object with specific rotation order
        // Using 'ZYX' order: first yaw, then pitch, then roll
        const euler = new THREE.Euler(rollRad, -pitchRad, -yawRad, 'ZYX');
    
        // Convert Euler to Quaternion directly (preserves proper rotation order)
        const quaternion = new THREE.Quaternion().setFromEuler(euler);

        // Apply the rotation to the 3D object 
        imuObject.quaternion.copy(quaternion);

       // Update statistics display with improved formatting
       rollStat.textContent = currentRoll.toFixed(1) + "°";
       pitchStat.textContent = -currentPitch.toFixed(1) + "°";
       yawStat.textContent = -adjustedYaw.toFixed(1) + "°";

    	// Toggle grid visibility
    	gridHelper.visible = gridCheckbox.checked;
    }

    // Reset offset to current values 
    calibrateBtn.addEventListener('click', () => {
        pitchOffset = currentPitch;
        rollOffset = currentRoll;
        yawOffset = currentYaw;
        updateOrientation();  
    });
// -------------------------------------------------------------------------------------------------------------------------------------

        
        
//*************************************  Optimized animation loop  ************************************************
let lastRenderTime = 0;
const minRenderInterval = 1000 / 120; // Cap at 120fps for efficiency

function animate(time) {
    requestAnimationFrame(animate);
    // Limit render rate for efficiency
    // Ensure the scene renders at least at minRenderInterval
    const elapsed = time - lastRenderTime;
    if (RENDER_OBJECTS_ONLY_WHEN_NEEDED && elapsed < minRenderInterval && !isMoving) {
        return;
    }
            
   lastRenderTime = time;
    // Update orientation
    updateOrientation();
   	   
    // Adapt rendering quality based on movement
    if (ADAPTIVE_RENDERING) {
        renderer.setPixelRatio(isMoving ? 1.0 : Math.min(window.devicePixelRatio, 2));
    }

    // Ensure the scene is rendered
    renderer.render(scene, camera);
  }
        
// Start animation
animate(0);


// ####################################### END OF SCRIPT #####################################