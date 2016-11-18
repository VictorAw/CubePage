class RenderMesh {
  constructor(canvasCtx,
              vertices,
              itemCount,
              coordinates,
              rotationData, 
              scale, 
              colors,
              arrayType, // TRIANGLES, TRIANGLE_STRIP
              indices = [],
              hasElements = false,
              elementCount = 0) {
    // Coordinates: [x, y, z]
    // RotationData: {
    //                  degrees: a,
    //                  interval: b, (in ms)
    //                  axis: [x, y, z] 
    //                }
    // Scale: x
    // Color: [r, g, b, a]
    this.position = {
      vertices: vertices,
      coordinates: coordinates,
      itemSize: 3, // Assume only 3 space dimensions
      itemCount: itemCount,
      buffer: null
    };
    this.currentRotation = 0;
    this.rotationData = rotationData;
    this.scale = scale;
    this.color = {
      colors: colors,
      itemSize: 4, // R G B A
      itemCount: itemCount,
      buffer: null
    };
    this.arrayType = arrayType;
    this.hasElements = hasElements;
    this.elements = {
      indices: indices,
      itemSize: 1,
      itemCount: elementCount,
      buffer: null
    }

    this.initBuffers(canvasCtx);
  }
  
  initBuffers(canvasCtx) {
    this.initPositions(canvasCtx);
    this.initColors(canvasCtx);
    
    if (this.hasElements) {
      this.initElementIndices(canvasCtx);
    }
  }
  
  initPositions(canvasCtx) {
    let positions = canvasCtx.createBuffer();
    canvasCtx.bindBuffer(canvasCtx.ARRAY_BUFFER, positions);
    canvasCtx.bufferData(canvasCtx.ARRAY_BUFFER, 
                         new Float32Array(this.position.vertices),
                         canvasCtx.STATIC_DRAW);
    this.position.buffer = positions;
  }

  initElementIndices(canvasCtx) {
    let elementIndices = canvasCtx.createBuffer();
    canvasCtx.bindBuffer(canvasCtx.ELEMENT_ARRAY_BUFFER, elementIndices);
    canvasCtx.bufferData(canvasCtx.ELEMENT_ARRAY_BUFFER,
                         new Uint16Array(this.elements.indices),
                         canvasCtx.STATIC_DRAW);
    this.elements.buffer = elementIndices;
  } 

  initColors(canvasCtx) {
    let colors = canvasCtx.createBuffer();
    canvasCtx.bindBuffer(canvasCtx.ARRAY_BUFFER, colors);
    canvasCtx.bufferData(canvasCtx.ARRAY_BUFFER, 
                         new Float32Array(this.color.colors),
                         canvasCtx.STATIC_DRAW);
    this.color.buffer = colors;
  }

  update(deltaTime) {
    const degrees = this.rotationData.degrees;
    const interval = this.rotationData.interval; 
    this.currentRotation += (degrees * deltaTime) / interval;
  }

  render(canvasCtx, mvMatrix, pMatrix, shaderData) {
    // Push mvMatrix
    let oldMV = mat4.create();
    mat4.copy(oldMV, mvMatrix);

    // Translation
    mat4.translate(mvMatrix, mvMatrix, this.position.coordinates);
    
    // Rotation
    let rotation = Utils.degToRad(this.currentRotation);
    let rAxis = this.rotationData.axis;
    mat4.rotate(mvMatrix, mvMatrix, rotation, rAxis);

    console.log(mvMatrix);
    // Write to buffer
    canvasCtx.bindBuffer(canvasCtx.ARRAY_BUFFER, 
                         this.position.buffer);
    canvasCtx.vertexAttribPointer(
        shaderData.vertexPositionAttribute,
        this.position.itemSize,
        canvasCtx.FLOAT,
        false,
        0,
        0
    );
    canvasCtx.bindBuffer(canvasCtx.ARRAY_BUFFER,
                         this.color.buffer);
    canvasCtx.vertexAttribPointer(
      shaderData.vertexColorAttribute,
      this.color.itemSize,
      canvasCtx.FLOAT,
      false,
      0,
      0
    );

    if (this.hasElements) {
      canvasCtx.bindBuffer(canvasCtx.ELEMENT_ARRAY_BUFFER,
                           this.elements.buffer);
    }

    // Set uniforms
    canvasCtx.uniformMatrix4fv(
        shaderData.pMatrixUniform, 
        false,
        pMatrix);
    canvasCtx.uniformMatrix4fv(
        shaderData.mvMatrixUniform,
        false,
        mvMatrix);

    // Draw
    if (this.hasElements) {
      canvasCtx.drawElements(this.arrayType,
                             this.elements.itemCount,   
                             canvasCtx.UNSIGNED_SHORT, 0);
    }
    else {
      canvasCtx.drawArrays(this.arrayType, 0, this.position.itemCount);
    }
    
    // Pop mvMatrix
    mat4.copy(mvMatrix, oldMV);

  }
}

// Coordinates: [x, y, z]
// RotationData: {
//                  degrees: a,
//                  interval: b, (in ms)
//                  axis: [x, y, z] 
//                }
// Scale: x
// Color: [r, g, b, a]
const Shapes = {
  SquareMesh: class SquareMesh extends RenderMesh {
    constructor(canvasCtx,
                coordinates,
                rotationData,
                scale,
                colors) {
      // Initialize Shape values
      const vertices = [
         1.0,  1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
      ];
      
      super(canvasCtx,
            vertices,
            4, // 4 Sides
            coordinates,
            rotationData,
            scale,
            colors,
            canvasCtx.TRIANGLE_STRIP);
    }
  },
  TriangleMesh: class TriangleMesh extends RenderMesh {
    constructor(canvasCtx,
                coordinates,
                rotationData,
                scale,
                colors) {
      const vertices = [
         0.0,  1.0, 0.0,
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0
      ];

      super(canvasCtx,
            vertices,
            3, // 3 Sides
            coordinates,
            rotationData,
            scale,
            color,
            canvasCtx.TRIANGLES);
    }
  },
  PyramidMesh: class PyramidMesh extends RenderMesh {
    constructor(canvasCtx,
                coordinates,
                rotationData,
                scale,
                colors) {
      const vertices = [
        // Front face
         0.0,  1.0,  0.0,
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
        // Right face
         0.0,  1.0,  0.0,
         1.0, -1.0,  1.0,
         1.0, -1.0, -1.0,
        // Back face
         0.0,  1.0,  0.0,
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
        // Left face
         0.0,  1.0,  0.0,
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0
      ];

      super(canvasCtx,
            vertices,
            12, // Item count (number of triangles?
            coordinates,
            rotationData,
            scale,
            colors,
            canvasCtx.TRIANGLES);
    }
  },
  CubeMesh: class CubeMesh extends RenderMesh {
    constructor(canvasCtx,
                coordinates,
                rotationData,
                scale,
                colors) {
      const vertices = [
        // Front face
        -1.0, -1.0, 1.0,
         1.0, -1.0, 1.0,
         1.0,  1.0, 1.0,
        -1.0,  1.0, 1.0,
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0,  1.0,
         1.0, 1.0,  1.0,
         1.0, 1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
      ];
      
      let indices = [
        0,  1,  2,    0,  2,  3,  // Front
        4,  5,  6,    4,  6,  7,  // Back
        8,  9,  10,   8,  10, 11, // Top
        12, 13, 14,   12, 14, 15, // Bottom
        16, 17, 18,   16, 18, 19, // Right
        20, 21, 22,   20, 22, 23  // Left
      ];

      super(canvasCtx,
            vertices,
            24, // Item count
            coordinates,
            rotationData,
            scale,
            colors,
            canvasCtx.TRIANGLES,
            indices,
            true,
            36);
    }
  }
}
