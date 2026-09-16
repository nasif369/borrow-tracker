const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

import { useEffect, useState } from "react";

function App() {
    const [isRegistering, setIsRegistering] = useState(false);

    const [name, setName] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);
    const [debts, setDebts] = useState([]);

    const [debtType, setDebtType] = useState("borrowed");
    const [personRollNumber, setPersonRollNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    // EDIT MODE
    const [editingDebtId, setEditingDebtId] = useState(null);

    // RESTORE LOGIN
    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (token && user) {
            setLoggedIn(true);
            fetchDebts(token);
        }
    }, []);

    // REGISTER
    const handleRegister = async (e) => {
        e.preventDefault();

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
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Registration successful! You can now login.");

                setName("");
                setRollNumber("");
                setPassword("");

                setIsRegistering(false);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not connect to server");
        }
    };

    // LOGIN
    const handleLogin = async (e) => {
        e.preventDefault();

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
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                setLoggedIn(true);
                setMessage("");

                await fetchDebts(data.token);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not connect to server");
        }
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

    // CREATE DEBT
    const handleCreateDebt = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

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

                setPersonRollNumber("");
                setAmount("");
                setDescription("");

                await fetchDebts(token);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not create debt");
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
            setPersonRollNumber(debt.lender.rollNumber);
        } else {
            setDebtType("lent");
            setPersonRollNumber(debt.borrower.rollNumber);
        }

        setAmount(String(debt.amount));
        setDescription(debt.description || "");
        setMessage("");
    };

    // CANCEL EDIT
    const handleCancelEdit = () => {
        setEditingDebtId(null);
        setPersonRollNumber("");
        setAmount("");
        setDescription("");
        setDebtType("borrowed");
        setMessage("");
    };

    // UPDATE DEBT
    const handleEditDebt = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

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

                setEditingDebtId(null);
                setPersonRollNumber("");
                setAmount("");
                setDescription("");
                setDebtType("borrowed");

                await fetchDebts(token);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not update debt");
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
                await fetchDebts(token);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not request payment confirmation");
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
                await fetchDebts(token);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not confirm payment");
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
                await fetchDebts(token);
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            console.error(error);
            setMessage("Could not delete debt");
        }
    };

    // LOGOUT
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setLoggedIn(false);
        setDebts([]);
        setMessage("");
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

                            <input
                                type="text"
                                placeholder={
                                    debtType === "borrowed"
                                        ? "Lender Roll Number"
                                        : "Borrower Roll Number"
                                }
                                value={personRollNumber}
                                onChange={(e) =>
                                    setPersonRollNumber(e.target.value)
                                }
                                style={inputStyle}
                            />

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
                        <div style={messageCardStyle}>
                            {message}
                        </div>
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


    // REGISTER PAGE

    if (isRegistering) {

        return (
            <div style={pageStyle}>

                <div style={cardStyle}>

                    <h1 style={titleStyle}>
                        Borrow Tracker
                    </h1>

                    <h2>
                        Create Account
                    </h2>

                    <form onSubmit={handleRegister}>

                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            style={inputStyle}
                        />

                        <input
                            type="text"
                            placeholder="Roll Number"
                            value={rollNumber}
                            onChange={(e) =>
                                setRollNumber(e.target.value)
                            }
                            style={inputStyle}
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            style={inputStyle}
                        />

                        <button
                            type="submit"
                            style={primaryButtonStyle}
                        >
                            Register
                        </button>

                    </form>

                    {message && (
                        <p style={messageStyle}>
                            {message}
                        </p>
                    )}

                    <button
                        onClick={() => {
                            setIsRegistering(false);
                            setMessage("");
                        }}
                        style={secondaryButtonStyle}
                    >
                        Already have an account? Login
                    </button>

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
                        placeholder="Roll Number"
                        value={rollNumber}
                        onChange={(e) =>
                            setRollNumber(e.target.value)
                        }
                        style={inputStyle}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        style={inputStyle}
                    />

                    <button
                        type="submit"
                        style={primaryButtonStyle}
                    >
                        Login
                    </button>

                </form>

                {message && (
                    <p style={messageStyle}>
                        {message}
                    </p>
                )}

                <button
                    onClick={() => {
                        setIsRegistering(true);
                        setMessage("");
                        setName("");
                        setRollNumber("");
                        setPassword("");
                    }}
                    style={secondaryButtonStyle}
                >
                    Create a new account
                </button>

                <footer className="app-footer">
                            Built by Nasif · Contact: nasiftk5j@gmail.com
                        </footer>

            </div>

        </div>
    );
}


// ==================== STYLES ====================

const pageStyle = {
    minHeight: "100vh",
    background: "#f4f6f8",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
};

const dashboardPageStyle = {
    minHeight: "100vh",
    background: "#f4f6f8",
    padding: "40px 20px"
};

const dashboardContainerStyle = {
    maxWidth: "800px",
    margin: "0 auto"
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
    color: "#2563eb",
    fontSize: "14px"
};
export default App;