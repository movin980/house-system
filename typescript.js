import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  addDoc,
  setDoc,
  doc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// UI libs (available per instructions)
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, LogOut, Plus, Search, Home, MapPin, Upload, BedDouble } from "lucide-react";

// -------------------- Firebase Config --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAFmQUaciIIcNZHGlSXBLu0I3sp4YENdvE",
  authDomain: "housebookingsystem.firebaseapp.com",
  projectId: "housebookingsystem",
  storageBucket: "housebookingsystem.appspot.com",
  messagingSenderId: "819878550596",
  appId: "1:819878550596:web:959c12eb48868928a5f011",
  measurementId: "G-8NNE50F62B",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// -------------------- Helpers --------------------
function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function currencyKES(n) {
  if (n === undefined || n === null || isNaN(Number(n))) return "KES —";
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(n));
}

// -------------------- Auth Views --------------------
function AuthView() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toggleMode = () => setMode((m) => (m === "login" ? "signup" : "login"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        // Create a basic user profile doc
        await setDoc(doc(db, "users", cred.user.uid), {
          name: name || "",
          email,
          role: "renter",
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      alert(err?.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-indigo-50 to-white">
      <Card className="w-full max-w-md rounded-2xl shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-indigo-600">
              <Home className="h-6 w-6" />
              <h1 className="text-2xl font-bold">House Booking</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Welcome back. Log in to continue." : "Create an account to get started."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {mode === "login" ? "Logging in..." : "Creating account..."}</span>
              ) : (
                mode === "login" ? "Log In" : "Create Account"
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <p className="text-center text-sm">
            {mode === "login" ? (
              <>New here? <button className="text-indigo-600 hover:underline" onClick={toggleMode}>Create an account</button></>
            ) : (
              <>Already have an account? <button className="text-indigo-600 hover:underline" onClick={toggleMode}>Log in</button></>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------- Add House --------------------
function AddHouse({ user, onCreated }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please choose an image");
    setLoading(true);
    try {
      // Upload image
      const path = `houses/${user.uid}/${Date.now()}-${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);

      // Create doc
      const houseDoc = {
        ownerId: user.uid,
        title,
        location,
        price: Number(price),
        description,
        images: [url],
        availability: true,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "houses"), houseDoc);
      setTitle("");
      setLocation("");
      setPrice("");
      setDescription("");
      setFile(null);
      onCreated?.();
      alert("House added successfully ✅");
    } catch (err) {
      alert(err?.message || "Failed to add house");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="h-5 w-5" /> Add a New House</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="2 Bedroom Apartment" required />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nairobi, Westlands" required />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="price">Monthly Price (KES)</Label>
            <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25000" required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Spacious, parking available, near amenities..." rows={4} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="image">Cover Image</Label>
            <div className="flex items-center gap-3">
              <Input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Badge variant="secondary" className="inline-flex items-center gap-2"><Upload className="h-4 w-4" /> Upload</Badge>
            </div>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span> : "Save House"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// -------------------- Browse Houses --------------------
function BrowseHouses({ user }) {
  const [houses, setHouses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchHouses = async () => {
    setLoading(true);
    const q = query(collection(db, "houses"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setHouses(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return houses;
    return houses.filter((h) =>
      [h.title, h.location, h.description].filter(Boolean).some((x) => String(x).toLowerCase().includes(term))
    );
  }, [houses, search]);

  const handleBook = async (house) => {
    try {
      await addDoc(collection(db, "bookings"), {
        houseId: house.id,
        userId: user.uid,
        status: "pending",
        dateBooked: serverTimestamp(),
      });
      alert("Booking request sent ✅");
    } catch (err) {
      alert(err?.message || "Booking failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, location, features..." className="pl-9" />
        </div>
        <Button variant="secondary" onClick={fetchHouses} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {filtered.map((h) => (
          <Card key={h.id} className="rounded-2xl overflow-hidden hover:shadow-xl transition">
            <div className="h-44 w-full bg-muted">
              {h.images?.[0] ? (
                <img src={h.images[0]} alt={h.title} className="h-44 w-full object-cover" />
              ) : (
                <div className="h-44 w-full grid place-items-center text-muted-foreground">No image</div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{h.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {h.location}</div>
                </div>
                <Badge variant={h.availability ? "default" : "secondary"}>{h.availability ? "Available" : "Unavailable"}</Badge>
              </div>
              <div className="mt-2 font-semibold text-indigo-600">{currencyKES(h.price)}</div>
              <p className="mt-1 text-sm line-clamp-2 text-muted-foreground">{h.description}</p>
              <div className="mt-4 flex items-center gap-2">
                <Button className="flex-1" onClick={() => setSelected(h) || setOpen(true)}>View</Button>
                <Button className="flex-1" variant="outline" onClick={() => handleBook(h)} disabled={!h.availability}>Book</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BedDouble className="h-5 w-5" /> {selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.location} • {currencyKES(selected?.price)}
            </DialogDescription>
          </DialogHeader>
          {selected?.images?.[0] && (
            <img src={selected.images[0]} alt={selected.title} className="rounded-xl w-full h-56 object-cover" />
          )}
          <p className="text-sm text-muted-foreground">{selected?.description}</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => handleBook(selected)}>Request Booking</Button>
            <Button className="flex-1" variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -------------------- My Bookings --------------------
function MyBookings({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    const q = query(collection(db, "bookings"), where("userId", "==", user.uid), orderBy("dateBooked", "desc"));
    const snap = await getDocs(q);
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Booking Requests</h3>
        <Button variant="secondary" onClick={fetchBookings} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((b) => (
          <Card key={b.id} className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Booking #{b.id.slice(0, 6)}</div>
                <Badge variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "secondary" : "outline"}>{b.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">House: {b.houseId}</div>
              <div className="text-sm text-muted-foreground">Placed: {b.dateBooked?.toDate ? b.dateBooked.toDate().toLocaleString() : "—"}</div>
            </CardContent>
          </Card>
        ))}
        {!items.length && !loading && (
          <div className="text-muted-foreground text-sm">No bookings yet.</div>
        )}
      </div>
    </div>
  );
}

// -------------------- Main App --------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("browse");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold"><Home className="h-5 w-5" /> House Booking</div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Hi, {user.displayName || user.email}</Badge>
            <Button variant="ghost" size="sm" onClick={() => signOut(auth)} className="gap-2"><LogOut className="h-4 w-4" /> Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse" className="gap-2"><Search className="h-4 w-4" /> Browse</TabsTrigger>
            <TabsTrigger value="add" className="gap-2"><Plus className="h-4 w-4" /> Add House</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2"><BedDouble className="h-4 w-4" /> My Bookings</TabsTrigger>
          </TabsList>
          <div className="mt-6 space-y-6">
            <TabsContent value="browse" className="m-0">
              <BrowseHouses user={user} />
            </TabsContent>
            <TabsContent value="add" className="m-0">
              <AddHouse user={user} onCreated={() => setTab("browse")} />
            </TabsContent>
            <TabsContent value="bookings" className="m-0">
              <MyBookings user={user} />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <footer className="py-8 text-center text-xs text-muted-foreground">
        Built with Firebase • Designed for Kenya 🇰🇪
      </footer>
    </div>
  );
}
