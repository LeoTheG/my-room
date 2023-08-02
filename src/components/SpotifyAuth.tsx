import React, { PropsWithChildren, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

// public key
const clientId = "825061040e06449781114c19a0af4732";

// todo change for production
const redirectUri = "http://localhost:3000/spotify-auth-redirect";

export const SpotifyAuth = () => {
  const handleLogin = async () => {
    const codeVerifier = generateRandomString(128);

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(16);
    const scope = "user-read-private user-read-email user-top-read streaming";

    localStorage.setItem("code_verifier", codeVerifier);

    const args = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge
    });

    //@ts-ignore
    window.location = "https://accounts.spotify.com/authorize?" + args;
  };

  return (
    <div>
      <Button onClick={handleLogin}>Spotify Connect</Button>
    </div>
  );
};

export const RedirectPage: React.FC<PropsWithChildren<{}>> = (props) => {
  const { setAccessToken, accessToken } = useSpotifyAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const codeVerifier = localStorage.getItem("code_verifier");

    if (!code || !codeVerifier) {
      console.log("no code or code verifier");
    }

    //@ts-ignore
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier
    });

    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("HTTP status " + response.status);
        }
        return response.json();
      })
      .then(async (data) => {
        localStorage.setItem("access_token", data.access_token);
        setAccessToken(data.access_token);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, [setAccessToken]);

  useEffect(() => {
    if (accessToken) {
      navigate("/");
    }
  }, [accessToken, navigate]);

  return <div>{props.children}</div>;
};

export const SpotifyAuthContext = React.createContext({
  isWebPlaybackSDKReady: false,
  accessToken: "",
  setAccessToken: (accessToken: string) => {},
  hasFetchedAccessToken: false,
  setHasFetchedAccessToken: (hasFetchedAccessToken: boolean) => {}
});

export const SpotifyAuthContextProvider: React.FC<
  PropsWithChildren<{ isWebPlaybackSDKReady: boolean }>
> = (props) => {
  const [accessToken, setAccessToken] = useState("");
  const [hasFetchedAccessToken, setHasFetchedAccessToken] = useState(false);

  return (
    <SpotifyAuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        hasFetchedAccessToken,
        setHasFetchedAccessToken,
        isWebPlaybackSDKReady: props.isWebPlaybackSDKReady
      }}
    >
      {props.children}
    </SpotifyAuthContext.Provider>
  );
};

export const useSpotifyAuth = () => {
  const {
    accessToken,
    setAccessToken,
    isWebPlaybackSDKReady,
    hasFetchedAccessToken,
    setHasFetchedAccessToken
  } = React.useContext(SpotifyAuthContext);
  return {
    accessToken,
    setAccessToken,
    isWebPlaybackSDKReady,
    hasFetchedAccessToken,
    setHasFetchedAccessToken
  };
};

function generateRandomString(length: number) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string) {
  function base64encode(string: any) {
    //@ts-ignore
    return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);

  return base64encode(digest);
}

// unused
const getUsersTopSongs = async (accessToken: any) => {
  accessToken = localStorage.getItem("access_token");
  const response = await fetch("https://api.spotify.com/v1/me/top/tracks", {
    headers: {
      Authorization: "Bearer " + accessToken
    }
  });

  const data = await response.json();
  console.log({ data });
};

async function getProfile(accessToken: any) {
  accessToken = localStorage.getItem("access_token");

  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: "Bearer " + accessToken
    }
  });

  const data = await response.json();
  console.log({ data });
}
