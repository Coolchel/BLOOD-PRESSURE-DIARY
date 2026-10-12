import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  Text,
  View,
} from "react-native";
import * as M from "../../design-lab/model";
import {
  readClarityPreferences,
  readClarityState,
  writeClarityDrafts,
  writeClarityPreferences,
} from "@/data/clarity-state";
import { tr } from "@/localization";
import { useLanguage } from "@/localization/provider";
import { Palette } from "@/constants/design";
import { waitForBackupOperations } from "@/data/auto-backup";

type DiaryContext = {
  language: ReturnType<typeof useLanguage>["language"];
  state: M.State;
  preferences: M.Preferences;
  change: (operation: () => Promise<unknown>) => Promise<void>;
  draft: (value: M.Draft | null, mode: "single" | "series") => Promise<void>;
  flush: () => Promise<void>;
  configure: (value: M.Preferences) => Promise<void>;
  historySelection: M.Selection | null;
  historyFor: (value: M.Selection | null) => void;
  now: number;
  viewEpoch: number;
  resetView: () => void;
};
const Context = createContext<DiaryContext | null>(null);

async function loadDiary(db: SQLiteDatabase) {
  const state = await readClarityState(db);
  const preferences = await readClarityPreferences(db, state.phases);
  return { state, preferences };
}

export function DiaryProvider({ children }: PropsWithChildren) {
  // Mounted tabs also consume this context, so language changes refresh every
  // screen without remounting its navigation, scroll position or draft.
  const { language } = useLanguage();
  const db = useSQLiteContext();
  const [state, setState] = useState<M.State | null>(null);
  const [preferences, setPreferences] = useState(M.statisticsPreferences(null));
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(Date.now());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  const [historySelection, historyFor] = useState<M.Selection | null>(null);
  const [viewEpoch, setViewEpoch] = useState(0);
  const resetView = () => {
    historyFor(null);
    setViewEpoch((value) => value + 1);
  };
  const current = useRef<M.State | null>(null);
  const queue = useRef(Promise.resolve());
  const latest = useRef(Promise.resolve());
  const flush = useCallback(() => latest.current, []);
  const reload = useCallback(async () => {
    const { state: next, preferences: nextPreferences } = await loadDiary(db);
    current.current = next;
    setState(next);
    setPreferences(nextPreferences);
  }, [db]);
  useEffect(() => {
    let active = true;
    loadDiary(db).then(
      ({ state: next, preferences: nextPreferences }) => {
        if (!active) return;
        current.current = next;
        setState(next);
        setPreferences(nextPreferences);
        setError(false);
      },
      () => { if (active) setError(true); },
    );
    return () => {
      active = false;
    };
  }, [db, attempt]);
  function enqueue(operation: () => Promise<void>) {
    const pending = queue.current.then(operation);
    latest.current = pending;
    queue.current = pending.catch(() => {});
    return pending;
  }
  async function change(operation: () => Promise<unknown>) {
    return enqueue(async () => {
      await waitForBackupOperations();
      await operation();
      try {
        await reload();
      } catch {
        setError(true);
      }
    });
  }
  async function draft(value: M.Draft | null, mode: "single" | "series") {
    return enqueue(async () => {
      const previous = current.current;
      if (!previous) throw new Error("Проверьте запись.");
      const next = value
        ? M.storeDraft(previous, value)
        : M.clearDraft(previous, mode);
      await writeClarityDrafts(db, next);
      current.current = next;
      setState(next);
    });
  }
  async function configure(value: M.Preferences) {
    return enqueue(async () => {
      await writeClarityPreferences(db, value);
      setPreferences(value);
    });
  }
  if (!state || error)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Palette.background,
        }}
      >
        {error ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => { setError(false); setAttempt((x) => x + 1); }}
          >
            <Text
              style={{
                fontFamily: "Manrope",
                color: Palette.text,
                marginBottom: 14,
              }}
            >
              {tr("Не удалось загрузить записи. Повторить")}
            </Text>
          </Pressable>
        ) : (
          <ActivityIndicator color={Palette.coral} />
        )}
      </View>
    );
  return (
    <Context.Provider
      value={{
        language,
        state,
        preferences,
        change,
        draft,
        flush,
        configure,
        historySelection,
        historyFor,
        now,
        viewEpoch,
        resetView,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useDiary() {
  const context = useContext(Context);
  if (!context) throw new Error("DiaryProvider is required");
  return context;
}
