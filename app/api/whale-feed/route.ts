import { NextResponse } from "next/server";
import { fetchJsonRetry } from "@/lib/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const USER = process.env.WHALE_USER || "BagsWhaleBot";
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
    // Get user data with retry logic
    const userEndpoint = `https://api.fxtwitter.com/${USER}`;
    const data = await fetchJsonRetry(userEndpoint, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; WhaleBot/1.0)'
      },
      cache: "no-store"
    });
    
    // Check for API error responses
    if (data.code && data.code !== 200) {
      return NextResponse.json({ 
        ok: false, 
        error: `FixTweet API: ${data.message || 'Unknown error'}` 
      }, { status: 502 });
    }

    // For User API, we need to get tweets from the user object
    if (!data.user) {
      return NextResponse.json({ 
        ok: false, 
        error: "No user data found in response" 
      }, { status: 502 });
    }

    // Get timeline data with retry logic
    const timelineEndpoint = `https://api.fxtwitter.com/${USER}/tweets`;
    const timelineData = await fetchJsonRetry(timelineEndpoint, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; WhaleBot/1.0)'
      },
      cache: "no-store"
    });
    
    // Extract tweets from timeline response
    let tweets: any[] = [];
    if (timelineData.tweets) {
      tweets = Array.isArray(timelineData.tweets) ? timelineData.tweets : [timelineData.tweets];
    } else if (Array.isArray(timelineData)) {
      tweets = timelineData;
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
        name: tweet.author?.name || tweet.user?.name || data.user?.name || "Whale Bot",
        handle: tweet.author?.screen_name || tweet.user?.screen_name || data.user?.screen_name || USER,
        avatar: tweet.author?.avatar_url || tweet.user?.profile_image_url_https || data.user?.avatar_url,
      },
    }));

    // Sort by timestamp if available
    items.sort((a, b) => (b.created_timestamp || 0) - (a.created_timestamp || 0));

    return NextResponse.json({ 
      ok: true, 
      count: items.length, 
      items: items.slice(0, MAX),
      source: "api.fxtwitter.com",
      user: {
        name: data.user?.name,
        screen_name: data.user?.screen_name,
        followers: data.user?.followers,
        avatar_url: data.user?.avatar_url
      }
    });

  } catch (e: any) {
    return NextResponse.json({ 
      ok: false, 
      error: `API Error: ${e.message}`,
      details: e.name === 'FetchError' ? 'Network connection failed after retries' : undefined
    }, { status: 500 });
  }
}