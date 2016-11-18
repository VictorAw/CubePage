class GameObject {
  constructor(coordinates, mesh, boundingMesh=null) {
    this.coordinates = coordinates;
    this.mesh = mesh;
    this.boundingMesh = boundingMesh;
  }

  update(deltaTime) {
    // Temporary. Move animation data out of mesh
    this.mesh.update(deltaTime);
  }

  render(canvasCtx, mvMatrix, pMatrix, shaderData) {
    this.mesh.render(canvasCtx, mvMatrix, pMatrix, shaderData);
  }

  onMouseDown() {}

  onMouseUp() {}

  onMouseMove() {}
}

const GameObjects = {
  Cube: class Cube extends GameObject {
    onMouseDown(e, clickInfo) {
      console.log("Cube click reached");
    }
  }
}
