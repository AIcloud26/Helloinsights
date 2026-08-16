// HelloInsights — ads-config.js
// This file has been deprecated and replaced by the AdManager v4 system.
// All ad configuration is now managed through config.json (slotAssignment + adProviders).
// All ad rendering logic is handled by config-loader.js (AdManager).
//
// Migration date: 2026-08-13
// Old ad slots (banner, rectangle, fluid, auto) have been replaced with named slots:
//   - Index page: native-top, banner-mid, banner-bottom
//   - Category page: cat-top, cat-mid, cat-bottom
//   - Article page: article-bottom
//
// To enable ads:
//   1. Set adProviders.<name>.enabled to true in config.json
//   2. Fill in the slot IDs / widget IDs in config.json
//   3. Assign providers to slots via slotAssignment in config.json
//
// No code changes needed — AdManager handles everything automatically.
