// Security-update support period: free security updates at least until the
// end of the same calendar month PLAN.supportYears years after the purchase
// date (UTC). Shared by the pricing section, the support page and tests.

import { PLAN } from './plan.js';

/** { year, month (1-12) } whose last day ends the support period. */
export function supportEndFor(purchase) {
  return { year: purchase.getUTCFullYear() + PLAN.supportYears, month: purchase.getUTCMonth() + 1 };
}

/** "2031 年 10 月底" or "the end of October 2031". */
export function formatSupportEnd({ year, month }, locale) {
  if (locale === 'en') {
    const name = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 15)));
    return `the end of ${name} ${year}`;
  }
  return `${year} 年 ${month} 月底`;
}
