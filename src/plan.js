// Seller identity and paid-plan terms. Shared by pricing copy (i18n.js) and the
// legal pages (legal.js) so prices, seats and refund windows never drift apart.
// No imports here: both of those modules depend on this one.

export const LEGAL_NAME_EN = 'Dudu Technology Ltd.';
export const LEGAL_NAME_ZH = '嘟嘟數位科技有限公司';
export const EFFECTIVE_DATE = '2026-10-15';

export const PLAN = {
  proPrice: 'US$149',
  proRenewal: 'US$49',
  teamPrice: 'US$890',
  teamSeats: 10,
  proDevices: 3,
  updateMonths: 12,
  refundDays: 14,
};
