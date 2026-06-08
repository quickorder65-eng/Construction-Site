export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const data = req.body || {};

    const name  = String(data.name  || '').trim();
    const phone = String(data.phone || '').trim();

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const estimateRequest = {
      name,
      phone,
      source:      data.source      || '',
      objectType:  data.objectType  || '',
      area:        data.area        || '',
      repairType:  data.repairType  || '',
      workPriority: data.workPriority || '',
      startTime:   data.startTime   || '',
      message:     data.message     || '',
      pageUrl:     data.pageUrl     || '',
      createdAt:   data.createdAt   || new Date().toISOString(),
      utmSource:   data.utmSource   || '',
      utmMedium:   data.utmMedium   || '',
      utmCampaign: data.utmCampaign || ''
    };

    console.log('New Riza Stroy Group estimate request:', estimateRequest);

    const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (sheetsWebhookUrl) {
      const sheetsResponse = await fetch(sheetsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estimateRequest)
      });

      if (!sheetsResponse.ok) {
        return res.status(500).json({ success: false, message: 'Google Sheets webhook error' });
      }

      return res.status(200).json({
        success: true,
        mode: 'google_sheets',
        message: 'Estimate request saved to Google Sheets'
      });
    }

    console.log('GOOGLE_SHEETS_WEBHOOK_URL not configured — demo mode');

    return res.status(200).json({
      success: true,
      mode: 'demo',
      message: 'Estimate request received in demo mode. Configure GOOGLE_SHEETS_WEBHOOK_URL to save to Google Sheets.'
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}
