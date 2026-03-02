const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/supabase');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EMERGENCY_NUMBERS = `
EMERGENCY NUMBERS (India):
• National Emergency: 112
• Ambulance: 108
• Disaster Management (NDRF): 1078
• Fire: 101
• Police: 100
• Women Helpline: 1091
• Child Helpline: 1098
`;

// Haversine formula to calculate distance in km between two lat/lng points
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// @desc    Emergency Chatbot — location-aware, multi-turn
// @route   POST /api/chatbot/chat
const chatWithAI = async (req, res) => {
    const { message, context, history, location } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'message is required' });
    }

    // --- Find nearest site if location is provided ---
    let nearestSite = null;
    let nearestVolunteerContact = null;
    let sitesContext = '';

    try {
        const { data: sites } = await supabase
            .from('sites')
            .select('id, name, location, latitude, longitude, urgency_score, patient_count')
            .order('urgency_score', { ascending: false })
            .limit(10);

        if (sites && sites.length > 0) {
            // If user shares location, find nearest site with coordinates
            if (location && location.lat && location.lng) {
                const sitesWithCoords = sites.filter(s => s.latitude && s.longitude);
                if (sitesWithCoords.length > 0) {
                    let minDist = Infinity;
                    sitesWithCoords.forEach(site => {
                        const dist = getDistanceKm(location.lat, location.lng, site.latitude, site.longitude);
                        if (dist < minDist) {
                            minDist = dist;
                            nearestSite = { ...site, distance_km: dist.toFixed(1) };
                        }
                    });

                    // Find a volunteer contact at the nearest site
                    if (nearestSite) {
                        const { data: volunteers } = await supabase
                            .from('users')
                            .select('full_name, phone, assigned_track')
                            .eq('current_site_id', nearestSite.id)
                            .in('assigned_track', ['NURSE', 'HELPER'])
                            .limit(1);

                        if (volunteers && volunteers.length > 0) {
                            nearestVolunteerContact = volunteers[0];
                        }
                    }
                }
            }

            sitesContext = '\n\nActive Relief Sites:\n' + sites.map(s =>
                `• ${s.name} (${s.location || 'Location unknown'}) — Urgency: ${s.urgency_score}/10, Patients: ${s.patient_count}`
            ).join('\n');
        }
    } catch (e) {
        console.error('Site fetch error (non-fatal):', e.message);
    }

    const nearestSiteContext = nearestSite
        ? `\nCLOSEST SAFE ZONE to user: ${nearestSite.name} — ${nearestSite.distance_km} km away (${nearestSite.location}). PRIORITIZE directing them here.`
        : '';

    const systemPrompt = `
    You are the Karuna Emergency Assistant — a disaster relief chatbot.
    Provide immediate, clear, calm advice during a disaster.
    
    ${EMERGENCY_NUMBERS}
    ${nearestSiteContext}
    ${sitesContext}

    RULES:
    1. ALWAYS include relevant emergency phone numbers in your first response.
    2. If the user shared their location and a nearest safe zone was found, PROMINENTLY direct them there first.
    3. Provide step-by-step evacuation or safety instructions.
    4. Use bullet points. Plain language. No medical jargon.
    5. Always end with: "Stay calm. Help is on the way."
  `;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const contents = [];
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            });
        }

        const currentMessage = context ? `[Context: ${context}] ${message}` : message;
        contents.push({ role: 'user', parts: [{ text: currentMessage }] });

        const result = await model.generateContent({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });

        const text = result.response.text();

        res.status(200).json({
            response: text,
            nearest_site: nearestSite
                ? {
                    name: nearestSite.name,
                    location: nearestSite.location,
                    distance_km: nearestSite.distance_km
                }
                : null,
            volunteer_contact: nearestVolunteerContact
                ? {
                    name: nearestVolunteerContact.full_name,
                    phone: nearestVolunteerContact.phone,
                    role: nearestVolunteerContact.assigned_track
                }
                : null,
            emergency_numbers: {
                national: '112', ambulance: '108', ndrf: '1078', fire: '101', police: '100'
            }
        });
    } catch (error) {
        console.error('Chatbot AI Error:', error);
        // Always return emergency numbers even on failure
        res.status(200).json({
            response: `I'm having trouble right now, but here are your emergency numbers:\n${EMERGENCY_NUMBERS}\n\nStay calm. Help is on the way.`,
            nearest_site: nearestSite || null,
            volunteer_contact: nearestVolunteerContact || null,
            emergency_numbers: {
                national: '112', ambulance: '108', ndrf: '1078', fire: '101', police: '100'
            },
            ai_error: true
        });
    }
};

module.exports = { chatWithAI };
