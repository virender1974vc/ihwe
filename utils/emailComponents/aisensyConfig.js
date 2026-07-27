'use strict';

const AISENSY_CAMPAIGN_BY_FORM_TYPE = {
    'general-visitor': 'AISENSY_CAMPAIGN_VISITOR_GENERAL',
    'corporate-visitor': 'AISENSY_CAMPAIGN_VISITOR_CORPORATE',
    'health-camp-visitor': 'AISENSY_CAMPAIGN_VISITOR_HEALTHCAMP',
    'buyer-registration': 'AISENSY_CAMPAIGN_BUYER_REGISTRATION',
    'exhibitor-registration': 'AISENSY_CAMPAIGN_EXHIBITOR_RECEIVED',
    'exhibitor-registration-approved': 'AISENSY_CAMPAIGN_EXHIBITOR_APPROVED',
    'exhibitor-booking-confirmed': 'AISENSY_CAMPAIGN_EXHIBITOR_BOOKING',
    'exhibitor-registration-rejection': 'AISENSY_CAMPAIGN_EXHIBITOR_REJECTED',
    'exhibitor-payment-failed': 'AISENSY_CAMPAIGN_EXHIBITOR_PAYMENT_FAILED',
    'exhibitor-payment-receipt': 'AISENSY_CAMPAIGN_EXHIBITOR_PAYMENT_RECEIPT',
    'exhibitor-accessory-order': 'AISENSY_CAMPAIGN_EXHIBITOR_ACCESSORY_ORDER',
    'speaker-nomination': 'AISENSY_CAMPAIGN_SPEAKER_NOMINATION',
    'contact-enquiry': 'AISENSY_CAMPAIGN_CONTACT_ENQUIRY',
    'career-application': 'AISENSY_CAMPAIGN_CAREER_APPLICATION',
    'book-meeting': 'AISENSY_CAMPAIGN_BOOK_MEETING'
};

const AISENSY_BANNER_BY_FORM_TYPE = {
    'general-visitor': 'AISENSY_BANNER_VISITOR_GENERAL',
    'corporate-visitor': 'AISENSY_BANNER_VISITOR_CORPORATE',
    'health-camp-visitor': 'AISENSY_BANNER_VISITOR_HEALTHCAMP',
    'buyer-registration': 'AISENSY_BANNER_BUYER_REGISTRATION',
    'exhibitor-registration': 'AISENSY_BANNER_EXHIBITOR_RECEIVED',
    'exhibitor-registration-approved': 'AISENSY_BANNER_EXHIBITOR_APPROVED',
    'exhibitor-booking-confirmed': 'AISENSY_BANNER_EXHIBITOR_BOOKING',
    'exhibitor-payment-receipt': 'AISENSY_BANNER_EXHIBITOR_PAYMENT_RECEIPT',
    'exhibitor-accessory-order': 'AISENSY_BANNER_EXHIBITOR_ACCESSORY_ORDER',
    'speaker-nomination': 'AISENSY_BANNER_SPEAKER_NOMINATION',
    'contact-enquiry': 'AISENSY_BANNER_CONTACT_ENQUIRY',
    'career-application': 'AISENSY_BANNER_CAREER_APPLICATION',
    'book-meeting': 'AISENSY_BANNER_BOOK_MEETING'
};

module.exports = { AISENSY_CAMPAIGN_BY_FORM_TYPE, AISENSY_BANNER_BY_FORM_TYPE };
