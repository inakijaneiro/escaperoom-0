import {RGBELoader} from "../libs/three.js/loaders/RGBELoader.js"
var instructions, blocker, noteHTML;
let loading = true;
let lightsFirstTurned = false;
var audioListener = new THREE.AudioListener();
var sound = new THREE.Audio( audioListener );
var audioLoader = new THREE.AudioLoader();
var loader = new THREE.GLTFLoader();
let currentObject;
let isNoteDisplayed = false;

var dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath( '/examples/js/libs/draco/' );
loader.setDRACOLoader( dracoLoader );
let note, usb, gun, key;


var camera, scene, renderer, reticle, clock, pmremGenerator, light, lightSwitch;

let lightEnv, darkEnv, lightOn = false;
let gtlfObj;
let controls = null;
let collidableObjects = [];
const PLAYERCOLLISIONDISTANCE = 2;
let globalRayCaster = new THREE.Raycaster();

// Flags to determine which direction the player is moving
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

// Velocity vector for the player
var playerVelocity = new THREE.Vector3();

// How fast the player will move
var PLAYERSPEED = 0.01;

var clock;




let textureLoader = new THREE.TextureLoader();

/**
 * Function that handles game over. It is triggered when the player finds the key.
 */
function gameOver() {
    scene.remove(gtlfObj);
    scene.remove(key);
    scene.remove(lightSwitch);
    camera.remove(reticle);
    // scene.background = null;
    document.getElementById("won").style.display = "block"
}

/**
 * Function to handle a player finding the gun
 */
function grabGun() {
    scene.remove(gun);
    loader.load(
        // resource URL
        'src/models/gltf/key/scene.gltf',
        // called when the resource is loaded
        function ( gltf ) {
        key = gltf.scene;
        currentObject = key;
        gltf.scene.scale.set( 0.025, 0.025, 0.025 );			   
        gltf.scene.position.x = 1.6;				    //Position (x = right+ left-) 
        gltf.scene.position.y = -1.6;				    //Position (y = up+, down-)
        gltf.scene.position.z = 2.0;				    //Position (z = front +, back-)

        scene.add( gltf.scene );
        }
    );
    setUpAudio("key");
}

/**
 * Function to handle a player finding the USB.
 */
function grabUSB() {
    scene.remove(usb);
    loader.load(
        // resource URL
        'src/models/gltf/gun/scene.gltf',
        // called when the resource is loaded
        function ( gltf ) {
        gun = gltf.scene;
        currentObject = gun;
        gltf.scene.scale.set( 0.001, 0.001, 0.001 );			   
        gltf.scene.position.x = 4.1;				    //Position (x = right+ left-) 
        gltf.scene.position.y = -0.7;				    //Position (y = up+, down-)
        gltf.scene.position.z = -3.5;				    //Position (z = front +, back-)
        // gltf.scene.rotation.z = -Math.PI / 2;				    
        gltf.scene.rotation.x = Math.PI;				    

        scene.add( gltf.scene );
        }
    );
    setUpAudio("gunshots");
}

/**
 * Function that handles a player finding the note.
 */
function openNote() {
    scene.remove(note);
    noteHTML = document.getElementById("note");
    noteHTML.style.display = "block";
    isNoteDisplayed = true;

    loader.load(
        // resource URL
        'src/models/gltf/usb/scene.gltf',
        // called when the resource is loaded
        function ( gltf ) {
        usb = gltf.scene;
        currentObject = usb;
        gltf.scene.scale.set( 0.01, 0.01, 0.01 );			   
        gltf.scene.position.x = 0.7;				    //Position (x = right+ left-) 
        gltf.scene.position.y = -1.2;				    //Position (y = up+, down-)
        gltf.scene.position.z = -3.85;				    //Position (z = front +, back-)			    

        scene.add( gltf.scene );
        }
    );
}

/**
 * Function that triggers on or off the light if it is the current focused object.
 */
function createLight() {
    if (lightOn) {
        scene.remove(light);
        lightOn = false;
        scene.background = darkEnv;
        scene.environment = darkEnv;
    }
    else {
        scene.add(light);
        lightOn = true;
        scene.background = lightEnv;
        scene.environment = lightEnv;
    }

    if (!lightsFirstTurned) {
        lightsFirstTurned = true;
        currentObject = null;
        setUpAudio("figureOut");
        loader.load(
            // resource URL
            'src/models/gltf/paper/scene.gltf',
            // called when the resource is loaded
            function ( gltf ) {
            note = gltf.scene;
            currentObject = note;
            gltf.scene.scale.set( 0.003, 0.003, 0.003 );			   
            gltf.scene.position.x = -0.75;				    //Position (x = right+ left-) 
            gltf.scene.position.y = -0.42;				    //Position (y = up+, down-)
            gltf.scene.position.z = 0.15;				    //Position (z = front +, back-)
            gltf.scene.rotation.z = -Math.PI / 2;				    
            gltf.scene.rotation.y = Math.PI / 2;				    
    
            scene.add( gltf.scene );
            }
        );
    }

}

/**
 * Function that creates the invisible box-boundaries for the house wall support.
 */
function loadBoundaries() {
    var geometry = new THREE.BoxGeometry( 10, 1, 1 );
    var material = new THREE.MeshPhongMaterial( {color: 0x00ff00} );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.z = -8.5;
    cube.visible = false;

    scene.add(cube);
    collidableObjects.push(cube);

    cube = new THREE.Mesh( geometry, material );
    cube.position.z = 3;
    cube.visible = false;
    scene.add(cube);
    collidableObjects.push(cube);


    geometry = new THREE.BoxGeometry( 1, 1, 12 );
    cube = new THREE.Mesh( geometry, material );
    cube.position.x = -4.5;
    cube.position.z= -2;
    cube.visible = false;

    scene.add(cube);
    collidableObjects.push(cube);


    geometry = new THREE.BoxGeometry( 1, 1, 12 );
    cube = new THREE.Mesh( geometry, material );
    cube.position.x= 4.5;
    cube.position.z= -2;
    cube.visible = false;
    scene.add(cube);
    collidableObjects.push(cube);

    geometry = new THREE.BoxGeometry( 3, 1, 8 );
    cube = new THREE.Mesh( geometry, material );
    cube.position.z= -0.5;
    cube.visible = false;
    scene.add(cube);
    collidableObjects.push(cube);

    
}

/**
 * Function that loads the first elements of the scene: the room, the light switch and the environment map.
 */
function loadScene() {

    // Load a glTF resource
    loader.load(
        // resource URL
        'src/models/gltf/scene/scene.gltf',
        // called when the resource is loaded
        function ( gltf ) {
        gtlfObj = gltf.scene;
        gltf.scene.scale.set( 1, 1, 1 );			   
        gltf.scene.position.x = 0;				    //Position (x = right+ left-) 
        gltf.scene.position.y = -2;				    //Position (y = up+, down-)
        gltf.scene.position.z = -2;				    //Position (z = front +, back-)


        gltf.scene.traverse(child => {
            if (child.isMesh){
                collidableObjects.push(child)
            }
        })

        scene.add( gltf.scene );
        },
        // called while loading is progressing
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
    );

    loader.load(
        // resource URL
        'src/models/gltf/switch/scene.gltf',
        // called when the resource is loaded
        function ( gltf ) {
        lightSwitch = gltf.scene;
        currentObject = lightSwitch;
        gltf.scene.scale.set( 4, 4, 4 );
        gltf.scene.rotation.y = -Math.PI / 2;				   
        gltf.scene.position.x = 2;				    //Position (x = right+ left-) 
        gltf.scene.position.y = 0;				    //Position (y = up+, down-)
        gltf.scene.position.z = 0;				    //Position (z = front +, back-)

        scene.add( gltf.scene );
        }
    );
    
    pmremGenerator = new THREE.PMREMGenerator( renderer );

    new RGBELoader()
    .setDataType( THREE.UnsignedByteType )
    .setPath( 'src/models/' )
    .load( 'satara_night_no_lamps_1k.hdr', function ( texture ) {

        darkEnv = pmremGenerator.fromEquirectangular( texture ).texture;

        scene.background = darkEnv;
        scene.environment = darkEnv;
        
    });

    new RGBELoader()
    .setDataType( THREE.UnsignedByteType )
    .setPath( 'src/models/' )
    .load( 'satara_night_1k.hdr', function ( texture ) {

        lightEnv = pmremGenerator.fromEquirectangular( texture ).texture;

    });

    light = new THREE.PointLight( 0xffffff, 1, 100, 1 );
    light.position.set( 0, 1, -2 ).normalize();

    loadBoundaries()
}

/**
 * Function that checks if the reticle collides with the current focused object at a minimum distance
 */
function checkCollision() {
    let objs = []
    globalRayCaster.set( camera.getWorldPosition(), camera.getWorldDirection() );
    currentObject.traverse(child => {
        if (child.isMesh) {
            objs.push(child)
        }
    })
    var intersections = globalRayCaster.intersectObjects( objs );
    if (intersections.length > 0) {
        if (intersections[0].distance <= 3.5)
            if (currentObject === lightSwitch)
                createLight();
            else if (currentObject === note)
                openNote();
            else if (currentObject === usb)
                grabUSB();
            else if (currentObject === gun)
                grabGun();
            else if (currentObject === key)
                gameOver();

    }
}

/**
 * Player movement listener.
 */
function listenForPlayerMovement() {
    
    // A key has been pressed
    var onKeyDown = function(event) {
    switch (event.keyCode) {

      case 38: // up
      case 87: // w
        moveForward = true;
        break;

      case 37: // left
      case 65: // a
        moveLeft = true;
        break;

      case 40: // down
      case 83: // s
        moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        moveRight = true;
        break;
      case 13:
          if (isNoteDisplayed) {
              isNoteDisplayed = false;
              noteHTML.style.display = "none";
              setUpAudio("people");
          }
        break;
    }
  };

  // A key has been released
    var onKeyUp = function(event) {

    switch (event.keyCode) {

      case 38: // up
      case 87: // w
        moveForward = false;
        break;

      case 37: // left
      case 65: // a
        moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        break;
    case 27: // d
        controls.unlock();
        break;
    }
  };

  // Add event listeners for when movement keys are pressed and released
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  //add event listener to your document.body
  document.body.addEventListener( 'click', function () {
    //lock mouse on screen
    controls.lock();
    checkCollision();


}, false );
}

/**
 * Function to instanciate and setup PointerLockControls
 */
function initControls() {
    controls = new THREE.PointerLockControls( camera, renderer.domElement);
    var geometry = new THREE.CircleBufferGeometry( 0.005, 32 );
    var material = new THREE.MeshBasicMaterial( { color: 0xaaaaaa } );
    reticle = new THREE.Mesh( geometry, material );
    reticle.position.set( 0, 0, -1 ); // or whatever distance you want
    scene.add( controls.getObject() ); // required zwhen the camera has a child
    controls.getObject().add( reticle );

    // add event listener to show/hide a UI (e.g. the game's menu)
    controls.addEventListener( 'lock', function () {
        if (loading) return;
        blocker.style.display = "none";
        instructions.innerHTML = "";


    } );

    controls.addEventListener( 'unlock', function () {
        if (loading) return;
        blocker.style.display = "block";
        instructions.innerHTML = "Paused";

    } );

    listenForPlayerMovement();

}

/**
 * Function for background music setup.
 */
function setBackgroundMusic() {
    // create an AudioListener and add it to the camera
    var listener = new THREE.AudioListener();
    camera.add( listener );

    // create a global audio source
    var sound = new THREE.Audio( listener );

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'src/audio/music.mp3', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( 0.3 );
        sound.play();
    });
}

/**
 * Entry point of the app
 * @param canvas The HTML Canvas document object.
 */
function init(canvas) 
{

    blocker = document.getElementById("blocker");
    instructions = document.getElementById("instructions");
    blocker.style.display = "block";

    
    setTimeout( () => {
        blocker.style.display = "none";
        setUpAudio("lights");
        loading = false;
        
    }, 6000)
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 200);
    camera.position.set(2, 0, -4);
    camera.lookAt(2, 0, -2)
    
    setBackgroundMusic();

	scene = new THREE.Scene();

	clock = new THREE.Clock();

	// createMaterials();
    
	
	renderer = new THREE.WebGLRenderer( { canvas:canvas, antialias: true} );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor(0xaaaaaa);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;    

	loadScene();

    initControls();

	onWindowResize();

	window.addEventListener( 'resize', onWindowResize, false );

	animate();

}

/**
 * Function that handles the window resize event.
 */
function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

/**
 * Function that animates the player movement.
 */
function animatePlayer() {
    // Gradual slowdown
    playerVelocity.x -= playerVelocity.x * 0.1 ;
    playerVelocity.z -= playerVelocity.z * 0.1 ;

    // If no collision and a movement key is being pressed, apply movement velocity
    if (detectPlayerCollision() == false) {
        if (moveForward) {
            playerVelocity.z += PLAYERSPEED;
        }
        if (moveBackward) {
            playerVelocity.z -= PLAYERSPEED;
        } 
        if (moveLeft) {
            playerVelocity.x -= PLAYERSPEED;
        }
        if (moveRight) {
            playerVelocity.x += PLAYERSPEED ;
        }

        controls.moveRight(playerVelocity.x);
        controls.moveForward(playerVelocity.z);
    } else {
        // Collision or no movement key being pressed. Stop movememnt
        playerVelocity.x = 0;
        playerVelocity.z = 0;
    }
}

/**
 * Runs animation frames.
 */
function animate() {

	requestAnimationFrame( animate );

	render();

}

/**
 * Calls render methods
 */
function render() {

	var delta = 5 * clock.getDelta();

    renderer.render(scene, camera);
    animatePlayer(delta);

}

$(document).ready(
    function() {						
        init(document.getElementById("webglcanvas"));
        render();
    }
);

/**
 * Detects collision with player and walls.
 */
function detectPlayerCollision() {
    // The rotation matrix to apply to our direction vector
    // Undefined by default to indicate ray should coming from front
    var rotationMatrix;
    // Get direction of camera
    var cameraDirection = controls.getDirection(new THREE.Vector3(0, 0, 0)).clone();

    // Check which direction we're moving (not looking)
    // Flip matrix to that direction so that we can reposition the ray
    if (moveBackward) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(180));
    }
    else if (moveLeft) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(90));
    }
    else if (moveRight) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(270));
    }

    // Player is not moving forward, apply rotation matrix needed
    if (rotationMatrix !== undefined) {
        cameraDirection.applyMatrix4(rotationMatrix);
    }

    // Apply ray to player camera
    var rayCaster = new THREE.Raycaster(controls.getObject().position, cameraDirection);

    // If our ray hit a collidable object, return true
    if (rayIntersect(rayCaster, PLAYERCOLLISIONDISTANCE, collidableObjects)) {
        return true;
    } else {
        return false;
    }
}

/**
 * Performs a raycaster intersect check
 * @param {THREE.Raycaster} ray The Raycaster instance
 * @param {number} distance  Maximum collision distance
 * @param {Object[]} objects Objects to check
 */
function rayIntersect(ray, distance, objects) {
    var intersects = ray.intersectObjects(objects, true);
    for (var i = 0; i < intersects.length; i++) {
        // Check if there's a collision
        if (intersects[i].distance < distance) {
            return true;
        }
    }
    return false;
}

/**
 * Util function to convert degrees to radians
 * @param {number} degrees 
 */
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}
  
/**
 * Util function to convert radians to degrees
 * @param {number} radians 
 */
function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

/**
 * Plays a given audio file.
 * @param {string} audio The filename of the audio to play
 */
function setUpAudio(audio) {
// add the listener to the camera
camera.add( audioListener );


// add the audio object to the scene
scene.add( sound );

// load a resource
audioLoader.load(
	// resource URL
	`src/audio/${audio}.mp3`,

	// onLoad callback
	function ( audioBuffer ) {
		// set the audio object buffer to the loaded object
		sound.setBuffer( audioBuffer );

		// play the audio
		sound.play();
	}
);
}

  