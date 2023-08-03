declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: any;
  }
}

export interface ISpotifyItem {
  album: {
    album_type: "SINGLE";
    artists: [
      {
        external_urls: {
          // url like: "https://open.spotify.com/artist/2KT..."
          spotify: string;
        };
        // ex: "https://api.spotify.com/v1/artists/2KT..."
        href: string;
        // ex: "2KT..."
        id: string;
        name: string;
        type: "artist";
        //ex: "spotify:artist:2KT..."
        uri: string;
      }
    ];
    available_markets: string[];
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: [
      {
        height: number;
        url: string;
        width: number;
      }
    ];
    name: string;
    // ex: "2023-03-07";
    release_date: string;
    release_date_precision: "day";
    total_tracks: number;
    type: "album";
    //ex: uri: "spotify:album:4PR..."
    uri: string;
  };
  artists: [
    {
      external_urls: {
        spotify: string;
      };
      href: string;
      id: string;
      name: string;
      type: "artist";
      uri: string;
    }
  ];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: true;
  external_ids: {
    isrc: string;
  };
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: "track";
  uri: string;
}
