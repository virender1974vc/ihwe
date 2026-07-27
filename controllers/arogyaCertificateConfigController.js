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

const EMPTY_IMAGE_VALUE = '__CERT_IMAGE_EMPTY__';
const CERTIFICATE_TYPES = new Set([
  'speaker',
  'delegate',
  'paperPresentation',
  'posterPresentation',
  'juryMember',
  'guest',
]);

const TEXT_FIELDS = [
  'supportedByText',
  'supportedByLeftText',
  'supportedByRightText',
  'supportedByBottomRightText',
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

const TYPE_TEXT_DEFAULTS = {
  juryMember: {
    bodyTextPart1: 'We extend our gratitude to',
    bodyTextPart2: 'for serving as a Jury Member for the Paper Presentation at the 18th',
    highlightText1: 'Arogya Sangoshthi',
    bodyTextPart3: 'Seminar & 9th Edition of',
    highlightText2: 'International Health & Wellness',
    highlightText3: 'Expo 2026',
    bodyTextPart4: ', organised by Namo Gange Trust, held from 21st August to 23rd August 2026',
    bodyTextPart5: 'at Pragati Maidan, New Delhi, Bharat.',
    bodyTextPart6: 'Your expertise, fair evaluation, and insights contributed to the success',
    bodyTextPart7: 'of the sessions.',
    bodyTextPart8: 'We sincerely appreciate your dedication, professionalism, and commitment to promoting',
    bodyTextPart9: 'excellence in healthcare, research, and innovation.',
  },
};

const uploadPath = (file) => `/uploads/certificate/${file.filename}`;

const normalizeCertificateType = (type) => (
  CERTIFICATE_TYPES.has(type) ? type : 'speaker'
);

const getOrCreateConfig = async (requestedType = 'speaker') => {
  const certificateType = normalizeCertificateType(requestedType);
  let config = await ArogyaCertificateConfig.findOne({ certificateType });

  if (!config && certificateType === 'speaker') {
    config = await ArogyaCertificateConfig.findOne({ certificateType: { $exists: false } });
    if (config) {
      config.certificateType = 'speaker';
      await config.save();
    }
  }

  if (!config) {
    config = new ArogyaCertificateConfig({ certificateType, ...(TYPE_TEXT_DEFAULTS[certificateType] || {}) });
    await config.save();
  }
  return config;
};

exports.getConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig(req.query.type);
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Arogya certificate config fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch certificate config' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig(req.body.certificateType);
    config.certificateType = normalizeCertificateType(req.body.certificateType);

    TEXT_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) config[field] = req.body[field];
    });

    if (req.body.initiativeLogos !== undefined) {
      config.initiativeLogos = JSON.parse(req.body.initiativeLogos || '[]');
    }
    if (req.body.concurrentLogos !== undefined) {
      config.concurrentLogos = JSON.parse(req.body.concurrentLogos || '[]');
    }

    JSON.parse(req.body.clearedImageFields || '[]').forEach((field) => {
      if (IMAGE_FIELDS.includes(field)) config[field] = EMPTY_IMAGE_VALUE;
    });

    JSON.parse(req.body.resetImageFields || '[]').forEach((field) => {
      if (IMAGE_FIELDS.includes(field)) config[field] = '';
    });

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
