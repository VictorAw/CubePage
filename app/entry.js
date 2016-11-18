document.addEventListener("DOMContentLoaded", () => {
  let canvas = document.getElementById("main-canvas");
  console.log(canvas);
  console.log(canvas.getContext("webgl"));
  let app = new App(canvas);
});
