// Preset categories and name pools for generating 1,000+ unique presets procedurally.

export const CATEGORIES = [
  { id: "all", name: "🔥 ALL VOICES", theme: "theme-pink" },
  { id: "favorites", name: "⭐ FAVORITES", theme: "theme-yellow" },
  { id: "gaming", name: "🎮 GAMING LEGENDS", theme: "theme-yellow" },
  { id: "robots", name: "🤖 ROBOT & SCI-FI", theme: "theme-cyan" },
  { id: "monsters", name: "👹 MONSTERS & GHOULS", theme: "theme-green" },
  { id: "funny", name: "🤪 FUNNY & MEME", theme: "theme-pink" },
  { id: "horror", name: "💀 HORROR NIGHTS", theme: "theme-purple" },
  { id: "celebrity", name: "🎤 STAR HOSTS", theme: "theme-cyan" },
  { id: "elements", name: "⚡ NATURE & MAGIC", theme: "theme-green" },
  { id: "classic", name: "📻 RETRO COMMS", theme: "theme-pink" }
];

export const CATEGORY_NAMES = {
  gaming: [
    "Squad Leader", "Sniper Ghost", "Battle Commander", "Chrono Agent", "Kelly Speedster",
    "Alok DJ", "Wukong Monkey", "Hayato Samurai", "Moco Hacker", "A124 Cyborg",
    "Apex Predator", "Warzone Veteran", "Ghillie Stalker", "Airdrop Looter", "Red Zone Survivor",
    "Rank Pusher", "One Tap King", "Rush Specialist", "Lobby Host", "Headshot Master",
    "Cyber Raider", "Pixel Warrior", "Frag Grenadier", "Stealth Scout", "Night Ops Assassin",
    "Zone Camper", "Pochinki Boss", "Military Base Hero", "Novorepnoye King", "Yasnaya Ruler",
    "School Sweeper", "Drop Hunter", "Flare Gunner", "Pan Deflector", "Buggy Driver",
    "Glider Pilot", "Medkit Medic", "Adrenaline Junkie", "Energy Drinker", "Bandage Wrapper",
    "Ammo Hoarder", "Scopes Sniper", "Suppressor Assassin", "Recoil Controller", "Ping Warrior",
    "Lag Survivor", "Noob Destroyer", "Pro Carry", "Clutch God", "Sweaty Tryhard"
  ],
  robots: [
    "Cyborg Agent", "AI Overlord", "Space Marine", "T-800", "Iron Vanguard",
    "Synthesizer Bot", "Mech Pilot", "Mainframe Core", "Protocol Droid", "Starship Captain",
    "Quantum Processor", "Cyberpunk Hacker", "Grid Runner", "Vector Node", "Signal Beacon",
    "Laser Striker", "Hyper Drive", "Hologram Projection", "Nano Swarm", "Plasma Core",
    "Nebula Pilot", "Android Assassin", "Binary Code", "CPU Overclocker", "Data Streamer",
    "Megatron Voice", "Optimus Prime", "Sentinel Unit", "Rover Bot", "Circuit Board",
    "Silicon Brain", "Static Discharge", "Resonator Bot", "Pulsar Beam", "Orbital Strike",
    "Warp Drive", "Sub-Zero AI", "Omega Mech", "Alpha Drone", "Tesla Coil",
    "Hacker Console", "Glitch Engine", "Byte Sized", "Gigabyte Giant", "Teraflop Beast"
  ],
  monsters: [
    "Dragon Lord", "Zombie Horde", "Alien Overlord", "Orc Warchief", "Goblin Thief",
    "Gargoyle Guardian", "Minotaur Roar", "Werewolf Howl", "Ogre Basher", "Troll Chieftain",
    "Abyss Stalker", "Cthulhu Whisper", "Swamp Thing", "Cave Dweller", "Toxic Slime",
    "Mutation Beast", "Kraken Deep", "Hydra Head", "Chimera Beast", "Gorgon Petrifier",
    "Yeti Ice", "Lava Golem", "Stone Titan", "Sand Worm", "Acid Spitter",
    "Underworld King", "Dark Elf", "Shadow Wraith", "Grave Crawler", "Crypt Creeper",
    "Flesh Eater", "Venom Weaver", "Brood Mother", "Scorpion Stinger", "Viper Strike",
    "Plague Bearer", "Dread Behemoth", "Lich King", "Skeleton Archer", "Banshee Screamer"
  ],
  funny: [
    "Chipmunk", "Helium Hero", "Deep Bass God", "Squeaky Toy", "Dwarf Miner",
    "Giant Goliath", "Baby Talk", "Grandpa Gamer", "Quacky Duck", "Mickey Mouse",
    "Minion Speak", "Goblin Balloon", "Alien Helium", "Speedy Gonzales", "Turtle Slow",
    "Echo Chamber", "Reverse Speak", "Wobbly Jelly", "Boing Spring", "Honk Horn",
    "Kazoo Solo", "Vocal Fry", "Whistler", "Chirper", "Giggler",
    "Snicker Snout", "Drunk Sailor", "Silly Robot", "Cartoon Rabbit", "Derpy Dog",
    "Frog Croak", "Parrot Mimic", "Squeaker Kid", "Rage Quitter", "Keyboard Smasher"
  ],
  horror: [
    "Demon Voice", "Whisper Ghost", "Scream Queen", "Vampire Lord", "Poltergeist",
    "Necromancer", "Exorcist Evil", "Possessed Doll", "Pharaoh Curse", "Grim Reaper",
    "Soul Eater", "Nightmare Stalker", "Shadow Crawler", "Corrupted Soul", "Spooky Skeleton",
    "Witch Cackle", "Mirror Phantom", "Gallows Ghost", "Dungeon Master", "Torturer",
    "Brain Eater", "Serial Killer", "Slender Shadow", "Hollow Face", "Faceless Ghoul",
    "Void Walker", "Dark Presence", "Haunted Radio", "Spirit Guide", "Coffin Sleeper",
    "Mummy Wrap", "Blood Sucker", "Hell Hound", "Sinister Clown", "Mad Scientist"
  ],
  celebrity: [
    "Movie Trailer Guy", "Radio DJ", "News Anchor", "Opera Singer", "Sportscaster",
    "Beatboxer", "Anime Protagonist", "VIP Speaker", "ASMR Whisperer", "Hypnotist",
    "Auctioneer", "Late Night Host", "Politician Speech", "TED Presenter", "E-Sports Shoutcaster",
    "Guru Master", "Motivational Speaker", "Preacher", "Yoga Instructor", "Commercial Voice",
    "Jazz Singer", "Rock Star", "Rapper Fast", "Melodramatic Actor", "Shakespearean Actor",
    "Documentary Narrator", "Nature Show Host", "Mystery Narrator", "Conspiracy Theorist", "Weather Reporter"
  ],
  elements: [
    "Thunder Voice", "Wind Whisper", "Ocean Deep", "Volcano Rumble", "Blizzard Chill",
    "Lightning Strike", "Earthquake Tremor", "Solar Flare", "Acid Rain", "Mist Walker",
    "Ice Shard", "Flame Thrower", "Iron Clang", "Gold Glimmer", "Crystal Echo",
    "Space Void", "Black Hole", "Cosmic Ray", "Supernova Blast", "Gravity Pull",
    "Static Electric", "Tesla Shock", "Geothermal Vent", "Avalanche Slide", "Tornado Spin"
  ],
  classic: [
    "Megaphone", "Walkie-Talkie", "Phone Call", "AM Radio", "Police Scanner",
    "Aviation Pilot", "Astronaut NASA", "Intercom System", "Drive Thru Mic", "Vintage Gramophone",
    "Dictaphone", "Submarine Sonar", "Sonar Ping", "Morse Code Tap", "Ham Radio",
    "CB Radio Trucker", "Helicopter Comms", "Subway Intercom", "Elevator Speaker", "Paging Doctor"
  ]
};

// Parameter generation boundaries per category
export const CATEGORY_FX_TEMPLATES = {
  gaming: {
    pitchRange: [-2, 3],
    robotMixRange: [0, 15],
    distRange: [5, 20],
    bassRange: [2, 8],
    trebleRange: [1, 6],
    delayMixRange: [10, 25],
    reverbMixRange: [5, 15]
  },
  robots: {
    pitchRange: [-5, 4],
    robotMixRange: [60, 100],
    robotFreqRange: [40, 110],
    distRange: [10, 35],
    bassRange: [-2, 8],
    trebleRange: [4, 12],
    delayMixRange: [15, 40],
    reverbMixRange: [10, 30]
  },
  monsters: {
    pitchRange: [-8, -3],
    robotMixRange: [0, 25],
    robotFreqRange: [10, 40],
    distRange: [20, 60],
    bassRange: [8, 15],
    trebleRange: [-6, 2],
    delayMixRange: [5, 20],
    reverbMixRange: [20, 50]
  },
  funny: {
    pitchRange: [5, 12], // very high pitch
    robotMixRange: [0, 20],
    distRange: [0, 10],
    bassRange: [-6, -2],
    trebleRange: [5, 12],
    delayMixRange: [0, 20],
    reverbMixRange: [0, 20]
  },
  horror: {
    pitchRange: [-10, -1],
    robotMixRange: [10, 40],
    robotFreqRange: [5, 30],
    distRange: [15, 50],
    bassRange: [5, 12],
    trebleRange: [-4, 6],
    delayMixRange: [20, 50],
    reverbMixRange: [30, 80],
    reverbDecayRange: [2.5, 5.0]
  },
  celebrity: {
    pitchRange: [-2, 2],
    robotMixRange: [0, 5],
    distRange: [0, 8],
    bassRange: [3, 8],
    trebleRange: [2, 6],
    delayMixRange: [0, 10],
    reverbMixRange: [5, 15],
    reverbDecayRange: [0.8, 1.4]
  },
  elements: {
    pitchRange: [-4, 4],
    robotMixRange: [0, 30],
    robotFreqRange: [20, 80],
    distRange: [5, 40],
    bassRange: [4, 12],
    trebleRange: [0, 10],
    delayMixRange: [25, 60],
    reverbMixRange: [40, 90],
    reverbDecayRange: [2.0, 4.5]
  },
  classic: {
    pitchRange: [0, 3],
    robotMixRange: [0, 0],
    distRange: [40, 80], // high distortion/fuzz for vintage feel
    bassRange: [-10, -4], // tinny sound: roll off bass
    trebleRange: [8, 15], // high treble to highlight static
    delayMixRange: [0, 15],
    reverbMixRange: [0, 10]
  }
};
