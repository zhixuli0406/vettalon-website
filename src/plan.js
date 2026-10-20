// Seller identity and paid-plan terms. Shared by pricing copy (i18n.js) and the
// legal pages (legal.js) so prices, seats and refund windows never drift apart.
// No imports here: both of those modules depend on this one.

export const LEGAL_NAME_EN = 'Dudu Technology Ltd.';
export const LEGAL_NAME_ZH = '嘟嘟數位科技有限公司';
// Taiwan Unified Business Number (統一編號).
export const TAX_ID = '94139082';
export const EFFECTIVE_DATE = '2026-10-20';

export const PLAN = {
  proPrice: 'US$149',
  proRenewal: 'US$49',
  teamPrice: 'US$890',
  teamSeats: 10,
  proDevices: 3,
  updateMonths: 12,
  // Security updates stay free at least until the end of the same calendar
  // month this many years after the purchase date (see support.js).
  supportYears: 5,
  refundDays: 14,
};
