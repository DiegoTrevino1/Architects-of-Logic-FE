import "./App.css";
import { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import LibraryCacheGame from "./LibraryCacheGame";
import SpellCounter from "./SpellCounter";
import {
  apiFetch,
  hasToken,
  clearToken,
  getStatsOverview,
  getRecentActivity,
} from "./api";

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
  },
];

const PROGRESS_LABELS = {
  cache: "Library Cache Puzzle",
  spell: "Spell Counter",
};

const GAME_META = {
  cache: { label: "Cache Puzzle", icon: "🗄️", color: "var(--accent)" },
  spell: { label: "Spell Counter", icon: "⚡", color: "var(--accent3)" },
};

const AVATAR_PALETTE = [
  ["#63b3ed", "#b794f4"],
  ["#f6ad55", "#fc8181"],
  ["#68d391", "#4fd1c5"],
  ["#b794f4", "#f687b3"],
  ["#4fd1c5", "#63b3ed"],
  ["#f687b3", "#f6ad55"],
];

function avatarGradient(name) {
  if (!name) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function formatRelativeTime(unixSec) {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - unixSec);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatNumber(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

function Avatar({ name, size = 28 }) {
  const [a, b] = avatarGradient(name);
  const initials = (name || "??").slice(0, 2).toUpperCase();
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${a}, ${b})`,
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initials}
    </div>
  );
}

function HomePage({
  onGameClick,
  onOpenAuth,
  isLoggedIn,
  user,
  onLogout,
  leaderboard,
  progress,
  stats,
  recentActivity,
}) {
  const totalXp = progress?.totalXp ?? 0;
  const userRank = progress?.rank;
  const totalUsers = progress?.totalUsers ?? stats?.users ?? 0;
  const maxGameXp = Math.max(
    progress?.perGame?.cache?.bestScore ?? 0,
    progress?.perGame?.spell?.bestScore ?? 0,
    1,
  );

  const heroStats = stats
    ? [
        { num: formatNumber(stats.users), label: "Players" },
        { num: formatNumber(stats.plays), label: "Sessions" },
        {
          num: formatNumber(stats.totalXp),
          label: "XP Earned",
        },
      ]
    : null;

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
          <a href="#progress">Progress</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#activity">Activity</a>
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <>
              <div className="user-pill">
                <Avatar name={user?.username} size={26} />
                <span className="user-pill-name">@{user?.username}</span>
              </div>
              <button className="btn-outline" onClick={onLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={onOpenAuth}>
                Log in
              </button>
              <button className="btn-primary" onClick={onOpenAuth}>
                Get started
              </button>
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
            with pre/post assessments, bit-level scoring, and a live class
            leaderboard.
          </p>

          {heroStats ? (
            <div className="hero-stats">
              {heroStats.map((s) => (
                <div className="stat" key={s.label}>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hero-stats">
              {[1, 2, 3].map((i) => (
                <div className="stat" key={i}>
                  <div className="stat-num skeleton-num">—</div>
                  <div className="stat-label">Loading…</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hero-visual fade-in">
          <div className="hero-card">
            <div className="hero-card-head">
              <span className="hero-card-eyebrow">Live · Top Scorer</span>
              <span
                className="hero-card-pulse"
                title="Updates whenever someone plays"
              />
            </div>
            {stats?.topScorer ? (
              <div className="hero-card-body">
                <Avatar name={stats.topScorer.username} size={56} />
                <div className="hero-card-name">@{stats.topScorer.username}</div>
                <div className="hero-card-xp">
                  {formatNumber(stats.topScorer.totalXp)} XP
                </div>
                <div className="hero-card-sub">
                  Avg accuracy ·{" "}
                  {stats.avgAccuracy != null
                    ? `${Math.round(stats.avgAccuracy * 100)}%`
                    : "—"}
                </div>
              </div>
            ) : (
              <div className="hero-card-body">
                <div className="hero-empty">
                  <div className="hero-empty-icon">🏁</div>
                  <div>No champions yet.</div>
                  <div className="hero-empty-sub">
                    First plays appear here in real time.
                  </div>
                </div>
              </div>
            )}
            <div className="hero-card-foot">
              <span className="hero-card-foot-num">
                {stats ? formatNumber(stats.plays) : "—"}
              </span>{" "}
              sessions played across {stats ? formatNumber(stats.users) : "—"}{" "}
              learners
            </div>
          </div>
        </div>
      </div>

      {/* GAMES SECTION */}
      <div className="section-head" id="games">
        <span className="section-title">// Games</span>
        <div className="section-line" />
        <span className="section-tag">2 Games · Pre & Post Assessments</span>
      </div>

      <div className="games-showcase">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className="game-showcase-card fade-in"
            style={{
              "--card-accent": game.color,
              "--card-dim": game.colorDim,
              "--card-border": game.colorBorder,
            }}
            onClick={() => onGameClick(game.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onGameClick(game.id)}
          >
            <div className="gsc-left">
              <div
                className="gsc-icon-wrap"
                style={{ background: game.colorDim }}
              >
                <span className="gsc-icon">{game.icon}</span>
              </div>
              <div className="gsc-body">
                <div className="gsc-tag" style={{ color: game.color }}>
                  {game.tag}
                </div>
                <div className="gsc-title">{game.title}</div>
                <p className="gsc-desc">{game.desc}</p>
                <div className="gsc-badges">
                  {game.badges.map((b) => (
                    <span
                      key={b}
                      className="gsc-badge"
                      style={{
                        background: game.colorDim,
                        color: game.color,
                        borderColor: game.colorBorder,
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="gsc-play-btn" style={{ color: game.color }}>
              Play →
            </div>
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
            <div className="panel-head">
              <div className="panel-title">YOUR PROGRESS</div>
              {isLoggedIn && (
                <div className="panel-meta">
                  <span className="meta-num">{formatNumber(totalXp)}</span> XP
                </div>
              )}
            </div>

            {!isLoggedIn ? (
              <div className="panel-empty">
                <div className="panel-empty-icon">🔒</div>
                <div className="panel-empty-title">Sign in to track XP</div>
                <div className="panel-empty-sub">
                  Your scores, rank, and accuracy will appear here once you log
                  in.
                </div>
                <button
                  className="btn-primary"
                  style={{ marginTop: 14 }}
                  onClick={onOpenAuth}
                >
                  Log in / Register
                </button>
              </div>
            ) : (
              <>
                {userRank && (
                  <div className="rank-card">
                    <div className="rank-card-left">
                      <div className="rank-badge">#{userRank}</div>
                      <div>
                        <div className="rank-card-title">
                          Class rank {userRank} of {totalUsers}
                        </div>
                        <div className="rank-card-sub">
                          {userRank === 1
                            ? "👑 You're leading the class."
                            : userRank <= 3
                              ? "🥇 Top three. Keep pushing."
                              : userRank <= Math.ceil(totalUsers * 0.25)
                                ? "🚀 Top 25%. Great work."
                                : "Climb the leaderboard by replaying for a higher score."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {["cache", "spell"].map((gid) => {
                  const g = progress?.perGame?.[gid];
                  const xp = g?.bestScore ?? 0;
                  const plays = g?.plays ?? 0;
                  const acc = g?.accuracy ?? 0;
                  const pct = `${Math.round((xp / maxGameXp) * 100)}%`;
                  return (
                    <div key={gid} className="progress-row">
                      <div className="xp-row">
                        <span className="xp-label">
                          <span
                            className="xp-icon"
                            style={{ color: GAME_META[gid].color }}
                          >
                            {GAME_META[gid].icon}
                          </span>
                          {PROGRESS_LABELS[gid]}
                        </span>
                        <span className="xp-val">{formatNumber(xp)} XP</span>
                      </div>
                      <div className="xp-track">
                        <div className="xp-fill" style={{ width: pct }} />
                      </div>
                      <div className="xp-meta">
                        <span>{plays} plays</span>
                        <span>·</span>
                        <span>{Math.round(acc * 100)}% avg accuracy</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="bottom-section">
          <div className="section-head">
            <span className="section-title">// Leaderboard</span>
            <div className="section-line" />
            <span className="section-tag">Top {leaderboard.length || 5}</span>
          </div>
          <div className="panel" id="leaderboard">
            <div className="panel-head">
              <div className="panel-title">CLASS LEADERBOARD</div>
              <div className="panel-meta">
                {stats ? `${formatNumber(stats.users)} learners` : ""}
              </div>
            </div>
            {leaderboard.length === 0 && (
              <div className="panel-empty">
                <div className="panel-empty-icon">🏁</div>
                <div className="panel-empty-title">No scores yet</div>
                <div className="panel-empty-sub">
                  Be the first to place a book or counter a spell.
                </div>
              </div>
            )}
            {leaderboard.map((r) => {
              const top = leaderboard[0]?.totalXp || 1;
              const widthPct = `${Math.max(8, Math.round((r.totalXp / top) * 100))}%`;
              const isMe = isLoggedIn && user?.username === r.username;
              const podiumClass =
                r.rank === 1
                  ? "podium-gold"
                  : r.rank === 2
                    ? "podium-silver"
                    : r.rank === 3
                      ? "podium-bronze"
                      : "";
              return (
                <div
                  key={r.rank}
                  className={`lb-row ${podiumClass} ${isMe ? "is-me" : ""}`}
                >
                  <div className="lb-rank">
                    {r.rank === 1
                      ? "🥇"
                      : r.rank === 2
                        ? "🥈"
                        : r.rank === 3
                          ? "🥉"
                          : `#${r.rank}`}
                  </div>
                  <Avatar name={r.username} size={28} />
                  <div className="lb-name">
                    {r.username}
                    {isMe && <span className="lb-you">YOU</span>}
                  </div>
                  <div className="lb-bar">
                    <div className="lb-bar-fill" style={{ width: widthPct }} />
                  </div>
                  <div className="lb-score">{formatNumber(r.totalXp)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTIVITY FEED */}
      <div className="section-head" id="activity">
        <span className="section-title">// Activity</span>
        <div className="section-line" />
        <span className="section-tag">Live · class-wide</span>
      </div>
      <div className="panel activity-panel">
        {(!recentActivity || recentActivity.length === 0) && (
          <div className="panel-empty">
            <div className="panel-empty-icon">📭</div>
            <div className="panel-empty-title">No recent plays</div>
            <div className="panel-empty-sub">
              Sessions appear here as classmates finish a game.
            </div>
          </div>
        )}
        {recentActivity?.map((row) => {
          const meta = GAME_META[row.gameId] || {
            label: row.gameId,
            icon: "🎮",
            color: "var(--text2)",
          };
          const isMe = isLoggedIn && user?.username === row.username;
          return (
            <div key={row.id} className={`activity-row ${isMe ? "is-me" : ""}`}>
              <Avatar name={row.username} size={32} />
              <div className="activity-body">
                <div className="activity-line">
                  <span className="activity-name">@{row.username}</span>
                  <span className="activity-verb">played</span>
                  <span className="activity-game" style={{ color: meta.color }}>
                    {meta.icon} {meta.label}
                  </span>
                  {isMe && <span className="lb-you">YOU</span>}
                </div>
                <div className="activity-meta">
                  <span>+{formatNumber(row.xpEarned)} XP</span>
                  <span>·</span>
                  <span>{Math.round(row.accuracy * 100)}% accuracy</span>
                  <span>·</span>
                  <span>{formatRelativeTime(row.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer>
        <div className="footer-left">
          © {new Date().getFullYear()} CWU · Architects of Logic
        </div>
        <div className="footer-right">
          Built for CS computer-architecture coursework
        </div>
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
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);

  // Hydrate session from token on mount
  useEffect(() => {
    if (!hasToken()) return;
    apiFetch("/auth/me")
      .then((u) => {
        setUser(u);
        setIsLoggedIn(true);
      })
      .catch(() => {
        clearToken();
      });
  }, []);

  // Fetch home-page data whenever home is shown or after a game/login
  useEffect(() => {
    if (view !== "home") return;
    apiFetch("/leaderboard?limit=5")
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]));
    getStatsOverview()
      .then(setStats)
      .catch(() => setStats(null));
    getRecentActivity(8)
      .then(setRecentActivity)
      .catch(() => setRecentActivity([]));
  }, [view, refreshTick]);

  // Fetch personal progress when logged in and on home
  useEffect(() => {
    if (view !== "home" || !isLoggedIn) return;
    apiFetch("/progress/me")
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [view, isLoggedIn, refreshTick]);

  const goHome = () => {
    setView("home");
    setSelectedGameId(null);
    setRefreshTick((t) => t + 1);
  };
  const goGame = (id) => {
    setSelectedGameId(id);
    setView("game");
  };
  const goAuth = () => setView("auth");
  const handleLoginSuccess = (u) => {
    setUser(u);
    setIsLoggedIn(true);
    setView("home");
    setRefreshTick((t) => t + 1);
  };
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
      stats={stats}
      recentActivity={recentActivity}
    />
  );
}

export default App;
