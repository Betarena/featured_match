// ~~~~~~~~~~~~~~~~~~
// firebase/index.ts
// ~~~~~~~~~~~~~~~~~~

import firebase from 'firebase/app' // rollup bundle issue with ESM import
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/database'
import {
  readable
} from 'svelte/store'

// firebase config with non-auth properties skipped
const firebaseConfig = {
  apiKey: 'AIzaSyDHMGmKQRsRcxq5MNAOmzegmPScIVdo3Zg',
  authDomain: 'betarena-rv-6b382.firebaseapp.com',
  projectId: 'betarena-rv-6b382',
  databaseURL: "https://betarena-rv-6b382.firebaseio.com/"
}

// Initialize the Firebase APP
firebase.initializeApp(firebaseConfig)
// Get a reference to the Firestore Service
export const db = firebase.firestore()
// Get a reference to the Real Database Service
export const db_real = firebase.database()