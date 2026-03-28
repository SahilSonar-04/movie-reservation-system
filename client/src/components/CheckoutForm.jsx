import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "../services/api";
import styles from "./CheckoutForm.module.css";

function CheckoutForm({ amount, seatCount, onSuccess, onCancel }) {
  const stripe     = useStripe();
  const elements   = useElements();
  const [error,      setError]      = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        const response = await api.post("/payments/confirm-booking", {
          paymentIntentId: paymentIntent.id,
        });
        onSuccess(response.data.booking);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.response?.data?.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>

      {/* Payment summary */}
      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Seats</span>
          <span className={styles.summaryValue}>{seatCount}</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total Amount</span>
          <span className={styles.totalValue}>₹{amount}</span>
        </div>
      </div>

      {/* Stripe payment element */}
      <div className={styles.stripeWrap}>
        <PaymentElement />
      </div>

      {/* Error */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Buttons */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.payBtn}
          disabled={!stripe || processing}
        >
          {processing ? "Processing…" : `Pay ₹${amount}`}
        </button>
      </div>

      {/* Security note */}
      <div className={styles.secureNote}>
        <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd" />
        </svg>
        Secured by Stripe
      </div>

    </form>
  );
}

export default CheckoutForm;