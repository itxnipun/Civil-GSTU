// api/proxy.js

// This is the server-side Supabase client
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Get the Supabase URL and Key from Vercel's secure Environment Variables
  const supabaseUrl = process.env.https://cwubbhcuormtrvyczgpf.supabase.co;
  const supabaseKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJiaGN1b3JtdHJ2eWN6Z3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MDQ2MDIsImV4cCI6MjA3Mjk4MDYwMn0.EC-lF_wgrTZxvBpHb_z___45JGHHwX3hKGgQ3juRy5I;

  // Create a new Supabase client for the server
  const supabase = createClient(supabaseUrl, supabaseKey);

  // This part is complex, but it essentially forwards the user's request
  // to Supabase and then streams the response back to the user.
  const { pathname, search } = new URL(req.url);
  const url = new URL(pathname + search, supabaseUrl);
  url.pathname = url.pathname.replace('/api/proxy', ''); // Clean up the path

  const res = await fetch(url, {
    method: req.method,
    headers: {
      ...req.headers,
      apiKey: supabaseKey,
      'Content-Type': 'application/json',
    },
    body: req.body,
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}