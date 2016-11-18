function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

class App {
  constructor(canvas) {
    this.init(canvas);

    this.mainCamera = new Camera(this.stage,
                                 [0.0, 0.0, 0.0],
                                 [0.0, 0.0, 0.0],
                                 45,
                                 0.1,
                                 100.0);
    this.gameObjects = [];

    this.initBuffers(this.stage);

    this.stage.clearColor(0.0, 0.0, 0.0, 1.0);
    this.stage.enable(this.stage.DEPTH_TEST);

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    canvas.onmousedown = this.handleMouseDown;
    document.onmouseup = this.handleMouseUp;
    document.onmousemove = this.handleMouseMove;
    document.onkeydown = this.handleKeyDown;
    document.onkeyup = this.handleKeyUp;

    // State managers
    this.vel = [0.0, 0.0, 0.0]; // Move to camera
    this.keyDown = {};

    this.mouseDown = false;
    this.lastMouseX = null;
    this.lastMouseY = null; 

    this.selectedObj = null; // Move to some other script

    this.lastTime = 0;

    // Start the app
    this.tick();
  }

  init(canvas) {
    this.initGL(canvas);
    this.initShaders();
  
    App.loadScene(0); // For now, we have no scene and will load the triangle and square in code blocks
  }

  initGL(canvas) {
    this.stage = canvas.getContext("webgl");
    console.log(this.stage);
  }

  // Goes into shader utils
  _getShaderType(script, canvasCtx) {
    if (script.type === "x-shader/x-fragment") {
      return canvasCtx.FRAGMENT_SHADER;
    }
    else if (script.type === "x-shader/x-vertex") {
      return canvasCtx.VERTEX_SHADER;
    }
    else {
      return null;
    }
  }

  // Goes into shader utils
  _getShader(canvasCtx, id) {
    let script = document.getElementById(id);
  
    let source = script.text;
    let type = this._getShaderType(script, canvasCtx);
    let shader = canvasCtx.createShader(type);
    canvasCtx.shaderSource(shader, source);

    canvasCtx.compileShader(shader);

    return shader;
  }

  initShaders() {
    let fShader = this._getShader(this.stage, "shader-frag");
    let vShader = this._getShader(this.stage, "shader-vert");

    let shaderProgram = this.stage.createProgram();
    this.stage.attachShader(shaderProgram, vShader);
    this.stage.attachShader(shaderProgram, fShader);
    this.stage.linkProgram(shaderProgram);

    this.stage.useProgram(shaderProgram);

    this.shaderData = {
      program: shaderProgram,
      vertexPositionAttribute: this.stage.getAttribLocation(shaderProgram, "a_VertexPosition"),
      vertexColorAttribute: this.stage.getAttribLocation(shaderProgram, "a_VertexColor"),
      pMatrixUniform: this.stage.getUniformLocation(shaderProgram, "u_PMatrix"),
      mvMatrixUniform: this.stage.getUniformLocation(shaderProgram, "u_MVMatrix")
    }

    this.stage.enableVertexAttribArray(this.shaderData.vertexPositionAttribute);
    this.stage.enableVertexAttribArray(this.shaderData.vertexColorAttribute);
  }

  static loadScene(scene, canvasCtx) {
    // Go through each object in the scene and run Scene.initBuffers
    // Scene shape:
    // Scene {
    //  SceneObject[],
    //  lights?
    //  sounds?
    // }
    // SceneObject {
    //  vertices,
    //  colors,
    //  triangleMappings
    //  Elements?
    // }

    // Scene.initBuffers
    // Triangle
  }

  initBuffers() {
    let cubeFaceColors = [
      [1.0, 0.0, 0.0, 1.0], // Front
      [1.0, 1.0, 0.0, 1.0], // Back
      [0.0, 1.0, 0.0, 1.0], // Top
      [1.0, 0.5, 0.5, 1.0], // Bottom
      [1.0, 0.0, 1.0, 1.0], // Right
      [0.0, 0.0, 1.0, 1.0]  // Left
    ];

    let cubeColors = [];
    for (let color of cubeFaceColors) {
      for (let i=0; i<4; i++) {
        cubeColors = cubeColors.concat(color);
      }
    }

    let cubeMesh = new Shapes.CubeMesh(
      this.stage,
      [1.5, 0.0, -7.0],
      {
        degrees: -75,
        interval: 1000,
        axis: [1.0, 1.0, 1.0]
      },
      1.0,
      cubeColors 
    );

    let cubeBoundingMesh = {
      coordinates: cubeMesh.coordinates,
      extents: [1.0, 1.0, 1.0]
    }

    this.gameObjects.push(new GameObjects.Cube(cubeMesh.coordinates, cubeMesh, cubeBoundingMesh));
  }

  setMatrixUniforms() {
    this.stage.uniformMatrix4fv(this.shaderData.pMatrixUniform, 
                                false, 
                                this.mainCamera.pMatrix);
    this.stage.uniformMatrix4fv(this.shaderData.mvMatrixUniform, 
                                false, 
                                this.mainCamera.mvMatrix);
  }

  tick() {
    requestAnimationFrame(this.tick.bind(this));

    this.update();
    this.render();
  }

  handleMouseDown(e) {
    this.mouseDown = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    this.gameObjects.forEach((shape) => {
      shape.onMouseDown(e);
    });
  }

  handleMouseUp(e) {
    this.mouseDown = false;
    this.gameObjects.forEach((shape) => {
      shape.onMouseUp(e);
    });
  }

  handleMouseMove(e) {
    let newX = e.clientX;
    let newY = e.clientY;

    let deltaX = newX - this.lastMouseX;
    let rotation = mat4.create();
    mat4.identity(rotation);
    mat4.rotate(rotation, rotation, glMatrix.toRadian(deltaX / 8), [0, 1, 0]);

    let deltaY = newY - this.lastMouseY;
    mat4.rotate(rotation, rotation, glMatrix.toRadian(deltaY / 8), [1, 0, 0]);

    mat4.multiply(this.mainCamera.mvMatrix, 
                  this.mainCamera.mvMatrix, 
                  rotation);
    this.lastMouseX = newX;
    this.lastMouseY = newY;

    this.gameObjects.forEach((shape) => {
      shape.onMouseMove(e);
    });


    console.log(this.gameObjects);
    //new CollisionChecker.raycast(this.mainCamera.screenToWorldCoords(
  }

  handleKeyDown(e) {
    if (e.keyCode === "W".charCodeAt(0)) {
      this.keyDown["W"] = true;
    }
   
    if (e.keyCode === "S".charCodeAt(0)) {
      this.keyDown["S"] = true;
    }
    
    if (e.keyCode === "A".charCodeAt(0)) {
      this.keyDown["A"] = true;
    }
    
    if (e.keyCode === "D".charCodeAt(0)) {
      this.keyDown["D"] = true;
    }
  
  }

  handleKeyUp(e) {
    if (e.keyCode === "W".charCodeAt(0)) {
      this.keyDown["W"] = false;
    }
    
    if (e.keyCode === "S".charCodeAt(0)) {
      this.keyDown["S"] = false;
    }
    
    if (e.keyCode === "A".charCodeAt(0)) {
      this.keyDown["A"] = false;
    }
    
    if (e.keyCode === "D".charCodeAt(0)) {
      this.keyDown["D"] = false;
    }
  }

  updateVels() {
    if (this.keyDown["W"]) {
      this.vel[2] = 5.0 / 1000;
    }
    else if (this.keyDown["S"]) {
      this.vel[2] = -5.0 / 1000;
    }
    else {
      this.vel[2] = 0.0 / 1000;
    }
    
    if (this.keyDown["A"]) {
      this.vel[0] = 5.0 / 1000;
    }
    else if (this.keyDown["D"]) {
      this.vel[0] = -5.0 / 1000;
    }
    else {
      this.vel[0] = 0.0 / 1000;
    }
  }

  update() {
    let currentTime = new Date().getTime();
    let deltaTime = currentTime - this.lastTime;
    if (this.deltaTime != 0) {
      this.updateVels();

      let t = [0, 0, 0, 0];
      for (let i=0; i<this.vel.length; i++) {
        let moveDist = this.vel[i] * deltaTime;
        t[i] = moveDist;
      }

      // Solve for a: a^2 = 1^2 / (x^2 + y^2 + z^2)
      // Then, multiply forward vector by a to
      //  align t to the forward vector
      /*
      let forward = [];
      forward.push(this.mvMatrix[8]);
      forward.push(this.mvMatrix[9]);
      forward.push(this.mvMatrix[10]);

      let x = forward[0];
      let y = forward[1];
      let z = forward[2];
      let a = Math.sqrt(((t[0]*t[0]) + (t[1]*t[1]) + (t[2]*t[2])) / 
                        ((x*x) + (y*y) + (z*z)));

      vec3.scale(t, forward, a); 
*/
      //let transform = mat3.create();
      //mat3.fromMat4(transform, this.mainCamera.mvMatrix);
      //mat3.transpose(transform, transform);
      let transform = mat4.create();
      mat4.copy(transform, this.mainCamera.mvMatrix);
      mat4.transpose(transform, transform);
      let y = t[1];
      //vec3.transformMat3(t, t, transform);
      vec3.transformMat4(t, t, transform);
      t[1] = y;

      mat4.translate(this.mainCamera.mvMatrix, 
                     this.mainCamera.mvMatrix, 
                     t);
      this.gameObjects.forEach((go) => {
        go.update(deltaTime);
      });
    }
    this.lastTime = currentTime;
  }

  render() {
    // Resize the canvas to the size in the window in case
    // of window resize
    this.stage.canvas.width = this.stage.canvas.clientWidth;
    this.stage.canvas.height = this.stage.canvas.clientHeight;
    /*
    this.stage.drawingBufferWidth = this.stage.canvas.width;
    this.stage.drawingBufferHeight = this.stage.canvas.height;*/

    this.mainCamera.render(this.stage, 
                            this.shaderData, 
                            this.gameObjects);
  }
}
