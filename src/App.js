import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Plus,
  MessageCircle,
  Heart,
  User,
  Film,
  Tv,
  Clapperboard,
  Sparkles,
  X,
  Send,
  Loader2,
  Settings,
  LogOut,
  Mail,
  Lock,
  Chrome,
  Wand2,
  Hash,
  ShieldAlert,
  BrainCircuit,
  Lightbulb,
  Flame,
  Dna,
  Shuffle,
  ExternalLink,
  ChevronDown,
  Share2,
} from "lucide-react";

// Firebase Imports
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

// --- Configuration ---
let firebaseConfig;
if (typeof __firebase_config !== "undefined") {
  try {
    firebaseConfig = JSON.parse(__firebase_config);
  } catch (e) {
    firebaseConfig = {};
  }
} else {
  // CodeSandbox Keys - Replace with yours if needed
  firebaseConfig = {
    apiKey: "AIzaSyCFwUvwfYRDtxwgZuK6_KpylHL54rDPfzI",
    authDomain: "movietalk-282ad.firebaseapp.com",
    projectId: "movietalk-282ad",
    storageBucket: "movietalk-282ad.firebasestorage.app",
    messagingSenderId: "392639064000",
    appId: "1:392639064000:web:26a75eb69725dd51174a25",
    measurementId: "G-QVRF0FXJ22",
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "movie-talk-public";
const apiKey = ""; // 🔑 ADD GEMINI API KEY HERE FOR AI FEATURES

// --- Helpers ---
const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getRandomColor = (id) => {
  const colors = [
    "#ef4444",
    "#3b82f6",
    "#22c55e",
    "#a855f7",
    "#eab308",
    "#6366f1",
  ];
  let hash = 0;
  if (id)
    for (let i = 0; i < id.length; i++)
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const callGemini = async (prompt) => {
  if (!apiKey) {
    return null;
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    return null;
  }
};

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }) => (
  <nav className="fixed bottom-0 left-0 w-full bg-slate-950 border-t border-slate-900 z-50 md:sticky md:top-0 md:h-screen md:w-64 md:flex-col md:border-r md:border-t-0 md:justify-start md:pt-8">
    <div className="hidden md:flex items-center gap-2 px-6 mb-8 text-red-500">
      <Film size={32} color="#ef4444" />
      <span className="text-2xl font-bold tracking-tighter text-white">
        Movie<span className="text-red-500">Clips</span>
      </span>
    </div>
    <div className="flex justify-around items-center w-full h-16 md:flex-col md:h-auto md:gap-2 md:px-2">
      <NavButton
        icon={<Tv size={24} />}
        label="Clips"
        isActive={activeTab === "feed"}
        onClick={() => setActiveTab("feed")}
      />
      <NavButton
        icon={<Plus size={24} />}
        label="Create"
        isActive={activeTab === "studio"}
        onClick={() => setActiveTab("studio")}
      />
      <NavButton
        icon={<User size={24} />}
        label="Profile"
        isActive={activeTab === "profile"}
        onClick={() => setActiveTab("profile")}
      />
    </div>
  </nav>
);

const NavButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col md:flex-row md:gap-4 md:px-6 md:py-3 md:w-full items-center justify-center md:justify-start rounded-xl transition-all duration-200 ${
      isActive
        ? "text-red-500 md:bg-slate-900"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
    }`}
    style={{ color: isActive ? "#ef4444" : "#94a3b8" }}
  >
    {icon}
    <span className="text-xs md:text-lg font-medium mt-1 md:mt-0">{label}</span>
  </button>
);

const ClipCard = ({ video, onOpenComments, onOpenSmart, user }) => {
  const ytId = getYoutubeId(video.url);
  const [liked, setLiked] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    setLiked(true);
    setTimeout(() => setLiked(false), 500);
    try {
      const videoRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "videos",
        video.id
      );
      await updateDoc(videoRef, { likes: increment(1) });
    } catch (err) {}
  };

  return (
    <div
      className="relative w-full h-full snap-start flex items-center justify-center bg-black overflow-hidden"
      style={{ minHeight: "calc(100vh - 4rem)", md: { minHeight: "100vh" } }}
    >
      {/* Video Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        {ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0&controls=1&loop=1&playlist=${ytId}`}
            className="w-full h-full pointer-events-auto"
            style={{ height: "100%", width: "100%", objectFit: "cover" }}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="text-white">Invalid Link</div>
        )}
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-20 pointer-events-auto">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleLike}
            className="p-3 bg-slate-800/60 backdrop-blur-md rounded-full text-white hover:bg-slate-700 hover:scale-110 transition-all"
          >
            <Heart
              size={28}
              className={liked ? "fill-red-500 text-red-500" : ""}
            />
          </button>
          <span className="text-white text-xs font-bold shadow-black drop-shadow-md">
            {video.likes || 0}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onOpenComments(video)}
            className="p-3 bg-slate-800/60 backdrop-blur-md rounded-full text-white hover:bg-slate-700 hover:scale-110 transition-all"
          >
            <MessageCircle size={28} />
          </button>
          <span className="text-white text-xs font-bold shadow-black drop-shadow-md">
            Chat
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onOpenSmart(video)}
            className="p-3 bg-yellow-500/20 backdrop-blur-md rounded-full text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/40 hover:scale-110 transition-all"
          >
            <Sparkles size={28} />
          </button>
          <span className="text-white text-xs font-bold shadow-black drop-shadow-md">
            Smart
          </span>
        </div>
      </div>

      {/* Bottom Info Area */}
      <div className="absolute bottom-4 left-4 right-16 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 border-white`}
            style={{ backgroundColor: getRandomColor(video.userId) }}
          >
            {video.username ? video.username[0].toUpperCase() : "U"}
          </div>
          <span className="text-white font-bold drop-shadow-md">
            {video.username}
          </span>
          {video.tags &&
            video.tags.split(" ").map(
              (tag, i) =>
                i < 2 && (
                  <span
                    key={i}
                    className="text-xs bg-slate-800/80 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30"
                  >
                    {tag}
                  </span>
                )
            )}
        </div>

        <h3 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-lg line-clamp-2">
          {video.title}
        </h3>
        <p className="text-slate-300 text-sm mb-3 line-clamp-2 drop-shadow-md">
          {video.description}
        </p>

        {/* Affiliate / Watch Link */}
        {video.watchLink && (
          <a
            href={
              video.watchLink.startsWith("http")
                ? video.watchLink
                : `https://${video.watchLink}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-full font-bold transition-colors shadow-lg shadow-red-900/50 animate-pulse"
          >
            <Play size={18} fill="currentColor" /> Watch Movie
          </a>
        )}
      </div>
    </div>
  );
};

const SmartSheet = ({ video, onClose }) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runFeature = async (type) => {
    setAiLoading(true);
    let prompt = "";
    if (type === "explain")
      prompt = `Explain the plot context of the movie clip "${video.title}" in 2 sentences.`;
    if (type === "trivia")
      prompt = `Tell me a fun fact about the movie "${video.title}".`;
    if (type === "roast")
      prompt = `Roast the movie clip "${video.title}" in a funny way.`;

    const res = await callGemini(prompt);
    setResult({ type, text: res });
    setAiLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div
        className="absolute inset-0 bg-black/60 pointer-events-auto"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl border-t border-slate-800 p-6 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-yellow-400" /> AI Smart Info
          </h3>
          <button onClick={onClose}>
            <X className="text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => runFeature("explain")}
            className="bg-slate-800 p-3 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors text-blue-400"
          >
            <BrainCircuit /> <span className="text-xs font-bold">Explain</span>
          </button>
          <button
            onClick={() => runFeature("trivia")}
            className="bg-slate-800 p-3 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors text-yellow-400"
          >
            <Lightbulb /> <span className="text-xs font-bold">Trivia</span>
          </button>
          <button
            onClick={() => runFeature("roast")}
            className="bg-slate-800 p-3 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors text-red-400"
          >
            <Flame /> <span className="text-xs font-bold">Roast</span>
          </button>
        </div>

        {aiLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-white" />
          </div>
        ) : (
          result && (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <h4 className="text-slate-300 text-xs font-bold uppercase mb-2 tracking-wider opacity-75">
                {result.type}
              </h4>
              <p className="text-white leading-relaxed">{result.text}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

const CommentsSheet = ({ video, onClose, user, appId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "comments"),
      (snapshot) => {
        const allComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(
          allComments
            .filter((c) => c.videoId === video.id)
            .sort(
              (a, b) =>
                (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            )
        );
      }
    );
    return () => unsubscribe();
  }, [video.id, appId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    await addDoc(
      collection(db, "artifacts", appId, "public", "data", "comments"),
      {
        videoId: video.id,
        text: newComment,
        userId: user.uid,
        username: user.email ? user.email.split("@")[0] : "User",
        createdAt: serverTimestamp(),
      }
    );
    setNewComment("");
  };

  const getAiHotTake = async () => {
    setIsAiLoading(true);
    const res = await callGemini(
      `Write a funny short comment about "${video.title}"`
    );
    if (res) setNewComment(res.trim());
    setIsAiLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl border-t border-slate-800 h-[70vh] flex flex-col shadow-2xl pointer-events-auto transition-transform duration-300 transform translate-y-0">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-white font-bold">Comments ({comments.length})</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-slate-500 text-center mt-10">
              No comments yet.
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div
                  className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs text-white font-bold`}
                  style={{ backgroundColor: getRandomColor(c.userId) }}
                >
                  {c.username[0]}
                </div>
                <div>
                  <div className="text-slate-300 text-sm font-bold">
                    {c.username}
                  </div>
                  <p className="text-slate-400 text-sm">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-slate-800 bg-slate-900 flex gap-2 pb-8 items-center"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-slate-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Add a comment..."
          />
          <button
            type="button"
            onClick={getAiHotTake}
            disabled={isAiLoading}
            className="text-yellow-400"
          >
            <Sparkles size={20} />
          </button>
          <button
            type="submit"
            className="p-2 bg-red-600 rounded-full text-white"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

const StudioMode = ({ user, appId, setActiveTab }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [watchLink, setWatchLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewId, setPreviewId] = useState(null);

  const handleAiAction = async (action) => {
    setAiLoading(true);
    let result = "";
    if (action === "magic_title") {
      result = await callGemini(
        `Rewrite this movie video title to be catchy, viral, and exciting (max 10 words): "${title}"`
      );
      if (result) setTitle(result.replace(/"/g, ""));
    }
    if (action === "auto_desc") {
      result = await callGemini(
        `Write a compelling 2-sentence description for a movie video titled: "${title}". Use emojis.`
      );
      if (result) setDescription(result);
    }
    if (action === "tags") {
      result = await callGemini(
        `Generate 5 relevant hashtags for a movie video titled "${title}". Separated by spaces.`
      );
      if (result) setTags(result);
    }
    if (action === "rating") {
      result = await callGemini(
        `Predict the MPAA rating (G, PG, PG-13, R) for a movie clip titled "${title}" and explain why in 3 words.`
      );
      if (result) alert(`AI Prediction: ${result}`);
    }
    setAiLoading(false);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!previewId || !title.trim() || !user) return;
    setLoading(true);
    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "videos"),
        {
          url,
          title,
          description,
          tags,
          watchLink,
          userId: user.uid,
          username: user.email ? user.email.split("@")[0] : "Director",
          likes: 0,
          createdAt: serverTimestamp(),
        }
      );
      setUrl("");
      setTitle("");
      setDescription("");
      setTags("");
      setWatchLink("");
      setActiveTab("feed");
    } catch (error) {
      alert("Failed to publish video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12 pb-24 text-slate-100">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Clapperboard className="text-red-500" />
        Upload Clip
      </h1>
      <form onSubmit={handlePublish} className="space-y-6">
        <div className="space-y-2">
          <label className="text-slate-400 text-sm">YouTube Clip URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setPreviewId(getYoutubeId(e.target.value));
            }}
            className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-white focus:border-red-500 outline-none transition-colors"
            placeholder="https://youtube.com/shorts/..."
          />
        </div>
        {previewId && (
          <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
            <iframe
              src={`https://www.youtube.com/embed/${previewId}`}
              className="w-full h-full"
              frameBorder="0"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-400 text-sm">Movie Title</label>
            <button
              type="button"
              onClick={() => handleAiAction("magic_title")}
              disabled={!title}
              className="text-xs text-yellow-400 flex items-center gap-1"
            >
              <Wand2 size={12} /> Magic Polish
            </button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-white focus:border-red-500 outline-none"
            placeholder="e.g. The Best Scene in Inception"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-400 text-sm">Description</label>
            <button
              type="button"
              onClick={() => handleAiAction("auto_desc")}
              disabled={!title}
              className="text-xs text-blue-400 flex items-center gap-1"
            >
              <Sparkles size={12} /> Auto Write
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-white focus:border-red-500 outline-none resize-none"
            placeholder="Why should people watch this?"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-slate-400 text-sm">Tags</label>
              <button
                type="button"
                onClick={() => handleAiAction("tags")}
                disabled={!title}
                className="text-xs text-purple-400 flex items-center gap-1"
              >
                <Hash size={12} /> Gen Tags
              </button>
            </div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white text-sm"
              placeholder="#Action #Movie"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => handleAiAction("rating")}
              disabled={!title}
              className="w-full bg-slate-900 hover:bg-slate-800 p-3 rounded-xl text-slate-300 text-sm flex items-center justify-center gap-2 border border-slate-800 transition-colors"
            >
              <ShieldAlert size={16} /> Predict Rating
            </button>
          </div>
        </div>

        <div className="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <label className="text-green-400 font-bold flex items-center gap-2 mb-2">
            <ExternalLink size={16} /> Affiliate / Watch Link
          </label>
          <input
            type="url"
            value={watchLink}
            onChange={(e) => setWatchLink(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white text-sm focus:border-green-500 outline-none"
            placeholder="https://netflix.com/title/..."
          />
          <p className="text-xs text-slate-500">
            This link will appear as a "Watch Movie" button on the Clip.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !previewId}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Post Clip"}
        </button>
      </form>
    </div>
  );
};

const ProfileMode = ({ user }) => {
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState(null);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === "signup")
        await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      alert(error.message);
    }
  };

  const generatePersona = async () => {
    setLoading(true);
    const result = await callGemini(
      `Based on a movie fan profile, describe my 'Director Persona' in 3 words (e.g. The Action Junkie).`
    );
    if (result) setPersona(result);
    setLoading(false);
  };

  if (user && !user.isAnonymous) {
    return (
      <div className="max-w-md mx-auto p-8 pt-20 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-purple-600 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-white mb-4">
          {user.email[0].toUpperCase()}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {user.email.split("@")[0]}
        </h2>
        <button
          onClick={generatePersona}
          className="mt-2 mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 text-sm border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
        >
          <Dna size={14} /> {persona || "Analyze My Persona"}
        </button>
        <button
          onClick={() => signOut(auth)}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-6 pt-24">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {authMode === "login" ? "Sign In" : "Join MovieClips"}
        </h2>
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-6 hover:bg-slate-200"
        >
          <Chrome size={20} className="text-blue-500" /> Google
        </button>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-900 px-2 text-slate-500 text-xs">
              OR EMAIL
            </span>
          </div>
        </div>
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-red-500 outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-red-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl"
          >
            {authMode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <button
          onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
          className="w-full text-center text-slate-400 text-sm mt-4 hover:text-white transition-colors"
        >
          {authMode === "login"
            ? "New here? Create account"
            : "Already have account? Login"}
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [videos, setVideos] = useState([]);
  const [commentVideo, setCommentVideo] = useState(null);
  const [smartVideo, setSmartVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- AUTOMATIC STYLE FIX ---
  useEffect(() => {
    document.body.style.backgroundColor = "#020617";
    document.body.style.color = "white";
    document.body.style.margin = "0";
    document.body.style.fontFamily = "sans-serif";
    if (!document.getElementById("tailwind-cdn")) {
      const script = document.createElement("script");
      script.id = "tailwind-cdn";
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {}
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "artifacts", appId, "public", "data", "videos"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVideos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(fetchedVideos);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // AI Curator
  const handleAiCurator = async () => {
    if (videos.length === 0) return;
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    const reason = await callGemini(
      `Give me a 5-word excited reason to watch a clip titled "${randomVideo.title}".`
    );
    alert(`AI Recommendation: ${reason || "Just watch it!"}`);
    // Ideally scroll to it, but simple alert for now
  };

  if (!user && loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="text-red-500 animate-spin" />
      </div>
    );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 md:ml-0 w-full relative h-screen overflow-hidden">
        {activeTab === "feed" && (
          <div className="h-full w-full snap-y snap-mandatory overflow-y-scroll scroll-smooth no-scrollbar">
            {/* Floating Curator Button */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={handleAiCurator}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-white/20 transition-all"
              >
                <Shuffle size={14} /> Surprise Me
              </button>
            </div>

            {videos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Clapperboard size={64} className="text-slate-800 mb-4" />
                <h2 className="text-xl font-bold text-slate-500">
                  No Clips yet
                </h2>
                <button
                  onClick={() => setActiveTab("studio")}
                  className="mt-4 text-red-500 font-bold hover:underline"
                >
                  Be the first to post!
                </button>
              </div>
            ) : (
              videos.map((video) => (
                <ClipCard
                  key={video.id}
                  video={video}
                  onOpenComments={setCommentVideo}
                  onOpenSmart={setSmartVideo}
                  user={user}
                />
              ))
            )}
          </div>
        )}
        {activeTab === "studio" && (
          <div className="h-full overflow-y-auto">
            <StudioMode user={user} appId={appId} setActiveTab={setActiveTab} />
          </div>
        )}
        {activeTab === "profile" && (
          <div className="h-full overflow-y-auto">
            <ProfileMode user={user} />
          </div>
        )}

        {commentVideo && (
          <CommentsSheet
            video={commentVideo}
            onClose={() => setCommentVideo(null)}
            user={user}
            appId={appId}
          />
        )}

        {smartVideo && (
          <SmartSheet video={smartVideo} onClose={() => setSmartVideo(null)} />
        )}
      </main>
    </div>
  );
}
