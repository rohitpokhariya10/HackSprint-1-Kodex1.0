import { Link } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import devhubLogo from "../../assets/devhub-logo.png";
import { Container } from "../components/Container";

const productLinks = [
  { to: "/discover", label: "Discover" },
  { to: "/developers", label: "Developers" },
  { to: "/projects", label: "Projects" },
  { to: "/blogs", label: "Blogs" },
];

export function Footer() {
  const user = useAppSelector((state) => state.auth.user);
  const accountLinks = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/profile/me", label: "Profile" },
        { to: "/dashboard/projects", label: "My Projects" },
        { to: "/dashboard/blogs", label: "My Blogs" },
      ]
    : [
        { to: "/login", label: "Login" },
        { to: "/register", label: "Register" },
      ];

  return (
    <footer className="mt-16 border-t border-white/10 bg-black">
      <Container className="py-8 sm:py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center">
              <img src={devhubLogo} alt="DevHub" className="h-[3.75rem] w-auto object-contain" />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-500">
              A developer social platform to showcase portfolios, projects, and technical blogs.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <div className="mt-4 grid gap-3">
              {productLinks.map((link) => (
                <Link key={link.to} to={link.to} className="text-sm text-zinc-400 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Account</h3>
            <div className="mt-4 grid gap-3">
              {accountLinks.map((link) => (
                <Link key={link.to} to={link.to} className="text-sm text-zinc-400 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DevHub. Built for developers.</p>
          <p>Ship. Share. Connect.</p>
        </div>
      </Container>
    </footer>
  );
}
