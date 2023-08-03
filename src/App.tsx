import "./globals.css";
import "./App.css";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Stage,
  useTexture,
  Cylinder,
  CameraControls,
  Loader
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useToast } from "components/ui/use-toast";
import { Button } from "components/ui/button";
import { Toaster } from "components/ui/toaster";
import {
  RedirectPage,
  SpotifyAuth,
  SpotifyAuthContextProvider,
  getUsersTopSongs,
  useSpotifyAuth
} from "components/SpotifyAuth";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Expand } from "lucide-react";
import { ISpotifyItem } from "types";
import { Skeleton } from "components/ui/skeleton";

const POSITION_RECORD_SELECTED: [number, number, number] = [20.03, 3.25, 0.1];

const VinylRecordWall = ({
  songs,
  onClickRecord,
  currentTrack,
  isSongPlaying
}: {
  songs: ISpotifyItem[];
  onClickRecord: (recordId: string) => void;
  currentTrack: ISpotifyItem | null;
  isSongPlaying: boolean;
}) => {
  return (
    <group>
      {songs.map((song, index) => {
        // want 4 rows of 5
        const row = Math.floor(index / 5);
        const column = index % 5;

        const x = 18 + row * 0.5;
        const y = 6 + row * -0.5;
        const z = -1.5 + column * 0.75;

        let position: [number, number, number] = [x, y, z];

        const hasSameId = currentTrack?.id === song.id;
        const hasSameName = currentTrack?.name === song.name;

        const isCurrentTrack = hasSameId || hasSameName;

        if (isCurrentTrack) {
          position = POSITION_RECORD_SELECTED;
        }

        return (
          <VinylRecord
            isStandingUp={!isCurrentTrack}
            isPlaying={isCurrentTrack && isSongPlaying}
            key={song.id}
            url={song.album.images[0].url}
            position={position}
            onClick={() => onClickRecord(song.id)}
          />
        );
      })}
    </group>
  );
};

const VinylRecord = ({
  url,
  position,
  isPlaying,
  onClick,
  isStandingUp
}: {
  url: string;
  position: [number, number, number];
  onClick: () => void;
  isPlaying: boolean;
  isStandingUp?: boolean;
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const texture = useTexture(url);
  const recordRef = useRef<any>(null);

  useFrame(() => {
    if (isPlaying) {
      recordRef.current.rotation.y -= 0.01;
    }
  });

  return (
    <Cylinder
      ref={recordRef}
      onPointerDown={onClick}
      onPointerOver={() => setIsHovering(true)}
      onPointerOut={() => setIsHovering(false)}
      args={[1, 1, 0.01]}
      scale={isHovering ? 0.4 : 0.35}
      position={position}
      rotation={isStandingUp ? [0, Math.PI, Math.PI / 2] : [0, 0, 0]}
    >
      <meshStandardMaterial map={texture} />
    </Cylinder>
  );
};

const ThreeDComponent = ({
  songs,
  position,
  target,
  currentTrack,
  onClickRecord,
  isSongPlaying
}: {
  position: [number, number, number];
  target: [number, number, number];
  songs?: ISpotifyItem[];
  currentTrack: ISpotifyItem | null;
  onClickRecord: (id: string) => void;
  isSongPlaying: boolean;
}) => {
  const gltfSkull = useGLTF("skull.glb");
  const gltfRoom = useGLTF("modern_bedroom.glb");
  const gltfRecordPlayer = useGLTF("vinyl_player.glb");
  const gltfDesk = useGLTF("antique_wooden_desk.glb");

  const [isSkullClicked, setIsSkullClicked] = useState(false);

  const [isHoveringSkull, setIsHoveringSkull] = useState(false);

  const cameraRef = useRef<CameraControls>(null);
  const skullRef = useRef<any>(null);

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

  return (
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
        scale={!songs && (isHoveringSkull || isSkullClicked) ? 2 : 1}
        position={[15, 5, 0]}
      />

      <group>
        <primitive
          object={gltfRecordPlayer.scene}
          position={[20, 3, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={2}
        />
      </group>

      <primitive
        object={gltfDesk.scene}
        position={[20, 1.4, 0]}
        scale={2}
        rotation={[0, 0, 0]}
      />

      {songs && (
        <VinylRecordWall
          currentTrack={currentTrack}
          onClickRecord={onClickRecord}
          songs={songs}
          isSongPlaying={isSongPlaying}
        />
      )}

      <CameraControls makeDefault dollyToCursor ref={cameraRef} />
    </Stage>
  );
};

function App() {
  const { accessToken, setAccessToken } = useSpotifyAuth();
  const [player, setPlayer] = useState<any>(null);
  const { toast } = useToast();

  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<ISpotifyItem | null>(null);
  // todo?: use this
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [topSongs, setTopSongs] = useState<ISpotifyItem[]>([]);

  const [initialCameraPosition, setInitialCameraPosition] = useState<
    [number, number, number]
  >([20, -6, 0]);
  const [initialCameraTarget, setInitialCameraTarget] = useState<
    [number, number, number]
  >([0, -10, 0]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const accessToken = localStorage.getItem("access_token");

      // check if access token is valid
      if (accessToken) {
        try {
          const response = await getUsersTopSongs(accessToken);
          if (response.error) {
            throw new Error(response.error.message);
          }

          const items = response.items as ISpotifyItem[];

          setTopSongs(items);

          setAccessToken(accessToken);
        } catch (e) {
          console.error(e);
          console.log(
            "Unable to retrieve top songs - access token might be invalid"
          );
          localStorage.setItem("access_token", "");
        }
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [setAccessToken]);

  useEffect(() => {
    if (accessToken) {
      if (!window.Spotify) {
        return;
      }
      const player = new window.Spotify.Player({
        name: "My Dope Room",
        getOAuthToken: (cb: any) => {
          cb(accessToken);
        },
        volume: 0.5
      });

      setPlayer(player);

      player.addListener("ready", ({ device_id }: any) => {
        setIsPlayerReady(true);
      });

      player.addListener("not_ready", ({ device_id }: any) => {
        setIsPlayerReady(false);
      });

      player.addListener("player_state_changed", (state: any) => {
        if (!state) {
          return;
        }

        setCurrentTrack(state.track_window.current_track);
        setIsPaused(state.paused);

        player.getCurrentState().then((state: any) => {
          !state ? setIsActive(false) : setIsActive(true);
          setIsPaused(state.paused);
        });
      });

      player.connect();
    }
  }, [accessToken]);

  const handleClickRecord = (id: string) => {
    const record = topSongs.find((song) => song.id === id);
    if (!isActive) return;

    // check if connected to spotify
    if (!currentTrack?.name) {
      toast({
        title: "Please connect to Spotify",
        description: "Please connect to Spotify to play music"
      });
      return;
    }

    const hasSameId = currentTrack?.id === id;
    const hasSameName = currentTrack?.name === record?.name;

    if (hasSameId || hasSameName) {
      if (isPaused) {
        player.resume();
        setIsPaused(false);
      } else {
        player.pause();
        setIsPaused(true);
      }
    } else {
      playSong(`spotify:track:${id}`)
        .then(() => {
          setIsPaused(false);
        })
        .catch((e) => {
          // check error code 401
          if (e.status === 401) {
            toast({
              title: "Please connect to Spotify",
              description: "Please connect to Spotify to play music"
            });

            setAccessToken("");
          }
        });
    }
  };

  async function playSong(uri: string) {
    try {
      await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        body: JSON.stringify({
          uris: [uri],
          position_ms: 1
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
    } catch (e) {
      toast({
        title: "Error playing song",
        description: "There was an error playing the song"
      });
    }
  }

  return (
    <div className="w-full h-full dark">
      <Toaster />
      <div className="dark:bg-slate-800 h-full flex justify-center items-center flex-col">
        {!isFullscreen && (
          <>
            <h1 className="text-white text-3xl font-bold mb-2">My Dope Room</h1>

            {!accessToken && <SpotifyAuth />}

            {accessToken && !currentTrack?.name && (
              <h2 className="dark:text-white mb-1 text-center">
                Please connect to the device "My Dope Room" on your Spotify app
              </h2>
            )}
          </>
        )}

        <div
          className="w-full max-w-full h-[300px] relative md:w-[800px] md:h-[800px] "
          style={{
            width: isFullscreen ? "100vw" : undefined,
            height: isFullscreen ? "-webkit-fill-available" : undefined
          }}
        >
          <Suspense
            fallback={
              <div className="w-full h-full flex justify-center items-center">
                {/* <h2 className="dark:text-white">Loading Room...</h2> */}
                <Skeleton className="w-full h-full" />
                <Loader />
              </div>
            }
          >
            <Button
              className="absolute top-0 right-0 z-10"
              onClick={() => {
                setInitialCameraPosition([20, -6, 0]);
                setInitialCameraTarget([0, -10, 0]);
              }}
            >
              Reset View
            </Button>

            <div className="absolute bottom-1 right-1 z-10 cursor-pointer">
              <Expand
                onClick={() => {
                  setIsFullscreen((b) => !b);
                }}
                className="w-6 h-6 text-gray-50 hover:text-white"
              />
            </div>

            <Canvas>
              <ThreeDComponent
                songs={topSongs}
                position={initialCameraPosition}
                target={initialCameraTarget}
                currentTrack={currentTrack}
                onClickRecord={handleClickRecord}
                isSongPlaying={!isPaused}
              />
            </Canvas>
          </Suspense>

          {currentTrack?.name && (
            <div className="absolute bottom-0">
              <div className="flex p-2">
                <div className="flex flex-col">
                  <img
                    src={currentTrack.album.images[0].url}
                    className="w-16 h-16 rounded-full"
                    alt=""
                  />

                  <div className="now-playing__side text-white">
                    <div className="now-playing__name ">
                      {currentTrack.name}
                    </div>

                    <div className="now-playing__artist">
                      {currentTrack.artists[0].name}
                    </div>
                  </div>
                </div>

                <Button
                  className="ml-4"
                  onClick={() => {
                    player.togglePlay();
                  }}
                >
                  {isPaused ? "Play" : "Pause"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
      <RouterProvider router={router} />
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
