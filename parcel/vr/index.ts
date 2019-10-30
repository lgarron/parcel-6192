import "babel-polyfill"; // Prevent `regeneratorRuntime is not defined` error. https://github.com/babel/babel/issues/5085
import { PerspectiveCamera, WebGLRenderer } from "three";
import { WEBVR } from "../../src/vendor/three/examples/jsm/vr/WebVR";
import { Room } from "./room";
import { VRInput } from "./vr-input";

class VRCubeDemo {
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;

  private room: Room;

  private vrInput: VRInput;

  constructor() {
    console.log("Constructing demo");
    this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.vr.enabled = true;

    this.vrInput = new VRInput(this.renderer);

    this.room = new Room(this.vrInput);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(WEBVR.createButton(this.renderer));

    window.addEventListener("resize", this.onWindowResize.bind(this), false);

    this.animate();
  }

  public render(): void {
    this.room.update();
    this.renderer.render(this.room.scene, this.camera);
  }

  private animate(): void {
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

(window as any).vrCubeDemo = new VRCubeDemo();

console.log("VR loaded");
