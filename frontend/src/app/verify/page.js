"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "../../lib/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("No verification token found in URL.");
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } catch (err) {
        setStatus("error");
        setError(err.message || "Failed to verify email.");
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div
      className="container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <div
        className="glass-panel"
        style={{ padding: "3rem", textAlign: "center", maxWidth: "500px" }}
      >
        {status === "verifying" && (
          <>
            <h2 style={{ marginBottom: "1rem" }}>Verifying your email...</h2>
            <div className="loader"></div>
          </>
        )}

        {status === "success" && (
          <>
            <h2 style={{ color: "#10b981", marginBottom: "1rem" }}>
              Email Verified!
            </h2>
            <p>
              Your account has been successfully activated. You will be
              redirected to the login page shortly.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 style={{ color: "#ff4b4b", marginBottom: "1rem" }}>
              Verification Failed
            </h2>
            <p style={{ marginBottom: "2rem" }}>{error}</p>
            <a href="/" className="btn-primary">
              Go to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="container">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
