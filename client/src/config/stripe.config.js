import { loadStripe } from "@stripe/stripe-js";

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Only initialize Stripe if a valid publishable key string is provided
export const stripePromise =
  stripeKey &&
  typeof stripeKey === "string" &&
  stripeKey.trim().startsWith("pk_")
    ? loadStripe(stripeKey.trim())
    : null;