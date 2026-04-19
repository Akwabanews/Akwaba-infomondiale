import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  child, 
  push, 
  update, 
  remove, 
  onValue, 
  off,
  query as dbQuery, 
  orderByChild, 
  limitToLast,
  equalTo,
  increment as dbIncrement,
  onChildAdded,
  DataSnapshot
} from 'firebase/database';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  User, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Article, Event, SiteSettings, Comment, Subscriber, MediaAsset, Poll, AppNotification, SupportMessage } from '../types';

const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const isPlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed-');

// --- Realtime Database Services ---

export const DatabaseService = {
  // Articles
  async getArticles(): Promise<Article[]> {
    if (isPlaceholder) {
      const saved = localStorage.getItem('akwaba_articles');
      return saved ? JSON.parse(saved) : [];
    }
    const dbRef = ref(rtdb);
    try {
      const snapshot = await get(child(dbRef, 'articles'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const articles = Object.values(data) as Article[];
        return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [];
    } catch (e) {
      return handleDatabaseError(e, 'list', 'articles');
    }
  },

  async saveArticle(article: Article): Promise<void> {
    if (isPlaceholder) {
      const articles = JSON.parse(localStorage.getItem('akwaba_articles') || '[]');
      const index = articles.findIndex((a: any) => a.id === article.id);
      if (index >= 0) articles[index] = article;
      else articles.unshift(article);
      localStorage.setItem('akwaba_articles', JSON.stringify(articles));
      return;
    }
    try {
      await set(ref(rtdb, `articles/${article.id}`), article);
    } catch (e) {
      handleDatabaseError(e, 'create', `articles/${article.id}`);
    }
  },

  async deleteArticle(id: string): Promise<void> {
    if (isPlaceholder) {
      const articles = JSON.parse(localStorage.getItem('akwaba_articles') || '[]');
      localStorage.setItem('akwaba_articles', JSON.stringify(articles.filter((a: any) => a.id !== id)));
      return;
    }
    await remove(ref(rtdb, `articles/${id}`));
  },

  // Events
  async getEvents(): Promise<Event[]> {
    if (isPlaceholder) {
      const saved = localStorage.getItem('akwaba_events');
      return saved ? JSON.parse(saved) : [];
    }
    try {
      const snapshot = await get(ref(rtdb, 'events'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const events = Object.values(data) as Event[];
        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async saveEvent(event: Event): Promise<void> {
    if (isPlaceholder) {
      const events = JSON.parse(localStorage.getItem('akwaba_events') || '[]');
      const index = events.findIndex((e: any) => e.id === event.id);
      if (index >= 0) events[index] = event;
      else events.unshift(event);
      localStorage.setItem('akwaba_events', JSON.stringify(events));
      return;
    }
    try {
      await set(ref(rtdb, `events/${event.id}`), event);
    } catch (e) {
      handleDatabaseError(e, 'create', `events/${event.id}`);
    }
  },

  async deleteEvent(id: string): Promise<void> {
    if (isPlaceholder) return;
    await remove(ref(rtdb, `events/${id}`));
  },

  // Settings
  async getSettings(): Promise<SiteSettings | null> {
    if (isPlaceholder) {
      const saved = localStorage.getItem('akwaba_site_settings');
      return saved ? JSON.parse(saved) : null;
    }
    const snapshot = await get(ref(rtdb, 'settings/global'));
    return snapshot.exists() ? snapshot.val() as SiteSettings : null;
  },

  async saveSettings(settings: SiteSettings): Promise<void> {
    if (isPlaceholder) {
      localStorage.setItem('akwaba_site_settings', JSON.stringify(settings));
      return;
    }
    try {
      await set(ref(rtdb, 'settings/global'), settings);
    } catch (e) {
      handleDatabaseError(e, 'write', 'settings/global');
    }
  },

  // Comments management
  async getAllComments(): Promise<Comment[]> {
    if (isPlaceholder) return [];
    try {
      const snapshot = await get(ref(rtdb, 'comments'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const comments = Object.values(data) as Comment[];
        return comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async saveComment(comment: Comment): Promise<void> {
    if (isPlaceholder) return;
    await set(ref(rtdb, `comments/${comment.id}`), comment);
  },

  async deleteComment(id: string): Promise<void> {
    if (isPlaceholder) return;
    await remove(ref(rtdb, `comments/${id}`));
  },

  async blockUser(userId: string): Promise<void> {
    if (isPlaceholder) return;
    await set(ref(rtdb, `blocked_users/${userId}`), {
      blockedAt: new Date().toISOString()
    });
  },

  async isUserBlocked(userId: string): Promise<boolean> {
    if (isPlaceholder) return false;
    const snapshot = await get(ref(rtdb, `blocked_users/${userId}`));
    return snapshot.exists();
  },

  async reportComment(commentId: string, userId: string): Promise<void> {
    if (isPlaceholder) return;
    const updates: any = {};
    updates[`comments/${commentId}/isReported`] = true;
    // Realtime Database doesn't have native arrayUnion, so we manage it
    const snapshot = await get(ref(rtdb, `comments/${commentId}/reportedBy`));
    const current = snapshot.val() || [];
    if (!current.includes(userId)) {
      updates[`comments/${commentId}/reportedBy`] = [...current, userId];
    }
    await update(ref(rtdb), updates);
  },

  async likeComment(commentId: string, userId: string, isLiked: boolean): Promise<void> {
    if (isPlaceholder) return;
    const refPath = `comments/${commentId}`;
    const snapshot = await get(ref(rtdb, `${refPath}/likedBy`));
    const currentLikes = snapshot.val() || [];
    let updatedLikes = [...currentLikes];

    if (isLiked && !currentLikes.includes(userId)) {
      updatedLikes.push(userId);
    } else if (!isLiked) {
      updatedLikes = currentLikes.filter((id: string) => id !== userId);
    }

    const updates: any = {};
    updates[`${refPath}/likes`] = updatedLikes.length;
    updates[`${refPath}/likedBy`] = updatedLikes;
    await update(ref(rtdb), updates);
  },

  // Article Likes
  async likeArticle(articleId: string, userId: string, isLiked: boolean): Promise<void> {
    if (isPlaceholder) return;
    
    // Increment article likes
    const articleRef = ref(rtdb, `articles/${articleId}/likes`);
    await set(articleRef, dbIncrement(isLiked ? 1 : -1));

    // Update user profile liked articles
    const userLikesRef = ref(rtdb, `users/${userId}/likedArticles`);
    const snapshot = await get(userLikesRef);
    let likedArticles = snapshot.val() || [];
    if (isLiked) {
      if (!likedArticles.includes(articleId)) likedArticles.push(articleId);
    } else {
      likedArticles = likedArticles.filter((id: string) => id !== articleId);
    }
    await set(userLikesRef, likedArticles);
  },

  async bookmarkArticle(articleId: string, userId: string, isBookmarked: boolean): Promise<void> {
    if (isPlaceholder) return;
    const userRef = ref(rtdb, `users/${userId}/bookmarkedArticles`);
    const snapshot = await get(userRef);
    let bookmarked = snapshot.val() || [];
    if (isBookmarked) {
      if (!bookmarked.includes(articleId)) bookmarked.push(articleId);
    } else {
      bookmarked = bookmarked.filter((id: string) => id !== articleId);
    }
    await set(userRef, bookmarked);
  },

  async followAuthor(authorName: string, userId: string, isFollowing: boolean): Promise<void> {
    if (isPlaceholder) return;
    const userRef = ref(rtdb, `users/${userId}/followedAuthors`);
    const snapshot = await get(userRef);
    let followed = snapshot.val() || [];
    if (isFollowing) {
      if (!followed.includes(authorName)) followed.push(authorName);
    } else {
      followed = followed.filter((name: string) => name !== authorName);
    }
    await set(userRef, followed);
  },

  async followCategory(category: string, userId: string, isFollowing: boolean): Promise<void> {
    if (isPlaceholder) return;
    const userRef = ref(rtdb, `users/${userId}/followedCategories`);
    const snapshot = await get(userRef);
    let followed = snapshot.val() || [];
    if (isFollowing) {
      if (!followed.includes(category)) followed.push(category);
    } else {
      followed = followed.filter((cat: string) => cat !== category);
    }
    await set(userRef, followed);
  },

  // User Profile
  async getUserProfile(userId: string): Promise<any> {
    if (isPlaceholder) return null;
    try {
      const snapshot = await get(ref(rtdb, `users/${userId}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (e) {
      return handleDatabaseError(e, 'get', `users/${userId}`);
    }
  },

  async updateUserProfile(userId: string, data: any): Promise<void> {
    if (isPlaceholder) return;
    try {
      await update(ref(rtdb, `users/${userId}`), data);
    } catch (e) {
      handleDatabaseError(e, 'update', `users/${userId}`);
    }
  },

  // Classifieds (Petites Annonces)
  async getClassifieds(): Promise<any[]> {
    if (isPlaceholder) return [];
    try {
      const snapshot = await get(ref(rtdb, 'classifieds'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async saveClassified(classified: any): Promise<void> {
    if (isPlaceholder) return;
    await set(ref(rtdb, `classifieds/${classified.id}`), classified);
  },

  async deleteClassified(id: string): Promise<void> {
    if (isPlaceholder) return;
    await remove(ref(rtdb, `classifieds/${id}`));
  },

  // Live Blogs
  async getLiveBlogs(): Promise<any[]> {
    if (isPlaceholder) return [];
    try {
      const snapshot = await get(ref(rtdb, 'live_blogs'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async saveLiveUpdate(blogId: string, updateData: any): Promise<void> {
    if (isPlaceholder) return;
    const updatesRef = ref(rtdb, `live_blogs/${blogId}/updates`);
    const snapshot = await get(updatesRef);
    const current = snapshot.val() || [];
    await set(updatesRef, [...current, updateData]);
  },

  // Polls
  async getActivePoll(): Promise<Poll | null> {
    if (isPlaceholder) return null;
    try {
      const snapshot = await get(ref(rtdb, 'polls'));
      if (snapshot.exists()) {
        const polls = Object.values(snapshot.val()) as Poll[];
        return polls.find(p => p.active) || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async submitVote(pollId: string, optionId: string, userId: string): Promise<void> {
    if (isPlaceholder) return;
    const pollRef = ref(rtdb, `polls/${pollId}`);
    const snapshot = await get(pollRef);
    if (!snapshot.exists()) return;

    const poll = snapshot.val() as Poll;
    const newOptions = poll.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    await update(pollRef, { options: newOptions });
    
    // Mark user as voted
    const userVotedRef = ref(rtdb, `users/${userId}/votedPolls`);
    const userVsnap = await get(userVotedRef);
    const voted = userVsnap.val() || [];
    if (!voted.includes(pollId)) {
      await set(userVotedRef, [...voted, pollId]);
    }
  },

  // Newsletter
  async subscribe(email: string): Promise<void> {
    if (isPlaceholder) return;
    const id = Date.now().toString();
    const sub: Subscriber = { id, email, date: new Date().toISOString() };
    await set(ref(rtdb, `subscribers/${id}`), sub);
  },

  async getSubscribers(): Promise<Subscriber[]> {
    if (isPlaceholder) return [];
    try {
      const snapshot = await get(ref(rtdb, 'subscribers'));
      if (snapshot.exists()) {
        return Object.values(snapshot.val()).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) as Subscriber[];
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async deleteSubscriber(id: string): Promise<void> {
    if (isPlaceholder) return;
    await remove(ref(rtdb, `subscribers/${id}`));
  },

  // Media Library
  async trackMedia(url: string, type: 'image' | 'video'): Promise<void> {
    if (isPlaceholder) return;
    const id = btoa(url).substring(0, 20).replace(/[/+=]/g, '');
    const asset: MediaAsset = { id, url, type, date: new Date().toISOString() };
    await set(ref(rtdb, `media/${id}`), asset);
  },

  async getMediaLibrary(): Promise<MediaAsset[]> {
    if (isPlaceholder) return [];
    try {
      const snapshot = await get(ref(rtdb, 'media'));
      if (snapshot.exists()) {
        return Object.values(snapshot.val()).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) as MediaAsset[];
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async deleteMediaAsset(id: string): Promise<void> {
    if (isPlaceholder) return;
    await remove(ref(rtdb, `media/${id}`));
  },

  // View Counter
  async incrementView(collectionName: 'articles' | 'events', id: string): Promise<void> {
    if (isPlaceholder) return;
    const viewRef = ref(rtdb, `${collectionName}/${id}/views`);
    await set(viewRef, dbIncrement(1));
  },

  // Notifications
  async getNotifications(userId: string): Promise<AppNotification[]> {
    if (isPlaceholder) return [];
    try {
      const snapshot = await get(ref(rtdb, 'notifications'));
      if (snapshot.exists()) {
        const notifs = Object.values(snapshot.val()) as AppNotification[];
        return notifs
          .filter(n => n.userId === userId || n.userId === 'global')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [];
    } catch (e) {
      return handleDatabaseError(e, 'list', 'notifications');
    }
  },

  async markNotificationAsRead(id: string): Promise<void> {
    if (isPlaceholder) return;
    await update(ref(rtdb, `notifications/${id}`), { read: true });
  },

  async sendNotification(notif: AppNotification): Promise<void> {
    if (isPlaceholder) return;
    await set(ref(rtdb, `notifications/${notif.id}`), notif);
  },

  subscribeToNotifications(userId: string, callback: (notifs: AppNotification[]) => void) {
    if (isPlaceholder) return () => {};
    const notifRef = ref(rtdb, 'notifications');
    const listener = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notifs = (Object.values(data) as AppNotification[])
          .filter(n => n.userId === userId || n.userId === 'global')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(notifs);
      } else {
        callback([]);
      }
    });
    return () => off(notifRef, 'value', listener);
  },

  async awardPoints(userId: string, points: number, badge?: string): Promise<void> {
    if (isPlaceholder) return;
    const userRef = ref(rtdb, `users/${userId}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return;

    const updates: any = {};
    updates[`users/${userId}/points`] = (snapshot.val().points || 0) + points;
    if (badge) {
      const currentBadges = snapshot.val().badges || [];
      if (!currentBadges.includes(badge)) {
        updates[`users/${userId}/badges`] = [...currentBadges, badge];
      }
    }
    await update(ref(rtdb), updates);
  },

  async incrementArticleViews(articleId: string): Promise<void> {
    if (isPlaceholder) return;
    await set(ref(rtdb, `articles/${articleId}/views`), dbIncrement(1));
  },

  async sendChatMessage(message: any): Promise<void> {
    if (isPlaceholder) return;
    await set(ref(rtdb, `article_chats/${message.articleId}/${message.id}`), message);
  },

  subscribeToChat(articleId: string, callback: (messages: any[]) => void) {
    if (isPlaceholder) return () => {};
    const chatRef = ref(rtdb, `article_chats/${articleId}`);
    const listener = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const messages = Object.values(snapshot.val()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        callback(messages);
      } else {
        callback([]);
      }
    });
    return () => off(chatRef, 'value', listener);
  },

  // Support Chat
  async sendSupportMessage(message: SupportMessage): Promise<void> {
    if (isPlaceholder) return;
    await set(ref(rtdb, `support_chats/${message.userId}/messages/${message.id}`), message);
  },

  subscribeToSupportMessages(userId: string, callback: (messages: SupportMessage[]) => void) {
    if (isPlaceholder) return () => {};
    const supportRef = ref(rtdb, `support_chats/${userId}/messages`);
    const listener = onValue(supportRef, (snapshot) => {
      if (snapshot.exists()) {
        const messages = Object.values(snapshot.val()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) as SupportMessage[];
        callback(messages);
      } else {
        callback([]);
      }
    });
    return () => off(supportRef, 'value', listener);
  },

  async getAllSupportChats(): Promise<string[]> {
    if (isPlaceholder) return [];
    const snapshot = await get(ref(rtdb, 'support_chats'));
    if (snapshot.exists()) {
      return Object.keys(snapshot.val());
    }
    return [];
  },

  // Admin Polls
  async getPolls(): Promise<Poll[]> {
    if (isPlaceholder) return [];
    const snapshot = await get(ref(rtdb, 'polls'));
    if (snapshot.exists()) {
        return Object.values(snapshot.val()).sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) as Poll[];
    }
    return [];
  },

  async savePoll(poll: Poll): Promise<void> {
    if (isPlaceholder) return;
    await set(ref(rtdb, `polls/${poll.id}`), poll);
  },

  async deletePoll(pollId: string): Promise<void> {
    if (isPlaceholder) return;
    await remove(ref(rtdb, `polls/${pollId}`));
  },

  async voteInPoll(pollId: string, optionId: string): Promise<void> {
    if (isPlaceholder) return;
    const pollRef = ref(rtdb, `polls/${pollId}/options`);
    const snapshot = await get(pollRef);
    if (!snapshot.exists()) return;

    const options = snapshot.val() as any[];
    const updatedOptions = options.map(opt => 
      opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
    );
    await set(pollRef, updatedOptions);
  },

  subscribeToAllSupportMessages(callback: (userId: string, messages: SupportMessage[]) => void) {
    if (isPlaceholder) return () => {};
    const supportRef = ref(rtdb, 'support_chats');
    const listener = onValue(supportRef, (snapshot) => {
      if (snapshot.exists()) {
        const chats = snapshot.val();
        Object.entries(chats).forEach(([userId, data]: [string, any]) => {
          if (data.messages) {
            const messages = Object.values(data.messages).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) as SupportMessage[];
            callback(userId, messages);
          }
        });
      }
    });
    return () => off(supportRef, 'value', listener);
  },

  async getAdminStats(): Promise<any> {
    if (isPlaceholder) return null;
    try {
      const [artSnap, subSnap, commSnap] = await Promise.all([
        get(ref(rtdb, 'articles')),
        get(ref(rtdb, 'subscribers')),
        get(ref(rtdb, 'comments'))
      ]);
      
      const articles = artSnap.val() ? Object.values(artSnap.val()) : [];
      const subs = subSnap.val() ? Object.values(subSnap.val()) : [];
      const comments = commSnap.val() ? Object.values(commSnap.val()) : [];

      const totalViews = articles.reduce((sum: number, art: any) => sum + (art.views || 0), 0);
      const categoryStats: Record<string, number> = {};
      articles.forEach((art: any) => {
        const cat = art.category;
        categoryStats[cat] = (categoryStats[cat] || 0) + 1;
      });

      return {
        totalArticles: articles.length,
        totalSubscribers: subs.length,
        totalComments: comments.length,
        totalViews,
        categoryStats
      };
    } catch (e) {
       return null;
    }
  }
};

// Aliases for compatibility
export const FirestoreService = DatabaseService;

// --- Auth Utilities ---
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Email:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    return result.user;
  } catch (error) {
    console.error("Error registering with Email:", error);
    throw error;
  }
};

export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(auth, containerId, {
    'size': 'invisible',
    'callback': () => {}
  });
};

export const handleUserLogout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error envoyant l'email de réinitialisation:", error);
    throw error;
  }
};

export const sendPhoneOtp = async (phoneNumber: string, appVerifier: any) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return confirmationResult as ConfirmationResult;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

// --- Error Handlers ---

export interface DatabaseErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleDatabaseError(error: any, operationType: DatabaseErrorInfo['operationType'], path: string | null = null): never {
  if (error.code === 'PERMISSION_DENIED' || (error.message && error.message.includes('permission_denied'))) {
    const user = auth.currentUser;
    const errorInfo: DatabaseErrorInfo = {
      error: error.message || 'Missing or insufficient permissions',
      operationType,
      path,
      authInfo: {
        userId: user?.uid || 'anonymous',
        email: user?.email || 'N/A',
        emailVerified: user?.emailVerified || false,
        isAnonymous: !user,
        providerInfo: user?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || 'N/A',
          email: p.email || 'N/A'
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
}

// Keep the old handler name for compatibility if needed
export const handleFirestoreError = handleDatabaseError;
