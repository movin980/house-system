import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAFmQUaciIIcNZHGlSXBLu0I3sp4YENdvE",
  authDomain: "housebookingsystem.firebaseapp.com",
  projectId: "housebookingsystem",
  storageBucket: "housebookingsystem.appspot.com",
  messagingSenderId: "819878550596",
  appId: "1:819878550596:web:959c12eb48868928a5f011",
  measurementId: "G-8NNE50F62B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const myBookings = document.getElementById("myBookings");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    myBookings.innerHTML = "";

    const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      myBookings.innerHTML = "<p>No bookings yet.</p>";
    }

    querySnapshot.forEach((docSnap) => {
      const booking = docSnap.data();

      const div = document.createElement("div");
      div.classList.add("house-card");

      div.innerHTML = `
        <h3>${booking.houseTitle}</h3>
        <p>Location: ${booking.houseLocation}</p>
        <p>Price: KES ${booking.housePrice}</p>
        <p>Status: <strong>${booking.status}</strong></p>
      `;

      myBookings.appendChild(div);
    });
  } else {
    myBookings.innerHTML = "<p>Please login to view your bookings.</p>";
  }
});
