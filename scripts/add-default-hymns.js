// Script to add default hymns for all 12 months to Firebase

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDa7CYH6LqxQ6r9zrnJiqBN8PRy1ccPEWw",
  authDomain: "selah-reflect-app.firebaseapp.com",
  projectId: "selah-reflect-app",
  storageBucket: "selah-reflect-app.appspot.com",
  messagingSenderId: "795114272171",
  appId: "1:795114272171:web:6460d7bf4fd2acbb73ceee"
};

// Define hymns for all 12 months
const defaultHymns = {
  january: {
    title: "Amazing Grace",
    author: "John Newton",
    lyrics: [
      { lineNumber: 1, text: "Amazing grace! how sweet the sound," },
      { lineNumber: 2, text: "That saved a wretch like me!" },
      { lineNumber: 3, text: "I once was lost, but now am found," },
      { lineNumber: 4, text: "Was blind, but now I see." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "'Twas grace that taught my heart to fear," },
      { lineNumber: 7, text: "And grace my fears relieved;" },
      { lineNumber: 8, text: "How precious did that grace appear" },
      { lineNumber: 9, text: "The hour I first believed!" },
      { lineNumber: 10, text: "" },
      { lineNumber: 11, text: "Through many dangers, toils, and snares," },
      { lineNumber: 12, text: "I have already come;" },
      { lineNumber: 13, text: "'Tis grace has brought me safe thus far," },
      { lineNumber: 14, text: "And grace will lead me home." }
    ],
    month: "January",
    updatedAt: new Date().toISOString()
  },
  february: {
    title: "Holy, Holy, Holy",
    author: "Reginald Heber",
    lyrics: [
      { lineNumber: 1, text: "Holy, holy, holy! Lord God Almighty!" },
      { lineNumber: 2, text: "Early in the morning our song shall rise to thee;" },
      { lineNumber: 3, text: "Holy, holy, holy! merciful and mighty," },
      { lineNumber: 4, text: "God in three persons, blessed Trinity!" },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "Holy, holy, holy! all the saints adore thee," },
      { lineNumber: 7, text: "Casting down their golden crowns around the glassy sea;" },
      { lineNumber: 8, text: "Cherubim and seraphim falling down before thee," },
      { lineNumber: 9, text: "Which wert, and art, and evermore shalt be." }
    ],
    month: "February",
    updatedAt: new Date().toISOString()
  },
  march: {
    title: "Be Thou My Vision",
    author: "Ancient Irish Poem",
    lyrics: [
      { lineNumber: 1, text: "Be Thou my Vision, O Lord of my heart;" },
      { lineNumber: 2, text: "Naught be all else to me, save that Thou art;" },
      { lineNumber: 3, text: "Thou my best Thought, by day or by night," },
      { lineNumber: 4, text: "Waking or sleeping, Thy presence my light." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "Be Thou my Wisdom, and Thou my true Word;" },
      { lineNumber: 7, text: "I ever with Thee and Thou with me, Lord;" },
      { lineNumber: 8, text: "Thou my great Father, I Thy true son;" },
      { lineNumber: 9, text: "Thou in me dwelling, and I with Thee one." }
    ],
    month: "March",
    updatedAt: new Date().toISOString()
  },
  april: {
    title: "When I Survey the Wondrous Cross",
    author: "Isaac Watts",
    lyrics: [
      { lineNumber: 1, text: "When I survey the wondrous cross" },
      { lineNumber: 2, text: "On which the Prince of glory died," },
      { lineNumber: 3, text: "My richest gain I count but loss," },
      { lineNumber: 4, text: "And pour contempt on all my pride." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "Forbid it, Lord, that I should boast," },
      { lineNumber: 7, text: "Save in the death of Christ my God!" },
      { lineNumber: 8, text: "All the vain things that charm me most," },
      { lineNumber: 9, text: "I sacrifice them to His blood." }
    ],
    month: "April",
    updatedAt: new Date().toISOString()
  },
  may: {
    title: "O Master, Let Me Walk With Thee",
    author: "Washington Gladden",
    lyrics: [
      { lineNumber: 1, text: "O Master, let me walk with Thee" },
      { lineNumber: 2, text: "In lowly paths of service free;" },
      { lineNumber: 3, text: "Tell me Thy secret; help me bear" },
      { lineNumber: 4, text: "The strain of toil, the fret of care." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "Help me the slow of heart to move" },
      { lineNumber: 7, text: "By some clear, winning word of love;" },
      { lineNumber: 8, text: "Teach me the wayward feet to stay," },
      { lineNumber: 9, text: "And guide them in the homeward way." }
    ],
    month: "May",
    updatedAt: new Date().toISOString()
  },
  june: {
    title: "Great Is Thy Faithfulness",
    author: "Thomas O. Chisholm",
    lyrics: [
      { lineNumber: 1, text: "Great is Thy faithfulness, O God my Father," },
      { lineNumber: 2, text: "There is no shadow of turning with Thee;" },
      { lineNumber: 3, text: "Thou changest not, Thy compassions, they fail not" },
      { lineNumber: 4, text: "As Thou hast been Thou forever wilt be." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "Great is Thy faithfulness! Great is Thy faithfulness!" },
      { lineNumber: 7, text: "Morning by morning new mercies I see;" },
      { lineNumber: 8, text: "All I have needed Thy hand hath provided" },
      { lineNumber: 9, text: "Great is Thy faithfulness, Lord, unto me!" }
    ],
    month: "June",
    updatedAt: new Date().toISOString()
  },
  july: {
    title: "Blessed Assurance",
    author: "Fanny Crosby",
    lyrics: [
      { lineNumber: 1, text: "Blessed assurance, Jesus is mine!" },
      { lineNumber: 2, text: "Oh, what a foretaste of glory divine!" },
      { lineNumber: 3, text: "Heir of salvation, purchase of God," },
      { lineNumber: 4, text: "Born of His Spirit, washed in His blood." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "This is my story, this is my song," },
      { lineNumber: 7, text: "Praising my Savior all the day long;" },
      { lineNumber: 8, text: "This is my story, this is my song," },
      { lineNumber: 9, text: "Praising my Savior all the day long." }
    ],
    month: "July",
    updatedAt: new Date().toISOString()
  },
  august: {
    title: "It Is Well With My Soul",
    author: "Horatio G. Spafford",
    lyrics: [
      { lineNumber: 1, text: "When peace like a river attendeth my way," },
      { lineNumber: 2, text: "When sorrows like sea billows roll;" },
      { lineNumber: 3, text: "Whatever my lot, Thou hast taught me to say," },
      { lineNumber: 4, text: "It is well, it is well with my soul." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "It is well with my soul," },
      { lineNumber: 7, text: "It is well, it is well with my soul." }
    ],
    month: "August",
    updatedAt: new Date().toISOString()
  },
  september: {
    title: "Come, Thou Fount of Every Blessing",
    author: "Robert Robinson",
    lyrics: [
      { lineNumber: 1, text: "Come, Thou Fount of every blessing," },
      { lineNumber: 2, text: "Tune my heart to sing Thy grace;" },
      { lineNumber: 3, text: "Streams of mercy, never ceasing," },
      { lineNumber: 4, text: "Call for songs of loudest praise." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "Teach me some melodious sonnet," },
      { lineNumber: 7, text: "Sung by flaming tongues above;" },
      { lineNumber: 8, text: "Praise the mount! I'm fixed upon it," },
      { lineNumber: 9, text: "Mount of Thy redeeming love." }
    ],
    month: "September",
    updatedAt: new Date().toISOString()
  },
  october: {
    title: "A Mighty Fortress Is Our God",
    author: "Martin Luther",
    lyrics: [
      { lineNumber: 1, text: "A mighty fortress is our God," },
      { lineNumber: 2, text: "A bulwark never failing;" },
      { lineNumber: 3, text: "Our helper He, amid the flood" },
      { lineNumber: 4, text: "Of mortal ills prevailing." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "For still our ancient foe" },
      { lineNumber: 7, text: "Doth seek to work us woe;" },
      { lineNumber: 8, text: "His craft and pow'r are great," },
      { lineNumber: 9, text: "And, armed with cruel hate," },
      { lineNumber: 10, text: "On earth is not his equal." }
    ],
    month: "October",
    updatedAt: new Date().toISOString()
  },
  november: {
    title: "How Great Thou Art",
    author: "Carl Boberg",
    lyrics: [
      { lineNumber: 1, text: "O Lord my God, when I in awesome wonder" },
      { lineNumber: 2, text: "Consider all the worlds Thy hands have made," },
      { lineNumber: 3, text: "I see the stars, I hear the rolling thunder," },
      { lineNumber: 4, text: "Thy pow'r throughout the universe displayed," },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "Then sings my soul, my Savior God, to Thee;" },
      { lineNumber: 7, text: "How great Thou art, how great Thou art!" },
      { lineNumber: 8, text: "Then sings my soul, my Savior God, to Thee;" },
      { lineNumber: 9, text: "How great Thou art, how great Thou art!" }
    ],
    month: "November",
    updatedAt: new Date().toISOString()
  },
  december: {
    title: "Joy to the World",
    author: "Isaac Watts",
    lyrics: [
      { lineNumber: 1, text: "Joy to the world! the Lord is come;" },
      { lineNumber: 2, text: "Let earth receive her King;" },
      { lineNumber: 3, text: "Let ev'ry heart prepare Him room," },
      { lineNumber: 4, text: "And heav'n and nature sing," },
      { lineNumber: 5, text: "And heav'n and nature sing," },
      { lineNumber: 6, text: "And heav'n, and heav'n and nature sing." },
      { lineNumber: 7, text: "" },
      { lineNumber: 8, text: "Joy to the earth! the Savior reigns;" },
      { lineNumber: 9, text: "Let men their songs employ;" },
      { lineNumber: 10, text: "While fields and floods, rocks, hills, and plains" },
      { lineNumber: 11, text: "Repeat the sounding joy," },
      { lineNumber: 12, text: "Repeat the sounding joy," },
      { lineNumber: 13, text: "Repeat, repeat the sounding joy." }
    ],
    month: "December",
    updatedAt: new Date().toISOString()
  }
};

async function addDefaultHymns() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('Adding hymns for all 12 months...');
  for (const [monthId, hymn] of Object.entries(defaultHymns)) {
    try {
      console.log(`Adding hymn for ${monthId}...`);
      const hymnRef = doc(db, 'hymns', monthId);
      await setDoc(hymnRef, hymn, { merge: true });
      console.log(`Hymn for ${monthId} added successfully!`);
    } catch (error) {
      console.error(`Error adding hymn for ${monthId}:`, error);
    }
  }

  console.log('All hymns have been added or updated.');
}

// Run the script
addDefaultHymns().catch(console.error); 