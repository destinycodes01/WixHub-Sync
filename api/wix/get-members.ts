import type { VercelRequest, VercelResponse } from '@vercel/node';
import { wixClient } from '../_lib/wixClient.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // We default to an empty site ID for listing all members associated with the API Key/Project
    // Note: depending on the exact member API implementation, you might need to use queryMembers() if listMembers() isn't standard in V1
    const response = await wixClient.members.queryMembers().find();
    
    const count = response.totalCount || response.items.length;
    const rawMembers = response.items || [];

    const cleanedMembers = rawMembers.map((member: any) => ({
      email: member.loginEmail || member.profile?.email || "",
      name: member.profile?.nickname || member.profile?.slug || "",
      wixMemberId: member._id
    }));

    console.log(`Total members fetched: ${cleanedMembers.length}`);
    if (cleanedMembers.length > 0) {
      console.log('Sample member (first item):', cleanedMembers[0]);
    }

    return res.status(200).json({
      success: true,
      count: cleanedMembers.length,
      members: cleanedMembers
    });
  } catch (error: any) {
    console.error("Error fetching Wix members:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch members'
    });
  }
}
