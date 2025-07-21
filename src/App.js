import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    setDoc,
    doc, 
    query, 
    onSnapshot, 
    serverTimestamp,
} from 'firebase/firestore';
import { ArrowLeft, Send, Users, MessageSquare, LogOut, Home, Sparkles, X, Info } from 'lucide-react';

// --- Firebase Configuration ---
// User-provided Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Gemini API Helper (Direct Frontend Call) ---
// ⚠️ IMPORTANT: Paste your Gemini API key below.
// This method is for local development only. Do not deploy a public website
// with your API key in the frontend code, as it will be exposed.
const callGeminiAPI = async (prompt) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
        return "Error: Please add your Gemini API key to the callGeminiAPI function in the code.";
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            throw new Error(`API call failed: ${errorData.error.message}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.error("Unexpected API response structure:", result);
            return "Could not get a valid response from the AI.";
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return `An error occurred: ${error.message}`;
    }
};


// --- Helper Functions ---
const getChatRoomId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
};

// --- SVG Logo Component ---
const Logo = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#22d3ee', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#a855f7', stopOpacity: 1}} />
            </linearGradient>
        </defs>
        <circle cx="35" cy="50" r="30" fill="url(#logoGradient)" opacity="0.8"/>
        <circle cx="65" cy="50" r="30" fill="url(#logoGradient)" />
    </svg>
);


// --- Components ---

const LandingPage = ({ setView }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center overflow-hidden">
            <div className="max-w-2xl animate-fade-in-up">
                <Logo className="w-32 h-32 mx-auto mb-4" />
                <h1 className="text-5xl md:text-6xl font-bold text-cyan-400">Welcome to ConnectSphere</h1>
                <p className="text-lg md:text-xl text-gray-300 mt-4 animate-fade-in-up animation-delay-300">
                    The social platform where your interests bring you closer to new people. Share your thoughts, discover like-minded individuals, and spark meaningful conversations.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
                    <button 
                        onClick={() => setView('auth')}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold text-lg transition-transform transform hover:scale-105"
                    >
                        Get Started
                    </button>
                     <button 
                        onClick={() => setView('about-public')}
                        className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg transition-transform transform hover:scale-105"
                    >
                        Learn More
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
                .animation-delay-300 { animation-delay: 0.3s; }
                .animation-delay-600 { animation-delay: 0.6s; }
            `}</style>
        </div>
    );
};

const AboutPage = ({ setView }) => {
    return (
        <div className="p-4 md:p-8 text-white animate-fade-in-up">
            <div className="text-center mb-10">
                <Logo className="w-24 h-24 mx-auto" />
                <h1 className="text-4xl font-bold text-cyan-400 mt-4">About ConnectSphere</h1>
            </div>
            <div className="space-y-8 text-gray-300 max-w-3xl mx-auto">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold text-white mb-2">What is ConnectSphere?</h2>
                    <p>ConnectSphere is a modern social media platform designed to help you connect with people who share your passions and interests. Instead of endless scrolling, we focus on creating genuine connections. Share your thoughts on our public feed, discover new friends, and engage in private, one-on-one chats.</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold text-white mb-3">Core Features</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>Public Feed:</strong> Share your thoughts, ideas, and updates with the entire community.</li>
                        <li><strong>Interest-Based Discovery:</strong> Our platform intelligently suggests users you might like based on the interests you list in your profile.</li>
                        <li><strong>Real-Time Private Chat:</strong> Once you find someone interesting, start a private and secure real-time chat.</li>
                    </ul>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
                    <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2"><Sparkles className="text-purple-400" /> AI-Powered Features</h2>
                    <p className="mb-4">To make your experience even more engaging, we've integrated the Gemini AI to bring you unique features:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>AI Post Summarizer:</strong> Don't have time to read a long post? Click the "Summarize" button, and our AI will give you a one-sentence summary in seconds.</li>
                        <li><strong>AI Icebreakers:</strong> Stuck on how to start a conversation? In the chat window, click the "Icebreakers" button. Our AI will generate three fun conversation starters based on the shared interests between you and the other user.</li>
                    </ul>
                </div>

                {setView && (
                    <div className="text-center mt-10">
                        <button 
                            onClick={() => setView('landing')}
                            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold text-lg transition-transform transform hover:scale-105"
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
            `}</style>
        </div>
    );
};


const AuthPage = ({ setNotification }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [interests, setInterests] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setNotification('');

        if (isLogin) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                setNotification('Logged in successfully!');
            } catch (error) {
                console.error("Login Error:", error);
                setNotification(error.message);
            }
        } else {
            if (password.length < 6) {
                setNotification("Password must be at least 6 characters long.");
                setLoading(false);
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                const interestsArray = interests.split(',').map(interest => interest.trim()).filter(Boolean);

                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name,
                    age: Number(age),
                    interests: interestsArray,
                    email: user.email
                });
                setNotification('Signup successful! You are now logged in.');
            } catch (error) {
                console.error("Signup Error:", error);
                setNotification(error.message);
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
                <div className="text-center">
                    <Logo className="w-20 h-20 mx-auto mb-2" />
                    <h1 className="text-4xl font-bold text-cyan-400">ConnectSphere</h1>
                    <p className="text-gray-400 mt-2">{isLogin ? 'Welcome back!' : 'Join the community.'}</p>
                </div>
                <form onSubmit={handleAuthAction} className="space-y-4">
                    {!isLogin && (
                        <>
                            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            <input type="text" placeholder="Interests (e.g., coding, music)" value={interests} onChange={(e) => setInterests(e.target.value)} required className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </>
                    )}
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    <button type="submit" disabled={loading} className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-colors disabled:bg-gray-500">
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>
                <div className="text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-cyan-400 hover:underline">
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const FeedPage = ({ currentUser, setNotification }) => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(false);
    const [summaries, setSummaries] = useState({});
    const [loadingSummary, setLoadingSummary] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "posts"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedPosts.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
            setPosts(fetchedPosts);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setNotification("Could not fetch posts.");
        });
        return () => unsubscribe();
    }, []);

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.trim() || !currentUser) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "posts"), {
                content: newPost,
                authorName: currentUser.name,
                authorUid: currentUser.uid,
                timestamp: serverTimestamp()
            });
            setNewPost('');
        } catch (error) {
            console.error("Error creating post:", error);
            setNotification("Failed to create post.");
        }
        setLoading(false);
    };

    const handleSummarize = async (postId, content) => {
        setLoadingSummary(postId);
        const prompt = `Summarize the following post in a single, concise sentence: "${content}"`;
        const summary = await callGeminiAPI(prompt);
        setSummaries(prev => ({ ...prev, [postId]: summary }));
        setLoadingSummary(null);
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-3xl font-bold text-white">Feed</h1>
            <form onSubmit={handlePostSubmit} className="bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row gap-4">
                <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder={`What's on your mind, ${currentUser.name}?`}
                    className="flex-grow bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    rows="2"
                />
                <button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-500 self-end sm:self-center">
                    Post
                </button>
            </form>
            <div className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
                        <p className="text-gray-300 mb-2">{post.content}</p>
                        {summaries[post.id] && (
                            <div className="border-l-4 border-cyan-500 pl-3 my-3 text-sm italic text-cyan-200">
                                <span className="font-bold">✨ Summary:</span> {summaries[post.id]}
                            </div>
                        )}
                        <div className="text-sm text-gray-500 flex justify-between items-center">
                            <span>By: <span className="font-semibold text-cyan-400">{post.authorName}</span></span>
                            <div className="flex items-center gap-4">
                               <button 
                                    onClick={() => handleSummarize(post.id, post.content)} 
                                    disabled={loadingSummary === post.id}
                                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 disabled:cursor-wait"
                                >
                                    <Sparkles size={16} />
                                    {loadingSummary === post.id ? 'Summarizing...' : 'Summarize'}
                                </button>
                                <span>{post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Just now'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DiscoverPage = ({ currentUser, setPage, setChatTarget }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const matchedUsers = useMemo(() => {
        if (!currentUser || !currentUser.interests) return [];
        return users.filter(user => 
            user.uid !== currentUser.uid &&
            user.interests?.some(interest => currentUser.interests.includes(interest))
        );
    }, [users, currentUser]);

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => doc.data());
            setUsers(fetchedUsers);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleStartChat = (user) => {
        setChatTarget(user);
        setPage('chat');
    };

    if (loading) {
        return <div className="p-6 text-white text-center">Loading users...</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-3xl font-bold text-white">Discover Users</h1>
            <p className="text-gray-400">Users who share your interests: <span className="font-semibold text-cyan-300">{currentUser.interests?.join(', ')}</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchedUsers.length > 0 ? matchedUsers.map(user => (
                    <div key={user.uid} className="bg-gray-800 p-5 rounded-lg shadow-lg flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white">{user.name}, {user.age}</h3>
                            <p className="text-gray-400 mt-2">Interests:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {user.interests?.map(interest => (
                                    <span key={interest} className="bg-gray-700 text-cyan-300 text-xs font-semibold px-2.5 py-1 rounded-full">{interest}</span>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => handleStartChat(user)} className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <MessageSquare size={18} /> Chat
                        </button>
                    </div>
                )) : (
                    <p className="text-gray-400 col-span-full text-center py-8">No users with similar interests found yet.</p>
                )}
            </div>
        </div>
    );
};

const ChatPage = ({ currentUser, chatTarget, setPage }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [icebreakers, setIcebreakers] = useState([]);
    const [loadingIcebreakers, setLoadingIcebreakers] = useState(false);
    const messagesEndRef = useRef(null);

    const chatRoomId = getChatRoomId(currentUser.uid, chatTarget.uid);

    useEffect(() => {
        const messagesCollectionPath = `chats/${chatRoomId}/messages`;
        const q = query(collection(db, messagesCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => doc.data());
            fetchedMessages.sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));
            setMessages(fetchedMessages);
        }, (error) => {
            console.error("Error fetching messages:", error);
        });
        return () => unsubscribe();
    }, [chatRoomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setLoading(true);
        const messagesCollectionPath = `chats/${chatRoomId}/messages`;
        try {
            await addDoc(collection(db, messagesCollectionPath), {
                text: newMessage,
                senderId: currentUser.uid,
                timestamp: serverTimestamp()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
        setLoading(false);
    };

    const handleGetIcebreakers = async () => {
        setLoadingIcebreakers(true);
        const sharedInterests = currentUser.interests.filter(i => chatTarget.interests.includes(i));
        const prompt = `Generate three fun, engaging icebreaker questions for two people who have just connected online. One person's interests are [${currentUser.interests.join(', ')}] and the other person's interests are [${chatTarget.interests.join(', ')}]. Their shared interests are [${sharedInterests.join(', ')}]. The questions should be based on their combined interests. Format the response as a numbered list, with each question on a new line.`;
        const response = await callGeminiAPI(prompt);
        setIcebreakers(response.split('\n').filter(q => q.trim() !== ''));
        setLoadingIcebreakers(false);
    };

    return (
        <div className="h-full flex flex-col p-0">
            <header className="bg-gray-800 p-4 flex items-center justify-between gap-4 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setPage('discover')} className="text-white hover:bg-gray-700 p-2 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-white">Chat with {chatTarget.name}</h2>
                </div>
                 <button 
                    onClick={handleGetIcebreakers} 
                    disabled={loadingIcebreakers}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500"
                >
                    <Sparkles size={18} />
                    {loadingIcebreakers ? 'Generating...' : 'Icebreakers'}
                </button>
            </header>
            
            {icebreakers.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full relative">
                        <button onClick={() => setIcebreakers([])} className="absolute top-2 right-2 text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                        <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2"><Sparkles /> AI Icebreakers</h3>
                        <div className="space-y-3">
                            {icebreakers.map((icebreaker, index) => (
                                <div key={index} className="bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600" onClick={() => { setNewMessage(icebreaker.replace(/^\d+\.\s*/, '')); setIcebreakers([]); }}>
                                    <p className="text-white">{icebreaker}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.senderId === currentUser.uid ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="bg-gray-800 p-4 flex items-center gap-2 sticky bottom-0">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow bg-gray-700 text-white p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-full transition-colors disabled:bg-gray-500">
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

// --- Main App Component (Updated Logic) ---
const App = () => {
    const [user, setUser] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [page, setPage] = useState('feed'); // feed, discover, chat, about
    const [chatTarget, setChatTarget] = useState(null);
    const [notification, setNotification] = useState('');
    const [view, setView] = useState('landing'); // 'landing', 'auth', or 'about-public' for logged-out users

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser && !firebaseUser.isAnonymous) {
                setUser(firebaseUser);
                const userDocRef = doc(db, "users", firebaseUser.uid);
                onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        setCurrentUserData(doc.data());
                    } else {
                        setCurrentUserData(null);
                    }
                    setLoadingAuth(false);
                }, (error) => {
                    console.error("Error fetching user data:", error);
                    setLoadingAuth(false);
                });
            } else {
                setUser(null);
                setCurrentUserData(null);
                setLoadingAuth(false);
            }
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setPage('feed');
            setView('landing');
            setNotification('Logged out successfully.');
        } catch (error) {
            console.error("Logout Error:", error);
            setNotification('Failed to log out.');
        }
    };

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <p className="text-white text-xl">Loading ConnectSphere...</p>
            </div>
        );
    }

    if (!user || !currentUserData) {
        if (view === 'landing') {
            return <LandingPage setView={setView} />;
        }
        if (view === 'about-public') {
            return <AboutPage setView={setView} />;
        }
        return <AuthPage setNotification={setNotification} />;
    }

    const renderPage = () => {
        switch (page) {
            case 'feed':
                return <FeedPage currentUser={currentUserData} setNotification={setNotification} />;
            case 'discover':
                return <DiscoverPage currentUser={currentUserData} setPage={setPage} setChatTarget={setChatTarget} />;
            case 'chat':
                return <ChatPage currentUser={currentUserData} chatTarget={chatTarget} setPage={setPage} />;
            case 'about':
                return <AboutPage />;
            default:
                return <FeedPage currentUser={currentUserData} setNotification={setNotification} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            {notification && (
                <div className="fixed top-5 right-5 bg-cyan-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    {notification}
                </div>
            )}
            <div className="flex h-screen">
                <nav className="bg-gray-800 p-4 flex flex-col justify-between items-center w-20">
                    <div>
                        <div className="text-cyan-400 text-2xl font-bold mb-10">CS</div>
                        <ul className="space-y-6">
                            <li>
                                <button onClick={() => setPage('feed')} title="Feed" className={`p-3 rounded-lg transition-colors ${page === 'feed' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}>
                                    <Home size={24} />
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setPage('discover')} title="Discover" className={`p-3 rounded-lg transition-colors ${page === 'discover' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}>
                                    <Users size={24} />
                                </button>
                            </li>
                             <li>
                                <button onClick={() => setPage('about')} title="About" className={`p-3 rounded-lg transition-colors ${page === 'about' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}>
                                    <Info size={24} />
                                </button>
                            </li>
                        </ul>
                    </div>
                    <button onClick={handleLogout} title="Logout" className="p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <LogOut size={24} />
                    </button>
                </nav>
                <main className="flex-grow overflow-y-auto">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

export default App;
