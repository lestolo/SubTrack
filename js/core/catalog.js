/*
 * Catalogue of popular subscription services.
 *
 * Each entry: [id, name, category, brandColor, logoSource | null]
 * - brandColor is a hex string without "#".
 * - logoSource is "<iconify-set>:<icon-name>": `npm run logos` copies that
 *   full-colour logo to icons/brands/<id>.svg (see tools/build-logos.mjs).
 *   When it is null (no logo available) the UI shows a monogram tile in the
 *   brand colour instead.
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
    ['netflix', 'Netflix', 'video', 'E50914', 'thesvg-color:netflix'],
    ['amazonprime', 'Amazon Prime', 'video', '00A8E1', 'selfhst:amazon-prime'],
    ['disneyplus', 'Disney+', 'video', '113CCF', 'selfhst:disney-plus'],
    ['appletv', 'Apple TV', 'video', '000000', 'selfhst:apple-tv'],
    ['sky', 'Sky', 'video', '0072C9', 'thesvg-color:sky'],
    ['now', 'NOW', 'video', '001211', 'thesvg-color:now'],
    ['dazn', 'DAZN', 'video', 'F8F8F5', 'selfhst:dazn'],
    ['hbomax', 'HBO Max', 'video', '000000', 'selfhst:hbo-max'],
    ['paramountplus', 'Paramount+', 'video', '0064FF', 'thesvg-color:paramountplus'],
    ['youtubepremium', 'YouTube Premium', 'video', 'FF0000', 'selfhst:youtube'],
    ['crunchyroll', 'Crunchyroll', 'video', 'FF5E00', 'thesvg-color:crunchyroll'],
    ['mubi', 'MUBI', 'video', '000000', 'thesvg-color:mubi'],
    ['timvision', 'TIMVISION', 'video', '0033A0', null],
    ['mediasetinfinity', 'Mediaset Infinity+', 'video', '1A1A6E', null],
    ['rakutentv', 'Rakuten TV', 'video', 'BF0000', 'thesvg-color:rakuten'],
    ['discoveryplus', 'discovery+', 'video', '2175D9', null],

    // Music & audio
    ['spotify', 'Spotify', 'music', '1ED760', 'thesvg-color:spotify'],
    ['applemusic', 'Apple Music', 'music', 'FA243C', 'selfhst:apple-music'],
    ['amazonmusic', 'Amazon Music Unlimited', 'music', '25D1DA', 'selfhst:amazon-music'],
    ['youtubemusic', 'YouTube Music', 'music', 'FF0000', 'thesvg-color:youtube-music'],
    ['deezer', 'Deezer', 'music', 'A238FF', 'thesvg-color:deezer'],
    ['tidal', 'TIDAL', 'music', '000000', 'selfhst:tidal'],
    ['soundcloud', 'SoundCloud Go+', 'music', 'FF5500', 'selfhst:soundcloud'],
    ['audible', 'Audible', 'music', 'F8991C', 'selfhst:audible'],
    ['pocketcasts', 'Pocket Casts Plus', 'music', 'F43E37', 'thesvg-color:pocket-casts'],

    // Cloud storage
    ['icloud', 'iCloud+', 'cloud', '3693F3', 'selfhst:icloud'],
    ['googleone', 'Google One', 'cloud', '4285F4', 'selfhst:google-one'],
    ['dropbox', 'Dropbox', 'cloud', '0061FF', 'logos:dropbox'],
    ['onedrive', 'OneDrive', 'cloud', '0078D4', 'selfhst:microsoft-onedrive'],
    ['proton', 'Proton Unlimited', 'cloud', '6D4AFF', 'thesvg-color:proton'],
    ['protondrive', 'Proton Drive', 'cloud', 'EB508D', 'selfhst:proton-drive'],
    ['mega', 'MEGA', 'cloud', 'D9272E', 'thesvg-color:mega'],
    ['box', 'Box', 'cloud', '0061D5', 'thesvg-color:box'],
    ['pcloud', 'pCloud', 'cloud', '17BED0', null],

    // Productivity & work
    ['microsoft365', 'Microsoft 365', 'productivity', 'D83B01', 'selfhst:microsoft-365'],
    ['googleworkspace', 'Google Workspace', 'productivity', '4285F4', 'logos:google-icon'],
    ['notion', 'Notion', 'productivity', '000000', 'selfhst:notion'],
    ['evernote', 'Evernote', 'productivity', '00A82D', 'thesvg-color:evernote'],
    ['todoist', 'Todoist', 'productivity', 'E44332', 'thesvg-color:todoist'],
    ['zoom', 'Zoom', 'productivity', '0B5CFF', 'thesvg-color:zoom'],
    ['slack', 'Slack', 'productivity', '4A154B', 'selfhst:slack'],
    ['linkedinpremium', 'LinkedIn Premium', 'productivity', '0A66C2', 'selfhst:linkedin'],
    ['grammarly', 'Grammarly', 'productivity', '027E6F', 'thesvg-color:grammarly'],
    ['setapp', 'Setapp', 'productivity', 'E6C3A5', 'thesvg-color:setapp'],
    ['jetbrains', 'JetBrains', 'productivity', '000000', 'thesvg-color:jetbrains'],
    ['githubcopilot', 'GitHub Copilot', 'productivity', '000000', 'selfhst:github-copilot'],
    ['squarespace', 'Squarespace', 'productivity', '000000', 'thesvg-color:squarespace'],
    ['wix', 'Wix', 'productivity', '0C6EFC', 'logos:wix'],
    ['wordpress', 'WordPress.com', 'productivity', '21759B', 'selfhst:wordpress'],

    // AI assistants
    ['chatgpt', 'ChatGPT', 'ai', '10A37F', 'thesvg-color:openai-chatgpt'],
    ['claude', 'Claude', 'ai', 'D97757', 'selfhst:claude'],
    ['gemini', 'Google AI (Gemini)', 'ai', '8E75B2', 'thesvg-color:gemini'],
    ['perplexity', 'Perplexity', 'ai', '1FB8CD', 'thesvg-color:perplexity'],
    ['midjourney', 'Midjourney', 'ai', '000000', 'selfhst:midjourney'],

    // Creative & media production
    ['adobecc', 'Adobe Creative Cloud', 'creative', 'DA1F26', 'thesvg-color:adobe-creative-cloud'],
    ['canva', 'Canva', 'creative', '00C4CC', 'thesvg-color:canva'],
    ['figma', 'Figma', 'creative', 'F24E1E', 'selfhst:figma'],
    ['frameio', 'Frame.io', 'creative', '5B53FF', null],
    ['artlist', 'Artlist', 'creative', '1D1D1B', null],
    ['epidemicsound', 'Epidemic Sound', 'creative', '000000', null],
    ['envato', 'Envato', 'creative', '87E64B', 'thesvg-color:envato'],
    ['motionarray', 'Motion Array', 'creative', '3D4BFF', null],
    ['vimeo', 'Vimeo', 'creative', '1AB7EA', 'thesvg-color:vimeo'],
    ['shutterstock', 'Shutterstock', 'creative', 'EE2B24', null],
    ['storyblocks', 'Storyblocks', 'creative', '0E1D2E', 'logos:storyblocks-icon'],

    // Gaming
    ['psplus', 'PlayStation Plus', 'gaming', '0070D1', 'thesvg-color:playstation'],
    ['gamepass', 'Xbox Game Pass', 'gaming', '107C10', 'selfhst:xbox-game-pass'],
    ['nintendoonline', 'Nintendo Switch Online', 'gaming', 'E60012', 'selfhst:nintendo-switch'],
    ['eaplay', 'EA Play', 'gaming', '000000', 'thesvg-color:ea'],
    ['ubisoftplus', 'Ubisoft+', 'gaming', '000000', 'thesvg-color:ubisoft'],
    ['geforcenow', 'GeForce NOW', 'gaming', '76B900', 'selfhst:nvidia'],
    ['discordnitro', 'Discord Nitro', 'gaming', '5865F2', 'selfhst:discord'],
    ['twitch', 'Twitch', 'gaming', '9146FF', 'thesvg-color:twitch'],

    // Security, VPN & passwords
    ['nordvpn', 'NordVPN', 'security', '4687FF', 'selfhst:nordvpn'],
    ['expressvpn', 'ExpressVPN', 'security', 'DA3940', 'thesvg-color:expressvpn'],
    ['surfshark', 'Surfshark', 'security', '1EBFBF', 'selfhst:surfshark'],
    ['protonvpn', 'Proton VPN', 'security', '66DEB1', 'thesvg-color:proton-vpn'],
    ['protonmail', 'Proton Mail', 'security', '6D4AFF', 'thesvg-color:proton-mail'],
    ['1password', '1Password', 'security', '145FE4', 'selfhst:1password'],
    ['bitwarden', 'Bitwarden', 'security', '175DDC', 'thesvg-color:bitwarden'],
    ['dashlane', 'Dashlane', 'security', '0E353D', 'thesvg-color:dashlane'],

    // Shopping & food delivery
    ['deliveroo', 'Deliveroo Plus', 'shopping', '00CCBC', 'thesvg-color:deliveroo'],
    ['glovo', 'Glovo Prime', 'shopping', 'F2CC38', 'thesvg-color:glovo'],
    ['uberone', 'Uber One', 'shopping', '000000', 'selfhst:uber'],
    ['hellofresh', 'HelloFresh', 'shopping', '99CC33', 'thesvg-color:hellofresh'],

    // News & reading
    ['kindleunlimited', 'Kindle Unlimited', 'reading', 'FF9900', 'thesvg-color:amazon-kindle'],
    ['storytel', 'Storytel', 'reading', 'FF5C28', null],
    ['nytimes', 'The New York Times', 'reading', '000000', 'selfhst:the-new-york-times'],
    ['medium', 'Medium', 'reading', '000000', 'logos:medium-icon'],
    ['substack', 'Substack', 'reading', 'FF6719', 'thesvg-color:substack'],
    ['patreon', 'Patreon', 'reading', '000000', 'selfhst:patreon'],

    // Fitness & wellness
    ['strava', 'Strava', 'fitness', 'FC4C02', 'thesvg-color:strava'],
    ['peloton', 'Peloton', 'fitness', '181A1D', 'thesvg-color:peloton'],
    ['fitbit', 'Fitbit Premium', 'fitness', '00B0B9', 'thesvg-color:fitbit'],
    ['headspace', 'Headspace', 'fitness', 'F47D31', 'thesvg-color:headspace'],
    ['calm', 'Calm', 'fitness', '4A6CF7', null],

    // Education
    ['duolingo', 'Duolingo Super', 'education', '58CC02', 'selfhst:duolingo'],
    ['babbel', 'Babbel', 'education', 'FF6400', 'thesvg-color:babbel'],
    ['coursera', 'Coursera Plus', 'education', '0056D2', 'selfhst:coursera'],
    ['udemy', 'Udemy', 'education', 'A435F0', 'logos:udemy-icon'],
    ['skillshare', 'Skillshare', 'education', '00FF84', 'thesvg-color:skillshare'],
    ['masterclass', 'MasterClass', 'education', '000000', null],
    ['domestika', 'Domestika', 'education', 'E8336D', null],

    // Telco (Italy-first, generic elsewhere)
    ['tim', 'TIM', 'telco', '004691', null],
    ['vodafone', 'Vodafone', 'telco', 'E60000', 'thesvg-color:vodafone'],
    ['windtre', 'WINDTRE', 'telco', 'FF6A00', null],
    ['iliad', 'iliad', 'telco', 'E2001A', null],
    ['fastweb', 'Fastweb', 'telco', 'FDC300', null],
    ['homobile', 'ho. Mobile', 'telco', '00B2A9', null],
    ['verymobile', 'Very Mobile', 'telco', '29D884', null],

    // Finance
    ['revolut', 'Revolut', 'finance', '191C1F', 'thesvg-color:revolut'],
    ['n26', 'N26', 'finance', '48AC98', 'thesvg-color:n26'],
    ['tradingview', 'TradingView', 'finance', '131622', 'selfhst:tradingview'],

    // Social & communication
    ['telegrampremium', 'Telegram Premium', 'social', '26A5E4', 'selfhst:telegram'],
    ['xpremium', 'X Premium', 'social', '000000', 'selfhst:x'],
    ['tinder', 'Tinder', 'social', 'FF6B6B', 'thesvg-color:tinder'],

    // Other bundles
    ['appleone', 'Apple One', 'other', '000000', 'selfhst:apple'],
    ['playpass', 'Google Play Pass', 'other', '414141', 'selfhst:google-play'],
  ];

  const ITEMS = RAW.map(([id, name, category, color, logo]) => ({
    id, name, category, color, logo,
  }));

  const byId = new Map(ITEMS.map((it) => [it.id, it]));

  ST.catalog = {
    CATEGORIES,
    ITEMS,
    /** Path of the bundled logo of a catalogue item, or null. */
    logoPath(item) {
      return item && item.logo ? `icons/brands/${item.id}.svg` : null;
    },
    get(id) {
      return byId.get(id) || null;
    },
  };
})(typeof self !== 'undefined' ? self : globalThis);
