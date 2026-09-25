"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { buildGuts, disposeObject, type Pose } from "@/lib/guts";

const TARGET = new THREE.Vector3(0, 1.08, 0);

const VIEWS: { id: string; label: string; pos: [number, number, number]; target?: [number, number, number] }[] = [
  { id: "face", label: "Face", pos: [0, 1.4, 5.2] },
  { id: "34d", label: "3/4 droit", pos: [-3.7, 1.5, 3.7] },
  { id: "profil", label: "Profil", pos: [-5.2, 1.4, 0] },
  { id: "dos", label: "Dos", pos: [0, 1.5, -5.2] },
  { id: "34g", label: "3/4 gauche", pos: [3.7, 1.5, 3.7] },
  { id: "plongee", label: "Plongée", pos: [0.8, 4.6, 2.6] },
  { id: "contre", label: "Contre-plongée", pos: [0.5, 0.3, 3.4] },
  { id: "visage", label: "Visage", pos: [0, 1.99, 0.72], target: [0, 1.975, 0] },
  { id: "profilv", label: "Profil visage", pos: [-0.75, 1.99, 0.04], target: [0, 1.975, 0] },
  { id: "portrait", label: "Portrait 3/4", pos: [-0.5, 2.02, 0.52], target: [0, 1.975, 0] },
];

const POSES: { id: Pose; label: string }[] = [
  { id: "repos", label: "Debout" },
  { id: "combat", label: "En combat" },
];

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function GutsViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const api = useRef<{
    setPose: (p: Pose) => void;
    goTo: (pos: [number, number, number], target?: [number, number, number]) => void;
    setAuto: (on: boolean) => void;
    exportGLB: () => void;
    exportSTL: () => void;
  } | null>(null);
  const [pose, setPose] = useState<Pose>("repos");
  const [auto, setAuto] = useState(true);
  const [view, setView] = useState("face");

  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x08080a, 6, 14);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.22;

    const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.05, 50);
    camera.position.set(...VIEWS[0].pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(TARGET);
    controls.enableDamping = true;
    controls.minDistance = 0.4;
    controls.maxDistance = 9;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.update();

    // Lighting: warm key, cold rim, blood-red kicker
    scene.add(new THREE.HemisphereLight(0x8a8f9a, 0x0a0806, 0.45));
    const key = new THREE.DirectionalLight(0xfff1dd, 3.2);
    key.position.set(-2.5, 4.5, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -1.5;
    key.shadow.camera.right = 1.5;
    key.shadow.camera.top = 2.8;
    key.shadow.camera.bottom = -0.5;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb6ff, 2.4);
    rim.position.set(2.5, 3, -3.5);
    scene.add(rim);
    const red = new THREE.PointLight(0xff2a1a, 2, 4, 2);
    red.position.set(1.2, 0.6, -1.6);
    scene.add(red);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(3, 1.5, 2.5);
    scene.add(fill);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.ShadowMaterial({ opacity: 0.55 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    let model = buildGuts("repos");
    scene.add(model);

    let tween: { from: THREE.Spherical; to: THREE.Spherical; t: number; a: THREE.Vector3; b: THREE.Vector3 } | null = null;
    let last = performance.now();

    api.current = {
      setPose(p) {
        scene.remove(model);
        disposeObject(model);
        model = buildGuts(p);
        scene.add(model);
      },
      goTo(pos, target) {
        let tgt = TARGET;
        let dest = new THREE.Vector3(...pos);
        if (target) {
          // close-ups follow the head, whatever the pose
          const head = model.getObjectByName("tete");
          const h = head ? head.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(...target);
          dest = dest.sub(new THREE.Vector3(...target)).add(h);
          tgt = h;
        }
        const from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        const to = new THREE.Spherical().setFromVector3(dest.sub(tgt));
        // take the short way around
        while (to.theta - from.theta > Math.PI) to.theta -= Math.PI * 2;
        while (to.theta - from.theta < -Math.PI) to.theta += Math.PI * 2;
        tween = { from, to, t: 0, a: controls.target.clone(), b: tgt.clone() };
      },
      setAuto(on) {
        controls.autoRotate = on;
      },
      exportGLB() {
        new GLTFExporter().parse(
          model,
          (res) => download(new Blob([res as ArrayBuffer], { type: "model/gltf-binary" }), "guts-figurine.glb"),
          (err) => console.error(err),
          { binary: true },
        );
      },
      exportSTL() {
        const data = new STLExporter().parse(model, { binary: true }) as unknown as DataView;
        download(new Blob([data.buffer as ArrayBuffer], { type: "model/stl" }), "guts-figurine.stl");
      },
    };

    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (tween) {
        tween.t = Math.min(1, tween.t + dt / 0.9);
        const e = 1 - Math.pow(1 - tween.t, 3);
        const s = new THREE.Spherical(
          THREE.MathUtils.lerp(tween.from.radius, tween.to.radius, e),
          THREE.MathUtils.lerp(tween.from.phi, tween.to.phi, e),
          THREE.MathUtils.lerp(tween.from.theta, tween.to.theta, e),
        );
        controls.target.lerpVectors(tween.a, tween.b, e);
        camera.position.setFromSpherical(s).add(controls.target);
        if (tween.t >= 1) tween = null;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      disposeObject(model);
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      api.current = null;
    };
  }, []);

  return (
    <main className="stage">
      <div ref={mountRef} className="canvas" />
      <header className="title">
        <h1>GUTS</h1>
        <p>Le Guerrier Noir — figurine 3D</p>
      </header>

      <section className="panel">
        <div className="group">
          <span className="label">Pose</span>
          <div className="row">
            {POSES.map((p) => (
              <button
                key={p.id}
                className={pose === p.id ? "on" : ""}
                onClick={() => {
                  setPose(p.id);
                  api.current?.setPose(p.id);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="group">
          <span className="label">Vue</span>
          <div className="row wrap">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                className={view === v.id ? "on" : ""}
                onClick={() => {
                  setView(v.id);
                  setAuto(false);
                  api.current?.setAuto(false);
                  api.current?.goTo(v.pos, v.target);
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="group">
          <div className="row">
            <button
              className={auto ? "on" : ""}
              onClick={() => {
                setAuto(!auto);
                api.current?.setAuto(!auto);
              }}
            >
              Rotation auto
            </button>
            <button onClick={() => api.current?.exportGLB()}>Export .glb</button>
            <button onClick={() => api.current?.exportSTL()}>Export .stl</button>
          </div>
        </div>
      </section>
      <p className="hint">Glisser pour tourner · molette pour zoomer</p>
    </main>
  );
}
