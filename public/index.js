// HumanLine Prototype - Advanced Version
// Firebase, MPESA STK Push, Agora Video, Roles, AI fallback, Creator Dashboard

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function HumanLineApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("user");
  const [dashboardData, setDashboardData] = useState([]);

  useEffect(() => {
    signInAnonymously(auth).then(async (userCred) => {
      const uid = userCred.user.uid;
      setUserId(uid);
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, { role: "user" });
      } else {
        setRole(userSnap.data().role);
      }
    });

    const unsub = onSnapshot(collection(db, "messages"), snapshot => {
      setMessages(snapshot.docs.map(doc => doc.data()));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (role === "creator") {
      loadDashboardData();
    }
  }, [role]);

  const loadDashboardData = async () => {
    const msgs = await getDocs(query(collection(db, "messages")));
    const data = msgs.docs.map(doc => doc.data());
    setDashboardData(data);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = {
      text: input,
      sender: "user",
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
    setInput("");

    const response = isPaid ? "[Real person] Got your message!" : await fakeAIResponse(input);
    await addDoc(collection(db, "messages"), msg);
    await addDoc(collection(db, "messages"), {
      text: response,
      sender: isPaid ? "real" : "ai",
      timestamp: Date.now()
    });
  };

  const fakeAIResponse = async (userInput) => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer YOUR_OPENAI_KEY`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userInput }]
      })
    });
    const data = await res.json();
    return data.choices[0].message.content;
  };

  const initiateSTKPush = async () => {
    const response = await fetch("https://your-backend.com/mpesa/stk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: "0712345678",
        amount: 10
      })
    });
    const result = await response.json();
    if (result.success) setIsPaid(true);
    else alert("Payment failed.");
  };

  const joinVideoCall = () => {
    window.open("https://your-agora-call-room.com/room123", "_blank");
  };

  if (role === "creator") {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Creator Dashboard</h1>
        <Card className="mb-4 h-96 overflow-y-scroll">
          <CardContent>
            {dashboardData.map((msg, i) => (
              <p key={i} className={`mb-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>{msg.sender}: {msg.text}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">HumanLine</h1>
      <p className="text-sm mb-2">Role: {role}</p>
      <div className="flex gap-2 mb-4">
        <Button onClick={initiateSTKPush}>Pay via MPESA</Button>
        <Button variant="outline" onClick={() => setIsPaid(false)}>Use AI Fallback</Button>
        {isPaid && <Button variant="secondary" onClick={joinVideoCall}>Join Video Call</Button>}
      </div>
      <Card className="mb-4 h-96 overflow-y-scroll">
        <CardContent>
          {messages.map((m, i) => (
            <p key={i} className={`mb-1 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>{m.sender}: {m.text}</p>
          ))}
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}

// index.html sample
// <html>
//   <head>
//     <title>HumanLine</title>
//     <meta name="viewport" content="width=device-width, initial-scale=1">
//   </head>
//   <body>
//     <div id="root"></div>
//     <script type="module" src="/src/main.jsx"></script>
//   </body>
// </html>
