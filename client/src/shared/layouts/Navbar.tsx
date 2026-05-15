import { Code2, LayoutDashboard, LogOut, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import devhubLogo from "../../assets/devhub-logo.png";
import { baseApi, useMeQuery, useLogoutMutation } from "../../services/api/baseApi";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { clearAuth } from "../../features/auth/authSlice";
import { Button } from "../ui/Button";
import { Container } from "../components/Container";
import { cn } from "../lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/developers", label: "Developers" },
  { to: "/projects", label: "Projects" },
  { to: "/blogs", label: "Blogs" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const { data } = useMeQuery(undefined, { skip: auth.status === "unauthenticated" });
  const [logout] = useLogoutMutation();
  const user = auth.user || data?.data || data?.user;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Logged out");
    } catch (error) {
      console.warn("Logout API failed, clearing client state anyway:", error);
      toast.success("Logged out");
    } finally {
      dispatch(clearAuth());
      dispatch(baseApi.util.resetApiState());
      setOpen(false);
      navigate("/login");
    }
  };

  const nav = (
    <>
      {navLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/5 hover:text-white",
              isActive ? "bg-white/10 text-white" : "text-zinc-400"
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/90 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex items-center">
          <img src={devhubLogo} alt="DevHub" className="block h-[3.75rem] w-auto object-contain" />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">{nav}</nav>
        <button
          onClick={() => navigate("/discover")}
          className="hidden min-w-[260px] items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-left text-sm text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300 xl:flex"
        >
          <Search className="h-4 w-4" />
          Search DevHub...
        </button>
        <div className="hidden items-center gap-2 md:flex">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="GitHub"
          >
            <Code2 className="h-4 w-4" />
          </a>
          {user ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
              <Button size="sm" onClick={() => navigate("/register")}>Register</Button>
            </>
          )}
        </div>
        <button className="rounded-xl border border-white/10 bg-zinc-950 p-2 text-white md:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>
      {open ? (
        <div className="border-t border-white/10 bg-[#050505]/95 md:hidden">
          <Container className="flex flex-col gap-5 py-5">
            {nav}
            {user ? (
              <>
                <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
                <Button variant="ghost" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => navigate("/login")}>Login</Button>
                <Button onClick={() => navigate("/register")}>Register</Button>
              </>
            )}
          </Container>
        </div>
      ) : null}
    </header>
  );
}
