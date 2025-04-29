/**
 * Script to update the structure of reflectionSections in Firestore
 * This adds passage fields to existing reflectionSections entries
 * 
 * Run with: node scripts/update-reflection-sections.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase configuration - replace with your own credentials file path 
const serviceAccountPath = path.join(__dirname, '../firebase-credentials.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error(`Error loading Firebase service account: ${error.message}`);
  console.log('Please create a firebase-credentials.json file with your service account credentials');
  console.log('You can download this from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const devotionsRef = db.collection('devotions');

// Sample reference data for passages - replace with your actual data
// or load from a JSON file
const referenceData = {
  "2025-04-21": {
    "bibleText": "Luke 24:1-12",
    "reflectionSections": [
      {
        "passage": "Luke 24:1-2, 12",
        "questions": [
          "What is the difference between the women and Peter vs. the disciples who did not go to the tomb? What can I learn about what is the best way to deal with rejection and disappointment?"
        ]
      },
      {
        "passage": "Luke 24:5-8",
        "questions": [
          "What did the angels remind the women?",
          "What is the role of remembering God's word in enabling us to recognize him at work?"
        ]
      }
    ]
  },
  "2025-04-22": {
    "bibleText": "Luke 24:13-35",
    "reflectionSections": [
      {
        "passage": "Luke 24:21",
        "questions": [
          "Think about the words: \"we had hoped....\" How did the crucifixion of Jesus dash their hope?",
          "What are my false hopes? In what ways do they get in the way of my recognizing my true need?"
        ]
      },
      {
        "passage": "Luke 24:32-35",
        "questions": [
          "What made their hearts burn?",
          "The disciples had no option but to hasten back to Jerusalem and share with others how they had encountered Jesus. How does the gospel have this kind of effect on a person's life, turning him from the path that he is on and returning him to community?",
          "How have I experienced this to be true of my life?"
        ]
      }
    ]
  }
};

// Function to update a single devotion document with updated reflectionSections
async function updateDevotion(docId, referenceData) {
  try {
    // Get the current document
    const docRef = devotionsRef.doc(docId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log(`Document ${docId} does not exist, skipping`);
      return;
    }
    
    const data = doc.data();
    
    // If the document already has reflectionSections with passage fields, we don't need to update
    if (data.reflectionSections && 
        data.reflectionSections.length > 0 && 
        data.reflectionSections[0].passage) {
      console.log(`Document ${docId} already has passage field in reflectionSections, skipping`);
      return;
    }
    
    // If we have reference data for this document
    if (referenceData && referenceData[docId]) {
      const refData = referenceData[docId];
      
      // Update with the reference reflectionSections
      await docRef.update({
        reflectionSections: refData.reflectionSections
      });
      
      console.log(`Updated document ${docId} with reference reflectionSections`);
      return;
    }
    
    // If we don't have reference data but the document has reflectionSections
    if (data.reflectionSections && data.reflectionSections.length > 0) {
      // Add a generic passage field to each section
      const updatedSections = data.reflectionSections.map((section, index) => {
        return {
          ...section,
          passage: `${data.bibleText || ''} (Part ${index + 1})`
        };
      });
      
      await docRef.update({
        reflectionSections: updatedSections
      });
      
      console.log(`Updated document ${docId} with generic passage fields`);
      return;
    }
    
    // If no reflectionSections but we have reflectionQuestions, create a section
    if (data.reflectionQuestions && data.reflectionQuestions.length > 0) {
      const updatedSections = [{
        passage: data.bibleText || '',
        questions: data.reflectionQuestions
      }];
      
      await docRef.update({
        reflectionSections: updatedSections
      });
      
      console.log(`Updated document ${docId} by converting reflectionQuestions to sections`);
      return;
    }
    
    console.log(`No updates needed for document ${docId}`);
    
  } catch (error) {
    console.error(`Error updating document ${docId}:`, error);
  }
}

// Main function to update all devotions
async function updateAllDevotions() {
  try {
    console.log('Starting update of reflectionSections in Firestore...');
    
    // Get all devotion documents
    const snapshot = await devotionsRef.get();
    
    if (snapshot.empty) {
      console.log('No devotion documents found');
      return;
    }
    
    console.log(`Found ${snapshot.size} devotion documents`);
    
    // For each document, update the reflectionSections
    const promises = snapshot.docs.map(doc => {
      return updateDevotion(doc.id, referenceData);
    });
    
    await Promise.all(promises);
    
    console.log('Finished updating reflectionSections in Firestore');
    
  } catch (error) {
    console.error('Error updating devotions:', error);
  }
}

// Run the update function
updateAllDevotions()
  .then(() => {
    console.log('Update script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Update script failed:', error);
    process.exit(1);
  }); 