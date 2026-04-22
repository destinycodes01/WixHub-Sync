import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getDb } from '../_lib/firebase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in query string' });
  }

  try {
    const db = getDb();
    const wixConn = await db.collection('wix_connections').doc(userId).get();
    
    if (!wixConn.exists) {
      return res.status(404).json({ success: false, error: 'Wix unauthenticated. Please connect Wix first.' });
    }
    
    const { access_token } = wixConn.data()!;

    // Request members natively through Wix headless REST API using the user's authorized token
    const response = await axios.get('https://www.wixapis.com/members/v1/members', {
      headers: { 
        'Authorization': access_token,
        'Accept': 'application/json'
      }
    });
    
    const membersData = response.data;
    const rawMembers = membersData.members || membersData.items || [];
    const count = membersData.metadata?.total || rawMembers.length;

    const cleanedMembers = rawMembers.map((member: any) => ({
      email: member.loginEmail || member.profile?.email || "",
      name: member.profile?.nickname || member.profile?.slug || "",
      wixMemberId: member.id || member._id
    }));

    return res.status(200).json({
      success: true,
      count,
      members: cleanedMembers
    });
  } catch (error: any) {
    console.error("Error fetching Wix members:", error.response?.data || error.message);
    
    // Check if unauthorized cleanly
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Wix access token expired. Refreshing tokens via Headless requires re-authentication or silent offline_access refresh handling.'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch members'
    });
  }
}
