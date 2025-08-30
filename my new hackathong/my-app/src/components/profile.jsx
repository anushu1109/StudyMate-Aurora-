import React, { useEffect, useState } from "react";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const sessionKey = localStorage.getItem("sessionKey"); // or cookie
      if (!sessionKey) return;

      try {
        const res = await fetch("http://localhost:5000/api/profile", {
          headers: {
            "Authorization": `Bearer ${sessionKey}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div>Loading profile...</div>;
  if (!user) return <div>No user data available.</div>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <img
        src={user.profilePicture}
        alt="Profile"
        style={{ width: "150px", height: "150px", borderRadius: "50%" }}
      />
      <h1>{user.fullName}</h1>
      <p>{user.email}</p>
    </div>
  );
}

export default Profile;
