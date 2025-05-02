// Script to check if hymns exist in Firebase

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration - hardcoded to ensure it works
const firebaseConfig = {
  apiKey: "AIzaSyDa7CYH6LqxQ6r9zrnJiqBN8PRy1ccPEWw",
  authDomain: "selah-reflect-app.firebaseapp.com",
  projectId: "selah-reflect-app",
  storageBucket: "selah-reflect-app.appspot.com",
  messagingSenderId: "795114272171",
  appId: "1:795114272171:web:6460d7bf4fd2acbb73ceee"
};

async function checkHymns() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('Checking hymns collection...');
  try {
    // List all documents in the 'hymns' collection
    const hymnsCollectionRef = collection(db, 'hymns');
    const querySnapshot = await getDocs(hymnsCollectionRef);
    
    if (querySnapshot.empty) {
      console.log('No hymns found in the database.');
      return;
    }
    
    console.log(`Found ${querySnapshot.size} hymns in the database:`);
    querySnapshot.forEach(doc => {
      const hymn = doc.data();
      console.log(`- Document ID: ${doc.id}`);
      console.log(`  Title: ${hymn.title || 'No title'}`);
      console.log(`  Author: ${hymn.author || 'No author'}`);
      console.log(`  Lyrics: ${hymn.lyrics ? (Array.isArray(hymn.lyrics) ? `${hymn.lyrics.length} lines` : 'Exists (not array)') : 'No lyrics'}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error fetching hymns:', error);
  }
}

// Run the check
checkHymns().catch(console.error); 