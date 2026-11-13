const SK = 'https://sketchfab.com/3d-models/';

const GROUPS = [
  {
    t: 'Town models',
    note: 'From Sketchfab, CC BY 4.0 unless marked',
    items: [
      ['Old gas station', 'CGMeller', 'old-gas-station-e1d067211c8a4226b2393de0db8dad36'],
      ['American vintage house', 'Katydid', 'american-vintage-house-with-interior-5a9e087fbd3a4ae79b4c51d6279f0466', 'CC BY NC 4.0'],
      ['Red barn', 'volvor', 'red-barn-906b74a1b8d7443eb66545dcc8a1b1c7'],
      ['Abandoned house', 'Sengchor', 'abandoned-house-a0c01ce35a474545b805c0739806aace'],
      ['Abandoned house', 'Leon.com', 'abandoned-house-76678173760042c7aab7a8dd2666b3b0'],
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
    ],
  },
  {
    t: 'Characters',
    items: [['Survivors, zombies and their animations', 'Mixamo by Adobe', 'https://www.mixamo.com', 'Mixamo license']],
  },
  {
    t: 'Icons',
    note: 'From game icons, CC BY 3.0',
    items: [['Skill and button icons', 'Lorc, Delapouite, Skoll, Zeromancer, Carl Olsen and Sbed', 'https://game-icons.net', 'CC BY 3.0']],
  },
  {
    t: 'Sounds',
    items: [
      ['Impact, interface, UI, RPG, digital and sci fi sounds', 'Kenney', 'https://kenney.nl/assets', 'CC0'],
      ['Authentic gun sounds, packs one and two', 'Snake, F8 Studios', 'https://f8studios.itch.io/snakes-authentic-gun-sounds', 'Free license'],
      ['Zombie sound effects', 'EditingCorp', 'https://www.editingcorp.com/zombie-sound-effects-pack-free-download/', 'Royalty free'],
      ['Explosions, cars, water, wind and night sounds', 'Mixkit', 'https://mixkit.co/free-sound-effects/', 'Mixkit license'],
      ['Grenade, dog and older zombie sounds', 'freesound.org and OpenGameArt creators', '/sounds/dead/CREDITS.txt', 'CC0'],
    ],
  },
  {
    t: 'Music and voices',
    items: [
      ['Horror Game Intro and Zombie Game music', 'Eric Matyas', 'https://soundimage.org', 'Free with credit'],
      ['Announcer and survivor voices', 'Kenney', 'https://kenney.nl/assets/voiceover-pack', 'CC0'],
    ],
  },
  {
    t: 'Textures and effects',
    items: [
      ['Grass, ground, asphalt and concrete', 'ambientCG', 'https://ambientcg.com', 'CC0'],
      ['Evening field sky', 'Sergej Majboroda, Poly Haven', 'https://polyhaven.com/a/evening_field', 'CC0'],
      ['Fire, smoke and flash sprites', 'Kenney', 'https://kenney.nl/assets/particle-pack', 'CC0'],
    ],
  },
];

export function CreditsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
      <div style={{ fontSize: 13, lineHeight: 1.45, color: 'rgba(255,255,255,0.62)' }}>Our games use work by these artists. Thank you.</div>
      {GROUPS.map((g) => (
        <div key={g.t} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: '#FFC23D' }}>{g.t}</span>
            {g.note && <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{g.note}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
            {g.items.map(([title, by, src, lic], i) => (
              <a key={title + by + i} href={/^(https?:)?\//.test(src) ? src : SK + src} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', textDecoration: 'none', color: '#FFFFFF', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.58)' }}>{by}</span>
                </span>
                {lic && <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)', padding: '3px 7px', borderRadius: 7, background: 'rgba(255,255,255,0.08)' }}>{lic}</span>}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
