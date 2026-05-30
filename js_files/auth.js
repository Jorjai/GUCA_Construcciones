// js_files/auth.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("auth.js loaded");

    const year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");

    if (!loginForm) {
        console.error("loginForm not found");
        return;
    }

    if (typeof GucaSupabase === "undefined") {
        console.error("GucaSupabase is not defined");
        loginMessage.textContent = "Error: Supabase no cargó. Revisa supabaseClient.js.";
        loginMessage.className = "msg error";
        return;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        console.log("login form submitted");

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        loginMessage.textContent = "Iniciando sesión...";
        loginMessage.className = "msg";

        try {
            const { data, error } = await GucaSupabase.auth.signInWithPassword({
                email,
                password
            });

            console.log("login response:", data, error);

            if (error) {
                throw error;
            }

            const userId = data.user.id;

            const { data: profile, error: profileError } = await GucaSupabase
                .from("profiles")
                .select("role, email")
                .eq("id", userId)
                .single();

            console.log("profile response:", profile, profileError);

            if (profileError) {
                throw profileError;
            }

            loginMessage.textContent = "Inicio de sesión correcto.";
            loginMessage.className = "msg success";

            setTimeout(() => {
                if (profile.role === "admin") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "index.html";
                }
            }, 500);

        } catch (error) {
            console.error("Login error:", error);
            loginMessage.textContent = error.message || "No se pudo iniciar sesión.";
            loginMessage.className = "msg error";
        }
    });

    const googleLoginBtn = document.getElementById("googleLoginBtn");

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener("click", async () => {
            if (loginMessage) {
                loginMessage.textContent = "Redirigiendo a Google...";
                loginMessage.className = "msg";
            }

            const { error } = await GucaSupabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: "https://gucaconstrucciones.netlify.app/admin.html"
                }
            });

            if (error) {
                console.error(error);

                if (loginMessage) {
                    loginMessage.textContent = "No se pudo iniciar sesión con Google.";
                    loginMessage.className = "msg error";
                } else {
                    alert("No se pudo iniciar sesión con Google.");
                }
            }
        });
    }
});