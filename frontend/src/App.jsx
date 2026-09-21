import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

function App() {
    const [isRegistering, setIsRegistering] = useState(false);

    const [name, setName] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // FORGOT PASSWORD
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotStep, setForgotStep] = useState("roll");
    const [forgotRollNumber, setForgotRollNumber] = useState("");
    const [resetVerificationCode, setResetVerificationCode] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isSendingResetOtp, setIsSendingResetOtp] = useState(false);
    const [isVerifyingResetOtp, setIsVerifyingResetOtp] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isResendingOtp, setIsResendingOtp] = useState(false);

 
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);
    const [debts, setDebts] = useState([]);
        // GEMINI AI
    const [geminiApiKey, setGeminiApiKey] = useState("");
    const [geminiConnected, setGeminiConnected] = useState(false);
    const [isConnectingGemini, setIsConnectingGemini] = useState(false);
const [aiStatus, setAiStatus] = useState("");
const [aiStatusType, setAiStatusType] = useState("");
    const [aiMessage, setAiMessage] = useState("");
    const [aiMessages, setAiMessages] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);


    const [debtType, setDebtType] = useState("borrowed");
    const [personRollNumber, setPersonRollNumber] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    // USER SEARCH
    const [userSearch, setUserSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [showUserList, setShowUserList] = useState(false);
    const [searchingUsers, setSearchingUsers] = useState(false);

    // EDIT MODE
    const [editingDebtId, setEditingDebtId] = useState(null);

    // RESTORE LOGIN
    // RESTORE LOGIN
// RESTORE LOGIN
// RESTORE LOGIN
useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
        setLoggedIn(true);
        fetchDebts(token);

        // CHECK SAVED GEMINI CONNECTION
        fetch(
            `${API_URL}/api/auth/gemini-status`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )
            .then(async (response) => {
                if (!response.ok) {
                    return;
                }

                const data = await response.json();

                setGeminiConnected(
                    data.connected === true
                );
            })
            .catch((error) => {
                console.error(
                    "Gemini status error:",
                    error
                );
            });
    }
}, []);

// AUTO REFRESH DEBTS
useEffect(() => {
    if (!loggedIn) {
        return;
    }

    const refreshInterval = setInterval(() => {
        const token = localStorage.getItem("token");

        if (token) {
            fetchDebts(token);
        }
    }, 10000); // refresh every 10 seconds

    return () => {
        clearInterval(refreshInterval);
    };
}, [loggedIn]);
    // CONNECT GEMINI
    // CONNECT GEMINI
const handleConnectGemini = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!geminiApiKey.trim()) {
        setAiStatus("Please enter your Gemini API key.");
        setAiStatusType("error");
        return;
    }

    setIsConnectingGemini(true);
    setAiStatus("");
    setAiStatusType("");

    try {
        const response = await fetch(
            `${API_URL}/api/auth/connect-gemini`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    apiKey: geminiApiKey.trim()
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            setGeminiConnected(true);
            setGeminiApiKey("");

            setAiStatus(
                "Gemini connected successfully. Your API key is now protected."
            );
            setAiStatusType("success");

        } else {
            setAiStatus(
                data.message ||
                "Could not connect Gemini."
            );
            setAiStatusType("error");
        }

    } catch (error) {
        console.error(error);

        setAiStatus(
            "Could not connect to the server."
        );
        setAiStatusType("error");

    } finally {
        setIsConnectingGemini(false);
    }
};
const handleDisconnectGemini = async () => {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(
            `${API_URL}/api/auth/disconnect-gemini`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {
            setGeminiConnected(false);
            setAiMessages([]);
            setAiMessage("");

            setMessage("Gemini disconnected successfully.");
            setMessageType("success");
        } else {
            setMessage(
                data.message || "Could not disconnect Gemini."
            );
            setMessageType("error");
        }

    } catch (error) {
        console.error(error);

        setMessage("Could not connect to the server.");
        setMessageType("error");
    }
};

    // AI CHAT
    const handleAiChat = async (e) => {
        e.preventDefault();

        if (!aiMessage.trim() || isAiLoading) {
            return;
        }

        const token = localStorage.getItem("token");
        const userMessage = aiMessage.trim();

        setAiMessages((previous) => [
            ...previous,
            {
                role: "user",
                text: userMessage
            }
        ]);

        setAiMessage("");
        setIsAiLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/ai/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        message: userMessage
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                setAiMessages((previous) => [
                    ...previous,
                    {
                        role: "ai",
                        text: data.message
                    }
                ]);

                // AI-created debt has already been saved
                // to MongoDB by the backend.
                if (data.action === "create_debt") {
                    await fetchDebts(token);
                }

            } else {

                setAiMessages((previous) => [
                    ...previous,
                    {
                        role: "ai",
                        text:
                            data.message ||
                            "The AI could not process your request."
                    }
                ]);
            }

        } catch (error) {
            console.error(error);

            setAiMessages((previous) => [
                ...previous,
                {
                    role: "ai",
                    text:
                        "Could not connect to the AI service."
                }
            ]);

        } finally {
            setIsAiLoading(false);
        }
    };
    // REGISTER
    const handleRegister = async (e) => {
        e.preventDefault();
        setIsSendingOtp(true);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        rollNumber: rollNumber.trim(),
                        email: email.trim(),
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setIsSendingOtp(false);
                setMessage(
                    `Verification OTP sent to ${email.trim()}. Check your email if not found please check junk/spam folder.`
                );
                setMessageType("success");
                setIsVerifyingEmail(true);
                setVerificationCode("");
            } else {
                setIsSendingOtp(false);
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            setIsSendingOtp(false);
            console.error(error);
            setMessage("Could not connect to server");
            setMessageType("error");
        }
    };

    // VERIFY EMAIL
    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        setIsVerifyingOtp(true);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/verify-email`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        verificationCode: verificationCode.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setIsVerifyingOtp(false);
                setMessage("Email verified successfully! You can now login.");
                setMessageType("success");
                setIsVerifyingEmail(false);
                setIsRegistering(false);
                setName("");
                setRollNumber("");
                setEmail("");
                setPassword("");
                setVerificationCode("");
            } else {
                setIsVerifyingOtp(false);
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            setIsVerifyingOtp(false);
            console.error(error);
            setMessage("Could not connect to server");
            setMessageType("error");
        }
    };


    // RESEND OTP
    const handleResendOtp = async () => {
        setIsResendingOtp(true);
        try {
            setMessage("Sending a new OTP...");
            setMessageType("info");

            const response = await fetch(
                `${API_URL}/api/auth/resend-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                   setIsResendingOtp(false);
                   setMessage("A new OTP has been sent to your email.");
                   setMessageType("success");
                   setVerificationCode("");
            } else {
                setIsResendingOtp(false);
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            setIsResendingOtp(false);
            console.error(error);
            setMessage("Could not connect to server");
            setMessageType("error");
        }
    };

    // LOGIN
    const handleLogin = async (e) => {
        e.preventDefault();
         setIsLoggingIn(true);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        rollNumber: rollNumber.trim(),
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setIsLoggingIn(false);
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                setLoggedIn(true);
                setMessage("");
                setMessageType("");

                await fetchDebts(data.token);
            } else {
                setIsLoggingIn(false);
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            setIsLoggingIn(false);
            console.error(error);
            setMessage("Could not connect to server");
            setMessageType("error");
        }
    };

    // FORGOT PASSWORD - SEND RESET OTP
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsSendingResetOtp(true);
        setMessage("");
        setMessageType("");

        try {
            const response = await fetch(
                `${API_URL}/api/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        rollNumber: forgotRollNumber.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMaskedEmail(data.maskedEmail || "your registered email");
                setForgotStep("otp");
                setResetVerificationCode("");
                setMessage(`OTP sent to ${data.maskedEmail || "your registered email"}. Check your inbox and junk/spam folder.`);
                setMessageType("success");
            } else {
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not connect to server");
            setMessageType("error");
        } finally {
            setIsSendingResetOtp(false);
        }
    };

    // VERIFY PASSWORD RESET OTP
    const handleVerifyResetOtp = async (e) => {
        e.preventDefault();
        setIsVerifyingResetOtp(true);
        setMessage("");
        setMessageType("");

        try {
            const response = await fetch(
                `${API_URL}/api/auth/verify-reset-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        rollNumber: forgotRollNumber.trim(),
                        verificationCode: resetVerificationCode.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setForgotStep("reset");
                setMessage("OTP verified successfully. Set your new password.");
                setMessageType("success");
                setResetVerificationCode("");
            } else {
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not connect to server");
            setMessageType("error");
        } finally {
            setIsVerifyingResetOtp(false);
        }
    };

    // RESET PASSWORD
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsResettingPassword(true);
        setMessage("");
        setMessageType("");

        try {
            const response = await fetch(
                `${API_URL}/api/auth/reset-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        rollNumber: forgotRollNumber.trim(),
                        newPassword: newPassword
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setIsForgotPassword(false);
                setForgotStep("roll");
                setForgotRollNumber("");
                setResetVerificationCode("");
                setMaskedEmail("");
                setNewPassword("");
                setMessage(data.message || "Password reset successfully. You can now login.");
                setMessageType("success");
            } else {
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not connect to server");
            setMessageType("error");
        } finally {
            setIsResettingPassword(false);
        }
    };

    const handleCancelForgotPassword = () => {
        setIsForgotPassword(false);
        setForgotStep("roll");
        setForgotRollNumber("");
        setResetVerificationCode("");
        setMaskedEmail("");
        setNewPassword("");
        setMessage("");
        setMessageType("");
    };

    // GET DEBTS
    const fetchDebts = async (token) => {
        try {
            const response = await fetch(
                `${API_URL}/api/debts`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setDebts(data.debts);
            } else if (response.status === 401) {
                handleLogout();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // SEARCH / LOAD USERS
    const fetchUsers = async (searchText = "") => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        setSearchingUsers(true);

        try {
            const url = searchText.trim()
                ? `${API_URL}/api/users/search?q=${encodeURIComponent(searchText.trim())}`
                : `${API_URL}/api/users/search`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setUsers(data.users || []);
            } else if (response.status === 401) {
                handleLogout();
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error(error);
            setUsers([]);
        } finally {
            setSearchingUsers(false);
        }
    };

    // OPEN USER LIST
    const handleOpenUserList = () => {
        setShowUserList(true);

        if (users.length === 0) {
            fetchUsers(userSearch);
        }
    };

    // SEARCH USERS AS USER TYPES
    const handleUserSearchChange = (e) => {
        const value = e.target.value;

        setUserSearch(value);
        setShowUserList(true);
        setSelectedUser(null);
        setPersonRollNumber("");

        fetchUsers(value);
    };

    // SELECT USER
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setPersonRollNumber(user.rollNumber);
        setUserSearch(`${user.name} (${user.rollNumber})`);
        setShowUserList(false);
        setMessage("");
                setMessageType("");
    };

    // CLEAR USER SELECTION
    const clearUserSelection = () => {
        setSelectedUser(null);
        setPersonRollNumber("");
        setUserSearch("");
        setShowUserList(true);
        fetchUsers("");
    };

    // CREATE DEBT
    const handleCreateDebt = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        if (!selectedUser) {
            setMessage("Please select a person first.");
            setMessageType("error");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/debts`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        debtType: debtType,
                        personRollNumber: personRollNumber.trim(),
                        amount: Number(amount),
                        description: description.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Debt created successfully!");
                setMessageType("success");

                setPersonRollNumber("");
                setSelectedUser(null);
                setUserSearch("");
                setAmount("");
                setDescription("");
                setShowUserList(false);

                await fetchDebts(token);
            } else {
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not create debt");
            setMessageType("error");
        }
    };

    // START EDIT
    const handleStartEdit = (debt) => {
        const user = JSON.parse(localStorage.getItem("user"));

        const isBorrower =
            String(debt.borrower._id) === String(user.id);

        setEditingDebtId(debt._id);

        if (isBorrower) {
            setDebtType("borrowed");

            setSelectedUser(debt.lender);

            setPersonRollNumber(debt.lender.rollNumber);

            setUserSearch(
                `${debt.lender.name} (${debt.lender.rollNumber})`
            );
        } else {
            setDebtType("lent");

            setSelectedUser(debt.borrower);

            setPersonRollNumber(debt.borrower.rollNumber);

            setUserSearch(
                `${debt.borrower.name} (${debt.borrower.rollNumber})`
            );
        }

        setAmount(String(debt.amount));
        setDescription(debt.description || "");
        setMessage("");
                setMessageType("");
        setShowUserList(false);
    };

    // CANCEL EDIT
    const handleCancelEdit = () => {
        setEditingDebtId(null);
        setPersonRollNumber("");
        setSelectedUser(null);
        setUserSearch("");
        setAmount("");
        setDescription("");
        setDebtType("borrowed");
        setMessage("");
                setMessageType("");
        setShowUserList(false);
    };

    // UPDATE DEBT
    const handleEditDebt = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        if (!selectedUser) {
            setMessage("Please select a person first.");
            setMessageType("error");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/debts/${editingDebtId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        debtType: debtType,
                        personRollNumber: personRollNumber.trim(),
                        amount: Number(amount),
                        description: description.trim()
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Debt updated successfully!");
                setMessageType("success");

                setEditingDebtId(null);
                setPersonRollNumber("");
                setSelectedUser(null);
                setUserSearch("");
                setAmount("");
                setDescription("");
                setDebtType("borrowed");
                setShowUserList(false);

                await fetchDebts(token);
            } else {
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not update debt");
            setMessageType("error");
        }
    };

    // REQUEST PAYMENT
    const handleRequestPayment = async (debtId) => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `${API_URL}/api/debts/${debtId}/request-payment`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Payment confirmation requested.");
                setMessageType("success");
                await fetchDebts(token);
            } else {
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not request payment confirmation");
            setMessageType("error");
        }
    };

    // CONFIRM PAYMENT
    const handleConfirmPayment = async (debtId) => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `${API_URL}/api/debts/${debtId}/confirm-payment`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Payment confirmed!");
                setMessageType("success");
                await fetchDebts(token);
            } else {
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not confirm payment");
            setMessageType("error");
        }
    };

    // DELETE DEBT
    const handleDeleteDebt = async (debtId) => {
        const token = localStorage.getItem("token");

        const confirmed = window.confirm(
            "Are you sure you want to delete this debt?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/debts/${debtId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Debt deleted successfully.");
                setMessageType("success");
                await fetchDebts(token);
            } else {
                setMessage(data.message);
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not delete debt");
            setMessageType("error");
        }
    };

    // LOGOUT
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setLoggedIn(false);
        setDebts([]);
        setMessage("");
                setMessageType("");
        setUsers([]);
        setSelectedUser(null);
        setPersonRollNumber("");
        setUserSearch("");
    };

    // DASHBOARD
    if (loggedIn) {
        const user = JSON.parse(localStorage.getItem("user"));

        const activeDebts = debts.filter(
            (debt) => debt.status !== "paid"
        );

        const paidDebts = debts.filter(
            (debt) => debt.status === "paid"
        );

        const youOwe = activeDebts
            .filter(
                (debt) =>
                    String(debt.borrower._id) === String(user.id)
            )
            .reduce(
                (total, debt) => total + Number(debt.amount),
                0
            );

        const owedToYou = activeDebts
            .filter(
                (debt) =>
                    String(debt.lender._id) === String(user.id)
            )
            .reduce(
                (total, debt) => total + Number(debt.amount),
                0
            );

        return (
            <div style={dashboardPageStyle}>
                <style>{`
                    @media (max-width: 900px) {
                        .borrow-tracker-dashboard-grid {
                            grid-template-columns: 1fr !important;
                        }

                        .borrow-tracker-ai-column {
                            position: static !important;
                        }
                    }
                `}</style>
                <div style={dashboardContainerStyle}>

                    {/* HEADER */}

                    <div style={headerCardStyle}>

                        <h1 style={titleStyle}>
                            Borrow Tracker
                        </h1>

                        <h2 style={{ margin: "0 0 5px" }}>
                            Welcome, {user.name}!
                        </h2>

                        <p style={{
                            margin: 0,
                            color: "#666"
                        }}>
                            Roll Number: {user.rollNumber}
                        </p>

                    </div>


                    {/* MAIN DASHBOARD CONTENT */}

                    <div
                        className="borrow-tracker-dashboard-grid"
                        style={dashboardContentGridStyle}
                    >

                        {/* LEFT SIDE - ALL DEBT FEATURES */}

                        <div>

                    {/* SUMMARY */}

                    <div style={summaryGridStyle}>

                        <div style={summaryCardStyle}>
                            <p style={summaryLabelStyle}>
                                You Owe
                            </p>

                            <h2 style={{
                                margin: 0,
                                color: "#dc2626"
                            }}>
                                ₹{youOwe}
                            </h2>
                        </div>

                        <div style={summaryCardStyle}>
                            <p style={summaryLabelStyle}>
                                Owed to You
                            </p>

                            <h2 style={{
                                margin: 0,
                                color: "#16a34a"
                            }}>
                                ₹{owedToYou}
                            </h2>
                        </div>

                        <div style={summaryCardStyle}>
                            <p style={summaryLabelStyle}>
                                Active Debts
                            </p>

                            <h2 style={{
                                margin: 0,
                                color: "#2563eb"
                            }}>
                                {activeDebts.length}
                            </h2>
                        </div>

                    </div>

                    {/* CREATE / EDIT DEBT */}

                    <div style={sectionCardStyle}>

                        <h3 style={{ marginTop: 0 }}>
                            {editingDebtId
                                ? "Edit Debt"
                                : "Add a Debt"}
                        </h3>

                        <div style={{
                            display: "flex",
                            gap: "10px",
                            marginBottom: "18px"
                        }}>

                            <button
                                type="button"
                                onClick={() => {
                                    setDebtType("borrowed");
                                    setMessage("");
                setMessageType("");
                                }}
                                style={{
                                    ...typeButtonStyle,
                                    background:
                                        debtType === "borrowed"
                                            ? "#2563eb"
                                            : "#ffffff",
                                    color:
                                        debtType === "borrowed"
                                            ? "#ffffff"
                                            : "#333"
                                }}
                            >
                                I Borrowed
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setDebtType("lent");
                                    setMessage("");
                setMessageType("");
                                }}
                                style={{
                                    ...typeButtonStyle,
                                    background:
                                        debtType === "lent"
                                            ? "#2563eb"
                                            : "#ffffff",
                                    color:
                                        debtType === "lent"
                                            ? "#ffffff"
                                            : "#333"
                                }}
                            >
                                I Lent
                            </button>

                        </div>

                        <form
                            onSubmit={
                                editingDebtId
                                    ? handleEditDebt
                                    : handleCreateDebt
                            }
                        >

                            {/* USER SEARCH */}

                            <div style={{
                                position: "relative",
                                marginBottom: "14px"
                            }}>

                                <input
                                    type="text"
                                    placeholder={
                                        debtType === "borrowed"
                                            ? "Search lender by name or roll number"
                                            : "Search borrower by name or roll number"
                                    }
                                    value={userSearch}
                                    onFocus={handleOpenUserList}
                                    onChange={handleUserSearchChange}
                                    style={{
                                        ...inputStyle,
                                        marginBottom: 0,
                                        paddingRight: selectedUser
                                            ? "85px"
                                            : "12px"
                                    }}
                                />

                                {selectedUser && (
                                    <button
                                        type="button"
                                        onClick={clearUserSelection}
                                        style={{
                                            position: "absolute",
                                            right: "8px",
                                            top: "8px",
                                            padding: "6px 10px",
                                            border: "none",
                                            borderRadius: "6px",
                                            background: "#e5e7eb",
                                            color: "#333",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Change
                                    </button>
                                )}

                                {showUserList && (
                                    <div style={userListStyle}>

                                        {searchingUsers ? (
                                            <p style={userListMessageStyle}>
                                                Searching...
                                            </p>
                                        ) : users.length === 0 ? (
                                            <p style={userListMessageStyle}>
                                                No users found.
                                            </p>
                                        ) : (
                                            users.map((person) => (
                                                <button
                                                    key={person._id}
                                                    type="button"
                                                    onClick={() =>
                                                        handleSelectUser(person)
                                                    }
                                                    style={userItemStyle}
                                                >
                                                    <div style={{
                                                        fontWeight: "bold",
                                                        fontSize: "15px"
                                                    }}>
                                                        {person.name}
                                                    </div>

                                                    <div style={{
                                                        color: "#666",
                                                        fontSize: "13px",
                                                        marginTop: "3px"
                                                    }}>
                                                        {person.rollNumber}
                                                    </div>
                                                </button>
                                            ))
                                        )}

                                    </div>
                                )}

                            </div>


                            <input
                                type="number"
                                min="1"
                                placeholder="Amount (₹)"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(e.target.value)
                                }
                                style={inputStyle}
                            />

                            <input
                                type="text"
                                placeholder="Description"
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                                style={inputStyle}
                            />

                            <button
                                type="submit"
                                style={primaryButtonStyle}
                            >
                                {editingDebtId
                                    ? "Save Changes"
                                    : "Add Debt"}
                            </button>

                            {editingDebtId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    style={secondaryButtonStyle}
                                >
                                    Cancel Edit
                                </button>
                            )}

                        </form>

                    </div>


                    {/* MESSAGE */}

                  {message && (
    <p
        style={{
            ...messageStyle,
            color:
                messageType === "error"
                    ? "#dc2626"
                    : messageType === "success"
                    ? "#16a34a"
                    : "#2563eb"
        }}
    >
        {message}
    </p>
)}


                    {/* ACTIVE DEBTS */}

                    <div style={sectionCardStyle}>

                        <h3 style={{ marginTop: 0 }}>
                            Active Debts
                        </h3>

                        {activeDebts.length === 0 ? (

                            <p style={{ color: "#777" }}>
                                No active debts.
                            </p>

                        ) : (

                            activeDebts.map((debt) => {

                                const isBorrower =
                                    String(debt.borrower._id) ===
                                    String(user.id);

                                const isLender =
                                    String(debt.lender._id) ===
                                    String(user.id);

                                return (
                                    <div
                                        key={debt._id}
                                        style={{
                                            ...debtCardStyle,
                                            borderLeft:
                                                debt.status === "payment_requested"
                                                    ? "5px solid #f59e0b"
                                                    : "5px solid #dc2626"
                                        }}
                                    >

                                        {/* DEBT TEXT */}

                                        <p style={{
                                            margin: "0 0 8px",
                                            fontSize: "17px",
                                            fontWeight: "bold",
                                            color:
                                                debt.status === "payment_requested"
                                                    ? "#d97706"
                                                    : "#dc2626"
                                        }}>

                                            {isBorrower
                                                ? `You owe ${debt.lender.name} ₹${debt.amount}`
                                                : `${debt.borrower.name} owes you ₹${debt.amount}`
                                            }

                                        </p>


                                        {/* DESCRIPTION */}

                                        {debt.description && (
                                            <p style={{
                                                margin: "0 0 12px",
                                                color: "#666"
                                            }}>
                                                {debt.description}
                                            </p>
                                        )}


                                        {/* STATUS */}

                                        {debt.status === "unpaid" && (
                                            <p style={unpaidStatusStyle}>
                                                ● Unpaid
                                            </p>
                                        )}

                                        {debt.status === "payment_requested" && (
                                            <p style={requestedStatusStyle}>
                                                ● Payment confirmation requested
                                            </p>
                                        )}


                                        {/* BORROWER: I PAID */}

                                        {isBorrower &&
                                            debt.status === "unpaid" && (

                                                <button
                                                    onClick={() =>
                                                        handleRequestPayment(
                                                            debt._id
                                                        )
                                                    }
                                                    style={payButtonStyle}
                                                >
                                                    I Paid
                                                </button>

                                            )}


                                        {/* BORROWER WAITING */}

                                        {isBorrower &&
                                            debt.status === "payment_requested" && (

                                                <p style={{
                                                    color: "#d97706",
                                                    margin: "10px 0 0"
                                                }}>
                                                    Waiting for {debt.lender.name}
                                                    {" "}to confirm.
                                                </p>

                                            )}


                                        {/* LENDER: CONFIRM */}

                                        {isLender &&
                                            debt.status === "payment_requested" && (

                                                <button
                                                    onClick={() =>
                                                        handleConfirmPayment(
                                                            debt._id
                                                        )
                                                    }
                                                    style={confirmButtonStyle}
                                                >
                                                    Confirm Payment
                                                </button>

                                            )}


                                        {/* EDIT */}

                                        {debt.status === "unpaid" &&
                                            (isBorrower || isLender) && (

                                                <button
                                                    onClick={() =>
                                                        handleStartEdit(debt)
                                                    }
                                                    style={editButtonStyle}
                                                >
                                                    Edit
                                                </button>

                                            )}


                                        {/* DELETE */}

                                        {(isBorrower || isLender) && (
                                            <button
                                                onClick={() =>
                                                    handleDeleteDebt(
                                                        debt._id
                                                    )
                                                }
                                                style={deleteButtonStyle}
                                            >
                                                Delete
                                            </button>
                                        )}

                                    </div>
                                );
                            })

                        )}

                    </div>


                    {/* PAID HISTORY */}

                    <div style={sectionCardStyle}>

                        <h3 style={{ marginTop: 0 }}>
                            Paid History
                        </h3>

                        {paidDebts.length === 0 ? (

                            <p style={{ color: "#777" }}>
                                No paid debts yet.
                            </p>

                        ) : (

                            paidDebts.map((debt) => {

                                const isBorrower =
                                    String(debt.borrower._id) ===
                                    String(user.id);

                                return (
                                    <div
                                        key={debt._id}
                                        style={{
                                            ...debtCardStyle,
                                            borderLeft:
                                                "5px solid #16a34a",
                                            background: "#f8fff9"
                                        }}
                                    >

                                        <p style={{
                                            margin: "0 0 8px",
                                            fontSize: "17px",
                                            fontWeight: "bold",
                                            color: "#16a34a"
                                        }}>

                                            {isBorrower
                                                ? `You paid ${debt.lender.name} ₹${debt.amount}`
                                                : `${debt.borrower.name} paid you ₹${debt.amount}`
                                            }

                                        </p>

                                        {debt.description && (
                                            <p style={{
                                                margin: "0 0 10px",
                                                color: "#666"
                                            }}>
                                                {debt.description}
                                            </p>
                                        )}

                                        <p style={paidStatusStyle}>
                                            ● Paid
                                        </p>

                                    </div>
                                );
                            })

                        )}

                    </div>


                        </div>


                        {/* RIGHT SIDE - GEMINI AI */}

                        <div
                            className="borrow-tracker-ai-column"
                            style={aiColumnStyle}
                        >

                    {/* GEMINI AI */}

                    <div style={sectionCardStyle}>

                        <h3 style={{ marginTop: 0 }}>
                            🤖 KADAM AI
                        </h3>

                        {!geminiConnected ? (

                            <>
                                <p style={{
                                    color: "#555",
                                    lineHeight: "1.6",
                                    marginTop: 0
                                }}>
                                    Connect your own Gemini API key to use
                                    the AI assistant with your Borrow Tracker data.
                                </p>

                                <div style={{
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    padding: "14px",
                                    marginBottom: "15px"
                                }}>

                                    <p style={{
                                        margin: "0 0 10px",
                                        fontWeight: "bold"
                                    }}>
                                        🔐 Your API key is protected
                                    </p>

                                    <p style={{
                                        margin: "0 0 10px",
                                        color: "#555",
                                        fontSize: "14px",
                                        lineHeight: "1.6"
                                    }}>
                                        Your Gemini API key is encrypted before
                                        it is stored on our server. It is not
                                        displayed back to you after connecting.
                                    </p>

                                    <p style={{
                                        margin: 0,
                                        color: "#555",
                                        fontSize: "14px",
                                        lineHeight: "1.6"
                                    }}>
                                        The AI currently understands your debt
                                        data, can summarize who owes whom and
                                        how much, and can create new debt or
                                        lending records for you.
                                    </p>

                                </div>

                                <p style={{
                                    color: "#666",
                                    fontSize: "13px",
                                    lineHeight: "1.5"
                                }}>
                                    Your debts remain stored in Borrow Tracker's
                                    database. Gemini does not have a
                                    separate debt database.
                                </p>
<form onSubmit={handleConnectGemini}>

    <input
        type="password"
        placeholder="Paste your Gemini API key"
        value={geminiApiKey}
        onChange={(e) =>
            setGeminiApiKey(e.target.value)
        }
        style={inputStyle}
    />

    <button
        type="submit"
        disabled={isConnectingGemini}
        style={{
            ...primaryButtonStyle,
            opacity:
                isConnectingGemini
                    ? 0.7
                    : 1,
            cursor:
                isConnectingGemini
                    ? "not-allowed"
                    : "pointer"
        }}
    >
        {isConnectingGemini
            ? "Connecting..."
            : "Connect Gemini"}
    </button>

    {aiStatus && (
        <p
            style={{
                margin: "10px 0 0",
                fontSize: "14px",
                lineHeight: "1.5",
                color:
                    aiStatusType === "error"
                        ? "#dc2626"
                        : "#16a34a"
            }}
        >
            {aiStatus}
        </p>
    )}

</form>

                            </>

                        ) : (

                            <>
                                <div style={{
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    borderRadius: "8px",
                                    padding: "10px 12px",
                                    marginBottom: "15px",
                                    color: "#166534",
                                    fontSize: "14px"
                                }}>
                                    ● Gemini connected
                                </div>
                                <button
    onClick={handleDisconnectGemini}
    style={{
        ...deleteButtonStyle,
        marginBottom: "15px"
    }}
>
    Disconnect Gemini
</button>

                                <div style={{
                                    maxHeight: "350px",
                                    overflowY: "auto",
                                    marginBottom: "12px"
                                }}>

                                    {aiMessages.length === 0 ? (

                                        <div style={{
                                            background: "#f8fafc",
                                            borderRadius: "8px",
                                            padding: "14px",
                                            color: "#555",
                                            fontSize: "14px",
                                            lineHeight: "1.6"
                                        }}>
                                            <strong>
                                                What can I ask?
                                            </strong>

                                            <p style={{
                                                marginBottom: "8px"
                                            }}>
                                                Try:
                                            </p>

                                            <p style={{ margin: "5px 0" }}>
                                                • "How much do I owe in total?"
                                            </p>

                                            <p style={{ margin: "5px 0" }}>
                                                • "How much money is owed to me?"
                                            </p>

                                            <p style={{ margin: "5px 0" }}>
                                                • "What debts do I have with Rahul?"
                                            </p>

                                            <p style={{ margin: "5px 0" }}>
                                                • "I lent Rahul ₹500 for lunch."
                                            </p>

                                        </div>

                                    ) : (

                                        aiMessages.map((chat, index) => (

                                            <div
                                                key={index}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        chat.role === "user"
                                                            ? "flex-end"
                                                            : "flex-start",
                                                    marginBottom: "10px"
                                                }}
                                            >

                                                <div style={{
                                                    maxWidth: "85%",
                                                    padding: "10px 13px",
                                                    borderRadius: "10px",
                                                    background:
                                                        chat.role === "user"
                                                            ? "#2563eb"
                                                            : "#f1f5f9",
                                                    color:
                                                        chat.role === "user"
                                                            ? "#ffffff"
                                                            : "#333",
                                                    lineHeight: "1.5",
                                                    fontSize: "14px"
                                                }}>
                                                    {chat.text}
                                                </div>

                                            </div>

                                        ))

                                    )}

                                    {isAiLoading && (
                                        <div style={{
                                            color: "#666",
                                            fontSize: "14px",
                                            padding: "8px"
                                        }}>
                                            AI is thinking...
                                        </div>
                                    )}

                                </div>

                                <form
                                    onSubmit={handleAiChat}
                                    style={{
                                        display: "flex",
                                        gap: "8px"
                                    }}
                                >

                                    <input
                                        type="text"
                                        placeholder="Ask Borrow Tracker AI..."
                                        value={aiMessage}
                                        onChange={(e) =>
                                            setAiMessage(e.target.value)
                                        }
                                        style={{
                                            ...inputStyle,
                                            marginBottom: 0,
                                            flex: 1
                                        }}
                                        disabled={isAiLoading}
                                    />

                                    <button
                                        type="submit"
                                        disabled={
                                            isAiLoading ||
                                            !aiMessage.trim()
                                        }
                                        style={{
                                            ...primaryButtonStyle,
                                            width: "auto",
                                            padding: "10px 18px",
                                            opacity:
                                                isAiLoading ||
                                                !aiMessage.trim()
                                                    ? 0.6
                                                    : 1
                                        }}
                                    >
                                        Send
                                    </button>

                                </form>

                            </>

                        )}

                    </div>
                        </div>

                    </div>


                    <button
                        onClick={handleLogout}
                        style={logoutButtonStyle}
                    >
                        Logout
                    </button>

                    <footer className="app-footer">
                        Built by Nasif · Contact: nasiftk5j@gmail.com
                    </footer>

                </div>
            </div>
        );
    }


    // FORGOT PASSWORD PAGE
    if (isForgotPassword) {
        return (
            <div style={pageStyle}>
                <div style={cardStyle}>
                    <style>{`
                        @keyframes borrowTrackerSpin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>

                    <h1 style={titleStyle}>Borrow Tracker</h1>
                    <h2>Forgot Password</h2>

                    {forgotStep === "roll" && (
                        <>
                            <p style={{ color: "#666", fontSize: "14px", marginTop: 0 }}>
                                Enter your roll number to reset your password.
                            </p>

                            <form onSubmit={handleForgotPassword}>
                                <input
                                    type="text"
                                    placeholder="Roll Number eg:- 2025BCD0012"
                                    value={forgotRollNumber}
                                    onChange={(e) => {
                                        setForgotRollNumber(e.target.value);
                                        setMessage("");
                                        setMessageType("");
                                    }}
                                    style={inputStyle}
                                />

                                <button
                                    type="submit"
                                    disabled={isSendingResetOtp}
                                    style={{
                                        ...primaryButtonStyle,
                                        opacity: isSendingResetOtp ? 0.8 : 1,
                                        cursor: isSendingResetOtp ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {isSendingResetOtp ? (
                                        <span style={loadingContentStyle}>
                                            <span style={spinnerStyle}></span>
                                            Sending OTP...
                                        </span>
                                    ) : (
                                        "Send OTP"
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {forgotStep === "otp" && (
                        <>
                            <p style={{ color: "#666", fontSize: "14px", marginTop: 0 }}>
                                We sent a 6-digit OTP to <strong>{maskedEmail}</strong>.
                            </p>

                            <form onSubmit={handleVerifyResetOtp}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="6"
                                    placeholder="Enter 6-digit OTP"
                                    value={resetVerificationCode}
                                    onChange={(e) => {
                                        setResetVerificationCode(
                                            e.target.value.replace(/\D/g, "")
                                        );
                                        setMessage("");
                                        setMessageType("");
                                    }}
                                    style={inputStyle}
                                />

                                <button
                                    type="submit"
                                    disabled={isVerifyingResetOtp}
                                    style={{
                                        ...primaryButtonStyle,
                                        opacity: isVerifyingResetOtp ? 0.8 : 1,
                                        cursor: isVerifyingResetOtp ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {isVerifyingResetOtp ? (
                                        <span style={loadingContentStyle}>
                                            <span style={spinnerStyle}></span>
                                            Verifying...
                                        </span>
                                    ) : (
                                        "Verify OTP"
                                    )}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={() => {
                                    setForgotStep("roll");
                                    setResetVerificationCode("");
                                    setMessage("");
                                    setMessageType("");
                                }}
                                style={secondaryButtonStyle}
                            >
                                Change Roll Number
                            </button>
                        </>
                    )}

                    {forgotStep === "reset" && (
                        <>
                            <p style={{ color: "#666", fontSize: "14px", marginTop: 0 }}>
                                OTP verified. Enter your new password.
                            </p>

                            <form onSubmit={handleResetPassword}>
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setMessage("");
                                        setMessageType("");
                                    }}
                                    style={inputStyle}
                                />

                                <button
                                    type="submit"
                                    disabled={isResettingPassword}
                                    style={{
                                        ...primaryButtonStyle,
                                        opacity: isResettingPassword ? 0.8 : 1,
                                        cursor: isResettingPassword ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {isResettingPassword ? (
                                        <span style={loadingContentStyle}>
                                            <span style={spinnerStyle}></span>
                                            Resetting Password...
                                        </span>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {message && (
                        <p
                            style={{
                                ...messageStyle,
                                color:
                                    messageType === "error"
                                        ? "#dc2626"
                                        : messageType === "success"
                                        ? "#16a34a"
                                        : "#2563eb"
                            }}
                        >
                            {message}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleCancelForgotPassword}
                        style={secondaryButtonStyle}
                    >
                        Back to Login
                    </button>

                    <footer className="app-footer">
                        Built by Nasif · Contact: nasiftk5j@gmail.com
                    </footer>
                </div>
            </div>
        );
    }

    // REGISTER PAGE

    if (isRegistering) {

        return (
            <div style={pageStyle}>

                <div style={cardStyle}>
                    <style>{`
                        @keyframes borrowTrackerSpin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `}</style>

                    <h1 style={titleStyle}>
                        Borrow Tracker
                    </h1>

                    <h2>
                        {isVerifyingEmail ? "Verify Your Email" : "Create Account"}
                    </h2>

                    {!isVerifyingEmail ? (
                        <>
                            <form onSubmit={handleRegister}>

                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) =>{
                                   setName(e.target.value)
                                          setMessage("");
                                          setMessageType(""); 
                                    }
                                     
                                         
                                    }
                                    style={inputStyle}
                                />

                                <input
                                    type="text"
                                    placeholder="Roll Number eg:- 2025BCD0012"
                                    value={rollNumber}
                                    onChange={(e) =>{
                                        setRollNumber(e.target.value)
                                        setMessage("");
                                        setMessageType("");
                                    }
                                       
                                    }
                                    style={inputStyle}
                                />

                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) =>{
                                        setEmail(e.target.value)
                                        setMessage("");
                                        setMessageType("");
                                    }
                                       
                                    }
                                    style={inputStyle}
                                />

                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) =>{
                                        setPassword(e.target.value)
                                        setMessage("");
                                        setMessageType("");
                                    }
                                        
                                    }
                                    style={inputStyle}
                                />

                                <button
                                    type="submit"
                                    disabled={isSendingOtp}
                                    style={{
                                        ...primaryButtonStyle,
                                        opacity: isSendingOtp ? 0.8 : 1,
                                        cursor: isSendingOtp ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {isSendingOtp ? (
                                        <span style={loadingContentStyle}>
                                            <span style={spinnerStyle}></span>
                                            Sending OTP...
                                        </span>
                                    ) : (
                                        "Send Verification OTP"
                                    )}
                                </button>

                            </form>
                        </>
                    ) : (
                        <>
                            <p style={{
                                color: "#666",
                                fontSize: "14px",
                                marginTop: 0
                            }}>
                                We sent a 6-digit OTP to <strong>{email}</strong>.
                            </p>

                            <form onSubmit={handleVerifyEmail}>

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="6"
                                    placeholder="Enter 6-digit OTP"
                                    value={verificationCode}
                                    onChange={(e) => {
                                        setVerificationCode(
                                            e.target.value.replace(/\D/g, "")
                                        );
                                        setMessage("");
                                        setMessageType("");
                                    }}
                                    style={inputStyle}
                                />

                                <button
                                    type="submit"
                                    disabled={isVerifyingOtp}
                                    style={{
                                        ...primaryButtonStyle,
                                        opacity: isVerifyingOtp ? 0.8 : 1,
                                        cursor: isVerifyingOtp ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {isVerifyingOtp ? (
                                        <span style={loadingContentStyle}>
                                            <span style={spinnerStyle}></span>
                                            Verifying...
                                        </span>
                                    ) : (
                                        "Verify Email"
                                    )}
                                </button>

                            </form>

                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={isResendingOtp}
                                style={{
                                    ...secondaryButtonStyle,
                                    opacity: isResendingOtp ? 0.7 : 1,
                                    cursor: isResendingOtp ? "not-allowed" : "pointer"
                                }}
                            >
                                {isResendingOtp ? (
                                    <span style={loadingContentStyle}>
                                        <span style={smallSpinnerStyle}></span>
                                        Sending...
                                    </span>
                                ) : (
                                    "Resend OTP"
                                )}
                            </button>
<button
    type="button"
    onClick={() => {
        setIsVerifyingEmail(false);
        setVerificationCode("");
        setMessage("");
                setMessageType("");
    }}
    style={secondaryButtonStyle}
>
    Change Email
</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsVerifyingEmail(false);
                                    setMessage("");
                setMessageType("");
                                }}
                                style={secondaryButtonStyle}
                            >
                                Back to Registration
                            </button>
                        </>
                    )}

                    {message && (
                        <p
                            style={{
                                ...messageStyle,
                                color:
                                    messageType === "error"
                                        ? "#dc2626"
                                        : messageType === "success"
                                        ? "#16a34a"
                                        : "#2563eb"
                            }}
                        >
                            {message}
                        </p>
                    )}

                    {!isVerifyingEmail && (
                        <button
                            onClick={() => {
                                setIsRegistering(false);
                                setMessage("");
                setMessageType("");
                                setName("");
                                setRollNumber("");
                                setEmail("");
                                setPassword("");
                                setVerificationCode("");
                            }}
                            style={secondaryButtonStyle}
                        >
                            Already have an account? Login
                        </button>
                    )}

                    <footer className="app-footer">
                        Built by Nasif · Contact: nasiftk5j@gmail.com
                    </footer>

                </div>

            </div>
        );
    }


    // LOGIN PAGE

    return (
        <div style={pageStyle}>

            <div style={cardStyle}>

                <h1 style={titleStyle}>
                    Borrow Tracker
                </h1>

                <p style={{
                    color: "#666",
                    marginTop: 0
                }}>
                    Track money you owe and money owed to you.
                </p>

                <h2>
                    Login
                </h2>

                <form onSubmit={handleLogin}>

                    <input
                        type="text"
                        placeholder="Roll Number eg:- 2025BCD0012"
                        value={rollNumber}
                        onChange={(e) => {
                            setRollNumber(e.target.value);
                            setMessage("");
                            setMessageType("");
                        }}
                        style={inputStyle}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setMessage("");
                            setMessageType("");
                        }}
                        style={inputStyle}
                    />

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        style={{
                            ...primaryButtonStyle,
                            opacity: isLoggingIn ? 0.8 : 1,
                            cursor: isLoggingIn ? "not-allowed" : "pointer"
                        }}
                    >
                        {isLoggingIn ? (
                            <span style={loadingContentStyle}>
                                <span style={spinnerStyle}></span>
                                Logging in...
                            </span>
                        ) : (
                            "Login"
                        )}
                    </button>

                </form>

                <button
                    type="button"
                    onClick={() => {
                        setIsForgotPassword(true);
                        setForgotStep("roll");
                        setForgotRollNumber("");
                        setResetVerificationCode("");
                        setMaskedEmail("");
                        setNewPassword("");
                        setMessage("");
                        setMessageType("");
                    }}
                    style={{
                        width: "100%",
                        marginTop: "10px",
                        border: "none",
                        background: "transparent",
                        color: "#2563eb",
                        fontSize: "14px",
                        cursor: "pointer"
                    }}
                >
                    Forgot Password?
                </button>

                {message && (
                    <p style={messageStyle}>
                        {message}
                    </p>
                )}

                <button
                    onClick={() => {
                        setIsRegistering(true);
                        setMessage("");
                setMessageType("");
                        setName("");
                        setRollNumber("");
                        setEmail("");
                        setPassword("");
                        setVerificationCode("");
                        setIsVerifyingEmail(false);
                    }}
                    style={secondaryButtonStyle}
                >
                    Create a new account
                </button>

                <footer className="app-footer">
                    Built by Nasif · Contact: nasiftk5j@gmail.com
                </footer>

            </div>

            {/* SOCIAL FOOTER - OUTSIDE LOGIN CARD */}
            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    background: "#ffffff",
                    padding: "18px 20px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    textAlign: "center"
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "30px"
                    }}
                >
                    <a
                        href="https://www.linkedin.com/in/mohammed-nasif-t-k-8928b5380/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            color: "#333",
                            textDecoration: "none",
                            fontSize: "14px"
                        }}
                    >
                        <span
                            style={{
                                fontWeight: "bold",
                                fontSize: "20px",
                                lineHeight: 1
                            }}
                        >
                            in
                        </span>
                        <span>Mohammed Nasif</span>
                    </a>

                    <a
                        href="https://github.com/nasif369"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            color: "#333",
                            textDecoration: "none",
                            fontSize: "14px"
                        }}
                    >
                        <span
                            style={{
                                fontSize: "20px",
                                lineHeight: 1
                            }}
                        >
                            ◉
                        </span>
                        <span>nasif369</span>
                    </a>
                </div>
            </div>

        </div>
    );
}


// ==================== STYLES ====================

const pageStyle = {
    minHeight: "100vh",
    background: "#f4f6f8",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    gap: "20px"
};

const dashboardPageStyle = {
    minHeight: "100vh",
    background: "#f4f6f8",
    padding: "40px 20px"
};

const dashboardContainerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%"
};

const dashboardContentGridStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(340px, 1fr)",
    gap: "25px",
    alignItems: "start"
};

const aiColumnStyle = {
    position: "sticky",
    top: "20px"
};

const cardStyle = {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    padding: "35px",
    borderRadius: "14px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
};

const headerCardStyle = {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "25px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
};

const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
    marginBottom: "25px"
};

const summaryCardStyle = {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
};

const summaryLabelStyle = {
    margin: "0 0 8px",
    color: "#666",
    fontSize: "14px",
    fontWeight: "bold"
};

const sectionCardStyle = {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "25px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
};

const messageCardStyle = {
    background: "#ffffff",
    padding: "15px 20px",
    borderRadius: "10px",
    marginBottom: "25px",
    color: "#2563eb",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
};

const debtCardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "12px"
};

const titleStyle = {
    color: "#2563eb",
    marginTop: 0
};

const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none"
};

const loadingContentStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
};

const spinnerStyle = {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.45)",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    animation: "borrowTrackerSpin 0.8s linear infinite"
};

const smallSpinnerStyle = {
    width: "14px",
    height: "14px",
    border: "2px solid #d1d5db",
    borderTop: "2px solid #2563eb",
    borderRadius: "50%",
    animation: "borrowTrackerSpin 0.8s linear infinite"
};

const primaryButtonStyle = {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer"
};

const secondaryButtonStyle = {
    width: "100%",
    padding: "12px",
    marginTop: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#333",
    fontSize: "14px",
    cursor: "pointer"
};

const typeButtonStyle = {
    flex: 1,
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer"
};

// USER SEARCH LIST

const userListStyle = {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.12)",
    maxHeight: "260px",
    overflowY: "auto",
    zIndex: 100
};

const userItemStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "none",
    borderBottom: "1px solid #eeeeee",
    background: "#ffffff",
    textAlign: "left",
    cursor: "pointer"
};

const userListMessageStyle = {
    padding: "15px",
    margin: 0,
    color: "#777",
    textAlign: "center"
};

const payButtonStyle = {
    padding: "9px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#f59e0b",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: "8px"
};

const confirmButtonStyle = {
    padding: "9px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: "8px"
};

const editButtonStyle = {
    padding: "9px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: "8px",
    marginTop: "8px"
};

const deleteButtonStyle = {
    padding: "9px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#dc2626",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px"
};

const unpaidStatusStyle = {
    color: "#dc2626",
    fontWeight: "bold",
    margin: "0 0 10px"
};

const requestedStatusStyle = {
    color: "#d97706",
    fontWeight: "bold",
    margin: "0 0 10px"
};

const paidStatusStyle = {
    color: "#16a34a",
    fontWeight: "bold",
    margin: "0 0 10px"
};

const logoutButtonStyle = {
    padding: "10px 20px",
    border: "none", 
    borderRadius: "8px",
    background: "#dc2626",
    color: "#ffffff",
    fontSize: "14px",
    cursor: "pointer"
};

const messageStyle = {
    marginTop: "15px",
    fontSize: "14px",
    lineHeight: "1.5",
    textAlign: "center"
};
export default App;
