class Camera {
  constructor(canvasCtx, 
              position, 
              rotations, 
              fov, 
              minClip, 
              maxClip) {
    this.position = position;
    this.rotations = rotations;
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();

    this.fov = fov;
    this.minClip = minClip;
    this.maxClip = maxClip;
   
    let ctxWidth = canvasCtx.drawingBufferWidth;
    let ctxHeight = canvasCtx.drawingBufferHeight;
    let aspect_ratio = ctxWidth / ctxHeight;
    this.updatePerspective(this.fov, 
                           aspect_ratio, 
                           this.minClip, 
                           this.maxClip);
  }

  updatePerspective(fov, aspect_ratio, minClip, maxClip) {
    mat4.perspective(this.pMatrix, 
                     fov, 
                     aspect_ratio, 
                     minClip,
                     maxClip);
  }

  screenToWorldCoords(coords) {
    // Apply transformations to coord, set Z to minClip
    coords.push(0);
    let worldCoords = vec3.create();
    vec3.copy(worldCoords, coords);
    let transform = mat4.create();
    mat4.transpose(transform, this.mvMatrix);
    vec3.transformMat4(worldCoords, coords, transform);
    return worldCoords;
  }

  render(canvasCtx, shaderData, objs) {
    // Prepare the canvas
    canvasCtx.viewport(0, 0, canvasCtx.drawingBufferWidth, canvasCtx.drawingBufferHeight);
    canvasCtx.clear(canvasCtx.COLOR_BUFFER_BIT,
                    canvasCtx.DEPTH_BUFFER_BIT);
    objs.forEach((obj) => {
    obj.render(canvasCtx, 
               this.mvMatrix, 
               this.pMatrix, 
               shaderData);
    });
  }
}
