import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile, Role, School } from "@/types";

interface SignupOptions {
  displayName: string;
  newSchool?: { name: string; nameAr: string };
  schoolId?: string;
  role?: Role;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  school: School | null;
  schoolId: string | null;
  role: Role | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, options: SignupOptions) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user profile + school document
  const fetchUserProfileAndSchool = useCallback(async (uid: string) => {
    try {
      console.log("📄 [Firestore] Fetching profile at: users/", uid);
      const profileRef = doc(db, "users", uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data() as UserProfile;
        console.log("📄 [Firestore] Profile loaded successfully:", data);
        setProfile(data);

        // Fetch school
        if (data.schoolId) {
          console.log("🏫 [Firestore] Fetching school at: schools/", data.schoolId);
          const schoolRef = doc(db, "schools", data.schoolId);
          const schoolSnap = await getDoc(schoolRef);

          if (schoolSnap.exists()) {
            const schoolData = { id: schoolSnap.id, ...schoolSnap.data() } as School;
            console.log("🏫 [Firestore] School loaded successfully:", schoolData);
            setSchool(schoolData);
          } else {
            console.warn("🏫 [Firestore] School doc missing for ID:", data.schoolId);
            setSchool(null);
          }
        }
      } else {
        console.warn("📄 [Firestore] User profile missing for UID:", uid);
        setProfile(null);
        setSchool(null);
      }
    } catch (err) {
      console.error("❌ [AuthContext] Error fetching profile/school:", err);
      setProfile(null);
      setSchool(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfileAndSchool(user.uid);
    }
  }, [user, fetchUserProfileAndSchool]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 [Auth] onAuthStateChanged:", firebaseUser ? firebaseUser.uid : "No user");
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchUserProfileAndSchool(firebaseUser.uid);
      } else {
        setProfile(null);
        setSchool(null);
      }

      setLoading(false);
    });

    return unsub;
  }, [fetchUserProfileAndSchool]);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      await fetchUserProfileAndSchool(cred.user.uid);
    }
  };

  const signup = async (
    email: string,
    password: string,
    options: SignupOptions
  ) => {
    const { displayName, newSchool, schoolId: existingSchoolId, role = "admin" } = options;

    // 1. Create Firebase Auth user
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;
    setUser(credential.user);

    await updateProfile(credential.user, { displayName });

    let finalSchoolId: string;

    // 2. Create School document if new school
    if (newSchool) {
      finalSchoolId = `${newSchool.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;

      await setDoc(doc(db, "schools", finalSchoolId), {
        name: newSchool.name,
        nameAr: newSchool.nameAr,
        plan: "free",
        ownerUid: uid,
        createdAt: serverTimestamp(),
      });
      console.log("🏫 [Signup] Created school document:", finalSchoolId);
    } else if (existingSchoolId) {
      finalSchoolId = existingSchoolId;
    } else {
      throw new Error("Either newSchool or schoolId must be provided");
    }

    // 3. Create User Profile document under /users/{uid}
    const profileData = {
      uid,
      email,
      displayName,
      schoolId: finalSchoolId,
      role: newSchool ? ("admin" as Role) : role,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", uid), profileData);
    console.log("📄 [Signup] Created user profile document for UID:", uid);

    // 4. Force immediate state synchronization
    await fetchUserProfileAndSchool(uid);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setSchool(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    school,
    schoolId: profile?.schoolId ?? null,
    role: profile?.role ?? null,
    loading,
    login,
    signup,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
