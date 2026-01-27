import { useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import api from "../services/api";

function CheckoutForm({ amount, seatCount, onSuccess, onCancel }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError("");

        try {
            // Confirm the payment
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
                // Confirm booking with backend
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
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            {/* Payment Summary */}
            <div
                style={{
                    background: "#f9fafb",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                    border: "1px solid #e5e7eb",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>Seats:</span>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>{seatCount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                    <span style={{ fontWeight: "600", fontSize: "16px" }}>Total Amount:</span>
                    <span style={{ fontWeight: "700", fontSize: "20px", color: "#dc2626" }}>
                        ₹{amount}
                    </span>
                </div>
            </div>

            {/* Payment Element */}
            <div style={{ marginBottom: "24px" }}>
                <PaymentElement />
            </div>

            {/* Error Message */}
            {error && (
                <div
                    style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#991b1b",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        fontSize: "14px",
                    }}
                >
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                    style={{
                        flex: 1,
                        padding: "12px",
                        background: "transparent",
                        color: "#6b7280",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        cursor: processing ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: processing ? 0.5 : 1,
                    }}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={!stripe || processing}
                    style={{
                        flex: 2,
                        padding: "12px",
                        background: !stripe || processing ? "#d1d5db" : "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: !stripe || processing ? "not-allowed" : "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                        transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        if (stripe && !processing) {
                            e.target.style.background = "#b91c1c";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (stripe && !processing) {
                            e.target.style.background = "#dc2626";
                        }
                    }}
                >
                    {processing ? "Processing..." : `Pay ₹${amount}`}
                </button>
            </div>

            {/* Security Note */}
            <div
                style={{
                    marginTop: "16px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                }}
            >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                    />
                </svg>
                Secured by Stripe
            </div>
        </form>
    );
}

export default CheckoutForm;