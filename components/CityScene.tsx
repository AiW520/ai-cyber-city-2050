"use client";

import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { chapters, type CameraView } from "./city-data";

export type CitySceneProps = {
  active: number;
  view: CameraView;
  reset: number;
  low: boolean;
  paused: boolean;
  reduced: boolean;
  night: boolean;
  touchCamera: boolean;
  command: { id: number; action: "left" | "right" | "in" | "out" } | null;
  onSelect: (index: number) => void;
  onReady: () => void;
  onFailure: () => void;
  onSlow: () => void;
};

const ground = 0.1;
const railCurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-15, 3.8, -4.5),
    new THREE.Vector3(-13, 3.8, -14),
    new THREE.Vector3(11, 3.8, -14),
    new THREE.Vector3(15, 3.8, -7),
    new THREE.Vector3(15, 3.8, 11),
    new THREE.Vector3(8, 3.8, 14),
    new THREE.Vector3(-12, 3.8, 14),
    new THREE.Vector3(-15, 3.8, 8),
  ],
  true,
  "catmullrom",
  0.15,
);

function Box({
  position = [0, 0, 0],
  size,
  color,
  emissive,
  ...props
}: {
  position?: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={0.35}
        emissive={emissive}
        emissiveIntensity={0.65}
      />
    </mesh>
  );
}

function Tower({
  x,
  z,
  height,
  width,
  accent,
  style = 0,
}: {
  x: number;
  z: number;
  height: number;
  width: number;
  accent: string;
  style?: number;
}) {
  const windows = useRef<THREE.InstancedMesh>(null);
  const floors = Math.floor(height / 0.7);
  useEffect(() => {
    if (!windows.current) return;
    const object = new THREE.Object3D();
    const rotation = new THREE.Quaternion();
    for (let side = 0; side < 4; side++) {
      rotation.setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        (side * Math.PI) / 2,
      );
      for (let floor = 0; floor < floors; floor++) {
        object.position
          .set(0, 0.7 + floor * 0.7, width / 2 + 0.015)
          .applyQuaternion(rotation);
        object.quaternion.copy(rotation);
        object.updateMatrix();
        windows.current.setMatrixAt(side * floors + floor, object.matrix);
      }
    }
    windows.current.instanceMatrix.needsUpdate = true;
    windows.current.computeBoundingSphere();
  }, [floors, width]);
  return (
    <group position={[x, ground, z]}>
      <Box
        position={[0, 0.3, 0]}
        size={[width + 0.6, 0.6, width + 0.6]}
        color="#445a69"
      />
      <Box
        position={[0, height / 2, 0]}
        size={[width, height, width]}
        color={style % 2 ? "#536e7c" : "#273e4c"}
      />
      <Box
        position={[0, height + 0.2, 0]}
        size={[width * 0.82, 0.4, width * 0.82]}
        color="#c0d4da"
      />
      <Box
        position={[0, height + 0.8, 0]}
        size={[width * 0.5, 0.8, width * 0.5]}
        color="#49616f"
      />
      <instancedMesh ref={windows} args={[undefined, undefined, floors * 4]}>
        <planeGeometry args={[width * 0.8, 0.3]} />
        <meshStandardMaterial
          color="#97c9d5"
          emissive={accent}
          emissiveIntensity={0.35}
          metalness={0.65}
          roughness={0.25}
        />
      </instancedMesh>
      {[0, 1, 2, 3].map((side) => (
        <group key={side} rotation={[0, (side * Math.PI) / 2, 0]}>
          <Box
            position={[-width * 0.35, height / 2, width / 2 + 0.04]}
            size={[0.08, height, 0.09]}
            color="#aac6cd"
          />
          <Box
            position={[width * 0.35, height / 2, width / 2 + 0.04]}
            size={[0.08, height, 0.09]}
            color="#aac6cd"
          />
        </group>
      ))}
      <Box
        position={[0, height + 1.6, 0]}
        size={[0.08, 1.2, 0.08]}
        color={accent}
        emissive={accent}
      />
    </group>
  );
}

function Architecture() {
  return (
    <group>
      <Tower x={-10.5} z={-10.5} height={12.5} width={3.4} accent="#7ae5ed" />
      <Tower
        x={-5.5}
        z={-10.5}
        height={8.8}
        width={2.8}
        accent="#e5b97c"
        style={1}
      />
      <Tower
        x={-11}
        z={-5.5}
        height={7}
        width={2.7}
        accent="#7ae5ed"
        style={1}
      />
      <Box position={[-8, 6.2, -10.5]} size={[3.5, 0.55, 1]} color="#a0cbd5" />
      <Box
        position={[-8, 6.55, -10.5]}
        size={[3.5, 0.13, 1.3]}
        color="#334f60"
      />
      {[-12, -10, -8, -6].map((x) => (
        <group key={x} position={[x, 0.8, -14]} rotation={[-0.25, 0, 0]}>
          <Box size={[1.4, 0.08, 1]} color="#226b8a" />
        </group>
      ))}
    </group>
  );
}

function Android({
  position,
  index,
  paused,
}: {
  position: [number, number, number];
  index: number;
  paused: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const arms = useRef<THREE.Group>(null);
  const elapsed = useRef(index * 1.3);
  useFrame((_, delta) => {
    if (paused || !group.current || !arms.current) return;
    elapsed.current += Math.min(delta, 0.05);
    const t = elapsed.current;
    group.current.position.z = position[2] + Math.sin(t * 0.45) * 1.7;
    group.current.rotation.y = Math.cos(t * 0.45) > 0 ? 0 : Math.PI;
    arms.current.rotation.x = Math.sin(t * 4) * 0.28;
  });
  return (
    <group ref={group} position={position}>
      <Box position={[0, 1, 0]} size={[0.38, 0.55, 0.27]} color="#dce8e9" />
      <mesh position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color="#eaf0ee" metalness={0.4} roughness={0.3} />
      </mesh>
      <Box
        position={[0, 1.47, 0.19]}
        size={[0.29, 0.07, 0.05]}
        color="#123b4c"
        emissive="#4ec9e3"
      />
      <group ref={arms}>
        <Box
          position={[-0.29, 0.97, 0]}
          size={[0.13, 0.55, 0.15]}
          color="#75909c"
        />
        <Box
          position={[0.29, 0.97, 0]}
          size={[0.13, 0.55, 0.15]}
          color="#75909c"
        />
      </group>
      {[-0.12, 0.12].map((x) => (
        <group key={x}>
          <Box
            position={[x, 0.4, 0]}
            size={[0.15, 0.65, 0.18]}
            color="#667f8b"
          />
          <Box
            position={[x, 0.08, 0.07]}
            size={[0.2, 0.12, 0.3]}
            color="#bccdd3"
          />
        </group>
      ))}
    </group>
  );
}

function Robotics({ paused, low }: { paused: boolean; low: boolean }) {
  return (
    <group>
      <Box position={[8, 1.8, -11]} size={[7, 3.6, 4.5]} color="#7b8d9a" />
      <Box position={[8, 3.65, -11]} size={[7.5, 0.18, 5]} color="#d7e0df" />
      <Box
        position={[8, 1.8, -8.73]}
        size={[5.8, 1.3, 0.06]}
        color="#214253"
        emissive="#526c8f"
      />
      <Box position={[8, 0.9, -8.65]} size={[1.1, 1.8, 0.14]} color="#1c303c" />
      {[5, 8, 11].map((x) => (
        <group key={x}>
          <Box
            position={[x, 0.8, -5.5]}
            size={[0.6, 1.6, 0.5]}
            color="#3e5365"
          />
          <Box
            position={[x, 1.1, -5.2]}
            size={[0.38, 0.65, 0.07]}
            color="#71f1e0"
            emissive="#71f1e0"
          />
        </group>
      ))}
      {[...Array(low ? 2 : 4)].map((_, i) => (
        <Android
          key={i}
          index={i}
          position={[5.3 + i * 1.4, ground, -6.5]}
          paused={paused}
        />
      ))}
      <Box position={[12.5, 1.3, -7]} size={[1.3, 2.6, 1.3]} color="#cadbdc" />
      <Box position={[12.5, 2.8, -7]} size={[2.7, 0.4, 1.7]} color="#4d6471" />
    </group>
  );
}

function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, ground, z]} scale={scale}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 1.3, 6]} />
        <meshStandardMaterial color="#665d49" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color="#497c5e" roughness={0.85} />
      </mesh>
      <mesh position={[0.15, 2.2, 0]} castShadow>
        <icosahedronGeometry args={[0.58, 1]} />
        <meshStandardMaterial color="#70a978" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Gardens() {
  return (
    <group>
      <Box position={[-8.8, 0.13, 8.5]} size={[10, 0.22, 10]} color="#51786b" />
      <Box position={[-8.8, 0.27, 8.5]} size={[1.4, 0.1, 10]} color="#c6d2ca" />
      <Box position={[-8.8, 0.27, 8.5]} size={[10, 0.1, 1.4]} color="#c6d2ca" />
      <mesh position={[-11, 0.3, 6]} castShadow>
        <sphereGeometry args={[2.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#93dbcc"
          roughness={0.15}
          metalness={0.3}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[-11, 0.34, 6]}>
        <sphereGeometry args={[2.12, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#dbf3e8" wireframe />
      </mesh>
      <mesh position={[-6, 0.4, 11]}>
        <cylinderGeometry args={[1.6, 1.6, 0.4, 28]} />
        <meshStandardMaterial color="#d2dfde" />
      </mesh>
      <mesh position={[-6, 0.65, 11]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 28]} />
        <meshStandardMaterial
          color="#56bec6"
          metalness={0.5}
          roughness={0.15}
        />
      </mesh>
      <mesh position={[-6, 1, 11]}>
        <cylinderGeometry args={[0.12, 0.2, 1.1, 12]} />
        <meshStandardMaterial color="#d8ece8" />
      </mesh>
      {[
        [-12, 11],
        [-12, 8.5],
        [-5.5, 5.5],
        [-10, 12.5],
        [-6, 7],
      ].map(([x, z]) => (
        <Tree key={`${x}-${z}`} x={x} z={z} />
      ))}
      {[-11, -6].map((x) => (
        <group key={x} position={[x, 0.5, 9]}>
          <Box size={[1.8, 0.12, 0.55]} color="#c6b993" />
          <Box
            position={[0, 0.3, -0.22]}
            size={[1.8, 0.5, 0.08]}
            color="#c6b993"
          />
          {[-0.65, 0.65].map((leg) => (
            <Box
              key={leg}
              position={[leg, -0.2, 0]}
              size={[0.12, 0.4, 0.45]}
              color="#405866"
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function Vehicle({
  color = "#eac268",
  train = false,
}: {
  color?: string;
  train?: boolean;
}) {
  return (
    <group>
      <Box
        position={[0, train ? 0.45 : 0.33, 0]}
        size={train ? [1.3, 0.75, 4] : [1.05, 0.5, 2]}
        color={color}
      />
      <Box
        position={[0, train ? 0.65 : 0.62, -0.1]}
        size={train ? [1.22, 0.55, 3.5] : [0.85, 0.4, 1.2]}
        color="#254757"
      />
      <Box
        position={[0, train ? 1 : 0.86, 0]}
        size={train ? [1.3, 0.12, 4] : [0.95, 0.09, 1.45]}
        color={color}
      />
      {[-0.38, 0.38].map((x) => (
        <Box
          key={x}
          position={[x, 0.39, 1.01]}
          size={[0.22, 0.12, 0.04]}
          color="#f2f9de"
          emissive="#f2f9de"
        />
      ))}
      {[-0.51, 0.51].map((x) =>
        [-0.65, 0.65].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.22, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.22, 0.22, 0.12, 10]} />
            <meshStandardMaterial color="#20323a" />
          </mesh>
        )),
      )}
    </group>
  );
}

function Traffic({ paused, low }: { paused: boolean; low: boolean }) {
  const cars = useRef<THREE.Group>(null);
  const train = useRef<THREE.Group>(null);
  const shuttle = useRef<THREE.Group>(null);
  const time = useRef(0);
  useFrame((_, delta) => {
    if (paused) return;
    time.current += Math.min(delta, 0.05);
    cars.current?.children.forEach((car, i) => {
      const t = ((time.current * (i % 2 ? 3 : 2.5) + i * 9) % 42) - 21;
      if (i < 4) car.position.z = i % 2 ? -t : t;
      else car.position.x = i % 2 ? -t : t;
    });
    if (train.current) {
      const t = (time.current * 0.022) % 1;
      train.current.position.copy(railCurve.getPointAt(t));
      train.current.rotation.y = Math.atan2(
        railCurve.getTangentAt(t).x,
        railCurve.getTangentAt(t).z,
      );
    }
    if (shuttle.current) {
      const t = time.current * 0.25;
      shuttle.current.position.set(
        Math.sin(t) * 12,
        8.5 + Math.sin(t * 2) * 0.4,
        Math.cos(t) * 12,
      );
      shuttle.current.rotation.y = t + Math.PI / 2;
    }
  });
  return (
    <>
      <group ref={cars}>
        {[...Array(low ? 4 : 8)].map((_, i) => (
          <group
            key={i}
            position={
              i < 4
                ? [i % 2 ? -1.1 : 1.1, ground, i * 8 - 15]
                : [i * 6 - 15, ground, i % 2 ? 1.1 : -1.1]
            }
            rotation={[
              0,
              i < 4
                ? i % 2
                  ? Math.PI
                  : 0
                : i % 2
                  ? -Math.PI / 2
                  : Math.PI / 2,
              0,
            ]}
          >
            <Vehicle
              color={["#efbf57", "#e9e9df", "#ad5553", "#6cb6bf"][i % 4]}
            />
          </group>
        ))}
      </group>
      <group ref={train} position={[-15, 3.8, -4.5]}>
        <Vehicle color="#e7e8df" train />
        <group position={[0, 0, -4.3]}>
          <Vehicle color="#e7e8df" train />
        </group>
      </group>
      {!low && (
        <group ref={shuttle} position={[0, 8.5, 12]}>
          <Box size={[1.1, 0.4, 1.5]} color="#d5e1df" />
          <Box position={[0, 0.25, 0]} size={[0.8, 0.2, 0.8]} color="#315b6b" />
          {[-0.85, 0.85].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <Box size={[1, 0.09, 0.25]} color="#b6caca" />
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.45, 0.04, 6, 16]} />
                <meshStandardMaterial color="#355463" />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </>
  );
}

function Transit() {
  const railGeometry = useMemo(
    () => new THREE.TubeGeometry(railCurve, 100, 0.12, 6, true),
    [],
  );
  useEffect(() => () => railGeometry.dispose(), [railGeometry]);
  return (
    <>
      <mesh geometry={railGeometry} receiveShadow>
        <meshStandardMaterial
          color="#b4d8d7"
          metalness={0.65}
          roughness={0.3}
        />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const p = railCurve.getPointAt(i / 14);
        return (
          <group key={i} position={[p.x, 0, p.z]}>
            <Box
              position={[0, 1.8, 0]}
              size={[0.35, 3.6, 0.35]}
              color="#9aadb2"
            />
            <Box
              position={[0, 3.55, 0]}
              size={[1.4, 0.18, 0.5]}
              color="#9aadb2"
            />
          </group>
        );
      })}
      <Box position={[8.5, 0.7, 10.5]} size={[7, 1.4, 3]} color="#667b86" />
      <Box
        position={[8.5, 2.65, 10.5]}
        size={[7.5, 0.22, 3.7]}
        color="#c4d6d4"
      />
      {[5.5, 8.5, 11.5].map((x) => (
        <Box
          key={x}
          position={[x, 1.9, 10.5]}
          size={[0.15, 1.5, 0.15]}
          color="#d9e9e2"
        />
      ))}
      <Box
        position={[8.5, 1.5, 11.9]}
        size={[3, 0.3, 0.08]}
        color="#bdacf9"
        emissive="#bdacf9"
      />
      <Tower
        x={10}
        z={5.8}
        width={2.8}
        height={5.5}
        accent="#b7a9fa"
        style={1}
      />
      <Box position={[5.8, 0.25, 6]} size={[2.5, 0.4, 3.6]} color="#c4d6d4" />
    </>
  );
}

function Streets({ low }: { low: boolean }) {
  return (
    <>
      <Box position={[0, -0.3, 0]} size={[42, 0.6, 42]} color="#a2b7b9" />
      <Box position={[0, 0.025, 0]} size={[5.6, 0.04, 42]} color="#344751" />
      <Box position={[0, 0.03, 0]} size={[42, 0.04, 5.6]} color="#344751" />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box
            position={[s * 3.2, 0.1, 0]}
            size={[0.7, 0.18, 42]}
            color="#d1ddd8"
          />
          <Box
            position={[0, 0.1, s * 3.2]}
            size={[42, 0.18, 0.7]}
            color="#d1ddd8"
          />
        </group>
      ))}
      {[...Array(16)].map((_, i) => (
        <group key={i}>
          <Box
            position={[0, 0.06, i * 2.6 - 20]}
            size={[0.07, 0.01, 1.1]}
            color="#e4dbb4"
          />
          <Box
            position={[i * 2.6 - 20, 0.065, 0]}
            size={[1.1, 0.01, 0.07]}
            color="#e4dbb4"
          />
        </group>
      ))}
      {[-4, 4].map((s) =>
        [...Array(5)].map((_, i) => (
          <group key={`${s}-${i}`}>
            <Box
              position={[s, 0.14, i * 0.55 - 1.1]}
              size={[1.8, 0.015, 0.28]}
              color="#dfebe0"
            />
            <Box
              position={[i * 0.55 - 1.1, 0.14, s]}
              size={[0.28, 0.015, 1.8]}
              color="#dfebe0"
            />
          </group>
        )),
      )}
      {[...Array(low ? 8 : 16)].map((_, i) => {
        const side = i % 2 ? 1 : -1;
        const z = Math.floor(i / 2) * 5 - 18;
        return (
          <group key={i} position={[side * 3.6, 0, z]}>
            <Box
              position={[0, 1.7, 0]}
              size={[0.07, 3.4, 0.07]}
              color="#6c8490"
            />
            <Box
              position={[side * -0.25, 3.35, 0]}
              size={[0.7, 0.12, 0.26]}
              color="#e7ead6"
              emissive="#f5e4b7"
            />
          </group>
        );
      })}
      {[...Array(low ? 4 : 6)].map((_, i) => (
        <Tower
          key={i}
          x={i % 2 ? -18 : 18}
          z={-17 + Math.floor(i / 2) * 7}
          height={3 + ((i * 7) % 5)}
          width={2.2}
          accent={i % 2 ? "#7bc7c4" : "#dfb781"}
          style={i}
        />
      ))}
      {[-19, 19].map((z) =>
        [-10, -4, 4, 10].map((x) => (
          <Tree key={`${x}-${z}`} x={x} z={z} scale={0.8} />
        )),
      )}
    </>
  );
}

function CivicHall() {
  return (
    <group position={[-18, ground, 8]}>
      <Box position={[0, 0.25, 0]} size={[5.7, 0.5, 7]} color="#d7ddd0" />
      <Box position={[0, 1.4, 0]} size={[4.6, 2.3, 6]} color="#b8c4a6" />
      <Box position={[0, 1.5, 3.01]} size={[4.3, 1.5, 0.08]} color="#4e9b9a" />
      <Box position={[2.31, 1.5, 0]} size={[0.08, 1.5, 5.6]} color="#68a8a4" />
      <mesh position={[0, 2.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[2.35, 2.35, 6.2, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial
          color="#398982"
          roughness={0.4}
          metalness={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
        <mesh key={z} position={[0, 2.3, z]}>
          <torusGeometry args={[2.4, 0.06, 6, 32, Math.PI]} />
          <meshStandardMaterial color="#f0e8ca" roughness={0.6} />
        </mesh>
      ))}
      {[-1.7, -0.6, 0.6, 1.7].map((x) => (
        <Box
          key={x}
          position={[x, 1.5, 3.09]}
          size={[0.09, 2, 0.12]}
          color="#e5d6a6"
        />
      ))}
      <Box position={[0, 0.65, 3.6]} size={[3.2, 0.3, 0.7]} color="#e9daba" />
      <Box position={[0, 0.35, 4]} size={[3.8, 0.2, 0.7]} color="#e9daba" />
      {[
        [-2.7, -3.5],
        [2.7, -3.5],
      ].map(([x, z]) => (
        <Tree key={x} x={x} z={z} scale={0.8} />
      ))}
    </group>
  );
}

function Terraces() {
  return (
    <group position={[18, ground, 8]}>
      {[0, 1, 2].map((level) => (
        <group key={level} position={[0, level * 1.1, -level * 0.8]}>
          <Box
            position={[0, 0.55, 0]}
            size={[4.2, 1.1, 5 - level]}
            color={level % 2 ? "#e9d7ad" : "#b7ccbd"}
          />
          <Box
            position={[0, 1.13, 0]}
            size={[4.4, 0.1, 5.2 - level]}
            color="#497c5e"
          />
          <Box
            position={[0, 0.6, (5 - level) / 2 + 0.01]}
            size={[3.7, 0.5, 0.04]}
            color="#477e8b"
          />
        </group>
      ))}
      <Tree x={-1.4} z={2.2} scale={0.7} />
      <Tree x={1.4} z={2.2} scale={0.7} />
    </group>
  );
}

function WindCrown({ paused }: { paused: boolean }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!paused && rotor.current)
      rotor.current.rotation.z += Math.min(delta, 0.05) * 0.6;
  });
  return (
    <group position={[-10.5, 15, -10.5]}>
      <Box position={[0, 0.8, 0]} size={[0.1, 2.4, 0.1]} color="#c7d7c9" />
      <group ref={rotor} position={[0, 2, 0.14]}>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <Box
              position={[0, 0.65, 0]}
              size={[0.18, 1.3, 0.06]}
              color="#e4ecd8"
            />
          </group>
        ))}
      </group>
    </group>
  );
}

function Hotspot({
  index,
  active,
  onSelect,
}: {
  index: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  const chapter = chapters[index];
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(index);
  };
  return (
    <group
      position={[chapter.position[0], 0.4, chapter.position[2]]}
      onClick={click}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[
            active === index ? 2.1 : 0.8,
            active === index ? 2.2 : 0.95,
            48,
          ]}
        />
        <meshBasicMaterial
          color={chapter.accent}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={chapter.accent}
          emissive={chapter.accent}
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh>
        <cylinderGeometry args={[1.4, 1.4, 3.8, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Rig(props: CitySceneProps) {
  const { camera, gl, invalidate, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const transition = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const frames = useRef({ time: 0, count: 0, reported: false });
  useEffect(() => {
    const p = chapters[props.active].position;
    const target =
      props.view === "overview"
        ? new THREE.Vector3(0, 2, 0)
        : new THREE.Vector3(p[0], props.view === "street" ? 1.6 : 2.5, p[2]);
    const mobile = size.width < 600;
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = mobile ? 52 : 43;
    perspective.updateProjectionMatrix();
    const position =
      props.view === "overview"
        ? mobile
          ? new THREE.Vector3(39, 43, 46)
          : new THREE.Vector3(31, 29, 37)
        : props.view === "street"
          ? new THREE.Vector3(p[0] + 5.5, 2.3, p[2] + 7)
          : new THREE.Vector3(p[0] + 12, 13, p[2] + 14);
    transition.current = { position, target };
    if (props.reduced && controls.current) {
      camera.position.copy(position);
      controls.current.target.copy(target);
      controls.current.update();
      transition.current = null;
    }
    invalidate();
  }, [
    props.active,
    props.view,
    props.reset,
    props.reduced,
    camera,
    invalidate,
    size.width,
  ]);
  useEffect(() => {
    if (!props.command || !controls.current) return;
    transition.current = null;
    const offset = camera.position.clone().sub(controls.current.target);
    if (props.command.action === "left" || props.command.action === "right")
      offset.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        props.command.action === "left" ? 0.23 : -0.23,
      );
    else offset.multiplyScalar(props.command.action === "in" ? 0.83 : 1.2);
    offset.clampLength(4, 100);
    camera.position.copy(controls.current.target).add(offset);
    controls.current.update();
    invalidate();
  }, [props.command, camera, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      props.onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    const ready = requestAnimationFrame(props.onReady);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      cancelAnimationFrame(ready);
      document.body.style.cursor = "";
    };
  }, [gl, props.onFailure, props.onReady]);
  useFrame((_, delta) => {
    if (transition.current && controls.current) {
      const factor = 1 - Math.exp(-Math.min(delta, 0.05) * 5);
      camera.position.lerp(transition.current.position, factor);
      controls.current.target.lerp(transition.current.target, factor);
      controls.current.update();
      invalidate();
      if (camera.position.distanceTo(transition.current.position) < 0.025)
        transition.current = null;
    }
    if (
      !props.paused &&
      !props.low &&
      !frames.current.reported &&
      delta < 0.5
    ) {
      frames.current.time += delta;
      frames.current.count++;
      if (frames.current.time > 6) {
        frames.current.reported = true;
        if (frames.current.count / frames.current.time < 24) props.onSlow();
      }
    }
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping={!props.reduced}
      enabled={size.width >= 800 || props.touchCamera}
      enableRotate={size.width >= 800 || props.touchCamera}
      enableZoom={size.width >= 800 || props.touchCamera}
      enablePan={size.width >= 800 || props.touchCamera}
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={100}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 - 0.025}
      onStart={() => {
        transition.current = null;
      }}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  );
}

export default function CityScene(props: CitySceneProps) {
  return (
    <Canvas
      style={{ touchAction: props.touchCamera ? "none" : "pan-y" }}
      shadows={!props.low}
      dpr={props.low ? 1 : [1, 1.6]}
      frameloop={props.paused ? "demand" : "always"}
      camera={{ position: [29, 26, 34], fov: 43, near: 0.1, far: 150 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "default",
        preserveDrawingBuffer: false,
      }}
      fallback={<div className="scene-status">3D unavailable</div>}
    >
      <color attach="background" args={[props.night ? "#192d39" : "#e1eced"]} />
      <fog attach="fog" args={[props.night ? "#192d39" : "#e1eced", 95, 160]} />
      <hemisphereLight
        args={[
          props.night ? "#80c5da" : "#d8f4f3",
          "#576260",
          props.night ? 1.5 : 2.3,
        ]}
      />
      <directionalLight
        position={[-15, 30, 18]}
        intensity={props.night ? 0.8 : 3}
        color={props.night ? "#b9ddea" : "#fff0ce"}
        castShadow={!props.low}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.001}
      />
      <Streets low={props.low} />
      <Architecture />
      <WindCrown paused={props.paused} />
      <CivicHall />
      <Terraces />
      <Robotics paused={props.paused} low={props.low} />
      <Gardens />
      <Transit />
      <Traffic paused={props.paused} low={props.low} />
      {chapters.map((_, index) => (
        <Hotspot
          key={index}
          index={index}
          active={props.active}
          onSelect={props.onSelect}
        />
      ))}
      <Rig {...props} />
    </Canvas>
  );
}
