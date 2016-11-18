class CollisionChecker {
  constructor(gameObjects) {
    // Might be more performant to only store bounding boxes/shapes here instead of full gameObjects, but I'm not sure how well javascript interacts with the cache
    this.gameObjects = gameObjects;
  }

  raycast(origin, direction, maxDistance=Infinity) {
    let hits = [];
    this.gameObjects.forEach((obj) => {
      const objCoords = obj.boundingMesh.coordinates;
      const objExtents = obj.boundingMesh.extents;
      // Left
      const leftBound = objCoords[0] - objExtents[0];
      // Right
      const rightBound = objCoords[0] + objExtents[0];
      // Top
      const topBound = objCoords[1] + objExtents[1];
      // Bottom
      const botBound = objCoords[1] - objExtents[1];
      // Front
      const frontBound = objCoords[2] - objExtents[2];
      // Back
      const backBound = objCoords[2] + objExtents[2];

      let t_origin = vec3.create();
      let scalar = (frontBound - origin[2]) / direction[2];
      vec3.scale(t_origin, origin, scalar);

      if (t_origin[0] >= leftBound && t_origin[0] <= rightBound &&
          t_origin[1] <= topBound && t_origin[1] >= botBound) {
        hits.push({collisionPoint: t_origin, target: obj});
      }
      
    });

    return hits;
  }
}
