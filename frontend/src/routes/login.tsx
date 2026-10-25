import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/site/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In - Asia Electronics" },
      { name: "description", content: "Sign in to your Asia Electronics customer account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <AuthForm mode="login" />,
});
