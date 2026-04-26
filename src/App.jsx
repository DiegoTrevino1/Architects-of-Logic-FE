import "./App.css";
import { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import LibraryCacheGame from "./LibraryCacheGame";
import SpellCounter from "./SpellCounter";
import { apiFetch, hasToken, clearToken } from "./api";

const GAMES = [
  {
    id: "cache",
    icon: "🗄️",
    title: "Library Cache Mapping Puzzle",
    color: "#63b3ed",
    colorDim: "rgba(99,179,237,0.12)",
    colorBorder: "rgba(99,179,237,0.35)",
    tag: "Cache Mapping",
    desc: "You control an intelligent library system. Decode 6-bit binary addresses into tag, index, and offset fields — then place books into the correct cache slots using Direct, Set-Associative, or Fully Associative mapping.",
    badges: ["Direct Mapping", "Set-Associative", "Fully Associative"],
    component: "CacheMappingGame",
  },
  {
    id: "number",
    icon: "⚡",
    title: "Spell Counter",
    color: "#f6ad55",
    colorDim: "rgba(246,173,85,0.12)",
    colorBorder: "rgba(246,173,85,0.35)",
    tag: "Number Systems",
    desc: "A turn-based combat game where enemies cast spells as binary, hex, or decimal numbers. Compute the correct counter-operation to deal damage — every wrong bit costs you HP.",
    badges: ["Binary", "Hexadecimal", "Bitwise Ops"],
    component: "NumberSystemsGame",
  },
];

const PROGRESS_LABELS = {
  cache: "Library Cache Puzzle",
  spell: "Spell Counter",
};

function HomePage({ onGameClick, onOpenAuth, isLoggedIn, user, onLogout, leaderboard, progress }) {
  const totalXp = progress?.totalXp ?? 0;
  const maxGameXp = Math.max(
    progress?.perGame?.cache?.bestScore ?? 0,
    progress?.perGame?.spell?.bestScore ?? 0,
    1
  );

  return (
    <div className="shell">
      <nav>
        <div className="logo">
          <div className="logo-icon">Σ</div>
          <div>
            <div className="logo-text">Architects of Logic</div>
            <div className="logo-sub">CWU · Computer Architecture</div>
          </div>
        </div>

        <div className="nav-links">
          <a href="#games">Games</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#progress">Progress</a>
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <>
              {user?.username && (
                <span style={{ color: "var(--text2)", fontSize: "13px", marginRight: "8px" }}>
                  @{user.username}
                </span>
              )}
              <button className="btn-outline" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={onOpenAuth}>Log in</button>
              <button className="btn-primary" onClick={onOpenAuth}>Get started</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-left fade-in">
          <div className="hero-eyebrow">CWU · Spring 2026</div>
          <h1>
            Learn
            <br />
            Computer
            <br />
            Architecture.
          </h1>
          <p className="hero-desc">
            Two interactive games covering cache mapping and number systems —
            with pre/post assessments, bit-level scoring, and real-time feedback.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">2</div>
              <div className="stat-label">Games</div>
            </div>
            <div className="stat">
              <div className="stat-num">3</div>
              <div className="stat-label">Modes each</div>
            </div>
            <div className="stat">
              <div className="stat-num">∞</div>
              <div className="stat-label">Practice</div>
            </div>
          </div>
        </div>

        <div className="hero-visual fade-in">
          <div className="term-bar">
            <div className="term-dot" style={{ background: "#fc8181" }} />
            <div className="term-dot" style={{ background: "#f6ad55" }} />
            <div className="term-dot" style={{ background: "#68d391" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text3)", marginLeft: "8px" }}>
              spell_counter.py
            </span>
          </div>
          <div className="term-body">
            <div className="term-line">
              <span className="term-prompt">▶ </span>
              <span className="term-cmd">enemy.cast_spell()</span>
            </div>
            <div className="term-line term-out">
              Spell: <span className="term-highlight">0x1A</span> → binary: <span className="term-green">00011010</span>
            </div>
            <div className="term-line term-out">
              Operation: <span className="term-purple">bitwise NOT</span>
            </div>
            <div className="term-line" style={{ marginTop: "8px" }}>
              <span className="term-prompt">▶ </span>
              <span className="term-cmd">player.counter("E5")</span>
            </div>
            <div className="term-line term-out">
              Your answer: <span className="term-highlight">11100101</span>
            </div>
            <div className="term-line term-out">
              Correct bits: <span className="term-green">8/8</span> → <span className="term-highlight">40 dmg</span>
            </div>
            <div className="term-line" style={{ marginTop: "8px", color: "var(--green)" }}>
              ✓ Perfect counter! +150 XP ⚡
            </div>
            <div className="term-line" style={{ marginTop: "8px" }}>
              <span className="term-prompt">▶ </span>
              <span className="term-cursor" />
            </div>
          </div>
        </div>
      </div>

      {/* GAMES SECTION */}
      <div className="section-head" id="games">
        <span className="section-title">// Games</span>
        <div className="section-line" />
        <span className="section-tag">2 Games · pre &amp; post assessments</span>
      </div>

      <div className="games-showcase">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className="game-showcase-card fade-in"
            style={{ "--card-accent": game.color, "--card-dim": game.colorDim }}
            onClick={() => onGameClick(game.id)}
          >
            <div className="gsc-left">
              <div className="gsc-icon-wrap" style={{ background: game.colorDim }}>
                <span className="gsc-icon">{game.icon}</span>
              </div>
              <div className="gsc-body">
                <div className="gsc-tag" style={{ color: game.color }}>{game.tag}</div>
                <div className="gsc-title">{game.title}</div>
                <p className="gsc-desc">{game.desc}</p>
                <div className="gsc-badges">
                  {game.badges.map((b) => (
                    <span
                      key={b}
                      className="gsc-badge"
                      style={{ background: game.colorDim, color: game.color, borderColor: game.colorBorder }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="gsc-play-btn" style={{ color: game.color }}>Play →</div>
          </div>
        ))}
      </div>

      {/* BOTTOM: progress + leaderboard */}
      <div className="bottom-grid">
        <div className="bottom-section">
          <div className="section-head">
            <span className="section-title">// Progress</span>
            <div className="section-line" />
          </div>
          <div className="panel" id="progress">
            <div className="panel-title">
              YOUR PROGRESS{isLoggedIn ? ` · ${totalXp} XP TOTAL` : ""}
            </div>
            {!isLoggedIn && (
              <div style={{ color: "var(--text3)", fontSize: "13px", marginBottom: "12px" }}>
                Log in to track XP and accuracy across games.
              </div>
            )}
            {["cache", "spell"].map((gid) => {
              const g = progress?.perGame?.[gid];
              const xp = g?.bestScore ?? 0;
              const pct = `${Math.round((xp / maxGameXp) * 100)}%`;
              return (
                <div key={gid}>
                  <div className="xp-row">
                    <span className="xp-label">{PROGRESS_LABELS[gid]}</span>
                    <span className="xp-val">{xp} XP</span>
                  </div>
                  <div className="xp-track">
                    <div className="xp-fill" style={{ width: pct }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: "16px" }}>
              {[
                { dot: "var(--accent)", name: "Pre-test · Cache Mapping", status: "AVAILABLE", bg: "rgba(99,179,237,0.12)", col: "var(--accent)" },
                { dot: "var(--accent3)", name: "Pre-test · Number Systems", status: "AVAILABLE", bg: "rgba(246,173,85,0.12)", col: "var(--accent3)" },
              ].map((a) => (
                <div key={a.name} className="assess-item">
                  <div className="assess-left">
                    <div className="assess-dot" style={{ background: a.dot }} />
                    <div className="assess-name" style={{ fontSize: "12px" }}>{a.name}</div>
                  </div>
                  <div className="assess-status" style={{ background: a.bg, color: a.col }}>{a.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="vertical-divider" />

        <div className="bottom-section">
          <div className="section-head">
            <span className="section-title">// Leaderboard</span>
            <div className="section-line" />
          </div>
          <div className="panel" id="leaderboard">
            <div className="panel-title">CLASS LEADERBOARD</div>
            {leaderboard.length === 0 && (
              <div style={{ color: "var(--text3)", fontSize: "13px" }}>
                No scores yet — be the first!
              </div>
            )}
            {leaderboard.map((r) => {
              const top = leaderboard[0]?.totalXp || 1;
              const widthPct = `${Math.max(8, Math.round((r.totalXp / top) * 100))}%`;
              const rankStr = String(r.rank).padStart(2, "0");
              const initials = r.username.slice(0, 2).toUpperCase();
              return (
                <div key={r.rank} className="lb-row">
                  <div className="lb-rank">{rankStr}</div>
                  <div className="lb-avatar" style={{ background: "linear-gradient(135deg,#63b3ed,#b794f4)" }}>{initials}</div>
                  <div className="lb-name">{r.username}</div>
                  <div className="lb-bar">
                    <div className="lb-bar-fill" style={{ width: widthPct }} />
                  </div>
                  <div className="lb-score">{r.totalXp.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-left">ARCHQUEST · CWU 2026-E1-E2 · Dr. Chunming Gao</div>
        <div className="footer-right">Central Washington CS Dept.</div>
      </footer>
    </div>
  );
}

function App() {
  const [view, setView] = useState("home");
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [progress, setProgress] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Hydrate session from token on mount
  useEffect(() => {
    if (!hasToken()) return;
    apiFetch("/auth/me")
      .then((u) => { setUser(u); setIsLoggedIn(true); })
      .catch(() => { clearToken(); });
  }, []);

  // Fetch leaderboard whenever home is shown or after a game/login
  useEffect(() => {
    if (view !== "home") return;
    apiFetch("/leaderboard?limit=5")
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]));
  }, [view, refreshTick]);

  // Fetch personal progress when logged in and on home
  useEffect(() => {
    if (view !== "home" || !isLoggedIn) return;
    apiFetch("/progress/me")
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [view, isLoggedIn, refreshTick]);

  const goHome = () => { setView("home"); setSelectedGameId(null); setRefreshTick((t) => t + 1); };
  const goGame = (id) => { setSelectedGameId(id); setView("game"); };
  const goAuth = () => setView("auth");
  const handleLoginSuccess = (u) => { setUser(u); setIsLoggedIn(true); setView("home"); setRefreshTick((t) => t + 1); };
  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setUser(null);
    setProgress(null);
    setView("home");
    setSelectedGameId(null);
  };

  if (view === "auth") {
    return <LoginPage onBack={goHome} onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === "game") {
    if (selectedGameId === "cache") {
      return <LibraryCacheGame onBack={goHome} onHome={goHome} />;
    }
    if (selectedGameId === "number") {
      return <SpellCounter onBack={goHome} onHome={goHome} />;
    }
  }

  return (
    <HomePage
      onGameClick={goGame}
      onOpenAuth={goAuth}
      isLoggedIn={isLoggedIn}
      user={user}
      onLogout={handleLogout}
      leaderboard={leaderboard}
      progress={progress}
    />
  );
}

export default App;
