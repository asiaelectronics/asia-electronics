import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/site/AuthForm";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account - Asia Electronics" },
      { name: "description", content: "Create an Asia Electronics customer account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <AuthForm mode="register" />,
});
