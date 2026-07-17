const ArogyaCertificateConfig = require('../models/arogyaCertificateConfig');

const IMAGE_FIELDS = [
  'supportedByLogo',
  'supportedByRightLogo',
  'supportedByBottomRightLogo',
  'mainLogo',
  'titleLogo',
  'certificateHeading',
  'founderSignature',
  'chairmanSignature',
  'globalAwardLogo',
];

const TEXT_FIELDS = [
  'supportedByText',
  'presentsText',
  'bodyTextPart1',
  'recipientName',
  'bodyTextPart2',
  'highlightText1',
  'bodyTextPart3',
  'highlightText2',
  'highlightText3',
  'bodyTextPart4',
  'bodyTextPart5',
  'bodyTextPart6',
  'bodyTextPart7',
  'bodyTextPart8',
  'bodyTextPart9',
  'founderName',
  'founderRole',
  'chairmanName',
  'chairmanRole',
  'initiativesTitle',
  'concurrentTitle',
  'footerAddress',
  'footerContact',
];

const uploadPath = (file) => `/uploads/certificate/${file.filename}`;

const getOrCreateConfig = async () => {
  let config = await ArogyaCertificateConfig.findOne();
  if (!config) {
    config = new ArogyaCertificateConfig();
    await config.save();
  }
  return config;
};

exports.getConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Arogya certificate config fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch certificate config' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();

    TEXT_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) config[field] = req.body[field];
    });

    if (req.body.initiativeLogos !== undefined) {
      config.initiativeLogos = JSON.parse(req.body.initiativeLogos || '[]');
    }
    if (req.body.concurrentLogos !== undefined) {
      config.concurrentLogos = JSON.parse(req.body.concurrentLogos || '[]');
    }

    (req.files || []).forEach((file) => {
      const field = file.fieldname;
      const path = uploadPath(file);

      if (IMAGE_FIELDS.includes(field)) {
        config[field] = path;
        return;
      }

      const initiativeMatch = field.match(/^initiativeLogo_(\d+)$/);
      if (initiativeMatch) {
        const index = Number(initiativeMatch[1]);
        const next = [...(config.initiativeLogos || [])];
        next[index] = path;
        config.initiativeLogos = next;
        return;
      }

      const concurrentMatch = field.match(/^concurrentLogo_(\d+)$/);
      if (concurrentMatch) {
        const index = Number(concurrentMatch[1]);
        const next = [...(config.concurrentLogos || [])];
        next[index] = path;
        config.concurrentLogos = next;
      }
    });

    await config.save();
    res.json({ success: true, message: 'Certificate config updated', data: config });
  } catch (error) {
    console.error('Arogya certificate config update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update certificate config' });
  }
};
