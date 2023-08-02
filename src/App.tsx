import "./globals.css";
import "./App.css";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Stage,
  useTexture,
  Cylinder,
  CameraControls,
  PositionalAudio
} from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
// import { useToast } from "./components/ui/use-toast";
import { useToast } from "components/ui/use-toast";
import { Button } from "components/ui/button";
import { Toaster } from "components/ui/toaster";
import {
  RedirectPage,
  SpotifyAuth,
  SpotifyAuthContextProvider,
  useSpotifyAuth
} from "components/SpotifyAuth";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const POSITION_RECORD_SELECTED = [20, 3.25, 0.1];
const POSITION_RECORD_UNSELECTED = [20, 3.0, 1];

const SONG_URL_BON_IVER = "/Bon Iver - Skinny Love.mp3";
const SONG_URL_TAME_IMPALA = "/Tame Impala - Elephant.mp3";

type RecordID = "Tame Impala - Elephant" | "Bon Iver - Skinny Love";

const ThreeDComponent = ({
  position,
  target
}: {
  position: [number, number, number];
  target: [number, number, number];
}) => {
  const { toast } = useToast();
  const [selectedRecordId, setSelectedRecordId] = useState<RecordID>(
    "Tame Impala - Elephant"
  );

  const gltfSkull = useGLTF("skull.glb");
  const gltfRoom = useGLTF("modern_bedroom.glb");
  const gltfRecordPlayer = useGLTF("vinyl_player.glb");
  const gltfDesk = useGLTF("antique_wooden_desk.glb");

  const [isSkullClicked, setIsSkullClicked] = useState(false);

  // const gltfRecord = useGLTF("12_vinyl_record.glb");
  const [isHoveringSkull, setIsHoveringSkull] = useState(false);
  const [isHoveringRecordPlayer, setIsHoveringRecordPlayer] = useState(false);

  const cameraRef = useRef<CameraControls>(null);
  const skullRef = useRef<any>(null);
  const [isPlayingSong, setIsPlayingSong] = useState(false);

  const textureLonerism = useTexture("vinyl_lonerism.png");
  const textureBonIver = useTexture("vinyl_bon_iver.png");

  useFrame(() => {
    if (skullRef.current) {
      skullRef.current.rotation.y += 0.01;
    }
  });

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.setPosition(position[0], position[1], position[2]);
      cameraRef.current.setTarget(target[0], target[1], target[2]);
    }
  }, [cameraRef, position, target]);

  const recordRef1 = useRef<any>(null);
  const recordRef2 = useRef<any>(null);

  useEffect(() => {
    if (isPlayingSong) {
      toast({
        title: "Now Playing",
        description: selectedRecordId
      });
    }
  }, [isPlayingSong, selectedRecordId, toast]);

  useFrame(() => {
    if (isPlayingSong) {
      if (selectedRecordId === "Tame Impala - Elephant") {
        recordRef1.current.rotation.y -= 0.01;
      } else if (selectedRecordId === "Bon Iver - Skinny Love") {
        recordRef2.current.rotation.y -= 0.01;
      }
    }
  });

  const positionalAudio1Ref = useRef<any>(null);
  const positionalAudio2Ref = useRef<any>(null);

  const handleClickRecordPlayer = () => {
    if (selectedRecordId === "Bon Iver - Skinny Love") {
      if (!positionalAudio2Ref.current.isPlaying) {
        positionalAudio2Ref.current.play();
        // increase volume because this song specifically is quiet
        positionalAudio2Ref.current.setVolume(10);
        setIsPlayingSong(true);
      } else {
        positionalAudio2Ref.current.pause();
        setIsPlayingSong(false);
      }
    } else if (selectedRecordId === "Tame Impala - Elephant") {
      if (!positionalAudio1Ref.current.isPlaying) {
        positionalAudio1Ref.current.play();
        setIsPlayingSong(true);
      } else {
        positionalAudio1Ref.current.pause();
        setIsPlayingSong(false);
      }
    }
  };

  return (
    <>
      <Stage
        preset="rembrandt"
        intensity={1}
        environment={"city"}
        adjustCamera={false}
      >
        <primitive scale={3} object={gltfRoom.scene} />
        <primitive
          ref={skullRef}
          onPointerOver={() => setIsHoveringSkull(true)}
          onPointerOut={() => setIsHoveringSkull(false)}
          onPointerDown={() => setIsSkullClicked((b) => !b)}
          object={gltfSkull.scene}
          scale={isHoveringSkull || isSkullClicked ? 2 : 1}
          position={[15, 5, 0]}
        />

        <group>
          <primitive
            object={gltfRecordPlayer.scene}
            position={[20, 3, 0]}
            onPointerOver={() => setIsHoveringRecordPlayer(true)}
            onPointerOut={() => setIsHoveringRecordPlayer(false)}
            onClick={handleClickRecordPlayer}
            rotation={[0, Math.PI / 2, 0]}
            scale={isHoveringRecordPlayer ? 2.2 : 2}
          />

          {/* @ts-ignore */}
          <PositionalAudio
            ref={positionalAudio1Ref}
            url={SONG_URL_TAME_IMPALA}
            distance={1}
          />

          {/* @ts-ignore */}
          <PositionalAudio
            ref={positionalAudio2Ref}
            url={SONG_URL_BON_IVER}
            distance={1}
          />
        </group>

        <primitive
          object={gltfDesk.scene}
          position={[20, 1.4, 0]}
          scale={2}
          rotation={[0, Math.PI, 0]}
        />

        <Cylinder
          ref={recordRef1}
          args={[1, 1, 0.01]}
          scale={0.35}
          //@ts-ignore
          position={
            selectedRecordId === "Tame Impala - Elephant"
              ? POSITION_RECORD_SELECTED
              : POSITION_RECORD_UNSELECTED
          }
          onPointerDown={() => {
            if (selectedRecordId !== "Tame Impala - Elephant") {
              positionalAudio2Ref.current.stop();
              setIsPlayingSong(false);
              setSelectedRecordId("Tame Impala - Elephant");
            }
          }}
        >
          <meshStandardMaterial map={textureLonerism} />
        </Cylinder>

        <Cylinder
          ref={recordRef2}
          onPointerDown={() => {
            if (selectedRecordId !== "Bon Iver - Skinny Love") {
              positionalAudio1Ref.current.stop();
              setIsPlayingSong(false);
              setSelectedRecordId("Bon Iver - Skinny Love");
            }
          }}
          args={[1, 1, 0.01]}
          scale={0.35}
          //@ts-ignore
          position={
            selectedRecordId === "Bon Iver - Skinny Love"
              ? POSITION_RECORD_SELECTED
              : POSITION_RECORD_UNSELECTED
          }
        >
          <meshStandardMaterial map={textureBonIver} />
        </Cylinder>

        <CameraControls makeDefault dollyToCursor ref={cameraRef} />
      </Stage>
    </>
  );
};

function App() {
  const { accessToken, isWebPlaybackSDKReady } = useSpotifyAuth();
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    console.log("access token changed", accessToken);

    if (accessToken) {
      if (!window.Spotify) {
        console.log("spotify not loaded yet");
        return;
      }
      const player = new window.Spotify.Player({
        name: "Web Playback SDK",
        getOAuthToken: (cb: any) => {
          console.log("passing in ", accessToken);
          cb(accessToken);
        },
        volume: 0.5
      });

      setPlayer(player);

      player.addListener("ready", ({ device_id }: any) => {
        console.log("Ready with Device ID", device_id);
      });

      player.addListener("not_ready", ({ device_id }: any) => {
        console.log("Device ID has gone offline", device_id);
      });

      player.connect();
    }
  }, [accessToken]);

  const [initialCameraPosition, setInitialCameraPosition] = useState<
    [number, number, number]
  >([20, -6, 0]);
  const [initialCameraTarget, setInitialCameraTarget] = useState<
    [number, number, number]
  >([0, -10, 0]);

  return (
    <div className="w-full h-full dark">
      <Toaster />
      <div className="dark:bg-slate-800 h-full flex justify-center items-center flex-col">
        <h1 className="text-white text-3xl font-bold mb-2">leo's room</h1>
        <SpotifyAuth />
        <div className="w-[800px] max-w-full h-[800px] relative">
          <Button
            className="absolute top-0 right-0 z-10"
            onClick={() => {
              setInitialCameraPosition([20, -6, 0]);
              setInitialCameraTarget([0, -10, 0]);
            }}
          >
            Reset View
          </Button>
          <Canvas>
            <ThreeDComponent
              position={initialCameraPosition}
              target={initialCameraTarget}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

// define spotify window global
declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: any;
  }
}

const AppRouter = () => {
  const [isWebPlaybackSDKReady, setIsWebPlaybackSDKReady] = useState(false);
  useEffect(() => {
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      setIsWebPlaybackSDKReady(true);
    };
  }, []);

  useEffect(() => {
    if (!window.Spotify) {
      const scriptTag = document.createElement("script");
      scriptTag.src = "https://sdk.scdn.co/spotify-player.js";

      document.head!.appendChild(scriptTag);
    }
  }, []);
  return (
    <SpotifyAuthContextProvider isWebPlaybackSDKReady={isWebPlaybackSDKReady}>
      <RouterProvider router={router} />;
    </SpotifyAuthContextProvider>
  );
};

export default AppRouter;

const router = createBrowserRouter([
  {
    path: "/spotify-auth-redirect",
    element: <RedirectPage />
  },
  {
    path: "/",
    element: <App />
  }
]);
