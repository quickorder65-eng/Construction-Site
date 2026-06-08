export default async function handler(req, res) {
  return res.status(410).json({
    success: false,
    message: 'This endpoint has been removed. Use /api/save-lead instead.'
  });
}
