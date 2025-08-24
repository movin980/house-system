import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔑 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAFmQUaciIIcNZHGlSXBLu0I3sp4YENdvE",
  authDomain: "housebookingsystem.firebaseapp.com",
  projectId: "housebookingsystem",
  storageBucket: "housebookingsystem.appspot.com",
  messagingSenderId: "819878550596",
  appId: "1:819878550596:web:959c12eb48868928a5f011",
  measurementId: "G-8NNE50F62B"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const housesList = document.getElementById("housesList");

// Load all houses
async function loadHouses(user) {
  const querySnapshot = await getDocs(collection(db, "houses"));
  housesList.innerHTML = ""; // clear

  querySnapshot.forEach((doc) => {
    const house = doc.data();
    const houseId = doc.id;

    // Create house card
    const div = document.createElement("div");
    div.classList.add("house-card");
    div.innerHTML = `
      <h3>${house.title}</h3>
      <p>Location: ${house.location}</p>
      <p>Price: KES ${house.price}</p>
      <button class="book-btn">Book</button>
    `;

    // Book button
    const btn = div.querySelector(".book-btn");
    btn.addEventListener("click", async () => {
      if (!user) {
        alert("Please login to book this house.");
        return;
      }

      try {
        await addDoc(collection(db, "bookings"), {
          userId: user.uid,
          houseId: houseId,
          houseTitle: house.title,
          housePrice: house.price,
          houseLocation: house.location,
          status: "pending",
          createdAt: new Date()
        });

        alert("Booking request sent successfully!");
      } catch (err) {
        console.error("Booking error:", err);
        alert("Failed to book house. Try again.");
      }
    });

    housesList.appendChild(div);
  });
}

// Track auth state
onAuthStateChanged(auth, (user) => {
  loadHouses(user);
});
