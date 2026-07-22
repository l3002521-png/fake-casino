export type Language = 'en' | 'pl';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.title': 'NEON Casino',
    'app.testnet': 'Testnet',
    'app.admin': 'Admin Panel',
    'auth.login': 'Login / Register',
    'nav.username': 'Username',
    'nav.verifyId': 'Verify ID',
    'nav.reviewingKyc': 'Reviewing KYC',
    'nav.daily': 'Daily',
    'nav.logout': 'Logout',
    'games.blackjack': 'Blackjack',
    'games.slots': 'Slots',
    'games.crash': 'Crash',
    'games.coinflip': 'Coin Flip',
    'games.roulette': 'Chicken Run',
    'games.dice': 'Dice',
    'games.hilo': 'HiLo',
    'games.keno': 'Keno',
    'games.mines': 'Mines',
    'games.plinko': 'Plinko',
    'games.videoPoker': 'Video Poker',
    'games.tower': 'Tower',
    'games.baccarat': 'Baccarat',
    'games.wheel': 'Wheel',
    'kyc.required': 'KYC Required',
    'kyc.message': 'Please complete identity verification to access this game.',
    'kyc.verify': 'Verify Identity',
    'roulette.spinWheel': 'SPIN WHEEL',
    'roulette.betAmount': 'Bet Amount',
    'roulette.youWon': 'YOU WON $',
    'roulette.youLost': 'YOU LOST',
  },
  pl: {
    'app.title': 'NEON Kasyno',
    'app.testnet': 'Sieć testowa',
    'app.admin': 'Panel Administratora',
    'auth.login': 'Zaloguj się / Zarejestruj',
    'nav.username': 'Nazwa użytkownika',
    'nav.verifyId': 'Weryfikacja ID',
    'nav.reviewingKyc': 'Sprawdzanie KYC',
    'nav.daily': 'Codzienne',
    'nav.logout': 'Wyloguj się',
    'games.blackjack': 'Blackjack',
    'games.slots': 'Automaty',
    'games.crash': 'Crash',
    'games.coinflip': 'Rzut Monetą',
    'games.roulette': 'Wyścig Kurek',
    'games.dice': 'Kostki',
    'games.hilo': 'HiLo',
    'games.keno': 'Keno',
    'games.mines': 'Miny',
    'games.plinko': 'Plinko',
    'games.videoPoker': 'Video Poker',
    'games.tower': 'Wieża',
    'games.baccarat': 'Baccarat',
    'games.wheel': 'Koło',
    'kyc.required': 'KYC Wymagany',
    'kyc.message': 'Prosimy o ukończenie weryfikacji tożsamości, aby uzyskać dostęp do tej gry.',
    'kyc.verify': 'Weryfikacja Tożsamości',
    'roulette.spinWheel': 'OBRÓĆ KOŁEM',
    'roulette.betAmount': 'Kwota Zakładu',
    'roulette.youWon': 'WYGRAŁEŚ $',
    'roulette.youLost': 'PRZEGRAŁEŚ',
  },
};

export function getSystemLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  return browserLang.startsWith('pl') ? 'pl' : 'en';
}

export function t(key: string, language: Language): string {
  return translations[language]?.[key] || key;
}
