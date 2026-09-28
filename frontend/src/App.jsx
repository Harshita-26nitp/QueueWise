import {useCallback,useEffect,useMemo,useState } from "react";
import {Link,Navigate,NavLink,Route,Routes,useNavigate,useParams} from "react-router-dom";
import {useSocket} from "./useSocket";
import {authApi,businessApi,queueApi } from "./api";
import {useAuth} from "./useAuth";
function Layout({children}) {
const {user,logout} = useAuth();
  const navigate=useNavigate();
   function handleLogout() { logout();
    navigate("/");
  }
return (<>
    <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            QueueWise
          </Link>
    <div className="flex items-center gap-3">
            {user ? (<>
            <span className="hidden text-sm text-slate-600 sm:block">
                  Hi, {user.name}</span>
                <NavLink to={user.role === "OWNER" ? "/owner" : "/"}className="btn-secondary">
                  Dashboard
                </NavLink>
                <button onClick={handleLogout} className="btn-primary">Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn-secondary">Login</NavLink>
              <NavLink to="/register" className="btn-primary">
                  Register
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main></>);}
function ProtectedRoute({children,role}) {
  const { user, loading } = useAuth();
if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
function AuthPage({mode}){
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const {login} = useAuth();
  const [form, setForm] = useState({
  name: "",
  email: "",
  password: "",
    role: "CUSTOMER"
  });
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    try {
      setBusy(true);
      setError("");
      const response = isLogin
        ? await authApi.login(form)
        : await authApi.register(form);
      const data = response.data.data;
      login(data);
      navigate(data.user.role === "OWNER" ? "/owner" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto max-w-md card">
      <h1 className="mb-6 text-2xl font-bold">
        {isLogin ? "Welcome back" : "Create account"}
      </h1>

      <form onSubmit={submit} className="space-y-4">
        {!isLogin &&(
          <input
            className="input"
            placeholder="Full name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
      <input className="input" type="email" placeholder="Email" required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
<input
          className="input"
          type="password"
          placeholder="Password (minimum 6 characters)"
          minLength="6"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {!isLogin && (
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="OWNER">Business Owner</option>
          </select>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>
      </form>
 <p className="mt-5 text-sm text-slate-600">
        {isLogin ?"New user?" : "Already have an account?"}{" "}
        <Link
          to={isLogin ? "/register" : "/login"}
          className="font-semibold text-indigo-600"
        >
          {isLogin ? "Register" : "Login"}
        </Link>
      </p>
    </section>
  );
}

function DiscoverPage() {
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  async function loadBusinesses() {
    const response = await businessApi.list({
      search: search || undefined,
      category: category || undefined
    });

    setBusinesses(response.data.data);
  }

  useEffect(() => {
    loadBusinesses();
  }, []);

  return (
    <>
      <section className="mb-8 rounded-3xl bg-indigo-600 px-6 py-12 text-white">
        <p className="mb-2 text-indigo-200">Digital queue management</p>
        <h1 className="text-4xl font-bold">Find a queue. Join remotely.</h1>
        <p className="mt-3 text-indigo-100">
          Check queue status and wait time before visiting.
        </p>
      </section>

      <section className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          className="input"
          placeholder="Search business"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          className="input sm:max-w-xs"
          placeholder="Category, e.g. Café"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
 <button onClick={loadBusinesses} className="btn-primary">
          Search
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => (
          <Link
            key={business._id}
            to={`/businesses/${business._id}`}
            className="card hover:border-indigo-300"
          >
            <div className="flex justify-between gap-3">
              <h2 className="font-semibold">{business.name}</h2>
              <span
                className={
                  business.isOpen ? "text-emerald-600" : "text-red-600"
                }
              >
                {business.isOpen ? "● Open" : "● Closed"}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {business.category}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {business.address}
            </p>
            <p className="mt-4 text-sm font-medium">
              Avg. service: {business.averageServiceTime} min
            </p>
          </Link>
        ))}
      </section>
    </>
  );
}

function BusinessPage() {
  const { businessId } = useParams();
  const { user } = useAuth();

 const socket = useSocket();
  const [data, setData] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await businessApi.getOne(businessId);
      setData(response.data.data);

      if (user?.role === "CUSTOMER") {
        try {
          const ticketResponse = await queueApi.getMyTicket(businessId);
          setTicket(ticketResponse.data.data);
        } catch {
          setTicket(null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load business");
    }
  }, [businessId, user]);

  useEffect(() => {
  void Promise.resolve().then(load);

  socket.emit("join_business", businessId);
  socket.on("queue_updated", load);

  return () => {
    socket.emit("leave_business", businessId);
    socket.off("queue_updated", load);
    
  };
}, [businessId, load, socket]);

  async function joinQueue() {
    try {
      await queueApi.join(businessId);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not join queue");
    }
  }

  if (!data) return <p>Loading business...</p>;

  const { business, liveQueue } = data;

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div className="card">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{business.category}</p>
            <h1 className="text-3xl font-bold">{business.name}</h1>
            <p className="mt-1 text-slate-600">{business.address}</p>
          </div>

          <b className={business.isOpen ? "text-emerald-600" : "text-red-600"}>
            {business.isOpen ? "Open" : "Closed"}
          </b>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Serving now" value={liveQueue.currentlyServing || "—"} />
        <Stat label="People waiting" value={liveQueue.waitingCount} />
        <Stat
          label="Estimated wait"
          value={`~${liveQueue.estimatedWaitMinutes} min`}
        />
      </div>

      {ticket ? (
        <div className="card border-indigo-200 bg-indigo-50">
          <p className="font-medium text-indigo-700">Your queue number</p>
          <p className="my-2 text-5xl font-bold text-indigo-700">
            {ticket.entry.queueNumber}
          </p>
          <p>
            Position: <b>{ticket.position}</b>
          </p>

          <Link
            to={`/my-ticket/${businessId}`}
            className="btn-primary mt-4 inline-block"
          >
            Track ticket
          </Link>
        </div>
      ) : user?.role === "CUSTOMER" ? (
        <button
          disabled={!business.isOpen || business.isQueuePaused}
          onClick={joinQueue}
          className="btn-primary w-full"
        >
          {business.isQueuePaused ? "Queue paused" : "Join queue"}
        </button>
      ) : !user ? (
        <Link to="/login" className="btn-primary block text-center">
          Login to join queue
        </Link>
      ) : null}

      {error && <p className="text-red-600">{error}</p>}
    </section>
  );
}

function TicketPage() {
  const {businessId} = useParams();
  const socket = useSocket();
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");

  const loadTicket = useCallback(async () => {
    try {
      const response = await queueApi.getMyTicket(businessId);
      setTicket(response.data.data);
    } catch (err) {
      setMessage(err.response?.data?.message||"No active ticket");
    }
  }, [businessId]);

 useEffect(() => {
  void Promise.resolve().then(loadTicket);

  socket.emit("join_business", businessId);
  socket.on("queue_updated", loadTicket);

  return () => {
    socket.emit("leave_business", businessId);
    socket.off("queue_updated", loadTicket);
  };
}, [businessId, socket, loadTicket]);
  async function cancelTicket() {
    await queueApi.cancelMyTicket(businessId);
    setTicket(null);
    setMessage("Your ticket has been cancelled.");
  }

  if (!ticket) {
    return <div className="mx-auto max-w-lg card text-center">{message}</div>;
  }

  return (
    <section className="mx-auto max-w-lg card text-center">
      <p className="text-sm text-slate-500">{ticket.business.name}</p>
      <p className="my-4 text-6xl font-bold text-indigo-600">
        {ticket.entry.queueNumber}
      </p>

      <p>
        People ahead: <b>{ticket.peopleAhead}</b>
      </p>
      <p className="mt-2">
        Estimated wait: <b>~{ticket.estimatedWaitMinutes} min</b>
      </p>

      {ticket.entry.status === "WAITING" && (
        <button onClick={cancelTicket} className="btn-secondary mt-6">
          Cancel ticket
        </button>
      )}
    </section>
  );
}

function OwnerPage() {
  const [businesses, setBusinesses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    address: "",
    averageServiceTime: 5,
    queuePrefix: "A"
  });

  async function loadBusinesses() {
    const response = await businessApi.myBusinesses();
    setBusinesses(response.data.data);

    if (!selected && response.data.data[0]) {
      setSelected(response.data.data[0]);
    }
  }

  async function loadQueue() {
    if (!selected) return;

    const response = await queueApi.getSnapshot(selected._id);
    setSnapshot(response.data.data);
  }

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    loadQueue();
  }, [selected]);

  async function createBusiness(event) {
    event.preventDefault();
    await businessApi.create(form);

    setForm({
      name: "",
      category: "",
      address: "",
      averageServiceTime: 5,
      queuePrefix: "A"
    });

    loadBusinesses();
  }

  async function serveNext() {
    await queueApi.serveNext(selected._id);
    loadQueue();
  }

  async function updateEntry(entryId, status) {
    await queueApi.updateEntryStatus(selected._id, entryId, status);
    loadQueue();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-4">
        <div className="card">
          <h2 className="font-semibold">Your Businesses</h2>

          <div className="mt-3 space-y-2">
            {businesses.map((business) => (
              <button
                key={business._id}
                onClick={() => setSelected(business)}
                className="w-full rounded-lg p-2 text-left hover:bg-indigo-50"
              >
                <b>{business.name}</b>
                <span className="block text-xs text-slate-500">
                  {business.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={createBusiness} className="card space-y-3">
          <h2 className="font-semibold">Create Business</h2>

          <input
            className="input"
            placeholder="Business name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="input"
            placeholder="Category"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <input
            className="input"
            placeholder="Address"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <input
            className="input"
            type="number"
            min="1"
            placeholder="Service time in minutes"
            value={form.averageServiceTime}
            onChange={(e) =>
              setForm({ ...form, averageServiceTime: e.target.value })
            }
          />

          <button className="btn-primary w-full">Create</button>
        </form>
      </aside>

      <section>
        {!selected ? (
          <div className="card">
            Create your first business to begin managing queues.
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Owner Dashboard</p>
                <h1 className="text-3xl font-bold">{selected.name}</h1>
              </div>

              <button onClick={serveNext} className="btn-primary">
                Serve next
              </button>
            </div>

            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <Stat
                label="Currently serving"
                value={snapshot?.currentlyServing?.queueNumber || "—"}
              />
              <Stat label="Waiting" value={snapshot?.waitingCount || 0} />
            </div>

            <div className="card">
              <h2 className="mb-4 text-lg font-semibold">Live Queue</h2>

              {snapshot?.currentlyServing && (
                <QueueEntry
                  entry={snapshot.currentlyServing}
                  label="Serving"
                  onUpdate={updateEntry}
                />
              )}

              {snapshot?.waiting?.map((entry) => (
                <QueueEntry
                  key={entry._id}
                  entry={entry}
                  label="Waiting"
                  onUpdate={updateEntry}
                />
              ))}

              {snapshot &&
                !snapshot.currentlyServing &&
                snapshot.waiting.length === 0 && (
                  <p className="text-slate-500">Queue is empty.</p>
                )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function QueueEntry({ entry, label, onUpdate }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0">
      <div>
        <b>{entry.queueNumber}</b>
        <span className="ml-3 text-sm text-slate-500">
          {entry.customerId?.name || "Customer"} · {label}
        </span>
      </div>

      <div className="flex gap-3 text-sm font-medium">
        <button
          onClick={() => onUpdate(entry._id, "COMPLETED")}
          className="text-emerald-700"
        >
          Complete
        </button>

        <button
          onClick={() => onUpdate(entry._id, "NO_SHOW")}
          className="text-amber-700"
        >
          No show
        </button>

        <button
          onClick={() => onUpdate(entry._id, "CANCELLED")}
          className="text-red-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        <Route
          path="/businesses/:businessId"
          element={<BusinessPage />}
        />

        <Route
          path="/my-ticket/:businessId"
          element={
            <ProtectedRoute role="CUSTOMER">
              <TicketPage />
            </ProtectedRoute>
          }
        />

        <Route path="/owner" element={
            <ProtectedRoute role="OWNER">
              <OwnerPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<p>Page not found.</p>} />
      </Routes>
    </Layout>
  );
}