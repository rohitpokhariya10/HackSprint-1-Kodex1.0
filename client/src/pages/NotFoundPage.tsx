import { Link } from "react-router-dom";
import { Container } from "../shared/components/Container";
import { Button } from "../shared/ui/Button";

export function NotFoundPage() {
  return (
    <Container className="grid min-h-[60vh] place-items-center py-10 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Page not found</h1>
        <p className="mt-3 text-zinc-400">This route does not exist in DevHub.</p>
        <Link to="/"><Button className="mt-6">Back home</Button></Link>
      </div>
    </Container>
  );
}
