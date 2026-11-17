const SK = 'https://sketchfab.com/3d-models/';

const GROUPS = [
  {
    t: 'Hush',
    items: [
      ['Hospital walls, doors, beds, tables and props, Free Modular 3D hospital environment', 'Madduck', 'https://madduck.itch.io/modular-3d-hospital-environment', 'Free asset pack'],
      ['Flashlight, keys, padlocks, knife and radio, Retro Horror Kit', '3Dexter', 'https://3dexter.itch.io/retrohorrorkit', 'CC0'],
      ['Lockers, 3D Locker 2', 'Taha Arslan, ShareTextures', 'https://www.sharetextures.com/models/furniture/locker-2', 'CC0'],
      ['The creature and its moves', 'Mixamo by Adobe', 'https://www.mixamo.com', 'Mixamo license'],
      ['Roars, screams, breathing, drips and the hospital hum, Horror Sound Effects Library', 'Little Robot Sound Factory, www.littlerobotsoundfactory.com', 'https://opengameart.org/content/horror-sound-effects-library', 'CC BY 3.0'],
      ['Jump scare hits, Horror Hit Soundpack 1', 'psychhead', 'https://opengameart.org/content/horror-hit-soundpack-1', 'CC0'],
      ['Stingers, Dark Ambiences', 'Ogrebane', 'https://opengameart.org/content/dark-ambiences', 'CC0'],
      ['Whispers, Voices of Madness', 'Eugene Loza', 'https://opengameart.org/node/141912', 'CC0'],
      ['Ghost moans, Ghost Monster Voice Moaning and Growling', 'qubodup', 'https://opengameart.org/content/ghost-monster-voice-moaning-growling', 'CC0'],
      ['Doors, keys, cloth and impacts, RPG Audio and Impact Sounds', 'Kenney', 'https://kenney.nl/assets', 'CC0'],
      ['Footsteps on tile, Footsteps on different surfaces', 'congusbongus', 'https://opengameart.org/content/footsteps-on-different-surfaces', 'CC BY 3.0'],
      ['The I see you voice', 'Vinrax', 'https://opengameart.org/content/i-see-you-voice', 'CC0'],
      ['Screeches, howls and sniffs, 80 CC0 creature SFX', 'rubberduck', 'https://opengameart.org/content/80-cc0-creature-sfx', 'CC0'],
      ['Room and game music, Horror Game Intro, Lurking in the Shadows, Night Stalker, Ominous Pursuit and Disturbed Soundscape', 'Eric Matyas, www.soundimage.org', 'https://soundimage.org', 'Free with credit'],
      ['Menu music, Horror Main Menu', 'Pixabay artist', 'https://pixabay.com/music/', 'Pixabay license'],
    ],
  },
  {
    t: 'Town models',
    note: 'From Sketchfab, CC BY 4.0 unless marked',
    items: [
      ['Old gas station', 'CGMeller', 'old-gas-station-e1d067211c8a4226b2393de0db8dad36'],
      ['American vintage house', 'Katydid', 'american-vintage-house-with-interior-5a9e087fbd3a4ae79b4c51d6279f0466', 'CC BY NC 4.0'],
      ['Red barn', 'volvor', 'red-barn-906b74a1b8d7443eb66545dcc8a1b1c7'],
      ['Abandoned gas station', 'NZP3D', 'abandoned-gas-station-3df532f761f945768ab487616fb6d656'],
      ['Hind attack helicopter', 'Ashley Aslett', 'hind-attack-helicopter-bb65bdfde2c54007a52dfbe1d91d930d'],
      ['Military crate', 'Mark Peters', 'military-crate-4096px2-dcd7089487f147f7b162d69bb5cd14cc'],
      ['Alien egg', 'Julio César', 'alien-egg-4407c29df6e94f2a93334408ba339506'],
      ['9mm ammo box', 'stfuaahil', '9mm-ammo-box-c902c80557f849ba9c9fdd06d8510a68'],
      ['Abandoned street lights pack', 'sergeilihandristov', 'abandoned-street-lights-pack-c853eca300e8435d8fe9206bcb524eda'],
      ['Street lamp', 'pinokio21', 'street-lamp-low-poly-17e2bc2ec7de42d08d98e3a6c886a8b2'],
      ['Concrete barrier', 'TampaJoey', 'concrete-barrier-low-poly-game-ready-1892932416e149e9931422d1bacb1e2d'],
      ['Abandoned car', 'Leandro Andrade', 'abandoned-car-c25ccc5a116342218d02dd57607e3f71'],
      ['Abandoned generic sedan', 'Rashad Ibrahimli', 'abandoned-generic-sedan-1-game-ready-6a2169dafc254f399387a679305bb1bf'],
      ['Rusty abandoned truck', 'Rashad Ibrahimli', 'rusty-abandoned-truck-with-interior-game-ready-68f715c39c07464db59e099bb8dc2d4e'],
      ['Abandoned simple car prop', 'Rashad Ibrahimli', 'lowpoly-abandoned-simple-car-prop-game-ready-946f633dca3b4008926d7049e538008a'],
      ['Free burned police cars', 'Renafox', 'free-burned-police-cars-ad16f7085cb047b494997cf9efed5059'],
      ['Abandoned school bus', 'nyronix', 'abandoned-school-bus-rusty-low-poly-bus-3711f6512b5d4a8fb15c6a6a1ffb1dfc'],
      ['Freight shipping container', 'Sousinho', 'freight-shipping-container-rusted-2b787d1a02174d0bbca9eac34eb3a486'],
      ['Water tower', 'adventurer', 'water-tower-4e98f8c8fe4e4e9fae250a026974fe99'],
      ['Military tent', 'dark minaz', 'military-tent-016f79c835e7427a83c434a9d5e8165e'],
      ['Hay bales', 'Zbrojmistrz', 'hay-bales-d6e087f9a2a9416c94918f0503943c17'],
      ['Wooden boxes', 'MaX3Dd', 'wooden-boxes-ddecbe4586594bddb4822a90c0cba222'],
      ['Garbage bin', 'Glen Ortiz', 'garbage-bin-fba6b5a8afdd4eb0a43be29aabceb3d6'],
      ['Trash', 'Guy in a Poncho', 'trash-555fd7fe9f164802a0ff194c0559075b'],
      ['Old tires', 'Berk Gedik', 'old-tires-dirt-low-poly-1929673829054c2b8085d743e652acab'],
      ['Post apocalyptic asset pack', 'Rookster', 'post-apocalyptic-asset-pack-6c396728f9bf47b481d1beaf943e7e08', 'Sketchfab license'],
      ['Trees and bush pack', 'EFX', 'trees-and-bush-pack-lowpoly-f2a25ee70df440c9ab03d57aba2dc3f2'],
      ['Plants scene', 'Nicholas 3D', 'plants-scene-free-5425c959e480400e957cd52c6f59c3dc'],
      ['Reed plants pack', 'Nicholas 3D', 'reed-plants-pack-bc77ea5218e44f2dbc23b2a4aef0c898'],
      ['Cattail', 'Hakujin', 'cattail-00cf5598ba274050b784b8a4beb00f03'],
      ['Stylized rocks pack', 'PolyOne Studio', 'free-pack-rocks-stylized-7c60b4d1b8ab4187965f30c5e0212fc0'],
      ['Train station', 'A9908244', 'train-station-eef3e666293e4eeea7282562ebb9c256'],
      ['Low poly forest tree pack', '99.Miles', 'low-poly-forest-tree-pack-5ff5a51e74324845a4e4905f182dfb2b'],
      ['Sandbag wall 04', 'Pypunk', 'sandbag-wall-04-a5ea125e9d534b54a3185f349da6aabd'],
      ['Barricade set', 'TampaJoey', 'barricade-set-low-poly-game-ready-209e7dc032de483cae12eb5c3e7f1bcf'],
      ['City props collection volume 1', 'TampaJoey', 'https://sketchfab.com/3d-models/city-props-collection-volume-1-32b8b82bb1e9489c993799c91967a916', 'Sketchfab standard license'],
      ['Concrete jersey barrier with fence', 'JeffK', 'concrete-jersey-barrier-with-fence-85c3967de8c24357acc4371339e73c2e'],
      ['Damaged wall', 'hhdev', 'damaged-wall-realityscan-e7bc57e7e1b24973b453a9e5d18b5e73'],
      ['Diesel locomotive', 'Runteratroll', 'free-diesel-locomotive-korail-c2c8e60ead2c4dac9704096fbde80997'],
      ['Freight train car', 'Вячеслав', 'freight-train-car-ca2084ce43a64a809be5ba0a0ec6cfa8'],
    ],
  },
  {
    t: 'Weapons',
    note: 'From Sketchfab, CC BY 4.0',
    items: [
      ['Animated pistol', 'DJMaesen', 'fps-pistol-animated-a8cdd6c2e936484aaf67e1786c8320d9'],
      ['Animated carbine', 'DJMaesen', 'fps-animated-carbine-62977bb4c53047a185b9f3a0cdf56b87'],
      ['Animated shotgun', 'DJMaesen', 'shotgun-animated-226237e0f49c4f69a9fc5a78df6a236c'],
      ['Animated SMG', 'DJMaesen', 'fps-animated-smg-ea3dad7478624495a5a46f40127b0579'],
      ['Animated sniper', 'DJMaesen', 'sniper-animated-b48999a250b2433da59f705c371a49b2'],
      ['Throwing arms', 'DJMaesen', 'fps-arms-throwing-99ff0b0e5b144cbfbf67cb34f8ce83bb'],
      ['M67 fragmentation grenade', 'Vextin', 'm67-fragmentation-grenade-05e2a29118c3408eaa574bcec6997aba'],
      ['Molotov', 'Armory3D, CGTrader', 'https://www.cgtrader.com', 'Royalty free'],
      ['Animated SMG9', 'DJMaesen', 'fps-smg9-animated-e77e2cd81dc048b998fd4652da644eb0'],
      ['UZI 9mm', 'DanielCollado', 'https://sketchfab.com/DanielCollado', 'CC BY 4.0'],
      ['Animated AK', 'DJMaesen', 'fps-ak-animated-b0b1bae40337449189483f6187cf7af7'],
      ['Low poly UAR 10', 'DU', 'https://sketchfab.com/DU1701', 'CC BY 4.0'],
      ['Animated LMG', 'DJMaesen', 'lmg-animated-c02dc6663f344008a502148e751c9974'],
      ['Animated grenade launcher', 'DJMaesen', 'grenadelauncher-animated-f05bbd6934c84c1eac6053e0513e3b16'],
      ['Medical syringe healing animation', 'BURNER', 'medical-syringe-healing-fps-animation-8de32be8633a4c87ba7ed1d125b45ec9'],
      ['Desert Eagle gun', 'attix84work', 'https://sketchfab.com/attix84work', 'CC BY 4.0'],
      ['AWM', '974390566xy', 'https://sketchfab.com/974390566xy', 'CC BY 4.0'],
      ['Spas 12 apocalypse', 'minhnguyen2k', 'https://sketchfab.com/minhnguyen2k', 'CC BY 4.0'],
      ['C4 bomb low poly', 'Abel099', 'c4-bomb-low-poly-1a75fffa279d48e88a6f86d644fb227c'],
      ['Armor plates', 'BarnusModels', 'armor-plates-75e70ae8d7a44f81bc9ff20e4eb7a9e7', 'Sketchfab standard license'],
    ],
  },
  {
    t: 'Characters',
    items: [
      ['Survivors, zombies and their animations', 'Mixamo by Adobe', 'https://www.mixamo.com', 'Mixamo license'],
      ['German Shepherd dog', 'RetroStyle Games', 'https://retrostylegames.artstation.com/store/5Y6zX/german-shepherd-3d-model', 'ArtStation standard license'],
      ['Bolt War heroes, mechs, aliens, power ups, rovers, towers, the Hive Ship and the Nebula Valley trees, rocks and buildings, Ultimate Space Kit', 'Quaternius', 'https://quaternius.com', 'CC0'],
      ['Bolt War heroes Arlo, Wren, Nyx, Ivy and Tusk, KayKit Character Pack Adventurers', 'Kay Lousberg', 'https://kaylousberg.itch.io/kaykit-adventurers', 'CC0'],
      ['Bolt War heroes Bones, Hex and Rattle, KayKit Character Pack Skeletons', 'Kay Lousberg', 'https://kaylousberg.itch.io/kaykit-skeletons', 'CC0'],
      ['Bolt War Graveyard crypt, graves, fences, trees and pumpkins, KayKit Halloween Bits', 'Kay Lousberg', 'https://kaylousberg.itch.io/halloween-bits', 'CC0'],
      ['Bolt War Mars outpost habitats, landers, trucks, cargo, cliffs and the mine, KayKit Space Base Bits', 'Kay Lousberg', 'https://kaylousberg.itch.io/space-base-bits', 'CC0'],
      ['Bolt War Downtown buildings, roads, cars and street props, KayKit City Builder Bits', 'Kay Lousberg', 'https://kaylousberg.itch.io/city-builder-bits', 'CC0'],
      ['Bolt War Old fort walls, towers, banners, barrels and props, KayKit Dungeon Remastered', 'Kay Lousberg', 'https://kaylousberg.itch.io/kaykit-dungeon-remastered', 'CC0'],
      ['Bolt War bolt bots, Animated Mech Pack', 'Quaternius', 'https://opengameart.org/content/animated-mech-pack', 'CC0'],
      ['Bolt War monsters, Textured Cute Monster Pack', 'Quaternius', 'https://opengameart.org/content/textured-cute-monster-pack', 'CC0'],
      ['Bolt War heroes Wisp, Zorp, Glim, Fawn, Grim, Oak and Ember, Cute Animated Monsters', 'Quaternius', 'https://quaternius.com', 'CC0'],
      ['Gift boxes, Holiday Kit', 'Kenney', 'https://kenney.nl/assets/holiday-kit', 'CC0'],
      ['Rock paper scissors hands, from the generic hand in WebXR Input Profiles', 'Immersive Web Community Group, copyright Amazon.com, Inc. or its affiliates', 'https://github.com/immersive-web/webxr-input-profiles', 'MIT'],
    ],
  },
  {
    t: 'Fonts',
    items: [['Bolt War lobby font, Barlow Condensed', 'The Barlow Project Authors, Jeremy Tribby', 'https://github.com/jpt/barlow', 'SIL OFL 1.1']],
  },
  {
    t: 'Icons',
    note: 'CC BY 3.0',
    items: [['Skill and button icons', 'Lorc, Delapouite, Skoll, Zeromancer, Carl Olsen and Sbed', 'https://game-icons.net', 'CC BY 3.0'], ['Bolt War painted skill buttons, Painterly Spell Icons parts 1 to 4', 'J. W. Bjerk (eleazzaar), www.jwbjerk.com/art, found on OpenGameArt.org', 'https://opengameart.org/content/painterly-spell-icons-part-1', 'CC BY 3.0']],
  },
  {
    t: 'Sounds',
    items: [
      ['Impact, interface, UI, RPG, digital and sci fi sounds', 'Kenney', 'https://kenney.nl/assets', 'CC0'],
      ['Bolt War skill sounds, Sci Fi Pack and Fantasy SFX Pack', 'JC Sounds', 'https://opengameart.org/content/jc-sounds-sci-fi-pack-vol-1', 'CC BY 4.0'],
      ['Bolt War announcer, Voiceover Pack and Voiceover Pack Fighter', 'Kenney', 'https://kenney.nl/assets/voiceover-pack-fighter', 'CC0'],
      ['Bolt War victory claps', 'freesound community on Pixabay', 'https://pixabay.com/sound-effects/', 'Pixabay license'],
      ['Authentic gun sounds, packs one and two', 'Snake, F8 Studios', 'https://f8studios.itch.io/snakes-authentic-gun-sounds', 'Free license'],
      ['The Free Firearm Sound Library', 'Ben Jaszczak, Brian Nelson, Kevin Heras and Matthew Nanney', 'https://opengameart.org/content/the-free-firearm-sound-library', 'CC0'],
      ['Zombie sound effects', 'EditingCorp', 'https://www.editingcorp.com/zombie-sound-effects-pack-free-download/', 'Royalty free'],
      ['Explosions, cars, water, wind and night sounds', 'Mixkit', 'https://mixkit.co/free-sound-effects/', 'Mixkit license'],
      ['Coins, heartbeat and grenade bounce', 'dihumichi, brvhrtz and freesound community on Pixabay', 'https://pixabay.com/sound-effects/', 'Pixabay license'],
      ['Uzi and bomb gun shots', 'freesound community on Pixabay', 'https://pixabay.com/sound-effects/', 'Pixabay license'],
      ['Helicopter', 'DRAGON STUDIO on Pixabay', 'https://pixabay.com/sound-effects/', 'Pixabay license'],
      ['Velcro and body rips apart', 'freesound community and ragecore29 on Pixabay', 'https://pixabay.com/sound-effects/', 'Pixabay license'],
      ['Emote laughs, cheers, hey, claps and dance music', 'sakkesode, scottishperson, saboteurcomics, floraphonic, digitalstore07, freesound community, The Mountain and Alex Morgan on Pixabay', 'https://pixabay.com/sound-effects/', 'Pixabay license'],
      ['Grenade, dog and older zombie sounds', 'freesound.org and OpenGameArt creators', '/sounds/dead/CREDITS.txt', 'CC0'],
      ['Footsteps on different surfaces', 'congusbongus, OpenGameArt', 'https://opengameart.org/content/footsteps-on-different-surfaces', 'CC BY 3.0'],
      ['Talking zombies, pain and death', 'Mike Koenig, SoundBible', 'https://soundbible.com/tags-zombie.html', 'CC BY 3.0'],
      ['Zombie calls', 'DRAGON STUDIO, Pixabay', 'https://pixabay.com/sound-effects/search/zombie%20voice/', 'Pixabay license'],
      ['Boss roar, made from bear roars and growls', 'YleArkisto and tbsounddesigns, freesound.org', 'https://freesound.org/people/YleArkisto/sounds/249441/', 'CC BY 3.0'],
      ['Trains, dog barks and explosions', 'Mixkit', 'https://mixkit.co/free-sound-effects/', 'Mixkit license'],
    ],
  },
  {
    t: 'Music and voices',
    items: [
      ['Lobby, break and wave fight music', 'mrlockjaw, emmraan and Pixabay artists', 'https://pixabay.com/music/', 'Pixabay license'],
      ['Hip hop emote beat', 'vaitsez on Pixabay', 'https://pixabay.com/music/', 'Pixabay license'],
      ['Bolt War fight and lobby music', 'The Mountain and vaitsez on Pixabay', 'https://pixabay.com/music/', 'Pixabay license'],
      ['Bolt War team battle music, Space Battle', 'MintoDog', 'https://opengameart.org/content/space-battle', 'CC0'],
      ['Bolt War team battle lobby music, Singularity', 'Vitalezzz', 'https://opengameart.org/node/154014', 'CC0'],
      ['Announcer and survivor voices', 'Kenney', 'https://kenney.nl/assets/voiceover-pack', 'CC0'],
      ['Seller voice lines', 'VoiceBosch on Pixabay', 'https://pixabay.com/sound-effects/', 'Pixabay license'],
    ],
  },
  {
    t: 'Textures and effects',
    items: [
      ['Grass, ground, asphalt and concrete', 'ambientCG', 'https://ambientcg.com', 'CC0'],
      ['Evening field sky', 'Sergej Majboroda, Poly Haven', 'https://polyhaven.com/a/evening_field', 'CC0'],
      ['Fire, smoke and flash sprites', 'Kenney', 'https://kenney.nl/assets/particle-pack', 'CC0'],
      ['Muzzle flash and explosion footage', 'ActionVFX', 'https://www.actionvfx.com', 'ActionVFX license'],
    ],
  },
];

export function CreditsTab({ tone }) {
  const T = tone || { ink: '#FFFFFF', muted: 'rgba(255,255,255,0.58)', faint: 'rgba(255,255,255,0.45)', head: '#FFC23D', box: 'rgba(255,255,255,0.04)', line: 'rgba(255,255,255,0.06)', chip: 'rgba(255,255,255,0.08)', chipTxt: 'rgba(255,255,255,0.7)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
      <div style={{ fontSize: 13, lineHeight: 1.45, color: T.muted }}>Our games use work by these artists. Thank you.</div>
      {GROUPS.map((g) => (
        <div key={g.t} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: T.head }}>{g.t}</span>
            {g.note && <span style={{ fontSize: 11.5, fontWeight: 700, color: T.faint }}>{g.note}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', background: T.box, boxShadow: `inset 0 0 0 1px ${T.line}` }}>
            {g.items.map(([title, by, src, lic], i) => (
              <a key={title + by + i} href={/^(https?:)?\//.test(src) ? src : SK + src} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', textDecoration: 'none', color: T.ink, borderTop: i ? `1px solid ${T.line}` : 'none' }}>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>{by}</span>
                </span>
                {lic && <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: T.chipTxt, padding: '3px 7px', borderRadius: 7, background: T.chip }}>{lic}</span>}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
