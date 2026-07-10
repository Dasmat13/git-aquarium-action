import { GitHubData } from './github';

export interface CoralData {
  weekIdx:    number;
  height:     number;      // Coral height 10 - 150px
  coralType:  'seaweed' | 'branching' | 'fan' | 'bulbous' | 'sand';
  color:      string;
  hasBulbs:   boolean;
}

export interface FishData {
  id:       number;
  type:     'goldfish' | 'clownfish' | 'angelfish' | 'jellyfish' | 'shark';
  size:     number;
  x:        number;
  y:        number;
  color1:   string;
  color2:   string;
  speed:    number;
  delay:    number;
}

export interface TreasureData {
  x:        number;
  scale:    number;
}

export interface AquariumData {
  corals:             CoralData[];
  fishes:             FishData[];
  treasures:          TreasureData[];
  waterColorTop:      string;
  waterColorBottom:   string;
  sandColor:          string;
  hasAlgaePollution:  boolean; // from open issues count
  bioluminescence:    number;  // 0 - 1 based on streak
  totalStars:         number;
  totalContributions: number;
  streak:             number;
  username:           string;
}

const WATER_THEMES: Record<string, { top: string, bottom: string, sand: string, coral: string }> = {
  JavaScript: {
    top: '#053040', bottom: '#021820', sand: '#e6c875', coral: '#e67e22'
  },
  TypeScript: {
    top: '#0b2b40', bottom: '#051420', sand: '#d5b885', coral: '#2980b9'
  },
  Python: {
    top: '#053825', bottom: '#021e12', sand: '#d5c285', coral: '#2ecc71'
  },
  Go: {
    top: '#053b4c', bottom: '#011c26', sand: '#ecd599', coral: '#00afdb'
  },
  Rust: {
    top: '#3a1f10', bottom: '#1e0c05', sand: '#b89d6c', coral: '#c0392b'
  }
};

const DEFAULT_THEME = {
  top: '#0a3a40', bottom: '#031c20', sand: '#d1b87d', coral: '#e74c3c'
};

export function buildAquarium(data: GitHubData): AquariumData {
  const theme = WATER_THEMES[data.topLanguage] || DEFAULT_THEME;
  const allMax = Math.max(...data.weeks.flatMap(w => w.map(d => d.count)), 1);

  // 1. Build corals from weeks
  const corals: CoralData[] = data.weeks.map((week, i) => {
    const maxCount = Math.max(...week.map(d => d.count), 0);
    let height = 0;
    let coralType: CoralData['coralType'] = 'sand';

    if (maxCount > 0) {
      const norm = Math.log(maxCount + 1) / Math.log(allMax + 1);
      height = Math.round(15 + norm * 110);
      coralType = maxCount > 8 ? 'branching' : maxCount > 4 ? 'fan' : maxCount > 2 ? 'bulbous' : 'seaweed';
    }

    const colPalette = [theme.coral, '#e67e22', '#e74c3c', '#9b59b6', '#1abc9c', '#f1c40f'];
    const color = colPalette[(maxCount + i) % colPalette.length];

    return {
      weekIdx: i,
      height,
      coralType,
      color,
      hasBulbs: coralType === 'bulbous' || coralType === 'branching',
    };
  });

  // 2. Build fishes from stars/followers
  const fishes: FishData[] = [];
  const fishCount = Math.min(15, Math.max(3, Math.floor(Math.log10(data.totalStars + 1) * 4)));
  
  // Deterministic generator seeded by username
  const seed = data.username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  for (let i = 0; i < fishCount; i++) {
    const randomY = 40 + ((seed * (i + 1) * 31) % 110);
    const size = 12 + ((seed * (i + 1) * 17) % 18);
    const speed = 12 + ((seed * (i + 1) * 11) % 16); // duration of anim in seconds
    const delay = (i * 1.5) % 8;

    const fishTypes: FishData['type'][] = ['goldfish', 'clownfish', 'angelfish'];
    let type = fishTypes[(seed + i) % fishTypes.length];

    if (data.openIssues > 20 && i % 4 === 0) {
      type = 'jellyfish';
    } else if (data.totalStars > 500 && i === fishCount - 1) {
      type = 'shark';
    }

    fishes.push({
      id: i,
      type,
      size,
      x: -50,
      y: randomY,
      color1: type === 'jellyfish' ? 'rgba(238, 130, 238, 0.7)' : (i % 2 === 0 ? '#ff5f1f' : '#ffea00'),
      color2: type === 'jellyfish' ? 'rgba(186, 85, 211, 0.4)' : (i % 2 === 0 ? '#ffffff' : '#00d2ff'),
      speed,
      delay,
    });
  }

  // 3. Build treasures from closed issues / PRs
  const treasures: TreasureData[] = [];
  const closedCount = data.closedIssues || 0;
  if (closedCount > 0) {
    const treasureCount = Math.min(3, Math.ceil(closedCount / 20));
    for (let i = 0; i < treasureCount; i++) {
      treasures.push({
        x: 100 + ((seed * (i + 1) * 23) % 700),
        scale: 0.6 + ((seed * (i + 1) * 7) % 5) * 0.1,
      });
    }
  }

  const hasAlgaePollution = data.openIssues > 30;
  const bioluminescence = Math.min(1, data.streak / 30);

  return {
    corals,
    fishes,
    treasures,
    waterColorTop: theme.top,
    waterColorBottom: theme.bottom,
    sandColor: theme.sand,
    hasAlgaePollution,
    bioluminescence,
    totalStars: data.totalStars,
    totalContributions: data.totalContributions,
    streak: data.streak,
    username: data.username,
  };
}
