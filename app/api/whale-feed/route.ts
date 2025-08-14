// app/api/whale-feed/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const USER = process.env.WHALE_USER || "BagsWhaleBot";
const FX_API = process.env.FXTWITTER_API_BASE || "https://api.fxtwitter.com";
const MAX = 25;

type Item = {
  id: string;
  text: string;
  created_at?: string;
  created_timestamp?: number;
  url?: string;
  media?: { photos: string[]; videos: string[] };
  author?: { name?: string; handle?: string; avatar?: string };
};

function cleanText(s: string) {
  // remove trailing t.co links + collapse spaces
  return (s || "").replace(/https?:\/\/t\.co\/\S+/g, "").replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    // Try different FixTweet API endpoints for user timeline
    const endpoints = [
      `${FX_API}/${USER}`,
      `${FX_API}/twitter/user/${USER}`,
      `${FX_API}/user/${USER}/tweets`,
      `https://api.fxtwitter.com/${USER}`,
      `https://vxtwitter.com/api/user/${USER}`,
    ];

    let userData: any = null;
    let lastError = "";

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; WhaleBot/1.0)'
          },
          cache: "no-store"
        });

        if (!response.ok) {
          lastError = `${endpoint}: ${response.status}`;
          continue;
        }

        const data = await response.json();
        
        // Check if we got valid data with tweets
        if (data && (data.tweets || data.timeline || Array.isArray(data))) {
          userData = data;
          break;
        }

        lastError = `${endpoint}: No tweets found in response`;
      } catch (e: any) {
        lastError = `${endpoint}: ${e.message}`;
        continue;
      }
    }

    if (!userData) {
      return NextResponse.json({ 
        ok: false, 
        error: `Failed to fetch user timeline. Last error: ${lastError}` 
      }, { status: 502 });
    }

    // Extract tweets from different possible response formats
    let tweets: any[] = [];
    if (userData.tweets) {
      tweets = Array.isArray(userData.tweets) ? userData.tweets : [userData.tweets];
    } else if (userData.timeline) {
      tweets = Array.isArray(userData.timeline) ? userData.timeline : [userData.timeline];
    } else if (Array.isArray(userData)) {
      tweets = userData;
    } else if (userData.tweet) {
      tweets = [userData.tweet];
    }

    const items: Item[] = tweets.slice(0, MAX).map((tweet: any) => ({
      id: tweet.id || tweet.id_str || String(Math.random()),
      text: cleanText(tweet.text || tweet.full_text || ""),
      created_at: tweet.created_at,
      created_timestamp: tweet.created_timestamp || tweet.timestamp,
      url: tweet.url || `https://twitter.com/${USER}/status/${tweet.id || tweet.id_str}`,
      media: {
        photos: (tweet.media?.photos || tweet.photos || []).map((p: any) => 
          typeof p === 'string' ? p : p.url || p.media_url_https || p.media_url
        ),
        videos: (tweet.media?.videos || tweet.videos || []).map((v: any) => 
          typeof v === 'string' ? v : v.url || v.video_info?.variants?.[0]?.url
        ),
      },
      author: {
        name: tweet.author?.name || tweet.user?.name || "Whale Bot",
        handle: tweet.author?.screen_name || tweet.user?.screen_name || USER,
        avatar: tweet.author?.avatar_url || tweet.user?.profile_image_url_https,
      },
    }));

    // Sort by timestamp if available
    items.sort((a, b) => (b.created_timestamp || 0) - (a.created_timestamp || 0));

    return NextResponse.json({ 
      ok: true, 
      count: items.length, 
      items: items.slice(0, MAX),
      source: "FixTweet API"
    });

  } catch (e: any) {
    return NextResponse.json({ 
      ok: false, 
      error: `API Error: ${e.message}` 
    }, { status: 500 });
  }
}