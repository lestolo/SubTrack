/*
 * Catalogue of popular subscription services.
 *
 * Each entry: [id, name, category, brandColor, simpleIconsSlug | null]
 * - brandColor is a hex string without "#".
 * - When the slug is null (brand not available in Simple Icons) the UI shows a
 *   monogram tile in the brand colour instead of a logo.
 *
 * Prices are intentionally NOT included: they change often and differ per
 * country, so the user always types the amount they actually pay.
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});

  const CATEGORIES = [
    'video', 'music', 'cloud', 'productivity', 'ai', 'creative', 'gaming',
    'security', 'shopping', 'reading', 'fitness', 'education', 'telco',
    'finance', 'social', 'other',
  ];

  const RAW = [
    // Video streaming
    ['netflix', 'Netflix', 'video', 'E50914', 'netflix'],
    ['amazonprime', 'Amazon Prime', 'video', '00A8E1', null],
    ['disneyplus', 'Disney+', 'video', '113CCF', null],
    ['appletv', 'Apple TV', 'video', '000000', 'appletv'],
    ['sky', 'Sky', 'video', '0072C9', 'sky'],
    ['now', 'NOW', 'video', '000000', 'now'],
    ['dazn', 'DAZN', 'video', '0C161C', 'dazn'],
    ['hbomax', 'HBO Max', 'video', '002BE7', 'hbomax'],
    ['paramountplus', 'Paramount+', 'video', '0064FF', 'paramountplus'],
    ['youtubepremium', 'YouTube Premium', 'video', 'FF0000', 'youtube'],
    ['crunchyroll', 'Crunchyroll', 'video', 'FF5E00', 'crunchyroll'],
    ['mubi', 'MUBI', 'video', '000000', 'mubi'],
    ['timvision', 'TIMVISION', 'video', '0033A0', null],
    ['mediasetinfinity', 'Mediaset Infinity+', 'video', '1A1A6E', null],
    ['rakutentv', 'Rakuten TV', 'video', 'BF0000', 'rakuten'],
    ['discoveryplus', 'discovery+', 'video', '2175D9', null],

    // Music & audio
    ['spotify', 'Spotify', 'music', '1DB954', 'spotify'],
    ['applemusic', 'Apple Music', 'music', 'FA243C', 'applemusic'],
    ['amazonmusic', 'Amazon Music Unlimited', 'music', '25D1DA', null],
    ['youtubemusic', 'YouTube Music', 'music', 'FF0000', 'youtubemusic'],
    ['deezer', 'Deezer', 'music', 'A238FF', 'deezer'],
    ['tidal', 'TIDAL', 'music', '000000', 'tidal'],
    ['soundcloud', 'SoundCloud Go+', 'music', 'FF5500', 'soundcloud'],
    ['audible', 'Audible', 'music', 'F8991C', 'audible'],
    ['pocketcasts', 'Pocket Casts Plus', 'music', 'F43E37', 'pocketcasts'],

    // Cloud storage
    ['icloud', 'iCloud+', 'cloud', '3693F3', 'icloud'],
    ['googleone', 'Google One', 'cloud', '4285F4', null],
    ['dropbox', 'Dropbox', 'cloud', '0061FF', 'dropbox'],
    ['onedrive', 'OneDrive', 'cloud', '0078D4', null],
    ['proton', 'Proton Unlimited', 'cloud', '6D4AFF', 'proton'],
    ['protondrive', 'Proton Drive', 'cloud', '6D4AFF', 'protondrive'],
    ['mega', 'MEGA', 'cloud', 'D9272E', 'mega'],
    ['box', 'Box', 'cloud', '0061D5', 'box'],
    ['pcloud', 'pCloud', 'cloud', '17BED0', null],

    // Productivity & work
    ['microsoft365', 'Microsoft 365', 'productivity', 'D83B01', null],
    ['googleworkspace', 'Google Workspace', 'productivity', '4285F4', null],
    ['notion', 'Notion', 'productivity', '000000', 'notion'],
    ['evernote', 'Evernote', 'productivity', '00A82D', 'evernote'],
    ['todoist', 'Todoist', 'productivity', 'E44332', 'todoist'],
    ['zoom', 'Zoom', 'productivity', '0B5CFF', 'zoom'],
    ['slack', 'Slack', 'productivity', '4A154B', null],
    ['linkedinpremium', 'LinkedIn Premium', 'productivity', '0A66C2', null],
    ['grammarly', 'Grammarly', 'productivity', '15C39A', 'grammarly'],
    ['setapp', 'Setapp', 'productivity', 'E6C3A5', 'setapp'],
    ['jetbrains', 'JetBrains', 'productivity', '000000', 'jetbrains'],
    ['githubcopilot', 'GitHub Copilot', 'productivity', '000000', 'githubcopilot'],
    ['squarespace', 'Squarespace', 'productivity', '000000', 'squarespace'],
    ['wix', 'Wix', 'productivity', '0C6EFC', 'wix'],
    ['wordpress', 'WordPress.com', 'productivity', '21759B', 'wordpress'],

    // AI assistants
    ['chatgpt', 'ChatGPT', 'ai', '10A37F', null],
    ['claude', 'Claude', 'ai', 'D97757', 'claude'],
    ['gemini', 'Google AI (Gemini)', 'ai', '8E75B2', 'googlegemini'],
    ['perplexity', 'Perplexity', 'ai', '1FB8CD', 'perplexity'],
    ['midjourney', 'Midjourney', 'ai', '000000', null],

    // Creative & media production
    ['adobecc', 'Adobe Creative Cloud', 'creative', 'DA1F26', null],
    ['canva', 'Canva', 'creative', '00C4CC', null],
    ['figma', 'Figma', 'creative', 'F24E1E', 'figma'],
    ['frameio', 'Frame.io', 'creative', '5B53FF', null],
    ['artlist', 'Artlist', 'creative', '1D1D1B', null],
    ['epidemicsound', 'Epidemic Sound', 'creative', '000000', null],
    ['envato', 'Envato', 'creative', '87E64B', 'envato'],
    ['motionarray', 'Motion Array', 'creative', '3D4BFF', null],
    ['vimeo', 'Vimeo', 'creative', '1AB7EA', 'vimeo'],
    ['shutterstock', 'Shutterstock', 'creative', 'EE2B24', null],
    ['storyblocks', 'Storyblocks', 'creative', '0E1D2E', null],

    // Gaming
    ['psplus', 'PlayStation Plus', 'gaming', '0070D1', 'playstation'],
    ['gamepass', 'Xbox Game Pass', 'gaming', '107C10', null],
    ['nintendoonline', 'Nintendo Switch Online', 'gaming', 'E60012', null],
    ['eaplay', 'EA Play', 'gaming', '000000', 'ea'],
    ['ubisoftplus', 'Ubisoft+', 'gaming', '000000', 'ubisoft'],
    ['geforcenow', 'GeForce NOW', 'gaming', '76B900', 'nvidia'],
    ['discordnitro', 'Discord Nitro', 'gaming', '5865F2', 'discord'],
    ['twitch', 'Twitch', 'gaming', '9146FF', 'twitch'],

    // Security, VPN & passwords
    ['nordvpn', 'NordVPN', 'security', '4687FF', 'nordvpn'],
    ['expressvpn', 'ExpressVPN', 'security', 'DA3940', 'expressvpn'],
    ['surfshark', 'Surfshark', 'security', '178BF1', 'surfshark'],
    ['protonvpn', 'Proton VPN', 'security', '66DEB1', 'protonvpn'],
    ['protonmail', 'Proton Mail', 'security', '6D4AFF', 'protonmail'],
    ['1password', '1Password', 'security', '3B66BC', '1password'],
    ['bitwarden', 'Bitwarden', 'security', '175DDC', 'bitwarden'],
    ['dashlane', 'Dashlane', 'security', '0E353D', 'dashlane'],

    // Shopping & food delivery
    ['deliveroo', 'Deliveroo Plus', 'shopping', '00CCBC', 'deliveroo'],
    ['glovo', 'Glovo Prime', 'shopping', 'FFC244', 'glovo'],
    ['uberone', 'Uber One', 'shopping', '000000', 'uber'],
    ['hellofresh', 'HelloFresh', 'shopping', '99CC33', 'hellofresh'],

    // News & reading
    ['kindleunlimited', 'Kindle Unlimited', 'reading', 'FF9900', null],
    ['storytel', 'Storytel', 'reading', 'FF5C28', null],
    ['nytimes', 'The New York Times', 'reading', '000000', 'newyorktimes'],
    ['medium', 'Medium', 'reading', '000000', 'medium'],
    ['substack', 'Substack', 'reading', 'FF6719', 'substack'],
    ['patreon', 'Patreon', 'reading', '000000', 'patreon'],

    // Fitness & wellness
    ['strava', 'Strava', 'fitness', 'FC4C02', 'strava'],
    ['peloton', 'Peloton', 'fitness', '181A1D', 'peloton'],
    ['fitbit', 'Fitbit Premium', 'fitness', '00B0B9', 'fitbit'],
    ['headspace', 'Headspace', 'fitness', 'F47D31', 'headspace'],
    ['calm', 'Calm', 'fitness', '4A6CF7', null],

    // Education
    ['duolingo', 'Duolingo Super', 'education', '58CC02', 'duolingo'],
    ['babbel', 'Babbel', 'education', 'FF6400', null],
    ['coursera', 'Coursera Plus', 'education', '0056D2', 'coursera'],
    ['udemy', 'Udemy', 'education', 'A435F0', 'udemy'],
    ['skillshare', 'Skillshare', 'education', '00FF84', 'skillshare'],
    ['masterclass', 'MasterClass', 'education', '000000', null],
    ['domestika', 'Domestika', 'education', 'E8336D', null],

    // Telco (Italy-first, generic elsewhere)
    ['tim', 'TIM', 'telco', '004691', null],
    ['vodafone', 'Vodafone', 'telco', 'E60000', 'vodafone'],
    ['windtre', 'WINDTRE', 'telco', 'FF6A00', null],
    ['iliad', 'iliad', 'telco', 'E2001A', null],
    ['fastweb', 'Fastweb', 'telco', 'FDC300', null],
    ['homobile', 'ho. Mobile', 'telco', '00B2A9', null],
    ['verymobile', 'Very Mobile', 'telco', '29D884', null],

    // Finance
    ['revolut', 'Revolut', 'finance', '191C1F', 'revolut'],
    ['n26', 'N26', 'finance', '36A18B', 'n26'],
    ['tradingview', 'TradingView', 'finance', '131622', 'tradingview'],

    // Social & communication
    ['telegrampremium', 'Telegram Premium', 'social', '26A5E4', 'telegram'],
    ['xpremium', 'X Premium', 'social', '000000', 'x'],
    ['tinder', 'Tinder', 'social', 'FF6B6B', 'tinder'],

    // Other bundles
    ['appleone', 'Apple One', 'other', '000000', 'apple'],
    ['playpass', 'Google Play Pass', 'other', '414141', 'googleplay'],
  ];

  const ITEMS = RAW.map(([id, name, category, color, icon]) => ({
    id, name, category, color, icon,
  }));

  const byId = new Map(ITEMS.map((it) => [it.id, it]));

  ST.catalog = {
    CATEGORIES,
    ITEMS,
    get(id) {
      return byId.get(id) || null;
    },
  };
})(typeof self !== 'undefined' ? self : globalThis);
